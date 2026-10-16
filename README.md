# SkillLens AI 4.0 — Career Clarity Experience

A complete local-first career analysis project built with FastAPI, SQLite, HTML/CSS/JavaScript, PDF/DOCX parsing, and explainable heuristics. It needs no paid API key or cloud AI service.

## What's included

- **Modern landing/workspace UI:** responsive dashboard, animated bubble-style feature buttons, feature highlights, and clear analysis states.
- **Authentication:** signup, login, logout, signed HttpOnly session cookie, salted PBKDF2-HMAC-SHA256 password hashing, and account-specific data access.
- **Resume analysis:** PDF/DOCX/TXT extraction (5 MB limit), explainable skill matching, evidence snippets, weighted overlap and context similarity.
- **ATS-style checklist:** resume section/readability checks and practical warnings. This is a transparent heuristic checklist, not a real commercial ATS.
- **Skill-gap analysis and learning roadmap:** missing skills prioritized by required/preferred/mentioned language, with curated learning links.
- **Interview practice:** role- and seniority-specific question sets with answer tips.
- **Career-role comparison API:** compare a supplied resume text with 2–5 role descriptions.
- **Analytics:** per-account score history and a small interactive-style bar chart.
- **Reports:** JSON, CSV and PDF downloads.
- **Privacy:** the raw resume is processed in memory and not persisted; only analysis summaries are stored. History/detail/export/clear endpoints are scoped by `user_id`.
- **Testing and setup:** Windows launcher, dependency list, REST API docs at `/docs`, and automated tests.

## Windows setup

1. Install Python 3.11+ from https://www.python.org/downloads/ and enable **Add Python to PATH**.
2. Extract the ZIP, open the `SkillLens_AI` folder, and double-click `run_windows.bat`.
3. The script creates `.venv`, installs dependencies, then launches the app on `http://127.0.0.1:8000`.
4. Create an account on the welcome screen, then upload a PDF/DOCX/TXT resume and paste a job description.
5. Keep the terminal open while using the app. Press `Ctrl+C` to stop it.

Manual setup (PowerShell):

