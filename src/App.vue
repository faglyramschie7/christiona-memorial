<script setup>
import { onMounted } from 'vue';
import NavBar from './components/NavBar.vue';
import AuthModal from './components/AuthModal.vue';
import Lightbox from './components/Lightbox.vue';
import ToastHost from './components/ToastHost.vue';
import { loadSession } from './store';

onMounted(loadSession);
</script>

<template>
  <NavBar />
  <router-view />
  <footer class="footer">
    <p>In loving memory of <strong>Christiona Adolfin Mona</strong></p>
    <p class="footer-sub">Passed away October 28 • 5:48 — Rest in peace 🕊️</p>
  </footer>
  <AuthModal />
  <Lightbox />
  <ToastHost />
</template>
