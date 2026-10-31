import { reactive } from 'vue';
import { api } from './api';

export const state = reactive({
  user: null,
  sessionLoaded: false,
  authOpen: false,
  authMode: 'login',
  toasts: [],
  lightbox: null // { src, video }
});

export async function loadSession() {
  try {
    state.user = (await api.session()).user;
  } catch {
    state.user = null;
  }
  state.sessionLoaded = true;
}

export function openAuth(mode = 'login') {
  state.authMode = mode;
  state.authOpen = true;
}

export async function logout() {
  await api.logout().catch(() => {});
  state.user = null;
}

let toastId = 0;
export function toast(message, type = 'success') {
  const id = ++toastId;
  state.toasts.push({ id, message, type });
  setTimeout(() => {
    state.toasts = state.toasts.filter((t) => t.id !== id);
  }, 4500);
}
