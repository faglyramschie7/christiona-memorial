<script setup>
import { ref, computed, watch } from 'vue';
import { api } from '../api';
import { state, toast } from '../store';
const isAdmin = computed(() => state.user?.role === 'admin');
const seconds = ref(6);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
async function load() {
  loading.value = true;
  error.value = '';
  try { seconds.value = (await api.slideshowSettings()).seconds; }
  catch (e) { error.value = e.message; }
  finally { loading.value = false; }
}
watch(() => state.sessionLoaded && isAdmin.value, (ready) => { if (ready) load(); }, { immediate: true });
async function save() {
  if (!Number.isInteger(seconds.value) || seconds.value < 2 || seconds.value > 120) {
    toast('Pilih durasi antara 2 dan 120 detik.', 'error');
    return;
  }
  saving.value = true;
  try {
    await api.saveSlideshowSettings({ seconds: seconds.value });
    toast('Pengaturan slideshow disimpan.');
  } catch (e) { toast(e.message, 'error'); }
  finally { saving.value = false; }
}
</script>

<template>
  <main class="main-container" style="padding-top: 2rem; padding-bottom: 2rem;">
    <section class="card" style="max-width: 600px; padding: 2rem;">
      <h2>Pengaturan Slideshow</h2>
      <p v-if="!state.sessionLoaded">Memuat...</p>
      <template v-else-if="!isAdmin">
        <p>Silakan masuk dengan akun admin untuk mengubah pengaturan.</p>
        <button class="btn btn-primary" @click="state.authOpen = true; state.authMode = 'login'">Masuk sebagai Admin</button>
      </template>
      <p v-else-if="loading">Memuat pengaturan...</p>
      <div v-else-if="error">
        <p role="alert">{{ error }}</p>
        <button class="btn btn-outline" @click="load">Coba Lagi</button>
      </div>
      <form v-else @submit.prevent="save" style="display: grid; gap: 1rem; margin-top: 1rem;">
        <label for="slide-seconds">Durasi setiap foto (detik)</label>
        <input style="min-height: 56px; padding: 12px 16px; font-size: 1.25rem; border-radius: 10px; border: 1px solid #414755; background: #0b0e14; color: #fff; width: 100%; box-sizing: border-box;" id="slide-seconds" v-model.number="seconds" type="number" min="2" max="120" step="1" required :disabled="saving" />
        <p class="section-desc">Pilih 2–120 detik. Video tetap diputar sampai selesai. Pengaturan berlaku untuk semua pengunjung saat slideshow dibuka atau dimuat ulang.</p>
        <button class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}</button>
      </form>
    </section>
  </main>
</template>
