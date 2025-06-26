/**
 * API base URL configuration.
 * Uses environment variable if present, otherwise falls back to provided backend URL.
 * Environment variable for React: REACT_APP_API_BASE_URL
 */
const BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "https://vscode-internal-3053-qa.qa01.cloud.kavia.ai:3001";

// PUBLIC_INTERFACE
// Get stored token and return auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Handle HTTP errors
 */
async function handleResp(resp) {
  if (!resp.ok) {
    let msg = "Unknown error";
    try {
      const data = await resp.json();
      throw data || { detail: "Request error" };
    } catch {
      throw { detail: resp.statusText || "HTTP error" };
    }
  }
  try {
    return await resp.json();
  } catch (e) {
    return {};
  }
}

/**
 * PUBLIC_INTERFACE
 * Login and obtain JWT token.
 */
export async function apiLogin(username, password) {
  const form = new FormData();
  form.append("username", username);
  form.append("password", password);
  const resp = await fetch(`${BASE}/auth/token`, {
    method: "POST",
    body: form,
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Register admin user (demo only).
 */
export async function apiRegister(username, password) {
  const resp = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResp(resp);
}

// -------- Student Endpoints --------

/**
 * PUBLIC_INTERFACE
 * List all students
 */
export async function apiListStudents({ skip = 0, limit = 100 } = {}) {
  const url = `${BASE}/students?skip=${skip}&limit=${limit}`;
  const resp = await fetch(url, {
    headers: { ...getAuthHeaders() }
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Get a student by ID
 */
export async function apiGetStudent(student_id) {
  const resp = await fetch(`${BASE}/students/${student_id}`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Add a new student
 */
export async function apiAddStudent(student) {
  const resp = await fetch(`${BASE}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(student)
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Update student
 */
export async function apiUpdateStudent(student_id, update) {
  const resp = await fetch(`${BASE}/students/${student_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(update)
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Delete student
 */
export async function apiDeleteStudent(student_id) {
  const resp = await fetch(`${BASE}/students/${student_id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() }
  });
  return resp.ok;
}

// -------- Score Endpoints --------

/**
 * PUBLIC_INTERFACE
 * List all scores
 */
export async function apiListScores({ skip = 0, limit = 100 } = {}) {
  const url = `${BASE}/scores?skip=${skip}&limit=${limit}`;
  const resp = await fetch(url, {
    headers: { ...getAuthHeaders() }
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Add a score
 */
export async function apiAddScore(score) {
  const resp = await fetch(`${BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(score)
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Update score
 */
export async function apiUpdateScore(score_id, update) {
  const resp = await fetch(`${BASE}/scores/${score_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(update)
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Delete score
 */
export async function apiDeleteScore(score_id) {
  const resp = await fetch(`${BASE}/scores/${score_id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() }
  });
  return resp.ok;
}

// -------- Analytics Endpoints --------

/**
 * PUBLIC_INTERFACE
 * Dashboard summary analytics
 */
export async function apiGetSummary() {
  const resp = await fetch(`${BASE}/analytics/summary`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Get student performance analytics
 */
export async function apiGetStudentPerformance(student_id) {
  const resp = await fetch(`${BASE}/analytics/students/${student_id}/performance`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Get subject trends (for charts)
 */
export async function apiGetSubjectTrends(subject) {
  const resp = await fetch(`${BASE}/analytics/trends/subject?subject=${encodeURIComponent(subject)}`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResp(resp);
}

/**
 * PUBLIC_INTERFACE
 * Get distribution histogram for a subject
 */
export async function apiGetSubjectDistribution(subject) {
  const resp = await fetch(`${BASE}/analytics/distribution/subject?subject=${encodeURIComponent(subject)}`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResp(resp);
}
