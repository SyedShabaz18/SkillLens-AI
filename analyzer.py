"""Transparent skill extraction and explainable resume/job analysis."""
import re
from collections import Counter

SKILL_ALIASES = {
    "Python": ["python", "python3"], "SQL": ["sql", "structured query language"],
    "MySQL": ["mysql"], "PostgreSQL": ["postgresql", "postgres"], "SQLite": ["sqlite"],
    "FastAPI": ["fastapi"], "Flask": ["flask"], "Django": ["django"],
    "REST APIs": ["rest api", "rest apis", "restful api", "restful apis"],
    "API Integration": ["api integration", "integrating apis", "api integrations"],
    "JavaScript": ["javascript", "js"], "TypeScript": ["typescript"], "React": ["react.js", "reactjs", "react"],
    "HTML": ["html5", "html"], "CSS": ["css3", "css"], "Git": ["git", "version control"],
    "GitHub": ["github"], "Docker": ["docker", "containerization", "containers"],
    "Kubernetes": ["kubernetes", "k8s"], "AWS": ["amazon web services", "aws"],
    "Azure": ["microsoft azure", "azure"], "GCP": ["google cloud platform", "gcp"],
    "Linux": ["linux"], "CI/CD": ["ci/cd", "continuous integration", "continuous delivery", "continuous deployment"],
    "Pytest": ["pytest"], "Unit Testing": ["unit testing", "unit tests", "automated testing"],
    "Machine Learning": ["machine learning", "ml models"], "NLP": ["natural language processing", "nlp"],
    "LLM": ["large language models", "large language model", "llms", "llm"],
    "RAG": ["retrieval augmented generation", "retrieval-augmented generation", "rag"],
    "Data Structures": ["data structures", "data structure"], "Algorithms": ["algorithms", "algorithm design"],
    "OOP": ["object oriented programming", "object-oriented programming", "oop"],
    "Power BI": ["power bi"], "Tableau": ["tableau"], "Excel": ["microsoft excel", "excel"],
    "Pandas": ["pandas"], "NumPy": ["numpy"], "ETL": ["extract transform load", "etl"],
    "Automation": ["automation", "automate workflows"], "Web Scraping": ["web scraping", "scraping websites"],
    "Problem Solving": ["problem solving", "problem-solving"], "Communication": ["communication", "communicate effectively"],
    "Agile": ["agile", "scrum"], "Figma": ["figma"], "Cybersecurity": ["cybersecurity", "application security", "secure coding"],
    "JSON": ["json"], "Data Analysis": ["data analysis", "data analytics"], "Statistics": ["statistics", "statistical analysis"],
    "Communication": ["communication", "communicate effectively"], "Leadership": ["leadership", "team leadership"],
}

