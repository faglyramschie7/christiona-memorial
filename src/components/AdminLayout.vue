<script setup>
import UploadQueueStatus from './UploadQueueStatus.vue';
import { useRoute } from 'vue-router';
const route = useRoute();
import Icon from './Icon.vue';
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <span class="admin-sidebar-label">ADMIN PANEL</span>
      <nav aria-label="Menu admin">
        <router-link to="/admin" exact-active-class="selected" class="admin-menu-link">
          <Icon name="home" :size="20" /><span>Feed</span>
        </router-link>
        <router-link to="/admin/slideshow" active-class="selected" class="admin-menu-link">
          <Icon name="settings" :size="20" /><span>Pengaturan</span>
        </router-link>
        <router-link to="/admin/music" active-class="selected" class="admin-menu-link">
          <span aria-hidden="true">♫</span><span>Musik</span>
        </router-link>
        <router-link to="/admin/library" active-class="selected" class="admin-menu-link">
          <Icon name="slideshow" :size="20" /><span>Koleksi</span>
        </router-link>
      </nav>
    </aside>
    <div class="admin-content"><slot /><UploadQueueStatus v-if="!(['/admin/library', '/admin/music'].includes(route.path))" /></div>
  </div>
</template>

<style scoped>
.admin-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); max-width: 1440px; margin: 0 auto; align-items: start; }
.admin-sidebar { position: sticky; top: 52px; height: calc(100dvh - 52px); box-sizing: border-box; overflow-y: auto; padding: 2rem 1.25rem; border-right: 1px solid var(--border, #282d3a); }
.admin-sidebar-label { display: block; color: var(--gold); font-size: .7rem; font-weight: 700; letter-spacing: .14em; margin: 0 .9rem 1.5rem; }
.admin-sidebar nav { display: grid; gap: .5rem; }
.admin-menu-link { display: flex; align-items: center; gap: .75rem; padding: .85rem 1rem; border-radius: 10px; color: #a5adbd; text-decoration: none; font-weight: 600; border: 1px solid transparent; }
.admin-menu-link:hover { background: #171b24; color: #fff; }
.admin-menu-link.selected { color: var(--gold); background: rgba(231, 193, 97, .09); border-color: rgba(231, 193, 97, .22); }
.admin-content { min-width: 0; padding: 0 1.5rem; }
.admin-content :deep(.main-container) { width: 100%; max-width: none; margin: 2rem 0; padding: 0; }
@media (max-width: 700px) {
  .admin-layout { grid-template-columns: 1fr; }
  .admin-sidebar { position: static; height: auto; max-height: none; padding: 1rem; border-right: 0; border-bottom: 1px solid #282d3a; }
  .admin-sidebar-label { margin-bottom: .75rem; }
  .admin-sidebar nav { grid-template-columns: 1fr 1fr; }
  .admin-content { padding: 0 1rem; }
}
</style>