```powershell
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Run tests:

```powershell
.venv\Scripts\python.exe -m pytest -q
```

## API overview

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Health/status |
| `POST /api/auth/signup` | Create account and sign in |
| `POST /api/auth/login` | Sign in |
| `POST /api/auth/logout` | Clear session |
| `GET /api/auth/me` | Current account |
| `POST /api/analyze` | Authenticated resume/job analysis (multipart form) |
| `GET /api/history` | Current account's recent history |
| `GET /api/history/{id}` | Read an owned analysis |\n| `DELETE /api/history/{id}` | Delete one owned analysis |
| `DELETE /api/history` | Clear current account's history |
| `GET /api/history/{id}/report.json` | Download JSON |
| `GET /api/history/{id}/report.csv` | Download CSV |
| `GET /api/history/{id}/report.pdf` | Download PDF |
| `GET /api/analytics` | Per-account score summary |
| `POST /api/interview/questions` | Role/level question set |
| `POST /api/roles/compare` | Compare 2–5 roles against supplied resume text |
| `GET /docs` | Interactive API documentation |

## Security and deployment notes

- The application binds to `127.0.0.1` by default. Do not expose it directly to the public internet without a security review, TLS, rate limiting, backups, and deployment hardening.
- **Session signing:** if `SKILLLENS_SECRET_KEY` is unset, the app generates a random key for this run, so sessions reset when the app restarts. For stable sessions and any non-local deployment, set a strong random key. PowerShell example: `$env:SKILLLENS_SECRET_KEY = [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()` before launching Uvicorn. For HTTPS deployments set `SKILLLENS_HTTPS_ONLY=1`.
- Session cookies are signed, HttpOnly and SameSite=Lax. Passwords are never stored in plaintext. Login errors do not reveal whether an email exists.
- SQLite data is stored in `skilllens.db` in the project directory unless `SKILLLENS_DB` is set. Keep this file private and back it up securely. Existing unauthenticated legacy history is not assigned to a user during migration and is not exposed through account-scoped endpoints.
- Account scoping is enforced in SQL queries; IDs alone do not grant access to another user's analysis.
- Resume files are not saved. Analysis summaries can still contain resume evidence snippets, so protect the database and clear history when no longer needed.

## Important limitations

This is a portfolio/learning application, not a hiring decision system. Matching is based on a curated skill dictionary and word-frequency cosine similarity. The ATS-style score is a simple checklist, not a vendor ATS simulation; role comparisons and scores are heuristic and are not a probability of being hired. Scanned PDFs need OCR before upload. The role comparison endpoint accepts resume text, so use it only in a trusted local session.


## Build 2.1 update (2026-10-13)
- Interview Practice now displays a live experience-level guide and labels each generated set with the selected role, level, and question count.
- Entry, mid, and senior levels use distinct technical, behavioral, and scenario prompts for supported role families.
- Static asset URLs include a build query string so browsers are less likely to reuse stale JavaScript or CSS. If an older server is already running, stop it with Ctrl+C and restart from this extracted project folder. Then hard-refresh the browser with Ctrl+F5.
- The dashboard's legacy `.free-badge` is explicitly hidden.


## Corrected workspace build (3.1.0)

The workspace shows one main page at a time: Overview, Analyze Resume, Interview Practice, Compare Career Paths, or My Progress. Interview questions are generated by the authenticated `/api/interview/questions` endpoint using the selected `entry`, `mid`, or `senior` level. The obsolete “No paid API required” badge is not part of the interface; a defensive cleanup removes that exact legacy badge if an old fragment is present. Static assets use a new cache-busting version identifier.


## Upgraded build notes

- Interview practice has separate entry, mid, and senior question sets. Changing the experience level after generating a set automatically requests a new set; stale responses are ignored if the level changes quickly.
- Interview requests are explicitly marked `no-store` so browsers and intermediaries do not reuse a previous level's response.
- Interview practice, role comparison, and progress tracking remain separate pages in the workspace.
- Core resume matching and interview questions run locally using the included Python code. There is no paid AI API dependency and no API key is required.
- Added browser security headers and defensive DOCX archive checks to reduce unsafe document-expansion risk.
- Analysis APIs send no-cache headers. Session cookies use `SameSite=Lax`; set `SKILLLENS_HTTPS_ONLY=1` when serving over HTTPS.
- Passwords are stored as PBKDF2-HMAC-SHA256 hashes with random salts, and analysis history is scoped to the signed-in account.

## Security and deployment checklist

1. Use a long, unique `SKILLLENS_SECRET_KEY` in your environment for stable sessions. Never commit a real secret or `.env` file.
2. Set `SKILLLENS_HTTPS_ONLY=1` behind HTTPS in production.
3. Run `pytest -q` after installing `requirements.txt`.
4. This is a local-first portfolio project, not a hardened public multi-tenant service. Before public deployment, add reverse-proxy request limits, login/signup rate limiting, secure secret management, and a production ASGI server configuration.


## Security/state cleanup build 3.2.0 (2026-10-14)

- Removed pre-filled job titles and sample job description from Resume Analysis, Interview Practice, and Compare Career Paths. Each signed-in user enters their own role titles and descriptions.
- Switching accounts or logging out clears the resume file selection, analysis result, interview output, comparison text/titles/descriptions, and progress UI before another account is shown.
- Resume file contents are parsed in memory and are not written to the database. Only the analysis summary is retained in account-scoped history; summaries may contain limited evidence snippets, so keep the local database private.
- Added regression tests for blank role fields and client-side state clearing. The automated test suite passed locally: 14 tests.
\n\n## Previous analyses archive (3.3.0)\n\n- Added a dedicated **Previous analyses** workspace page in the sidebar. It shows saved analyses for the currently signed-in account, with date, filename, role, score, View, and Delete actions.\n- Analyses remain stored in the local SQLite database across logout/login and account switching. History is fetched from the authenticated API when a user signs in.\n- Viewing a saved item reopens its full saved analysis result and report downloads. Deletion is restricted to the owner of that analysis. The dashboard still shows recent analyses for convenience.\n
## Deploy to Render (portfolio demo)

This repository includes `render.yaml` for a Render Blueprint deployment. It creates a Python Web Service, installs `requirements.txt`, starts FastAPI on Render's assigned port, uses `/api/health` as its health check, generates a session-signing secret, and enables HTTPS-only session cookies.

### Deploy

1. Create a **new, private GitHub repository** named `SkillLens-AI` (or your preferred name).
2. Upload the contents of this project folder to the repository root. Do not upload `.venv`, `.env`, any `*.db`/SQLite files, or caches. The supplied `.gitignore` excludes these.
3. In Render, choose **New → Blueprint**, connect the repository, and apply the `render.yaml` configuration. Alternatively, choose **New → Web Service** and use:
   - Runtime: Python 3
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Health check path: `/api/health`
4. In Render's Environment settings, verify `SKILLLENS_SECRET_KEY` is generated and `SKILLLENS_HTTPS_ONLY` is `1`. Do not commit a real secret to GitHub.
5. Wait for the deploy to finish, then open the service URL. Check `/api/health`, create a new account, and test analysis, history, interview practice, role comparison, and JSON/CSV/PDF reports.

### Portfolio-demo data note

The free Render web service has an ephemeral filesystem. SQLite user accounts and saved analysis history may be lost when a new deployment replaces the instance. The app initializes an empty database on startup, so do not ship a local `skilllens.db` or expect local accounts/history to transfer to Render. For persistent user data, use a supported persistent disk (where available on your plan) or migrate the database to a managed database before inviting real users.

### Before sharing publicly

This is a portfolio/learning demo, not a production hiring system. Use test resumes and avoid uploading sensitive personal information. The resume itself is processed in memory, but analysis summaries can contain resume evidence snippets and are saved to SQLite. Review Render logs and test account isolation after deployment. The free service may sleep when idle, so its first request after inactivity can take longer.
