// ─────────────────────────────────────────────────────────────
//  api.js  —  Frontend service layer
//  All login endpoints now return a unified shape:
//    { token, userId, email, name, role, message }
//  saveUserSession() stores that shape into localStorage.
// ─────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Auth helpers ──────────────────────────────────────────────

export function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// FIX: response shape is now always { token, userId, email, name, role, … }
//      No more fallback chain  data.userId || data.parentId || data.therapistId
export function saveUserSession(data) {
    localStorage.setItem('token',    data.token);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userId',   String(data.userId ?? ''));
    localStorage.setItem('userName', data.name ?? data.full_name ?? '');
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

// ── Unified login (used by Auth.jsx) ─────────────────────────
// Backend checks Therapist first, then Parent — one call does it all.
export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;   // { token, userId, email, name, role, … }
}

// ── Parent-specific ───────────────────────────────────────────
export async function loginParent(email, password) {
    const res = await fetch(`${BASE_URL}/api/parents/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

export async function registerParent(fullName, email, phone, password) {
    const res = await fetch(`${BASE_URL}/api/parents/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ full_name: fullName, email, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
}

// ── Therapist-specific ────────────────────────────────────────
export async function loginTherapist(email, password) {
    const res = await fetch(`${BASE_URL}/api/therapists/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

export async function fetchAuditLog() {
    const res = await fetch(`${BASE_URL}/api/therapists/audit-log`, {
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch audit log');
    return data;
}