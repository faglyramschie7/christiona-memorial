<script setup>
import { ref } from 'vue';
import { api } from '../api';
import { state, toast } from '../store';

const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

function close() {
  state.authOpen = false;
  error.value = '';
}

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    const res = await api.login({ email: email.value, password: password.value });
    state.user = res.user;
    toast(`Selamat datang, ${res.user.name}`);
    password.value = '';
    close();
  } catch (e) {
    error.value = e.message || 'Email atau password salah';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div v-if="state.authOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 1.3rem;">🛡️</span>
          <h3>Masuk sebagai Admin</h3>
        </div>
        <button class="close-btn" aria-label="Tutup" @click="close">&times;</button>
      </div>

      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
        Khusus akun pengelola &amp; keluarga untuk meninjau kiriman kenangan. Pendaftaran publik dinonaktifkan.
      </p>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="a-email">Email Admin</label>
          <input 
            id="a-email" 
            v-model="email" 
            type="email" 
            required 
            placeholder="admin@christiona.memorial" 
            autocomplete="email"
          />
        </div>

        <div class="form-group" style="margin-top: 1rem;">
          <label for="a-pass">Password</label>
          <input 
            id="a-pass" 
            v-model="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            autocomplete="current-password"
          />
        </div>

        <div v-if="error" class="alert alert-error" style="margin-top: 1rem;">{{ error }}</div>

        <button 
          class="btn btn-primary btn-block" 
          style="margin-top: 1.5rem; width: 100%; justify-content: center;" 
          :disabled="busy"
        >
          {{ busy ? 'Memeriksa kredensial…' : 'Masuk sebagai Admin' }}
        </button>
      </form>
    </div>
  </div>
</template>
