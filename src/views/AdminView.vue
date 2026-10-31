<script setup>
import { ref, computed, watch } from 'vue';
import { api, formatDate } from '../api';
import { state, toast } from '../store';
import { useRouter } from 'vue-router';

const router = useRouter();
const posts = ref([]);
const filter = ref('pending');
const loading = ref(false);
const busyId = ref('');

const isAdmin = computed(() => state.user?.role === 'admin');

const counts = computed(() => ({
  pending: posts.value.filter((p) => p.status === 'pending').length,
  approved: posts.value.filter((p) => p.status === 'approved').length,
  rejected: posts.value.filter((p) => p.status === 'rejected').length,
  all: posts.value.length
}));

const shownPosts = computed(() => {
  if (filter.value === 'all') return posts.value;
  return posts.value.filter((p) => p.status === filter.value);
});

async function load() {
  loading.value = true;
  try {
    posts.value = await api.adminPosts();
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

const approvePost = (p) => act(api.approvePost, p.post_id, 'Postingan berhasil disetujui dan dipublikasikan! 🕊️');
const rejectPost = (p) => act(api.rejectPost, p.post_id, 'Postingan telah ditolak.');
const removePost = (p) => {
  if (confirm('Hapus seluruh postingan ini beserta semua file fotonya secara permanen?')) {
    act(api.removePost, p.post_id, 'Postingan dan file telah dihapus permanen.');
  }
};

const open = (mediaItem) => {
  state.lightbox = {
    src: `/upload/${mediaItem.filename}`,
    video: mediaItem.mimetype?.startsWith('video')
  };
};

watch(
  () => [state.sessionLoaded, isAdmin.value],
  ([loaded, admin]) => {
    if (!loaded) return;
    if (admin) load();
  },
  { immediate: true }
);

const tabs = [
  ['pending', 'Menunggu'],
  ['approved', 'Disetujui'],
  ['rejected', 'Ditolak'],
  ['all', 'Semua']
];
</script>

<template>
  <main class="main-container admin-page">
    <div v-if="!state.sessionLoaded" class="empty-state">Memuat data...</div>

    <div v-else-if="!isAdmin" class="card login-prompt-box">
      <div style="font-size: 2rem">🛡️</div>
      <h3>Khusus Akun Admin</h3>
      <p>Silakan masuk dengan akun admin untuk meninjau dan mengelola kiriman kenangan.</p>
      <button class="btn btn-primary" @click="state.authOpen = true; state.authMode = 'login'">Masuk sebagai Admin</button>
      <button class="btn btn-outline" style="margin-left: .5rem" @click="router.push('/')">Kembali ke Beranda</button>
    </div>

    <section v-else>
      <div class="section-header">
        <div>
          <span class="badge admin-badge">Admin</span>
          <h2>Tinjau Kiriman Kenangan</h2>
          <p class="section-desc">Persetujuan dilakukan <strong>per postingan</strong>. Semua foto/video dalam satu postingan disetujui atau ditolak bersamaan.</p>
        </div>
        <button class="btn btn-outline btn-sm" :disabled="loading" @click="load">↻ Segarkan Data</button>
      </div>

      <div class="filter-tabs">
        <button 
          v-for="[key, label] in tabs" 
          :key="key" 
          class="tab-btn" 
          :class="{ active: filter === key }" 
          @click="filter = key"
        >
          {{ label }} ({{ counts[key] }})
        </button>
      </div>

      <div v-if="!shownPosts.length" class="empty-state">
        <p style="font-size: 1.8rem; margin-bottom: 0.5rem;">🕊️</p>
        <p>Tidak ada postingan pada kategori ini.</p>
      </div>

      <div v-else class="admin-grid">
        <article v-for="post in shownPosts" :key="post.post_id" class="admin-card">
          <!-- Media Showcase (All photos/videos in this post) -->
          <div class="admin-post-media-wrap">
            <span class="admin-media-count-badge">
              {{ (post.media && post.media.length > 1) ? `📸 ${post.media.length} File` : '1 Media' }}
            </span>

            <!-- Single media layout -->
            <div 
              v-if="!post.media || post.media.length <= 1" 
              class="admin-card-media" 
              style="cursor: zoom-in" 
              @click="open(post.media?.[0] || post)"
            >
              <video 
                v-if="post.media?.[0]?.mimetype?.startsWith('video')" 
                :src="`/upload/${post.media[0].filename}#t=0.1`" 
                preload="metadata" 
                muted
              ></video>
              <img 
                v-else-if="post.media?.[0]" 
                :src="`/upload/${post.media[0].filename}`" 
                :alt="post.media[0].original_name" 
                loading="lazy" 
              />
            </div>

            <!-- Multi-media grid layout -->
            <div v-else class="admin-media-grid">
              <div 
                v-for="m in post.media" 
                :key="m.id" 
                class="admin-sub-media" 
                @click="open(m)"
                title="Klik untuk memperbesar"
              >
                <video 
                  v-if="m.mimetype.startsWith('video')" 
                  :src="`/upload/${m.filename}#t=0.1`" 
                  preload="metadata" 
                  muted
                ></video>
                <img v-else :src="`/upload/${m.filename}`" :alt="m.original_name" loading="lazy" />
              </div>
            </div>
          </div>

          <!-- Post Information Body -->
          <div class="admin-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
              <span class="status-tag" :class="`status-${post.status}`">
                {{ post.status === 'approved' ? 'DISETUJUI' : (post.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU') }}
              </span>
              <small style="color: var(--text-muted); font-size: 0.75rem;">{{ formatDate(post.created_at) }}</small>
            </div>

            <div>
              <strong>Pengirim:</strong> {{ post.user_name || 'Keluarga & Sahabat' }}
            </div>

            <div v-if="post.caption" style="font-style: italic; background: rgba(0,0,0,0.25); padding: 0.4rem 0.6rem; border-radius: 6px; margin-top: 0.25rem;">
              “{{ post.caption }}”
            </div>

            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
              ID Post: <code>{{ post.post_id?.slice(0, 8) }}...</code> ({{ post.media?.length || 1 }} file)
            </div>

            <!-- Actions Per Post -->
            <div class="admin-card-actions">
              <button 
                v-if="post.status !== 'approved'" 
                class="btn btn-sm btn-success" 
                :disabled="busyId === post.post_id" 
                @click="approvePost(post)"
              >
                ✓ Setujui Postingan
              </button>
              <button 
                v-if="post.status !== 'rejected'" 
                class="btn btn-sm btn-danger" 
                :disabled="busyId === post.post_id" 
                @click="rejectPost(post)"
              >
                ✕ Tolak Postingan
              </button>
              <button 
                class="btn btn-sm btn-outline" 
                :disabled="busyId === post.post_id" 
                @click="removePost(post)"
              >
                🗑️ Hapus Postingan
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
