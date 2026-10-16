// SkillLens uses local, deterministic analysis logic; no external AI/API key is needed.
const form = document.getElementById("analyze-form");
const resumeInput = document.getElementById("resume");
const uploadBox = document.getElementById("upload-box");
const uploadMain = document.getElementById("upload-main");
const uploadSub = document.getElementById("upload-sub");
const jobDescription = document.getElementById("job-description");
const charCount = document.getElementById("char-count");
const errorBox = document.getElementById("form-error");
const analyzeButton = document.getElementById("analyze-button");
const emptyState = document.getElementById("empty-state");
const resultContent = document.getElementById("result-content");
const analysisLabel = document.getElementById("analysis-label");

jobDescription.addEventListener("input", () => {
  charCount.textContent = `${jobDescription.value.length.toLocaleString()} characters`;
});
charCount.textContent = `${jobDescription.value.length.toLocaleString()} characters`;

resumeInput.addEventListener("change", () => {
  const file = resumeInput.files[0];
  if (!file) return;
  uploadMain.textContent = file.name;
  uploadSub.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · selected`;
  uploadBox.classList.add("has-file");
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function renderChips(skills, kind) {
  if (!skills || !skills.length) return `<p class="evidence-text">No skills detected in this category.</p>`;
  return `<div class="skill-chips">${skills.map(s => `<span class="skill-chip ${kind}">${escapeHtml(s)}</span>`).join("")}</div>`;
}

function renderResult(data) {
  emptyState.classList.add("hidden");
  resultContent.classList.remove("hidden");
  analysisLabel.textContent = `Analysis #${data.analysis_id}`;
  const evidence = data.evidence.length
    ? data.evidence.map(item => `
      <div class="evidence-card">
        <div class="evidence-head">✓ ${escapeHtml(item.skill)}</div>
        <div class="evidence-text">“${escapeHtml(item.resume_evidence)}”</div>
      </div>`).join("")
    : `<p class="evidence-text">No matched skill evidence found.</p>`;
  const roadmap = data.roadmap.length
    ? data.roadmap.map((item, i) => `
      <div class="roadmap-item">
        <div class="roadmap-number">${String(i + 1).padStart(2, "0")}</div>
        <div class="roadmap-copy">
          <strong>${escapeHtml(item.skill)} <span class="importance-tag">${escapeHtml(item.importance || "Mentioned")}</span></strong>
          <p>${escapeHtml(item.suggested_task)}</p>
          <a href="${escapeHtml(item.resource_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.resource_title)} ↗</a>
        </div>
      </div>`).join("")
    : `<p class="evidence-text">No missing skills were detected from the supported skill dictionary.</p>`;
  resultContent.innerHTML = `
    <div class="score-block">
      <div class="score-ring" style="--score:${data.match_score * 3.6}deg"><strong>${data.match_score}%</strong></div>
      <div class="score-copy"><strong>${escapeHtml(data.job_title)}</strong><p>Skill overlap estimate based on skills detected in the resume and job description. This is not a hiring probability.</p></div>
    </div>
    <div class="metric-grid">
      <div class="metric-card"><span>Skill overlap</span><strong>${data.skill_overlap_score ?? data.match_score}%</strong></div>
      <div class="metric-card"><span>Context similarity</span><strong>${data.context_similarity_score ?? 0}%</strong></div>
      <div class="metric-card"><span>Skills matched</span><strong>${data.metrics?.matched_count ?? data.matched_skills.length}</strong></div>
      <div class="metric-card"><span>Required gaps</span><strong>${data.required_gaps?.length ?? 0}</strong></div>
    </div>
    <div class="result-section">
      <div class="result-title">MATCHED SKILLS <small>${data.matched_skills.length} found</small></div>
      ${renderChips(data.matched_skills, "match")}
    </div>
    <div class="result-section">
      <div class="result-title">SKILL GAPS <small>${data.missing_skills.length} to explore</small></div>
      ${renderChips(data.missing_skills, "missing")}
      ${data.required_gaps?.length ? `<p class="gap-priority"><strong>Prioritize these required gaps:</strong> ${data.required_gaps.map(escapeHtml).join(", ")}</p>` : ""}
    </div>
    <div class="result-section">
      <div class="result-title">RESUME SECTION CHECK <small>Basic structure scan</small></div>
      <div class="section-checks">${Object.entries(data.resume_sections || {}).map(([name, present]) => `<span class="section-check ${present ? "present" : "absent"}">${present ? "✓" : "!"} ${escapeHtml(name)}</span>`).join("")}</div>
      ${(data.resume_improvements || []).length ? `<ul class="limitations">${data.resume_improvements.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="result-section">
      <div class="result-title">RESUME EVIDENCE <small>Review before trusting</small></div>
      ${evidence}
    </div>
    <div class="result-section">
      <div class="result-title">SUGGESTED LEARNING ROADMAP <small>${data.roadmap.length} next steps</small></div>
      ${roadmap}
    </div>
    <div class="report-actions"><a class="report-link" href="/api/history/${data.analysis_id}/report.json" download>Download JSON report ↗</a><a class="report-link" href="/api/history/${data.analysis_id}/report.csv" download>Download CSV report ↗</a></div>
    <div class="notice">${escapeHtml(data.notice || "The resume itself is not stored. Analysis summaries are saved locally.")}</div>
    <div class="result-section">
      <div class="result-title">LIMITATIONS</div>
      <ul class="limitations">${data.limitations.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    </div>`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";
  const file = resumeInput.files[0];
  if (!file) { errorBox.textContent = "Please choose a resume file."; return; }
  if (!/\.(pdf|docx|txt)$/i.test(file.name)) { errorBox.textContent = "Upload a PDF, DOCX, or TXT file."; return; }
  if (file.size > 5 * 1024 * 1024) { errorBox.textContent = "The resume must be 5 MB or smaller."; return; }
  if (jobDescription.value.trim().length < 40) { errorBox.textContent = "Please paste a job description with at least 40 characters."; return; }

  const body = new FormData();
  body.append("resume", file);
  body.append("job_title", document.getElementById("job-title").value);
  body.append("job_description", jobDescription.value);
  analyzeButton.disabled = true;
  analyzeButton.innerHTML = "<span>Analyzing resume…</span><span>◌</span>";
  try {
    const response = await fetch("/api/analyze", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Analysis failed. Please try again.");
    renderResult(data);
    await loadHistory();
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    errorBox.textContent = err.message || "Could not connect to the app. Is the server running?";
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.innerHTML = "<span>Analyze my skill fit</span><span>→</span>";
  }
});

function renderHistoryItems(container, items) {
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="history-empty">No analyses saved yet. Analyze a resume and it will appear here for future reference.</div>`;
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="history-row">
      <div><div class="history-job">${escapeHtml(item.job_title || "General analysis")}</div>
      <div class="history-meta">${escapeHtml(item.filename)} · ${new Date(item.created_at).toLocaleString()}</div></div>
      <div class="history-score">${item.score}%</div>
      <div class="history-row-actions"><button class="history-open" data-view-id="${item.id}" type="button">View</button><button class="history-delete" data-delete-id="${item.id}" type="button" aria-label="Delete analysis ${item.id}" title="Delete this analysis">Delete</button></div>
    </div>`).join("");
  container.querySelectorAll("button[data-view-id]").forEach(button => {
    button.addEventListener("click", () => loadSavedAnalysis(button.dataset.viewId));
  });
  container.querySelectorAll("button[data-delete-id]").forEach(button => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this saved analysis? This cannot be undone.")) return;
      try {
        const response = await fetch(`/api/history/${encodeURIComponent(button.dataset.deleteId)}`, {method:"DELETE"});
        const data = response.status === 204 ? {} : await response.json();
        if (!response.ok) throw new Error(data.detail || "Could not delete this analysis.");
        await loadHistory();
      } catch (err) {
        alert(err.message || "Could not delete this analysis.");
      }
    });
  });
}

async function loadHistory() {
  const containers = [document.getElementById("history-list"), document.getElementById("previous-history-list")].filter(Boolean);
  try {
    const response = await fetch("/api/history", {cache:"no-store"});
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not load history.");
    containers.forEach(container => renderHistoryItems(container, data.items || []));
  } catch {
    containers.forEach(container => { container.innerHTML = `<div class="history-empty">Could not load history. Refresh after checking the server.</div>`; });
  }
}

async function loadSavedAnalysis(id) {
  try {
    const response = await fetch(`/api/history/${encodeURIComponent(id)}`, {cache:"no-store"});
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not load this analysis.");
    showPage("analysis-page");
    renderResult(data);
    document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    errorBox.textContent = err.message;
  }
}
document.getElementById("refresh-history").addEventListener("click", loadHistory);
 document.getElementById("refresh-previous-history").addEventListener("click", loadHistory);
loadHistory();

// Account gate: all private API calls use the same-origin HttpOnly session cookie.
let authMode = "login";
const authGate = document.getElementById("auth-gate");
const workspace = document.getElementById("workspace");
const authForm = document.getElementById("auth-form");
const authName = document.getElementById("auth-name");
const authNameLabel = document.getElementById("auth-name-label");
const authError = document.getElementById("auth-error");
function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  document.getElementById("auth-heading").textContent = signup ? "Create your account." : "Welcome back.";
  document.getElementById("auth-submit").innerHTML = `<span>${signup ? "Create account" : "Sign in"}</span><span>→</span>`;
  document.getElementById("auth-switch-copy").textContent = signup ? "Already have an account?" : "New to SkillLens?";
  document.getElementById("auth-switch").textContent = signup ? "Sign in" : "Create account";
  authNameLabel.classList.toggle("hidden", !signup); authName.classList.toggle("hidden", !signup);
  authName.required = signup;
  document.getElementById("auth-password").autocomplete = signup ? "new-password" : "current-password";
  authError.textContent = "";
}
document.getElementById("auth-switch").addEventListener("click", () => setAuthMode(authMode === "login" ? "signup" : "login"));
function showPage(pageId, scrollTarget) {
  document.querySelectorAll(".workspace-page").forEach(page => page.classList.toggle("hidden", page.id !== pageId));
  document.querySelectorAll(".nav-item[data-page]").forEach(item => item.classList.toggle("active", item.dataset.page === pageId));
  const headings = {
    "dashboard-page": "Your next step, made clearer.",
    "analysis-page": "Your analysis page.",
    "previous-analyses-page": "Your saved analyses.",
    "interview-page": "Interview practice, tailored to you.",
    "compare-page": "Compare career paths with clarity.",
    "progress-page": "Your progress, at a glance."
  };
  document.getElementById("workspace-heading").textContent = headings[pageId] || "SkillLens AI";
  if (scrollTarget) {
    setTimeout(() => {
      const target = document.getElementById(scrollTarget);
      if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
    }, 80);
  } else {
    window.scrollTo({top:0, behavior:"smooth"});
  }
}
document.querySelectorAll("[data-page]").forEach(item => item.addEventListener("click", () => showPage(item.dataset.page)));
document.querySelectorAll("[data-go-page]").forEach(item => item.addEventListener("click", () => showPage(item.dataset.goPage, item.dataset.scrollTarget)));
document.getElementById("sidebar-home").addEventListener("click", event => { event.preventDefault(); showPage("dashboard-page"); });

function clearPrivateWorkspaceState() {
  // Do not let an in-memory file selection, report, or comparison text from one
  // signed-in account remain visible after switching accounts in the same tab.
  const resume = document.getElementById("resume");
  if (resume) resume.value = "";
  const uploadMain = document.getElementById("upload-main");
  const uploadSub = document.getElementById("upload-sub");
  const uploadBox = document.getElementById("upload-box");
  if (uploadMain) uploadMain.textContent = "Choose your resume file";
  if (uploadSub) uploadSub.textContent = "PDF, DOCX or TXT · up to 5 MB";
  if (uploadBox) uploadBox.classList.remove("has-file");
  const jobDescription = document.getElementById("job-description");
  if (jobDescription) jobDescription.value = "";
  const jobTitle = document.getElementById("job-title");
  if (jobTitle) jobTitle.value = "";
  const compareResume = document.getElementById("compare-resume");
  if (compareResume) compareResume.value = "";
  // Role titles/descriptions are user-entered and must not carry across accounts.
  ["interview-role", "role-one-title", "role-one-desc", "role-two-title", "role-two-desc"].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = "";
  });
  const interviewResults = document.getElementById("interview-results");
  if (interviewResults) interviewResults.innerHTML = "";
  hasGeneratedInterviewSet = false;
  interviewRequestVersion++;
  const compareResults = document.getElementById("role-compare-results");
  if (compareResults) compareResults.innerHTML = "";
  const history = document.getElementById("history-list");
  if (history) history.innerHTML = "";
  const analytics = document.getElementById("analytics-chart");
  if (analytics) analytics.innerHTML = "";
  const summary = document.getElementById("analytics-summary");
  if (summary) summary.textContent = "";
  if (resultContent) resultContent.innerHTML = "";
  if (resultContent) resultContent.classList.add("hidden");
  if (emptyState) emptyState.classList.remove("hidden");
}
async function enterWorkspace(user) {
  // Always clear any client-side resume, report, comparison, history, and chart
  // state before showing a newly authenticated account in this browser tab.
  clearPrivateWorkspaceState();
  document.getElementById("welcome-page").classList.add("hidden");
  authGate.classList.add("hidden");
  workspace.classList.remove("hidden");
  document.getElementById("user-label").textContent = user.display_name || user.email;
  showPage("dashboard-page");
  await loadHistory(); await loadAnalytics();
}
async function authRequest(url, body) {
  const response = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Authentication failed.");
  return data;
}
authForm.addEventListener("submit", async event => {
  event.preventDefault(); authError.textContent = "";
  const payload = {email:document.getElementById("auth-email").value, password:document.getElementById("auth-password").value, display_name:authName.value};
  try { const data = await authRequest(`/api/auth/${authMode}`, payload); await enterWorkspace(data.user); }
  catch (err) { authError.textContent = err.message; }
});
document.getElementById("logout-button").addEventListener("click", async () => {
  try { await fetch("/api/auth/logout", {method:"POST", credentials:"same-origin"}); } finally {
    // Clear private UI state as well as the server-side session. This includes
    // the file input itself, whose selected filename can otherwise remain visible.
    clearPrivateWorkspaceState();
    workspace.classList.add("hidden"); authGate.classList.add("hidden"); document.getElementById("welcome-page").classList.remove("hidden"); authForm.reset(); setAuthMode("login");
    document.getElementById("user-label").textContent = "";
    resultContent.innerHTML = ""; resultContent.classList.add("hidden"); emptyState.classList.remove("hidden"); showPage("dashboard-page");
  }
});

async function loadAnalytics() {
  const summary = document.getElementById("analytics-summary"), chart = document.getElementById("analytics-chart");
  try {
    const response = await fetch("/api/analytics"); if (!response.ok) return;
    const data = await response.json();
    summary.textContent = `${data.total_analyses} analyses · average fit ${data.average_score}%`;
    const recent = data.scores.slice(0, 10).reverse();
    chart.innerHTML = recent.length ? recent.map(item => `<div class="chart-column" title="${escapeHtml(item.role)}: ${item.score}%"><span class="chart-value">${item.score}%</span><div class="chart-bar" style="height:${Math.max(3,item.score)}%"></div><span class="chart-label">${escapeHtml(item.role)}</span></div>`).join("") : `<div class="feature-empty">Run an analysis to build your personal progress chart.</div>`;
  } catch { summary.textContent = "Analytics could not be loaded."; }
}
document.getElementById("refresh-analytics").addEventListener("click", loadAnalytics);
const interviewLevel = document.getElementById("interview-level");
const levelGuide = document.getElementById("level-guide");
const levelCopy = {
  entry: ["Entry level focus", "Core concepts, learning mindset, personal or study projects, and step-by-step problem solving."],
  mid: ["Mid level focus", "Practical implementation, debugging, trade-offs, and independent ownership."],
  senior: ["Senior level focus", "Architecture, risk management, technical strategy, mentoring, and cross-team leadership."]
};
function updateLevelGuide() {
  const copy = levelCopy[interviewLevel.value] || levelCopy.mid;
  levelGuide.innerHTML = `<strong>${escapeHtml(copy[0])}</strong><span>${escapeHtml(copy[1])}</span>`;
}
updateLevelGuide();

const interviewForm = document.getElementById("interview-form");
const interviewOutput = document.getElementById("interview-results");
let hasGeneratedInterviewSet = false;
let interviewRequestVersion = 0;

async function generateInterviewQuestions() {
  const role = document.getElementById("interview-role").value.trim();
  const level = interviewLevel.value;
  if (!role) {
    interviewOutput.innerHTML = `<div class="feature-empty">Enter a role to generate targeted questions.</div>`;
    return;
  }
  const requestVersion = ++interviewRequestVersion;
  interviewOutput.innerHTML = `<div class="feature-empty">Building a fresh ${escapeHtml(level)}-level practice set for ${escapeHtml(role)}…</div>`;
  try {
    const response = await fetch("/api/interview/questions", {
      method: "POST",
      headers: {"Content-Type":"application/json", "Cache-Control":"no-store"},
      cache: "no-store",
      body: JSON.stringify({role, level})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not generate questions.");
    // Ignore an older response if the user changed the level while it was in flight.
    if (requestVersion !== interviewRequestVersion) return;
    const levelName = ({entry:"Entry level",mid:"Mid level",senior:"Senior level"})[data.level] || "Interview practice";
    interviewOutput.innerHTML =
      `<div class="practice-set-heading"><div><span class="eyebrow">PERSONALIZED PRACTICE SET</span><h3>${escapeHtml(data.role)} · ${escapeHtml(levelName)}</h3></div><span class="practice-count">${data.questions.length} questions</span></div>` +
      data.questions.map((q,i)=>`<article class="question-card"><strong>${escapeHtml(q.category)} · ${String(i+1).padStart(2,"0")}</strong><p>${escapeHtml(q.question)}</p><small>${escapeHtml(q.practice_tip)}</small><details class="sample-answer"><summary>View sample answer</summary><p>${escapeHtml(q.sample_answer || "Start with the context, explain your approach, and finish with the outcome or lesson learned.")}</p><small>Use this as a guide—adapt it to your own experience and never claim results you did not achieve.</small></details></article>`).join("");
    hasGeneratedInterviewSet = true;
  } catch(err) {
    if (requestVersion === interviewRequestVersion) interviewOutput.innerHTML = `<div class="feature-empty">${escapeHtml(err.message)}</div>`;
  }
}

interviewForm.addEventListener("submit", event => {
  event.preventDefault();
  generateInterviewQuestions();
});
interviewLevel.addEventListener("change", () => {
  updateLevelGuide();
  if (hasGeneratedInterviewSet) generateInterviewQuestions();
});
document.getElementById("interview-role").addEventListener("change", () => {
  if (hasGeneratedInterviewSet) generateInterviewQuestions();
});

// Enhance reports and refresh private analytics after a successful analysis.
const originalRenderResult = renderResult;
renderResult = function(data) {
  originalRenderResult(data);
  const actions = resultContent.querySelector(".report-actions");
  if (actions && !actions.querySelector(".pdf")) actions.insertAdjacentHTML("beforeend", `<a class="report-link pdf" href="/api/history/${encodeURIComponent(data.analysis_id)}/report.pdf" download>Download PDF report ↗</a>`);
  if (data.ats_check) {
    const target = resultContent.querySelector(".result-section");
    const checks = Object.entries(data.ats_check.checks || {}).map(([name,ok])=>`<span class="section-check ${ok ? "present":"absent"}">${ok ? "✓":"!"} ${escapeHtml(name)}</span>`).join("");
    const block = document.createElement("div"); block.className="result-section";
    block.innerHTML=`<div class="result-title">ATS-STYLE CHECKLIST <small>${data.ats_check.score}% checklist pass</small></div><div class="section-checks">${checks}</div>${(data.ats_check.warnings||[]).map(w=>`<p class="evidence-text">• ${escapeHtml(w)}</p>`).join("")}`;
    if(target) target.parentNode.insertBefore(block,target);
  }
  loadAnalytics();
};


function openAuth(mode) {
  document.getElementById("welcome-page").classList.add("hidden");
  workspace.classList.add("hidden");
  authGate.classList.remove("hidden");
  setAuthMode(mode);
  window.scrollTo({top:0, behavior:"smooth"});
}
document.getElementById("welcome-login").addEventListener("click", () => openAuth("login"));
document.getElementById("welcome-signup").addEventListener("click", () => openAuth("signup"));
document.getElementById("hero-get-started").addEventListener("click", () => openAuth("signup"));
document.getElementById("bottom-get-started").addEventListener("click", () => openAuth("signup"));
document.getElementById("back-home").addEventListener("click", () => {
  authGate.classList.add("hidden");
  document.getElementById("welcome-page").classList.remove("hidden");
  setAuthMode("login");
  window.scrollTo({top:0, behavior:"smooth"});
});

(async function bootstrapAuth() {
  setAuthMode("login");
  try { const response = await fetch("/api/auth/me"); const data = await response.json(); if (response.ok && data.user) await enterWorkspace(data.user); }
  catch { /* Signed-out state is the safe default. */ }
})();
document.getElementById("role-compare-form").addEventListener("submit", async event => {
  event.preventDefault(); const output = document.getElementById("role-compare-results");
  output.innerHTML = `<div class="feature-empty">Comparing role requirements…</div>`;
  const value = id => document.getElementById(id).value;
  try {
    const response = await fetch("/api/roles/compare", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resume_text:value("compare-resume"),roles:[{title:value("role-one-title"),description:value("role-one-desc")},{title:value("role-two-title"),description:value("role-two-desc")}]})});
    const data = await response.json(); if (!response.ok) throw new Error(data.detail || "Role comparison failed.");
    output.innerHTML = data.roles.map(role=>`<article class="role-result-card"><h3>${escapeHtml(role.title)}</h3><div class="role-result-score">${role.match_score}%</div><p>Heuristic fit estimate · ${role.matched_skills.length} matched skills</p><strong>Matched</strong>${renderChips(role.matched_skills,"match")}<p><strong>Gaps:</strong> ${escapeHtml(role.missing_skills.join(", ") || "No dictionary gaps detected")}</p></article>`).join("");
  } catch(err) { output.innerHTML = `<div class="feature-empty">${escapeHtml(err.message)}</div>`; }
});
