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
    <p class="footer-sub">“Aku telah mengakhiri pertandingan yang baik, aku telah mencapai garis akhir.” — 2 Timotius 4:7 🕊️</p>
  </footer>
  <AuthModal />
  <Lightbox />
  <ToastHost />
</template>
