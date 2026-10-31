<script setup>
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import AdminLayout from './components/AdminLayout.vue';
const route = useRoute();
const isAdminPage = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'));
import NavBar from './components/NavBar.vue';
import AuthModal from './components/AuthModal.vue';
import Lightbox from './components/Lightbox.vue';
import ToastHost from './components/ToastHost.vue';
import { loadSession } from './store';

onMounted(loadSession);
</script>

<template>
  <NavBar />
  <AdminLayout v-if="isAdminPage"><router-view /></AdminLayout>
  <router-view v-else />
  <footer class="footer" :class="{ 'admin-footer': isAdminPage }">
    <p>In loving memory of <strong>Christiona Adolfin Mona</strong></p>
    <p class="footer-sub">“Aku telah mengakhiri pertandingan yang baik, aku telah mencapai garis akhir.” — 2 Timotius 4:7 🕊️</p>
  </footer>
  <AuthModal />
  <Lightbox />
  <ToastHost />
</template>
