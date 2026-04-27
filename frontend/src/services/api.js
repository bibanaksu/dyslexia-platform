// services/api.js
const BASE_URL = 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────
export function saveUserSession(data) {
    if (data.token) localStorage.setItem('token', data.token);
    if (data.role) localStorage.setItem('userRole', data.role);
    if (data.userId) localStorage.setItem('userId', String(data.userId));
    if (data.name) localStorage.setItem('userName', data.name);
    // Also store in old format for compatibility
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    console.log('✅ Session saved. Token present:', !!data.token);
}

export function clearUserSession() {
    const keys = ['token', 'userRole', 'userId', 'userName', 'user', 'child_session_id'];
    keys.forEach(k => localStorage.removeItem(k));
    console.log('🔒 Session cleared');
}

export function getCurrentUser() {
    return {
        token: localStorage.getItem('token'),
        role: localStorage.getItem('userRole'),
        userId: localStorage.getItem('userId'),
        name: localStorage.getItem('userName'),
    };
}

export function isAuthenticated() {
    return !!localStorage.getItem('token');
}

export function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

// ─────────────────────────────────────────────────────────────
// Core fetch wrapper with auto-refresh
// ─────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
    refreshSubscribers.push(cb);
}

export async function apiFetch(path, options = {}, _retry = false) {
    const isAuthEndpoint = path.includes('/auth/login') ||
                          path.includes('/auth/refresh') ||
                          path.includes('/auth/logout') ||
                          path.includes('/parents/register');

    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {}),
    };

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (res.status === 401 && !_retry && !isAuthEndpoint) {
            console.log('🔄 401 detected, attempting token refresh...');

            if (!isRefreshing) {
                isRefreshing = true;

                try {
                    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        if (data.token) {
                            console.log('✅ Token refreshed successfully');
                            localStorage.setItem('token', data.token);
                            isRefreshing = false;
                            onRefreshed(data.token);
                            return apiFetch(path, options, true);
                        } else {
                            throw new Error('No token in refresh response');
                        }
                    } else {
                        throw new Error(`Refresh failed with status ${refreshRes.status}`);
                    }
                } catch (refreshError) {
                    console.error('❌ Token refresh failed:', refreshError);
                    isRefreshing = false;
                    clearUserSession();
                    setTimeout(() => {
                        window.location.href = '/auth';
                    }, 100);
                    throw new Error('Session expired. Please login again.');
                }
            }

            return new Promise((resolve, reject) => {
                addRefreshSubscriber((token) => {
                    const newOptions = {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    };
                    resolve(apiFetch(path, newOptions, true));
                });
            });
        }

        return res;
    } catch (error) {
        console.error(`API Fetch error for ${path}:`, error);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────
// AUTH ENDPOINTS
// ─────────────────────────────────────────────────────────────
export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) saveUserSession(data);
    return data;
}

export async function logout() {
    try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    } finally {
        clearUserSession();
        window.location.href = '/auth';
    }
}

