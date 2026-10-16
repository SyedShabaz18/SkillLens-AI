<div align="center">

# ✨ SkillLens AI

### Turn your resume into a clearer career action plan.

**Analyze your resume · Discover skill gaps · Practise interviews · Compare career paths**

A portfolio project built with **FastAPI, SQLite, HTML, CSS and JavaScript**. SkillLens AI uses explainable, rule-based analysis and does not require a paid AI API key.

</div>

---

## 📌 Contents

- [Overview](#-overview)
- [Features](#-features)
- [How it works](#-how-it-works)
- [Tech stack](#-tech-stack)
- [Run locally](#-run-locally)
- [API overview](#-api-overview)
- [Deploy on Render](#-deploy-on-render)
- [Privacy and security](#-privacy-and-security)
- [Limitations](#-limitations)

## 🎯 Overview

SkillLens AI is a career-planning web app that helps users understand how their resume aligns with a job description. It highlights matching skills, surfaces potential gaps, and provides practical next steps to support career preparation.

The app includes a signed-in workspace with analysis history, interview practice, career-path comparisons, and downloadable reports.

> **Please note:** SkillLens AI is a portfolio and learning project—not a hiring decision system or a commercial Applicant Tracking System (ATS).

## 🚀 Features

| Feature | What it does |
|---|---|
| **Resume analysis** | Reads PDF, DOCX and TXT resumes (maximum upload size: 5 MB) and compares them with a job description. |
| **Skill matching** | Shows matched skills, missing skills and supporting evidence using explainable heuristics. |
| **ATS-style checklist** | Checks resume sections and readability and provides practical warnings. It is not a commercial ATS simulation. |
| **Skill-gap roadmap** | Prioritizes potential skill gaps and offers curated learning links. |
| **Interview practice** | Provides role- and experience-level-specific questions and answer tips for entry, mid and senior levels. |
| **Career-path comparison** | Compares a resume text against 2–5 role descriptions. |
| **Progress tracking** | Shows per-account score history and a simple chart. |
| **Previous analyses** | View or delete saved analyses belonging to the signed-in account. |
| **Downloadable reports** | Export analysis reports as JSON, CSV and PDF. |
| **Account security** | Signup, login, logout, signed HttpOnly session cookies and salted PBKDF2-HMAC-SHA256 password hashing. |
| **Interactive API docs** | Explore the API through FastAPI's `/docs` page. |

## 🧭 How it works

1. **Create an account** and sign in.
2. **Upload a resume** in PDF, DOCX or TXT format.
3. **Paste a job description** and run the analysis.
4. **Review the results**—matching skills, potential gaps and the resume checklist.
5. **Plan your next steps** with the learning roadmap, interview practice and career-path comparison.
6. **Track and export** your work from Previous Analyses and My Progress.

## 🧰 Tech stack

- **Backend:** Python, FastAPI
- **Database:** SQLite
- **Frontend:** HTML, CSS, JavaScript
- **Document parsing:** PDF and DOCX parsing, plus TXT support
- **Analysis:** curated skill dictionary, weighted overlap and word-frequency cosine similarity
- **Testing:** pytest

## 💻 Run locally

### Requirements

- Python 3.11 or newer
- Windows instructions below use PowerShell.

### Quick start on Windows

1. Download or clone this repository.
2. Open the project folder.
3. Double-click `run_windows.bat`.
4. Wait for dependencies to install and the server to start.
5. Open **http://127.0.0.1:8000** in your browser.
6. Create an account and try an analysis.

Keep the terminal window open while using the app. Press `Ctrl+C` in that window to stop the server.

### Manual setup (PowerShell)

Run these commands from the project root:

```powershell
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000**.

### Run the tests

In a second PowerShell window, from the project root:

```powershell
.venv\Scripts\python.exe -m pytest -q
```

## 🔌 API overview

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health/status check |
| `POST` | `/api/auth/signup` | Create an account and sign in |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | End the session |
| `GET` | `/api/auth/me` | Get the current account |
| `POST` | `/api/analyze` | Analyze an authenticated resume and job description |
| `GET` | `/api/history` | List the current account's saved analyses |
| `GET` | `/api/history/{id}` | View an analysis owned by the current account |
| `DELETE` | `/api/history/{id}` | Delete one owned analysis |
| `DELETE` | `/api/history` | Clear the current account's history |
| `GET` | `/api/history/{id}/report.json` | Download a JSON report |
| `GET` | `/api/history/{id}/report.csv` | Download a CSV report |
| `GET` | `/api/history/{id}/report.pdf` | Download a PDF report |
| `GET` | `/api/analytics` | Get the account's score summary |
| `POST` | `/api/interview/questions` | Generate interview practice questions |
| `POST` | `/api/roles/compare` | Compare 2–5 career-role descriptions |
| `GET` | `/docs` | Interactive API documentation |

## ☁️ Deploy on Render

This project can be deployed as a **Render Web Service** connected to your GitHub repository.

### 1. Prepare your GitHub repository

Upload the project files and folders directly to the repository root. Keep `app.py` and `requirements.txt` at the top level.

**Do not upload** `.venv/`, `.env`, real secret values, local database files (`*.db`, `*.sqlite`, `*.sqlite3`) or Python/test caches.

### 2. Create a Render Web Service

In the Render dashboard, choose **New → Web Service**, connect your GitHub repository and select the branch you want to deploy.

Use these settings:

| Setting | Value |
|---|---|
| Runtime | Python 3 |
| Root Directory | Leave blank if `app.py` is in the repository root |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |

### 3. Configure environment variables

In the Render service's **Environment** settings, configure:

| Variable | Value |
|---|---|
| `SKILLLENS_SECRET_KEY` | A long, random, unique secret generated for the deployment |
| `SKILLLENS_HTTPS_ONLY` | `1` |

Keep the secret in Render's environment settings—never commit it to GitHub.

### 4. Test the live deployment

After the first deploy completes:

- Open your Render service URL.
- Visit `/api/health` and check that the service responds.
- Create a new test account.
- Test resume analysis, interview practice, role comparison, saved history and JSON/CSV/PDF exports.
- Test account isolation with separate test accounts.

### Important note about free hosting

A free Render service may have an ephemeral filesystem. Since this application uses SQLite, accounts and saved analysis history can be lost when the instance is replaced or redeployed. The deployment starts with a fresh database; local accounts and history are not transferred.

For this **portfolio demo**, use test accounts and sample resumes. If you later need reliable persistence for real users, use supported persistent storage or migrate to a managed database before inviting them. The service may also sleep when idle, so the first request after inactivity can take longer.

## 🔐 Privacy and security

- Resume files are processed in memory and are not saved as uploaded files.
- Analysis summaries are stored in SQLite and may include limited evidence snippets from the resume.
- History, detail, deletion and report endpoints are scoped to the signed-in account.
- Passwords are stored as salted PBKDF2-HMAC-SHA256 hashes, not plaintext.
- Session cookies are signed, HttpOnly and use `SameSite=Lax`.
- Keep the database private, avoid committing secrets, and clear saved history when it is no longer needed.

This project is **not hardened for a public multi-tenant production service**. Before using it with real users, add appropriate rate limiting, request-size controls, secure operational logging, backups and a production security review.

## ⚖️ Limitations

- Skill matching uses a curated skill dictionary and heuristic text similarity; it is not a trained generative AI model.
- Scores are guidance—not a probability of getting hired.
- The ATS-style checklist is not a simulation of any commercial ATS vendor.
- Scanned PDFs may need OCR before they can be analyzed.
- Career comparisons depend on the resume text and role descriptions supplied by the user.
- Do not use SkillLens AI as the sole basis for hiring or career decisions.

---

<div align="center">

**Built as a practical software-development portfolio project.**

*SkillLens AI — make your next career step more intentional.*

</div>
