// services/api.js
// ─────────────────────────────────────────────────────────────
//  All API calls go through `apiFetch` which automatically
//  retries once with a refreshed access token if it gets a 401.
// ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Session helpers ───────────────────────────────────────────

export function saveUserSession(data) {
    localStorage.setItem('token',    data.token);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userId',   String(data.userId ?? ''));
    localStorage.setItem('userName', data.name ?? '');
}

export function clearUserSession() {
    ['token', 'userRole', 'userId', 'userName'].forEach(k =>
        localStorage.removeItem(k)
    );
}

export function getCurrentUser() {
    return {
        token:  localStorage.getItem('token'),
        role:   localStorage.getItem('userRole'),
        userId: localStorage.getItem('userId'),
        name:   localStorage.getItem('userName'),
    };
}

export function isAuthenticated() {
    return !!localStorage.getItem('token');
}

export function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ── Core fetch wrapper with auto-refresh ──────────────────────

let isRefreshing = false;

/**
 * Makes an authenticated API call.
 * If the server returns 401 (token expired), it silently requests
 * a new access token using the httpOnly refresh token cookie,
 * saves it, and retries the original request once.
 *
 * @param {string} path   e.g. '/api/dashboard/students'
 * @param {object} options  fetch options (method, body, etc.)
 * @param {boolean} _retry  internal flag — do not pass manually
 */
export async function apiFetch(path, options = {}, _retry = false) {
    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',   // send/receive httpOnly cookies
    });

    // If token expired and we haven't retried yet — try to refresh
    if (res.status === 401 && !_retry && !isRefreshing) {
        isRefreshing = true;
        try {
            const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
                method:      'POST',
                credentials: 'include',
            });

            if (refreshRes.ok) {
                const { token } = await refreshRes.json();
                localStorage.setItem('token', token);
                isRefreshing = false;
                // Retry the original request with the new token
                return apiFetch(path, options, true);
            } else {
                // Refresh failed — session is dead, send to login
                isRefreshing = false;
                clearUserSession();
                window.location.href = '/auth';
                return;
            }
        } catch {
            isRefreshing = false;
            clearUserSession();
            window.location.href = '/auth';
            return;
        }
    }

    return res;
}

// ── Auth endpoints ────────────────────────────────────────────

export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',     // receive httpOnly refresh token cookie
        body:        JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

export async function logout() {
    try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
        clearUserSession();
        window.location.href = '/auth';
    }
}

export async function forgotPassword(email) {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export async function resetPassword(token, newPassword) {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');
    return data;
}

// ── Parent endpoints ──────────────────────────────────────────

export async function registerParent(fullName, email, phone, password) {
    const res = await fetch(`${BASE_URL}/api/parents/register`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ full_name: fullName, email, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
}

export async function fetchChildren() {
    const res  = await apiFetch('/api/children');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch children');
    return data.children;
}

export async function fetchChildAssessments(childId) {
    const res  = await apiFetch(`/api/children/${childId}/assessments`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch assessments');
    return data.assessments;
}

// ── Therapist / Dashboard endpoints ──────────────────────────

export async function fetchStudents() {
    const res  = await apiFetch('/api/dashboard/students');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch students');
    return data.students;
}

export async function fetchAuditLog() {
    const res  = await apiFetch('/api/dashboard/audit-log');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch audit log');
    return data.auditLog;
}

export async function fetchNotes() {
    const res  = await apiFetch('/api/dashboard/notes');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch notes');
    return data.notes;
}

export async function addNote(text) {
    const res  = await apiFetch('/api/dashboard/notes', {
        method: 'POST',
        body:   JSON.stringify({ text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save note');
    return data.note;
}