import { useSyncExternalStore } from 'react';

export const API_URL = "http://localhost:8000";

// The login session, kept in localStorage so it survives reloads and is shared between tabs.
// The token is opaque: the server looks it up on every request and enforces roles itself,
// so the role here only decides what the UI shows.
export type Role = 'admin' | 'staff' | 'visitor';
export type Session = { token: string; username: string; role: Role };

const KEY = 'session';
const listeners = new Set<() => void>();

// The backend's role values aren't consistently cased ("admin", "STAFF")
export const toRole = (role: unknown) => String(role).toLowerCase() as Role;

function read(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return s?.token ? s : null;
  } catch {
    return null;
  }
}

localStorage.removeItem('user');   // left by the old login, which had no token
let current = read();

export function getSession() {
  return current;
}

export function setSession(session: Session | null) {
  if (session) localStorage.setItem(KEY, JSON.stringify(session));
  else localStorage.removeItem(KEY);
  current = session;
  listeners.forEach(l => l());
}

// Logging in or out in another tab
window.addEventListener('storage', e => {
  if (e.key !== KEY && e.key !== null) return;
  current = read();
  listeners.forEach(l => l());
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSession);
}

export function hasRole(session: Session | null, roles?: Role[]) {
  return session !== null && (!roles || roles.includes(session.role));
}

// fetch against the backend, sending the token if logged in
export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = getSession();
  const headers = new Headers(init.headers);
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  // Expired (after 5 h) or revoked; only drop it if no one has logged in again meanwhile
  if (res.status === 401 && session && getSession()?.token === session.token) setSession(null);
  return res;
}

export async function logout() {
  // Revoke the token on the server, but log out locally even if the server is unreachable
  await apiFetch('/logout', { method: 'POST' }).catch(() => {});
  setSession(null);
}

// Re-check a stored token on startup: it may have expired, or an admin may have changed the role
export async function refreshSession() {
  const session = getSession();
  if (!session) return;
  try {
    const res = await apiFetch('/users/me');
    if (res.ok && getSession()?.token === session.token) {
      const me = await res.json();
      setSession({ ...session, role: toRole(me.role) });
    }
  } catch {
    // Server unreachable: keep the session; requests will fail on their own
  }
}
