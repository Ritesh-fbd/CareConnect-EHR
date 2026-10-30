const KEY = 'ehr_session';

export const getSession = () => {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
};
export const setSession = (s) =>
  s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const s = getSession();
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(s ? { Authorization: 'Bearer ' + s.token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !path.startsWith('/auth')) {
    setSession(null);
    location.reload();
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || (res.status === 403 ? 'Your role cannot do this.' : 'Something went wrong. Try again.'));
  }
  return res.status === 204 ? null : res.json();
}

export const ageFrom = (dob) => {
  if (!dob) return '';
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
};

export const fmt = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
export const fmtDay = (iso) => (iso ? new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) : '');
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '');
export const initials = (first = '', last = '') => ((first[0] || '') + (last[0] || '')).toUpperCase();
export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};
/** Value for a datetime-local input's min attribute, in local time. */
export const localNowValue = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

/** "Meera Rao" becomes "Dr. Meera Rao". Placeholder names from the server are left alone. */
export const dr = (name) => {
  if (!name) return '';
  if (/^(dr\.?\s|any doctor|former doctor)/i.test(name)) return name;
  return 'Dr. ' + name;
};
export const dateValue = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
