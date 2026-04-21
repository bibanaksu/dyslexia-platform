// frontend/src/utils/childSession.js
// Central helper for reading child info from localStorage.
// All tasks import from here.

export const getChildInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('child_info') || 'null');
  } catch {
    return null;
  }
};

export const getSessionUUID = () =>
  localStorage.getItem('child_session_uuid') || null;

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

/** Returns the child's display name, checking both key variants */
export const getChildName = () => {
  const info = getChildInfo();
  if (!info) return 'Guest User';
  return info.childFullName || info.childName || 'Guest User';
};

export const getChildGrade = () => {
  const info = getChildInfo();
  return info?.childGrade || 'Not Specified';
};