FREE_RESOURCES = {
    "Python": ("Official Python tutorial", "https://docs.python.org/3/tutorial/"),
    "SQL": ("SQLBolt interactive lessons", "https://sqlbolt.com/"), "MySQL": ("MySQL documentation", "https://dev.mysql.com/doc/"),
    "PostgreSQL": ("PostgreSQL tutorial", "https://www.postgresql.org/docs/current/tutorial.html"),
    "FastAPI": ("FastAPI tutorial", "https://fastapi.tiangolo.com/tutorial/"), "Flask": ("Flask documentation", "https://flask.palletsprojects.com/"),
    "Django": ("Django tutorial", "https://docs.djangoproject.com/en/stable/intro/tutorial01/"),
    "REST APIs": ("MDN HTTP overview", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"),
    "JavaScript": ("MDN JavaScript guide", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"),
    "React": ("React Learn", "https://react.dev/learn"), "HTML": ("MDN HTML", "https://developer.mozilla.org/en-US/docs/Learn/HTML"),
    "CSS": ("MDN CSS", "https://developer.mozilla.org/en-US/docs/Learn/CSS"), "Git": ("Pro Git book", "https://git-scm.com/book/en/v2"),
    "GitHub": ("GitHub Skills", "https://skills.github.com/"), "Docker": ("Docker Get Started", "https://docs.docker.com/get-started/"),
    "AWS": ("AWS Skill Builder", "https://skillbuilder.aws/"), "Pytest": ("pytest documentation", "https://docs.pytest.org/en/stable/"),
    "Unit Testing": ("Python unittest documentation", "https://docs.python.org/3/library/unittest.html"),
    "Machine Learning": ("Google Machine Learning Crash Course", "https://developers.google.com/machine-learning/crash-course"),
    "NLP": ("Hugging Face NLP course", "https://huggingface.co/learn/nlp-course/"), "LLM": ("Hugging Face LLM course", "https://huggingface.co/learn/llm-course/"),
    "Data Structures": ("OpenDSA", "https://opendsa-server.cs.vt.edu/"), "Algorithms": ("VisuAlgo", "https://visualgo.net/en"),
    "OOP": ("Python classes tutorial", "https://docs.python.org/3/tutorial/classes.html"),
    "Power BI": ("Microsoft Learn Power BI", "https://learn.microsoft.com/en-us/training/powerplatform/power-bi/"),
    "Tableau": ("Tableau training", "https://www.tableau.com/learn/training"), "Excel": ("Microsoft Excel help", "https://support.microsoft.com/excel"),
    "Pandas": ("Pandas getting started", "https://pandas.pydata.org/docs/getting_started/index.html"),
    "NumPy": ("NumPy quickstart", "https://numpy.org/doc/stable/user/quickstart.html"),
    "ETL": ("What is ETL?", "https://cloud.google.com/learn/what-is-etl"),
    "CI/CD": ("GitHub Actions documentation", "https://docs.github.com/en/actions"),
    "Linux": ("Ubuntu command line tutorial", "https://ubuntu.com/tutorials/command-line-for-beginners"),
    "TypeScript": ("TypeScript handbook", "https://www.typescriptlang.org/docs/handbook/intro.html"),
    "Problem Solving": ("HackerRank problem solving", "https://www.hackerrank.com/domains/algorithms"),
    "Communication": ("Toastmasters resources", "https://www.toastmasters.org/resources"), "Agile": ("Atlassian Agile Coach", "https://www.atlassian.com/agile"),
    "Automation": ("Python automation ideas", "https://automatetheboringstuff.com/"), "Web Scraping": ("Beautiful Soup documentation", "https://www.crummy.com/software/BeautifulSoup/bs4/doc/"),
    "JSON": ("MDN JSON guide", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON"),
    "Data Analysis": ("Kaggle Learn", "https://www.kaggle.com/learn"), "Statistics": ("Khan Academy statistics", "https://www.khanacademy.org/math/statistics-probability"),
}

STOP_WORDS = set("a an the and or to of for with in on by from as is are be this that it we you our their your will can should must have has had using use used work working experience ability strong good excellent including preferred required responsibilities role candidate team build develop design maintain support knowledge skills plus about into across at".split())

def contains_term(text: str, term: str) -> bool:
    pattern = r"(?<![a-zA-Z0-9+#])" + re.escape(term.lower()) + r"(?![a-zA-Z0-9+#])"
    return re.search(pattern, text.lower()) is not None

def find_skills(text: str):
    found = []
    for skill, aliases in SKILL_ALIASES.items():
        matches = [alias for alias in aliases if contains_term(text, alias)]
        if matches:
            found.append({"skill": skill, "matched_alias": max(matches, key=len)})
    # Remove duplicate canonical names if aliases happen to overlap.
    unique = {}
    for item in found: unique[item["skill"]] = item
    return list(unique.values())

def evidence_for_skill(resume_text: str, skill: str):
    aliases = SKILL_ALIASES.get(skill, [skill])
    sentences = re.split(r"(?<=[.!?\n])\s+", resume_text)
    for sentence in sentences:
        if any(contains_term(sentence, alias) for alias in aliases):
            cleaned = " ".join(sentence.split())
            if cleaned: return cleaned[:300]
    return ""

def _tokens(text):
    return [t for t in re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{1,}", text.lower()) if t not in STOP_WORDS]

def lexical_similarity(a: str, b: str) -> int:
    """Small, explainable TF-IDF-like cosine similarity without a model/API download."""
    ca, cb = Counter(_tokens(a)), Counter(_tokens(b))
    if not ca or not cb: return 0
    vocab = set(ca) | set(cb)
    dot = sum(ca[t] * cb[t] for t in vocab)
    norm_a = sum(v*v for v in ca.values()) ** 0.5
    norm_b = sum(v*v for v in cb.values()) ** 0.5
    return max(0, min(100, round((dot / (norm_a * norm_b)) * 100))) if norm_a and norm_b else 0

def _required_preferred(job_description, job_skills):
    required_words = ("required", "must have", "must-have", "requirements", "essential", "mandatory")
    preferred_words = ("preferred", "nice to have", "nice-to-have", "bonus", "desirable", "good to have")
    lines = [line.strip() for line in re.split(r"[\n.;]+", job_description) if line.strip()]
    labels = {}
    for skill in job_skills:
        relevant = [line.lower() for line in lines if any(contains_term(line, alias) for alias in SKILL_ALIASES.get(skill, [skill]))]
        if any(any(word in line for word in preferred_words) for line in relevant): labels[skill] = "Preferred"
        elif any(any(word in line for word in required_words) for line in relevant): labels[skill] = "Required"
        else: labels[skill] = "Mentioned"
    return labels

def analyze_resume(resume_text: str, job_description: str):
    resume_skills = {item["skill"] for item in find_skills(resume_text)}
    job_skills = {item["skill"] for item in find_skills(job_description)}
    matched = sorted(resume_skills & job_skills)
    missing = sorted(job_skills - resume_skills)
    labels = _required_preferred(job_description, job_skills)
    weights = {s: (2 if labels[s] == "Required" else 0.7 if labels[s] == "Preferred" else 1) for s in job_skills}
    weighted_total = sum(weights.values())
    weighted_matched = sum(weights[s] for s in matched)
    skill_score = round(weighted_matched / weighted_total * 100) if weighted_total else 0
    text_score = lexical_similarity(resume_text, job_description)
    # 85% detected skill overlap + 15% lexical context overlap. Clearly labeled, not an AI probability.
    combined = round(skill_score * 0.85 + text_score * 0.15) if job_skills else text_score
    evidence = [{"skill": s, "resume_evidence": evidence_for_skill(resume_text, s), "importance": labels[s]} for s in matched]
    gaps = []
    for skill in sorted(missing, key=lambda s: (0 if labels[s] == "Required" else 1 if labels[s] == "Mentioned" else 2, s)):
        title, url = FREE_RESOURCES.get(skill, (f"Explore {skill}", "https://developer.mozilla.org/"))
        gaps.append({"skill": skill, "importance": labels[skill], "resource_title": title, "resource_url": url,
                     "suggested_task": f"Build a small {skill} example, add it to a project, and document what you learned."})
    sections = {
        "Projects": bool(re.search(r"\b(projects?|portfolio|built|developed|implemented)\b", resume_text, re.I)),
        "Education": bool(re.search(r"\b(education|bachelor|b\.tech|degree|university|college)\b", resume_text, re.I)),
        "Experience": bool(re.search(r"\b(experience|internship|employment|work history)\b", resume_text, re.I)),
        "Certifications": bool(re.search(r"\b(certifications?|certificates?)\b", resume_text, re.I)),
    }
    improvements = []
    if not sections["Projects"]: improvements.append("Add a Projects section with 2–3 projects, your contribution, and measurable outcomes.")
    if not sections["Education"]: improvements.append("Make your Education section easy to find, with degree, institution, and expected graduation year.")
    if not sections["Experience"]: improvements.append("If you have no formal job experience, include internships, simulations, volunteering, or relevant practical work honestly.")
    if not sections["Certifications"]: improvements.append("Add relevant certifications or completed courses only if you can verify them.")
    if not matched: improvements.append("Use the exact technical skill names you genuinely know, and support them with project evidence.")
    return {
        "match_score": combined, "skill_overlap_score": skill_score, "context_similarity_score": text_score,
        "score_label": "Explainable fit estimate", "matched_skills": matched, "missing_skills": missing,
        "resume_skills": sorted(resume_skills), "job_skills": sorted(job_skills), "skill_importance": labels,
        "required_gaps": [s for s in missing if labels[s] == "Required"],
        "evidence": evidence, "roadmap": gaps, "resume_sections": sections, "resume_improvements": improvements,
        "metrics": {"resume_skills_detected": len(resume_skills), "job_skills_detected": len(job_skills),
                    "matched_count": len(matched), "gap_count": len(missing)},
        "limitations": [
            "This is a transparent local algorithm, not a generative AI model or an employment decision.",
            "The context score is word-frequency cosine similarity; it does not understand meaning like a human or a modern language model.",
            "Required/preferred labels are heuristic and depend on how the job description is written.",
            "A skill appearing in a resume is not proof of proficiency. Review the evidence and be honest about your level.",
            "The score is not a hiring probability and cannot predict whether an employer will shortlist you."
        ]
    }
