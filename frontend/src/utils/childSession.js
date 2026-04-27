// frontend/src/utils/childSession.js
export const getChildInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('child_info') || 'null');
  } catch {
    return null;
  }
};

export const getSessionUUID = () => {
  console.warn('getSessionUUID is deprecated – use getCurrentChildSessionId');
  return localStorage.getItem('child_session_id');
};

export const getCurrentChildSessionId = () => {
  return localStorage.getItem('child_session_id');
};

export const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

export const getGuestId = () => {
  let id = localStorage.getItem('guest_id');
  if (!id) {
    id = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guest_id', id);
  }
  return id;
};

export const getChildName = () => {
  const info = getChildInfo();
  return info?.childFullName || info?.childName || 'Guest User';
};

export const getChildGrade = () => {
  const info = getChildInfo();
  return info?.childGrade || 'Not Specified';
};