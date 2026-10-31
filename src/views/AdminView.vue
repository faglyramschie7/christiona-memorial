<script setup>
import { ref, computed, watch } from 'vue';
import { api, formatDate } from '../api';
import { state, toast } from '../store';
import { useRouter } from 'vue-router';

const router = useRouter();
const items = ref([]);
const filter = ref('pending');
const loading = ref(false);
const busyId = ref('');

const isAdmin = computed(() => state.user?.role === 'admin');
const counts = computed(() => ({
  pending: items.value.filter((i) => i.status === 'pending').length,
  approved: items.value.filter((i) => i.status === 'approved').length,
  rejected: items.value.filter((i) => i.status === 'rejected').length,
  all: items.value.length
}));
const shown = computed(() => (filter.value === 'all' ? items.value : items.value.filter((i) => i.status === filter.value)));

async function load() {
  loading.value = true;
  try {
    items.value = await api.adminList();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    loading.value = false;
  }
}

async function act(fn, id, okMsg) {
  busyId.value = id;
  try {
    await fn(id);
    toast(okMsg);
    await load();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    busyId.value = '';
  }
}

const approve = (i) => act(api.approve, i.id, 'Approved and published');
const reject = (i) => act(api.reject, i.id, 'Rejected');
const remove = (i) => confirm('Delete this file permanently?') && act(api.remove, i.id, 'Deleted');
const open = (i) => (state.lightbox = { src: `/upload/${i.filename}`, video: i.mimetype.startsWith('video') });

watch(
  () => [state.sessionLoaded, isAdmin.value],
  ([loaded, admin]) => {
    if (!loaded) return;
    if (admin) load();
  },
  { immediate: true }
);

const tabs = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['all', 'All']
];
</script>

<template>
  <main class="main-container admin-page">
    <div v-if="!state.sessionLoaded" class="empty-state">Loading…</div>

    <div v-else-if="!isAdmin" class="card login-prompt-box">
      <div style="font-size: 2rem">🛡️</div>
      <h3>Admin only</h3>
      <p>Sign in with the admin account to review uploads.</p>
      <button class="btn btn-primary" @click="state.authOpen = true; state.authMode = 'login'">Sign In</button>
      <button class="btn btn-outline" style="margin-left: .5rem" @click="router.push('/')">Back</button>
    </div>

    <section v-else>
      <div class="section-header">
        <div>
          <span class="badge admin-badge">Admin</span>
          <h2>Review Uploads</h2>
          <p class="section-desc">Only approved files appear on the public gallery.</p>
        </div>
        <button class="btn btn-outline btn-sm" :disabled="loading" @click="load">↻ Refresh</button>
      </div>

      <div class="filter-tabs">
        <button v-for="[key, label] in tabs" :key="key" class="tab-btn" :class="{ active: filter === key }" @click="filter = key">
          {{ label }} ({{ counts[key] }})
        </button>
      </div>

      <div v-if="!shown.length" class="empty-state">Nothing here.</div>
      <div v-else class="admin-grid">
        <article v-for="i in shown" :key="i.id" class="admin-card">
          <div class="admin-card-media" style="cursor: zoom-in" @click="open(i)">
            <video v-if="i.mimetype.startsWith('video')" :src="`/upload/${i.filename}#t=0.1`" preload="metadata" muted></video>
            <img v-else :src="`/upload/${i.filename}`" :alt="i.original_name" loading="lazy" />
          </div>
          <div class="admin-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span class="status-tag" :class="`status-${i.status}`">{{ i.status.toUpperCase() }}</span>
              <small style="color: var(--muted)">{{ formatDate(i.created_at) }}</small>
            </div>
            <div><strong>From:</strong> {{ i.user_name || 'User' }}</div>
            <div style="word-break: break-all"><strong>File:</strong> <code>{{ i.filename }}</code></div>
            <div v-if="i.caption" style="font-style: italic">“{{ i.caption }}”</div>
            <div class="admin-card-actions">
              <button v-if="i.status !== 'approved'" class="btn btn-sm btn-success" :disabled="busyId === i.id" @click="approve(i)">Approve</button>
              <button v-if="i.status !== 'rejected'" class="btn btn-sm btn-danger" :disabled="busyId === i.id" @click="reject(i)">Reject</button>
              <button class="btn btn-sm btn-outline" :disabled="busyId === i.id" @click="remove(i)">Delete</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
