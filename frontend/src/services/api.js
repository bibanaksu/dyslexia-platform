const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function loginParent(email, password) {
  const res = await fetch(`${BASE_URL}/api/parents/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerParent(fullName, email, phone, password) {
  const res = await fetch(`${BASE_URL}/api/parents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, email, phone, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginTherapist(email, password) {
  const res = await fetch(`${BASE_URL}/api/therapists/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerTherapist(username, email, password) {
  const res = await fetch(`${BASE_URL}/api/therapists/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export function saveUserSession(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('userRole', data.role);
  localStorage.setItem('userId', data.parentId || data.therapistId || '');
  localStorage.setItem('userName', data.full_name || data.name || '');
}

export function clearUserSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
}

export function getCurrentUser() {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('userRole'),
    userId: localStorage.getItem('userId'),
    name: localStorage.getItem('userName')
  };
}

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}