import os
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
import app as skill_app


def setup_client(monkeypatch, tmp_path):
    monkeypatch.setattr(skill_app, "DB_PATH", tmp_path / "test.db")
    skill_app.init_db()
    return TestClient(skill_app.app)


def test_signup_login_logout_and_password_hash(monkeypatch, tmp_path):
    client = setup_client(monkeypatch, tmp_path)
    response = client.post("/api/auth/signup", json={"email":"one@example.com","password":"correct-horse-1","display_name":"One"})
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "one@example.com"
    with skill_app.connect_db() as conn:
        stored = conn.execute("SELECT password_hash FROM users WHERE email=?", ("one@example.com",)).fetchone()[0]
    assert "correct-horse-1" not in stored
    assert skill_app.verify_password("correct-horse-1", stored)
    assert not skill_app.verify_password("wrong-password", stored)
    client.post("/api/auth/logout")
    assert client.get("/api/history").status_code == 401
    assert client.post("/api/auth/login", json={"email":"one@example.com","password":"correct-horse-1"}).status_code == 200


def test_analysis_history_is_scoped_to_account(monkeypatch, tmp_path):
    client_a = setup_client(monkeypatch, tmp_path)
    client_b = TestClient(skill_app.app)
    client_a.post("/api/auth/signup", json={"email":"a@example.com","password":"password-a-123"})
    client_b.post("/api/auth/signup", json={"email":"b@example.com","password":"password-b-123"})
    with skill_app.connect_db() as conn:
        a = conn.execute("SELECT id FROM users WHERE email='a@example.com'").fetchone()[0]
        conn.execute("INSERT INTO analyses(user_id,created_at,filename,job_title,score,result_json) VALUES(?,?,?,?,?,?)", (a,"2026-01-01T00:00:00+00:00","resume.txt","Engineer",77,'{"match_score":77,"job_title":"Engineer"}'))
        conn.commit()
    assert len(client_a.get("/api/history").json()["items"]) == 1
    assert client_b.get("/api/history").json()["items"] == []
    assert client_b.get("/api/history/1").status_code == 404
    assert client_b.get("/api/history/1/report.json").status_code == 404


def test_interview_questions_requires_auth(monkeypatch, tmp_path):
    client = setup_client(monkeypatch, tmp_path)
    assert client.post("/api/interview/questions", json={"role":"Data Analyst","level":"entry"}).status_code == 401
    client.post("/api/auth/signup", json={"email":"c@example.com","password":"password-c-123"})
    data = client.post("/api/interview/questions", json={"role":"Data Analyst","level":"entry"})
    assert data.status_code == 200
    assert any("dataset" in q["question"].lower() for q in data.json()["questions"])


def test_interview_questions_are_level_specific_and_include_sample_answers():
    from app import interview_questions_for

    entry = interview_questions_for("Python Backend Developer", "entry")
    mid = interview_questions_for("Python Backend Developer", "mid")
    senior = interview_questions_for("Python Backend Developer", "senior")

    assert len(entry) == len(mid) == len(senior) == 6
    assert {q["question"] for q in entry} != {q["question"] for q in mid}
    assert {q["question"] for q in mid} != {q["question"] for q in senior}
    assert all(q.get("sample_answer") for q in entry + mid + senior)



def test_security_headers_are_set(monkeypatch, tmp_path):
    client = setup_client(monkeypatch, tmp_path)
    response = client.get("/")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_interview_level_changes_question_set_and_api_is_not_cached(monkeypatch, tmp_path):
    client = setup_client(monkeypatch, tmp_path)
    client.post("/api/auth/signup", json={"email":"levels@example.com","password":"password-levels-123"})
    sets = {}
    for level in ("entry", "mid", "senior"):
        response = client.post("/api/interview/questions", json={"role":"Python Backend Developer","level":level})
        assert response.status_code == 200
        assert response.headers["cache-control"] == "no-store"
        sets[level] = {item["question"] for item in response.json()["questions"]}
    assert sets["entry"].isdisjoint(sets["mid"])
    assert sets["mid"].isdisjoint(sets["senior"])



def test_signup_rejects_malformed_email_addresses(monkeypatch, tmp_path):
    client = setup_client(monkeypatch, tmp_path)
    for email in ("@gmail.com", "person@", "person@gmail", "person..name@gmail.com", "person@-gmail.com", "person@gmail..com"):
        response = client.post("/api/auth/signup", json={"email": email, "password": "correct-horse-1"})
        assert response.status_code == 400, email
    response = client.post("/api/auth/signup", json={"email": "person@gmail.com", "password": "correct-horse-1"})
    assert response.status_code == 200



def test_role_fields_have_no_prepopulated_job_titles():
    from pathlib import Path
    html = (Path(skill_app.__file__).parent / "static" / "index.html").read_text(encoding="utf-8")
    assert 'id="interview-role" maxlength="120" placeholder="Enter a job title' in html
    assert 'id="role-one-title" required="" maxlength="120" placeholder="Enter first job title" value=""' in html
    assert 'id="role-two-title" required="" maxlength="120" placeholder="Enter second job title" value=""' in html
    assert 'value="Python Backend Developer"' not in html
    assert 'value="Backend Developer"' not in html
    assert 'value="Data Analyst"' not in html


def test_account_switch_clears_role_and_resume_form_state():
    from pathlib import Path
    js = (Path(skill_app.__file__).parent / "static" / "app.js").read_text(encoding="utf-8")
    assert '["interview-role", "role-one-title", "role-one-desc", "role-two-title", "role-two-desc"]' in js
    assert 'const compareResume = document.getElementById("compare-resume")' in js
    assert 'const resume = document.getElementById("resume")' in js



def test_delete_analysis_is_scoped_to_account(monkeypatch, tmp_path):
    client_a = setup_client(monkeypatch, tmp_path)
    client_b = TestClient(skill_app.app)
    client_a.post("/api/auth/signup", json={"email":"delete-a@example.com","password":"password-a-123"})
    client_b.post("/api/auth/signup", json={"email":"delete-b@example.com","password":"password-b-123"})
    with skill_app.connect_db() as conn:
        a = conn.execute("SELECT id FROM users WHERE email='delete-a@example.com'").fetchone()[0]
        cur = conn.execute("INSERT INTO analyses(user_id,created_at,filename,job_title,score,result_json) VALUES(?,?,?,?,?,?)",
            (a,"2026-01-01T00:00:00+00:00","resume.txt","Engineer",77,'{"match_score":77,"job_title":"Engineer"}'))
        analysis_id = cur.lastrowid
        conn.commit()
    assert client_b.delete(f"/api/history/{analysis_id}").status_code == 404
    assert client_a.get(f"/api/history/{analysis_id}").status_code == 200
    assert client_a.delete(f"/api/history/{analysis_id}").status_code == 204
    assert client_a.get(f"/api/history/{analysis_id}").status_code == 404
