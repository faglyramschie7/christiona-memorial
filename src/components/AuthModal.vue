<script setup>
import { ref } from 'vue';
import { api } from '../api';
import { state, toast } from '../store';

const email = ref('');
const password = ref('');
const name = ref('');
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
    const isReg = state.authMode === 'register';
    const res = isReg
      ? await api.register({ name: name.value, email: email.value, password: password.value })
      : await api.login({ email: email.value, password: password.value });
    state.user = res.user;
    toast(`Welcome, ${res.user.name}`);
    password.value = '';
    close();
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div v-if="state.authOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ state.authMode === 'register' ? 'Create Account' : 'Sign In' }}</h3>
        <button class="close-btn" aria-label="Close" @click="close">&times;</button>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab" :class="{ active: state.authMode === 'login' }" @click="state.authMode = 'login'">Sign In</button>
        <button class="auth-tab" :class="{ active: state.authMode === 'register' }" @click="state.authMode = 'register'">Register</button>
      </div>

      <form @submit.prevent="submit">
        <div v-if="state.authMode === 'register'" class="form-group">
          <label for="a-name">Your Name</label>
          <input id="a-name" v-model="name" type="text" required placeholder="Your name" />
        </div>
        <div class="form-group">
          <label for="a-email">Email</label>
          <input id="a-email" v-model="email" type="email" required placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label for="a-pass">Password</label>
          <input id="a-pass" v-model="password" type="password" required placeholder="••••••••" />
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <button class="btn btn-primary btn-block" style="margin-top: 1.2rem" :disabled="busy">
          {{ busy ? 'Please wait…' : state.authMode === 'register' ? 'Create Account' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>
