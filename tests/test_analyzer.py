from analyzer import analyze_resume, find_skills, lexical_similarity

def test_skill_alias_detection():
    found = {x["skill"] for x in find_skills("Built a Python API using FastAPI, SQL and GitHub.")}
    assert {"Python", "FastAPI", "SQL", "GitHub"}.issubset(found)

def test_overlap_score_is_explainable():
    result = analyze_resume("Python developer with SQL and FastAPI experience. Built REST APIs.", "Required Python, SQL, FastAPI and Docker. Nice to have React.")
    assert result["skill_overlap_score"] > 0
    assert "Python" in result["matched_skills"]
    assert "Docker" in result["missing_skills"]
    assert "Docker" in result["required_gaps"]
    assert any(x["skill"] == "Docker" for x in result["roadmap"])

def test_preferred_skill_priority():
    result = analyze_resume("Python and SQL", "Required Python. Preferred Docker. Nice to have React. Experience with SQL.")
    roadmap = {x["skill"]: x["importance"] for x in result["roadmap"]}
    assert roadmap.get("Docker") == "Preferred"
    assert roadmap.get("React") == "Preferred"

def test_context_similarity_bounds():
    assert 0 <= lexical_similarity("Python SQL", "Python SQL API") <= 100
    assert lexical_similarity("", "Python") == 0

def test_resume_section_checks():
    result = analyze_resume("Education: B.Tech. Projects: built a Python app.", "Python developer required with SQL and Git.")
    assert result["resume_sections"]["Education"] is True
    assert result["resume_sections"]["Projects"] is True
    assert result["resume_sections"]["Experience"] is False
