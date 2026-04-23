// services/api.js
// ─────────────────────────────────────────────────────────────
//  All API calls go through `apiFetch` which automatically
//  retries once with a refreshed access token if it gets a 401.
// ─────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:5000'; 
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
let refreshSubscribers = [];

function onRefreshed(token) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
    refreshSubscribers.push(cb);
}

export async function apiFetch(path, options = {}, _retry = false) {
    // Don't attempt refresh on auth endpoints to avoid loops
    const isAuthEndpoint = path.includes('/auth/login') || 
                          path.includes('/auth/refresh') || 
                          path.includes('/auth/logout');
    
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

        // Handle 401 - Unauthorized
        if (res.status === 401 && !_retry && !isAuthEndpoint) {
            // If we're not already refreshing, start the refresh process
            if (!isRefreshing) {
                isRefreshing = true;
                
                try {
                    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
                        method: 'POST',
                        credentials: 'include',
                    });

                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        if (data.token) {
                            localStorage.setItem('token', data.token);
                            isRefreshing = false;
                            onRefreshed(data.token);
                            // Retry the original request with new token
                            return apiFetch(path, options, true);
                        } else {
                            throw new Error('No token in refresh response');
                        }
                    } else {
                        throw new Error('Refresh failed with status: ' + refreshRes.status);
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    isRefreshing = false;
                    clearUserSession();
                    // Use setTimeout to avoid race conditions with navigation
                    setTimeout(() => {
                        window.location.href = '/auth';
                    }, 100);
                    throw new Error('Session expired. Please login again.');
                }
            }
            
            // If refresh is in progress, queue this request
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
        // Network errors or other fetch failures
        console.error(`API Fetch error for ${path}:`, error);
        throw error;
    }
}

// ── Auth endpoints ────────────────────────────────────────────

export async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
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
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch children');
    }
    const data = await res.json();
    return data;
}

export async function addChild(childData) {
    const res  = await apiFetch('/api/children', {
        method: 'POST',
        body:   JSON.stringify(childData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add child');
    return data;
}

export async function updateParentProfile(id, profileData) {
    const res  = await apiFetch(`/api/parents/${id}`, {
        method: 'PUT',
        body:   JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
}

// ── Parent info endpoints ─────────────────────────────────────

export async function fetchParentInfo() {
    const res = await apiFetch('/api/parents/me');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch parent info');
    }
    const data = await res.json();
    return data;
}

// ── Assessment results ────────────────────────────────────────

export async function fetchMyResults() {
    const res  = await apiFetch('/api/parents/me/results');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch results');
    }
    const data = await res.json();
    return data.results || [];
}

export async function fetchChildAssessments(childId) {
    const res  = await apiFetch(`/api/children/${childId}/assessments`);
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch assessments');
    }
    const data = await res.json();
    return data.assessments;
}

export async function fetchAssessmentSummary(sessionUUID) {
    const res = await apiFetch(`/api/assessment/summary/${sessionUUID}`);
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch assessment summary');
    }
    const data = await res.json();
    return data;
}

// ── Messages / Chat ───────────────────────────────────────────

export async function fetchMessages(parentId) {
    const query = parentId ? `?parentId=${parentId}` : '';
    const res   = await apiFetch(`/api/messages${query}`);
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch messages');
    }
    const data = await res.json();
    return data.messages || [];
}

export async function sendMessage(content, therapistId = null) {
    const res  = await apiFetch('/api/messages', {
        method: 'POST',
        body:   JSON.stringify({ content, therapistId }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
    }
    const data = await res.json();
    return data.message;
}

export async function fetchUnreadCount() {
    const res  = await apiFetch('/api/messages/unread-count');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
}

// ── Therapist / Dashboard endpoints ──────────────────────────

export async function fetchStudents() {
    const res  = await apiFetch('/api/dashboard/students');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch students');
    }
    const data = await res.json();
    return data.students;
}

export async function fetchAuditLog() {
    const res  = await apiFetch('/api/dashboard/audit-log');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch audit log');
    }
    const data = await res.json();
    return data.auditLog;
}

export async function fetchNotes() {
    const res  = await apiFetch('/api/dashboard/notes');
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch notes');
    }
    const data = await res.json();
    return data.notes;
}

export async function addNote(text) {
    const res  = await apiFetch('/api/dashboard/notes', {
        method: 'POST',
        body:   JSON.stringify({ text }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save note');
    }
    const data = await res.json();
    return data.note;
}

// ── Task submission endpoints ─────────────────────────────────

export async function submitTask1(taskData) {
    const res = await apiFetch('/api/task1/submit', {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 1');
    }
    const data = await res.json();
    return data;
}

export async function submitTask2(taskData) {
    const res = await apiFetch('/api/assessments/task2/submit', {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 2');
    }
    const data = await res.json();
    return data;
}

export async function submitTask3(taskData) {
    const res = await apiFetch('/api/task3/submit', {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 3');
    }
    const data = await res.json();
    return data;
}

export async function submitTask4(taskData) {
    const res = await apiFetch('/api/task4/submit', {
        method: 'POST',
        body: JSON.stringify(taskData),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit task 4');
    }
    const data = await res.json();
    return data;
}

// ── Child session helpers ─────────────────────────────────────
// ✅ FIXED VERSION - Now properly handles parentId and guestId

export async function saveChildSession(sessionData) {
    // Get user info if logged in
    const user = getCurrentUser();
    const token = localStorage.getItem('token');
    
    // Get or create guest ID for non-authenticated users
    let guestId = localStorage.getItem('guest_id');
    if (!guestId && !user.token) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('guest_id', guestId);
    }
    
    // Build the payload with proper IDs
    const payload = {
        sessionUUID: sessionData.sessionUUID,
        childName: sessionData.childName,
        childGrade: sessionData.childGrade,
        childAge: sessionData.childAge || null,
        parentId: sessionData.parentId || (user.role === 'parent' ? user.userId : null),
        guestId: sessionData.guestId || guestId,
    };
    
    console.log('Saving child session to DB:', payload);
    
    try {
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
            console.error('Server error response:', errorData);
            throw new Error(errorData.error || 'Failed to save child session');
        }
        
        const data = await res.json();
        console.log('Child session saved successfully:', data);
        return data;
    } catch (error) {
        console.error('Save child session error:', error);
        throw error;
    }
}

// Optional: Add a function to verify session was saved
export async function getChildSession(sessionUUID) {
    try {
        const res = await apiFetch(`/api/child-info/session/${sessionUUID}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.session;
    } catch (error) {
        console.error('Get child session error:', error);
        return null;
    }
}

// ── Quiz endpoints ────────────────────────────────────────────

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
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(quizData),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit quiz');
    }
    const data = await res.json();
    return data;
}