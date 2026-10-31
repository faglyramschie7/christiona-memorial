<script setup>
import { ref, computed, watch } from 'vue';
import PendingUploadCards from '../components/PendingUploadCards.vue';
import MediaDropzone from '../components/MediaDropzone.vue';
import { api, formatFileSize } from '../api';
import { state, toast } from '../store';
const selectedFile = ref(null);
const admin = computed(() => state.user?.role === 'admin');
const songs = ref([]), selectedId = ref('default'), title = ref('');
const loading = ref(true), busy = ref(false), error = ref('');
async function load(silent = false) {
  if (!silent) loading.value = true;
  error.value = '';
  try { const data = await api.slideshowMusic(); songs.value = data.songs; selectedId.value = data.selectedId; }
  catch (e) { error.value = e.message; }
  finally { loading.value = false; }
}
watch(() => state.sessionLoaded && admin.value, ready => { if (ready) load(); }, { immediate: true });
async function select(id) {
  busy.value = true;
  try { await api.selectSong(id); selectedId.value = id; toast('Musik slideshow disimpan.'); }
  catch (e) { toast(e.message, 'error'); }
  finally { busy.value = false; }
}
async function upload() {
  const file = selectedFile.value;
  if (!file) return toast('Pilih file terlebih dahulu.', 'error');
  if (file.size > 30 * 1024 * 1024) return toast('Ukuran maksimal 30 MB.', 'error');
  busy.value = true;
  try {
    const body = new FormData(); body.append('song', file); body.append('title', title.value);
    const data = await api.uploadSong(body); songs.value = data.songs;
    title.value = ''; selectedFile.value = null; toast('Lagu diterima dan masuk antrean optimasi.');
  } catch (e) { toast(e.message, 'error'); }
  finally { busy.value = false; }
}
</script>
<template>
  <main class="main-container music-page">
    <h2>Musik Slideshow</h2>
    <p class="section-desc">Tambahkan lagu dan pilih musik yang diputar berulang selama slideshow. Muat ulang slideshow untuk menerapkan pilihan.</p>
    <p v-if="!state.sessionLoaded">Memuat...</p>
    <div v-else-if="!admin">
      <p>Silakan masuk dengan akun admin.</p>
      <button class="btn btn-primary" @click="state.authOpen = true; state.authMode = 'login'">Masuk sebagai Admin</button>
    </div>
    <template v-else>
      <p v-if="loading">Memuat lagu...</p>
      <div v-else-if="error" role="alert">{{ error }} <button class="btn btn-outline" @click="load">Coba Lagi</button></div>
      <div class="song-list">
        <PendingUploadCards kind="music" @changed="load(true)" />
        <article v-for="song in songs" :key="song.id" class="card song-card">
          <div class="song-heading"><strong>{{ song.title }}</strong><span v-if="selectedId === song.id" class="active-song">Aktif</span></div>
          <small class="section-desc">Ukuran akhir: {{ formatFileSize(song.size) }}</small>
          <audio :src="song.src" controls preload="none" @play="event => { for (const audio of event.target.closest('.song-list').querySelectorAll('audio')) if (audio !== event.target) audio.pause(); }"></audio>
          <button class="btn btn-outline" :disabled="busy || selectedId === song.id" @click="select(song.id)">{{ selectedId === song.id ? 'Musik Saat Ini' : 'Gunakan untuk Slideshow' }}</button>
        </article>
      </div>
      <form class="card upload-song" @submit.prevent="upload">
        <h3>Tambah Lagu</h3>
        <label for="song-title">Judul lagu</label>
        <input id="song-title" v-model="title" placeholder="Nama lagu" maxlength="150" :disabled="busy" />
        <MediaDropzone v-model="selectedFile" accept=".mp3,.m4a,.ogg,.wav" label="MP3, M4A, OGG, WAV · Maks. 30 MB" :disabled="busy" />
        <button class="btn btn-primary" :disabled="busy">{{ busy ? 'Memproses...' : 'Tambah Lagu' }}</button>
      </form>
    </template>
  </main>
</template>
<style scoped>
.music-page > .section-desc { margin: .75rem 0 1.5rem; }
.song-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.song-card, .upload-song { padding: 1.5rem; display: grid; gap: 1rem; }
.song-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
.active-song { color: var(--gold); font-size: .8rem; }
audio { width: 100%; }
.upload-song { max-width: 600px; margin-top: 1.5rem; }
input { min-height: 52px; padding: 12px 16px; border: 1px solid #414755; background: #0b0e14; color: white; border-radius: 10px; width: 100%; box-sizing: border-box; font-size: 1rem; }
</style>