export async function forgotPassword(email) {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export async function resetPassword(token, newPassword) {
    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');
    return data;
}

// ─────────────────────────────────────────────────────────────
// CHILD SESSION
// ─────────────────────────────────────────────────────────────
export async function saveChildSession(sessionData) {
    const user = getCurrentUser();
    const token = localStorage.getItem('token');
    let guestId = localStorage.getItem('guest_id');
    if (!guestId && !user.token) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guest_id', guestId);
    }
    const payload = {
        sessionUUID: sessionData.sessionUUID,
        childName: sessionData.childName,
        childGrade: sessionData.childGrade,
        childAge: sessionData.childAge || null,
        parentId: sessionData.parentId || (user.role === 'parent' ? user.userId : null),
        guestId: sessionData.guestId || guestId,
    };
    const res = await fetch(`${BASE_URL}/api/child-info/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save child session');
    }
    const data = await res.json();
    if (data.sessionId) {
        localStorage.setItem('child_session_id', data.sessionId);
    } else if (data.sessionUUID) {
        localStorage.setItem('child_session_id', data.sessionUUID);
    }
    return data;
}

export function getCurrentChildSessionId() {
    return localStorage.getItem('child_session_id');
}

export function clearChildSession() {
    localStorage.removeItem('child_session_id');
}

// ─────────────────────────────────────────────────────────────
// PARENT ENDPOINTS
// ─────────────────────────────────────────────────────────────
export async function registerParent(fullName, email, phone, password, child_session_id, child_name) {
    const res = await fetch(`${BASE_URL}/api/parents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            full_name: fullName,
            email,
            phone,
            password,
            child_session_id,
            child_name,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    if (data.token) saveUserSession(data);
    return data;
}

export async function addChildToParent(childName, childGrade) {
    const res = await apiFetch('/api/parents/add-child', {
        method: 'POST',
        body: JSON.stringify({
            child_name: childName,
            child_grade: childGrade,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add child');
    return data;
}

export async function fetchChildren() {
    const res = await apiFetch('/api/children');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch children');
    }
    const data = await res.json();
    return data;
}

export async function addChild(childData) {
    const res = await apiFetch('/api/children', {
        method: 'POST',
        body: JSON.stringify(childData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add child');
    return data;
}

export async function updateParentProfile(id, profileData) {
    const res = await apiFetch(`/api/parents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
}

export async function fetchParentInfo() {
    const res = await apiFetch('/api/parents/me');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch parent info');
    }
    const data = await res.json();
    return data;
}

// ─────────────────────────────────────────────────────────────
// ASSESSMENT RESULTS
// ─────────────────────────────────────────────────────────────
export async function fetchMyResults() {
    const res = await apiFetch('/api/parents/me/results');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch results');
    }
    const data = await res.json();
    return data.results || [];
}

export async function fetchAssessmentSummary(childSessionId) {
    const res = await apiFetch(`/api/assessment/summary/${childSessionId}`);
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch assessment summary');
    }
    const data = await res.json();
    return data;
}

// ─────────────────────────────────────────────────────────────
// TASK SUBMISSION ENDPOINTS
// ─────────────────────────────────────────────────────────────
export async function submitTask1(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) {
        throw new Error('No active child session. Please start a new assessment.');
    }
    const res = await apiFetch('/api/task1/submit', {
        method: 'POST',
        body: JSON.stringify({
            child_session_id: childSessionId,
            ...taskData,
        }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 1');
    }
    const data = await res.json();
    return data;
}

export async function submitTask2(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) {
        throw new Error('No active child session. Please start a new assessment.');
    }
    const res = await apiFetch('/api/assessments/task2/submit', {
        method: 'POST',
        body: JSON.stringify({
            child_session_id: childSessionId,
            ...taskData,
        }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 2');
    }
    const data = await res.json();
    return data;
}

export async function submitTask3(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) {
        throw new Error('No active child session. Please start a new assessment.');
    }
    const res = await apiFetch('/api/task3/submit', {
        method: 'POST',
        body: JSON.stringify({
            child_session_id: childSessionId,
            ...taskData,
        }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 3');
    }
    const data = await res.json();
    return data;
}

export async function submitTask4(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) {
        throw new Error('No active child session. Please start a new assessment.');
    }
    const res = await apiFetch('/api/task4/submit', {
        method: 'POST',
        body: JSON.stringify({
            child_session_id: childSessionId,
            ...taskData,
        }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 4');
    }
    const data = await res.json();
    return data;
}

// ─────────────────────────────────────────────────────────────
// QUIZ ENDPOINTS
// ─────────────────────────────────────────────────────────────
export async function fetchQuizQuestions() {
    const res = await fetch(`${BASE_URL}/api/quiz/questions`);
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch questions');
    }
    const data = await res.json();
    return data.questions;
}

export async function submitQuiz(quizData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) {
        throw new Error('No active child session. Please start a new assessment.');
    }
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            child_session_id: childSessionId,
            ...quizData,
        }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit quiz');
    }
    const data = await res.json();
    return data;
}

// ─────────────────────────────────────────────────────────────
// MESSAGES - FIXED VERSION (works with ParentDashboard)
// ─────────────────────────────────────────────────────────────
export async function fetchMessages() {
    // Backend uses token to identify parent – no parameter needed
    const res = await apiFetch('/api/messages');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch messages');
    }
    const data = await res.json();
    return data.messages || [];
}

export async function sendMessage(content, therapistId = null, childId = null) {
    const res = await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ content, therapistId, child_id: childId }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
    }
    const data = await res.json();
    return data.message;
}

export async function fetchUnreadCount() {
    const res = await apiFetch('/api/messages/unread-count');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
}

// ─────────────────────────────────────────────────────────────
// THERAPIST / DASHBOARD ENDPOINTS
// ─────────────────────────────────────────────────────────────
export async function fetchStudents() {
    const res = await apiFetch('/api/dashboard/students');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch students');
    }
    const data = await res.json();
    return data.students;
}

export async function fetchAuditLog() {
    const res = await apiFetch('/api/dashboard/audit-log');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch audit log');
    }
    const data = await res.json();
    return data.auditLog;
}

export async function fetchNotes() {
    const res = await apiFetch('/api/dashboard/notes');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch notes');
    }
    const data = await res.json();
    return data.notes;
}

export async function addNote(text) {
    const res = await apiFetch('/api/dashboard/notes', {
        method: 'POST',
        body: JSON.stringify({ text }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save note');
    }
    const data = await res.json();
    return data.note;
}