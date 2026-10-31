<script setup>
import MediaRotation from '../components/MediaRotation.vue';
import AdminMediaEditor from '../components/AdminMediaEditor.vue';
import { ref, computed, watch } from 'vue';
import PendingUploadCards from '../components/PendingUploadCards.vue';
import MediaDropzone from '../components/MediaDropzone.vue';
import { api, formatFileSize } from '../api';
import { state, toast } from '../store';
const selectedFile = ref(null);
const admin = computed(() => state.user?.role === 'admin');
const items = ref([]), title = ref(''), busy = ref(false), loading = ref(true), error = ref('');
async function load(silent = false) {
  if (!silent) loading.value = true; error.value = '';
  try { items.value = await api.library(); }
  catch (e) { error.value = e.message; }
  finally { loading.value = false; }
}
watch(() => state.sessionLoaded && admin.value, ready => { if (ready) load(); }, { immediate: true });
async function upload() {
  const file = selectedFile.value;
  if (!file || !title.value.trim()) return toast('Isi judul dan pilih file terlebih dahulu.', 'error');
  if (file.size > 200 * 1024 * 1024) return toast('Ukuran maksimal 200 MB.', 'error');
  busy.value = true;
  try {
    const body = new FormData(); body.append('title', title.value.trim()); body.append('media', file);
    await api.uploadLibrary(body); title.value = ''; selectedFile.value = null;
    toast('Unggahan diterima dan masuk antrean optimasi.'); await load();
  } catch (e) { toast(e.message, 'error'); }
  finally { busy.value = false; }
}
async function remove(item) {
  if (!confirm(`Hapus “${item.title}” dari koleksi?`)) return;
  busy.value = true;
  try { await api.removeLibrary(item.id); await load(); toast('Koleksi dihapus.'); }
  catch (e) { toast(e.message, 'error'); }
  finally { busy.value = false; }
}
function preview(item) {
  state.lightbox = { items: [item], currentIndex: 0, adminKind: 'library', onMediaSaved: () => load(true) };
}
</script>
<template>
  <main class="main-container library-page">
    <h2>Koleksi</h2>
    <p class="section-desc">Video cover, penampilan, dan foto Christiona. Koleksi ini tampil di slideshow bersama kiriman feed.</p>
    <p v-if="!state.sessionLoaded">Memuat...</p>
    <div v-else-if="!admin">
      <p>Silakan masuk dengan akun admin.</p>
      <button class="btn btn-primary" @click="state.authOpen = true; state.authMode = 'login'">Masuk sebagai Admin</button>
    </div>
    <template v-else>
      <form class="card library-upload" @submit.prevent="upload">
        <h3>Tambah Foto / Video</h3>
        <label for="library-title">Judul</label>
        <input id="library-title" v-model="title" placeholder="Contoh: He Leadeth Me — Cover Christiona" required maxlength="200" :disabled="busy" />
        <MediaDropzone v-model="selectedFile" accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov" label="Foto / video · Maks. 200 MB" :disabled="busy" />
        <p class="section-desc">Unggahan masuk antrean optimasi WebP / WebM, lalu tersedia di slideshow. Koleksi muncul otomatis setelah selesai diproses.</p>
        <button class="btn btn-primary" :disabled="busy">{{ busy ? 'Memproses, mohon tunggu...' : 'Tambah ke Koleksi' }}</button>
      </form>
      <p v-if="loading">Memuat koleksi...</p>
      <div v-else-if="error" role="alert">{{ error }} <button class="btn btn-outline" @click="load">Coba Lagi</button></div>
      
      <div class="library-grid">
        <PendingUploadCards kind="library" @changed="load(true)" />
        <article v-for="item in items" :key="item.id" class="card library-item">
          <div style="position: relative;">
          <button class="library-preview" @click="preview(item)" :aria-label="`Lihat ${item.title}`">
            <video v-if="item.mimetype.startsWith('video')" :src="`/upload/${item.filename}#t=0.1`" muted preload="metadata" playsinline></video>
            <img v-else :src="`/upload/${item.filename}`" :alt="item.title" loading="lazy" />
            <span v-if="item.mimetype.startsWith('video')" class="preview-label">▶ Lihat Video</span>
          </button>
          <MediaRotation :item="item" kind="library" @saved="load(true)" />
          </div>
          <strong>{{ item.title }}</strong>
          <AdminMediaEditor :item="item" kind="library" @saved="load(true)" />
          <small class="section-desc">Ukuran akhir: {{ formatFileSize(item.size) }} · {{ item.mimetype.startsWith('video') ? 'WebM' : 'WebP' }}</small>
          <button class="btn btn-outline" :disabled="busy" @click="remove(item)">Hapus</button>
        </article>
      </div>
    </template>
  </main>
</template>
<style scoped>
.library-page > .section-desc { margin: .75rem 0 1.5rem; }
.library-upload { display: grid; gap: 1rem; padding: 1.5rem; max-width: 680px; margin-bottom: 2rem; }
input { min-height: 52px; padding: 12px 16px; font-size: 1rem; color: white; background: #0b0e14; border: 1px solid #414755; border-radius: 10px; width: 100%; box-sizing: border-box; }
.library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.library-item { padding: 1rem; display: grid; gap: 1rem; align-content: start; }
.library-preview { width: 100%; position: relative; border: 0; padding: 0; background: #000; border-radius: 8px; overflow: hidden; cursor: pointer; }
.library-preview video, .library-preview img { width: 100%; height: 180px; object-fit: contain; display: block; pointer-events: none; }
.preview-label { position: absolute; bottom: 10px; left: 10px; color: white; padding: 6px 10px; background: #000b; border-radius: 6px; }
</style>
