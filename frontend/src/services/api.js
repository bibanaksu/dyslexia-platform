// frontend/src/services/api.js
const BASE_URL = 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────
export function saveUserSession(data) {
    if (data.token) localStorage.setItem('token', data.token);
    if (data.role) localStorage.setItem('userRole', data.role);
    if (data.userId) localStorage.setItem('userId', String(data.userId));
    if (data.name) localStorage.setItem('userName', data.name);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
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
// AUTH ENDPOINTS (unchanged)
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
// CHILD SESSION (unchanged)
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
// PARENT ENDPOINTS (with fallbacks)
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
    try {
        const res = await apiFetch('/api/children');
        if (!res.ok) {
            if (res.status === 403 || res.status === 404) {
                console.warn('⚠️ fetchChildren: backend unavailable. Returning mock children for testing.');
                return [{ id: 1, full_name: 'Demo Child', grade: 3, dob: null }];
            }
            const data = await res.json();
            throw new Error(data.error || 'Failed to fetch children');
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('fetchChildren error:', err);
        return [{ id: 1, full_name: 'Demo Child', grade: 3, dob: null }];
    }
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
// ASSESSMENT RESULTS (unchanged)
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
// TASK SUBMISSION (unchanged)
// ─────────────────────────────────────────────────────────────
export async function submitTask1(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session. Please start a new assessment.');
    const res = await apiFetch('/api/task1/submit', { method: 'POST', body: JSON.stringify({ child_session_id: childSessionId, ...taskData }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to submit task 1'); }
    return res.json();
}

export async function submitTask2(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session. Please start a new assessment.');
    const res = await apiFetch('/api/assessments/task2/submit', { method: 'POST', body: JSON.stringify({ child_session_id: childSessionId, ...taskData }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to submit task 2'); }
    return res.json();
}

export async function submitTask3(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session. Please start a new assessment.');
    const res = await apiFetch('/api/task3/submit', { method: 'POST', body: JSON.stringify({ child_session_id: childSessionId, ...taskData }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to submit task 3'); }
    return res.json();
}

export async function submitTask4(taskData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session. Please start a new assessment.');
    const res = await apiFetch('/api/task4/submit', { method: 'POST', body: JSON.stringify({ child_session_id: childSessionId, ...taskData }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to submit task 4'); }
    return res.json();
}

// ─────────────────────────────────────────────────────────────
// QUIZ ENDPOINTS (unchanged)
// ─────────────────────────────────────────────────────────────
export async function fetchQuizQuestions() {
    const res = await fetch(`${BASE_URL}/api/quiz/questions`);
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to fetch questions'); }
    return (await res.json()).questions;
}

export async function submitQuiz(quizData) {
    const childSessionId = getCurrentChildSessionId();
    if (!childSessionId) throw new Error('No active child session. Please start a new assessment.');
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ child_session_id: childSessionId, ...quizData }),
    });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to submit quiz'); }
    return res.json();
}

// ─────────────────────────────────────────────────────────────
// MESSAGES (unchanged)
// ─────────────────────────────────────────────────────────────
export async function fetchMessages(parentId = null) {
    let url = '/api/messages';
    if (parentId) url += `?parentId=${parentId}`;
    const res = await apiFetch(url);
    if (!res.ok) { if (res.status === 404) return []; const data = await res.json(); throw new Error(data.error || 'Failed to fetch messages'); }
    const data = await res.json();
    return data.messages || [];
}

export async function sendMessage(content, therapistId = null, childId = null) {
    const res = await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ content, therapistId, child_id: childId }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to send message'); }
    return (await res.json()).message;
}

export async function sendTherapistMessage(parentId, content, childId = null) {
    const res = await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ parentId, content, child_id: childId }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to send message'); }
    return (await res.json()).message;
}

export async function fetchUnreadCount() {
    const res = await apiFetch('/api/messages/unread-count');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
}

export async function markMessageRead(messageId) {
    const res = await apiFetch(`/api/messages/${messageId}/read`, { method: 'PUT' });
    if (!res.ok) throw new Error('Failed to mark message as read');
    return res.json();
}

// ─────────────────────────────────────────────────────────────
// THERAPIST DASHBOARD ENDPOINTS (with localStorage fallbacks)
// ─────────────────────────────────────────────────────────────
export async function fetchPatients() {
    try {
        const res = await apiFetch('/api/therapist/patients');
        if (!res.ok) {
            if (res.status === 404) return [{ child_id: 1, child_name: 'Demo Child', grade: 3, parent_id: 1, parent_name: 'Demo Parent' }];
            throw new Error('Failed to fetch patients');
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('fetchPatients error:', err);
        return [{ child_id: 1, child_name: 'Demo Child', grade: 3, parent_id: 1, parent_name: 'Demo Parent' }];
    }
}

export async function fetchTherapistNotes(childId = null) {
    try {
        let url = '/api/therapist/notes';
        if (childId) url += `?childId=${childId}`;
        const res = await apiFetch(url);
        if (!res.ok) { if (res.status === 404) return []; throw new Error('Failed to fetch notes'); }
        return await res.json();
    } catch (err) { console.error(err); return []; }
}

export async function addTherapistNote(childId, noteText) {
    const res = await apiFetch('/api/therapist/notes', { method: 'POST', body: JSON.stringify({ child_id: childId, note_text: noteText }) });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
}

export async function deleteTherapistNote(noteId) {
    const res = await apiFetch(`/api/therapist/notes/${noteId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
}

export async function fetchActivities() {
    try {
        const res = await apiFetch('/api/activities');
        if (!res.ok) { if (res.status === 404) return { activities: [] }; throw new Error('Failed to fetch activities'); }
        const data = await res.json();
        if (data.activities && Array.isArray(data.activities)) return data;
        if (Array.isArray(data)) return { activities: data };
        return { activities: [] };
    } catch (err) { console.error(err); return { activities: [] }; }
}

// -- localStorage helpers (defined once) --
const getStorageKey = () => 'mock_assignments';

// Helper to get all assignments from localStorage
function getStoredAssignments() {
    const stored = localStorage.getItem(getStorageKey());
    return stored ? JSON.parse(stored) : [];
}

// Helper to save assignments to localStorage
function saveStoredAssignments(assignments) {
    localStorage.setItem(getStorageKey(), JSON.stringify(assignments));
}

// Helper to get assignments for a child with config attached
function getAssignmentsForChild(childId) {
    const all = getStoredAssignments();
    const defaultActivities = [
        { id: 1, name: 'Word-Picture Matching', type: 'matching', config: { pairs: [{ word: 'cat', image: 'https://placehold.co/200?text=🐱' }, { word: 'dog', image: 'https://placehold.co/200?text=🐶' }] } },
        { id: 2, name: 'Letter & Sound Match', type: 'letter_sound', config: { items: [{ letter: 'A', sound: '/sounds/a.mp3', image: 'https://placehold.co/100?text=🍎' }] } },
        { id: 3, name: 'Reading Comprehension', type: 'reading', config: { passage: 'Ali has a red ball.', questions: [{ text: 'What color?', options: ['Blue','Red','Green'], correct: 1 }] } }
    ];
    const childAssignments = all.filter(a => a.child_id === parseInt(childId));
    return childAssignments.map(assign => {
        const act = defaultActivities.find(a => a.id === assign.activity_id);
        return { ...assign, config: act?.config || null };
    });
}

// ─────────────────────────────────────────────────────────────
// Assignments (Therapist view)
// ─────────────────────────────────────────────────────────────
export async function fetchAssignments() {
    try {
        const res = await apiFetch('/api/therapist/assignments');
        if (!res.ok) { if (res.status === 404) return getStoredAssignments(); throw new Error('Failed to fetch assignments'); }
        const data = await res.json();
        return data.assignments || [];
    } catch (err) {
        console.warn('⚠️ Backend fetchAssignments failed, using localStorage');
        return getStoredAssignments();
    }
}

export async function assignActivity(childId, activityId) {
    try {
        const res = await apiFetch('/api/therapist/assignments', {
            method: 'POST',
            body: JSON.stringify({ child_id: childId, activity_id: activityId }),
        });
        if (!res.ok) throw new Error('Server error');
        return res.json();
    } catch (err) {
        console.warn('⚠️ Backend assignment failed, using localStorage fallback');
        
        const existing = getStoredAssignments();
        // Prevent duplicate assignments for same child+activity
        const alreadyAssigned = existing.some(a => a.child_id === parseInt(childId) && a.activity_id === parseInt(activityId));
        if (alreadyAssigned) {
            console.warn('Activity already assigned to this child');
            return { success: true, alreadyAssigned: true };
        }
        
        const defaultActivities = [
            { id: 1, name: 'Word-Picture Matching', type: 'matching', difficulty_level: 1,
              config: { pairs: [{ word: 'cat', image: 'https://placehold.co/200?text=🐱' }, { word: 'dog', image: 'https://placehold.co/200?text=🐶' }] } },
            { id: 2, name: 'Letter & Sound Match', type: 'letter_sound', difficulty_level: 1,
              config: { items: [{ letter: 'A', sound: '/sounds/a.mp3', image: 'https://placehold.co/100?text=🍎' }] } },
            { id: 3, name: 'Reading Comprehension', type: 'reading', difficulty_level: 1,
              config: { passage: 'Ali has a red ball.', questions: [{ text: 'What color?', options: ['Blue','Red','Green'], correct: 1 }] } }
        ];
        const activity = defaultActivities.find(a => a.id === parseInt(activityId)) || 
                         { id: activityId, name: `Activity ${activityId}`, type: 'matching', difficulty_level: 1, config: {} };
        
        const newAssignment = {
            id: Date.now(),
            child_id: parseInt(childId),
            activity_id: parseInt(activityId),
            assigned_at: new Date().toISOString(),
            completed: false,
            child_name: `Child ${childId}`,
            activity_name: activity.name,
            type: activity.type,
            difficulty_level: activity.difficulty_level,
            description: activity.name + ' - assigned by therapist',
            config: activity.config,
        };
        
        existing.push(newAssignment);
        saveStoredAssignments(existing);
        return { success: true, assignment: newAssignment };
    }
}

// ─────────────────────────────────────────────────────────────
// Parent endpoints
// ─────────────────────────────────────────────────────────────
export async function fetchAssignmentsForChild(childId) {
    if (!childId) return [];
    try {
        const res = await apiFetch(`/api/assignments/child/${childId}`);
        if (!res.ok) {
            if (res.status === 404) {
                console.warn('⚠️ fetchAssignmentsForChild: endpoint missing, using localStorage');
                return getAssignmentsForChild(childId);
            }
            throw new Error('Failed to fetch assignments for child');
        }
        const data = await res.json();
        return data.assignments || [];
    } catch (err) {
        console.warn('⚠️ fetchAssignmentsForChild error, using localStorage');
        return getAssignmentsForChild(childId);
    }
}

export const fetchAssignedActivities = fetchAssignmentsForChild;

export async function completeAssignment(assignmentId, score, resultData = null) {
    const res = await apiFetch(`/api/assignments/${assignmentId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ score, result_data: resultData }),
    });
    if (!res.ok) throw new Error('Failed to complete assignment');
    return res.json();
}

// Additional dashboard endpoints (unchanged but with fallbacks)
export async function fetchStudents() {
    try {
        const res = await apiFetch('/api/dashboard/students');
        if (!res.ok) { if (res.status === 404) return []; const data = await res.json(); throw new Error(data.error || 'Failed to fetch students'); }
        const data = await res.json();
        return data.students || [];
    } catch (err) { console.error(err); return []; }
}

export async function fetchAuditLog() {
    try {
        const res = await apiFetch('/api/dashboard/audit-log');
        if (!res.ok) { if (res.status === 404) return []; const data = await res.json(); throw new Error(data.error || 'Failed to fetch audit log'); }
        const data = await res.json();
        return data.auditLog || [];
    } catch (err) { console.error(err); return []; }
}

export async function fetchNotes() {
    try {
        const res = await apiFetch('/api/dashboard/notes');
        if (!res.ok) { if (res.status === 404) return []; const data = await res.json(); throw new Error(data.error || 'Failed to fetch notes'); }
        const data = await res.json();
        return data.notes || [];
    } catch (err) { console.error(err); return []; }
}

export async function addNote(text) {
    const res = await apiFetch('/api/dashboard/notes', { method: 'POST', body: JSON.stringify({ text }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to save note'); }
    return (await res.json()).note;
}