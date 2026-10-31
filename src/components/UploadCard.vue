<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { state, toast } from '../store';

const router = useRouter();

const file = ref(null);
const uploaderName = ref(state.user ? state.user.name : '');
const caption = ref('');
const previewUrl = ref('');
const progress = ref(0);
const uploadedBytes = ref(0);
const totalUploadBytes = ref(0);
const uploading = ref(false);
const dragging = ref(false);
const message = ref('');
const input = ref(null);
let activeUploadPromise = null;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const HEAVY_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const isVideo = computed(() => file.value?.type.startsWith('video') || /\.(mp4|webm|mov|m4v)$/i.test(file.value?.name || ''));
const sizeLabel = computed(() => (file.value ? formatBytes(file.value.size) : ''));
const isOversized = computed(() => file.value ? file.value.size > MAX_FILE_SIZE : false);
const isHeavy = computed(() => file.value ? (file.value.size > HEAVY_FILE_SIZE && !isOversized.value) : false);

const uploadedMBFormatted = computed(() => formatBytes(uploadedBytes.value));
const totalMBFormatted = computed(() => formatBytes(totalUploadBytes.value || file.value?.size || 0));

function pick(f) {
  if (!f) return;
  const isMedia = f.type.startsWith('image/') || f.type.startsWith('video/') ||
    /\.(jpe?g|png|webp|gif|mp4|webm|mov|quicktime|m4v)$/i.test(f.name);
  if (!isMedia) {
    return toast('Silakan pilih file foto atau video.', 'error');
  }

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = f;
  previewUrl.value = URL.createObjectURL(f);
  message.value = '';
}

function removePicked() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = null;
  previewUrl.value = '';
  if (input.value) input.value.value = '';
}

function onDrop(e) {
  dragging.value = false;
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    pick(e.dataTransfer.files[0]);
  }
}

function cancelUpload() {
  if (activeUploadPromise && activeUploadPromise.abort) {
    activeUploadPromise.abort();
  }
  uploading.value = false;
  toast('Unggahan dibatalkan.', 'info');
}

async function submit() {
  if (!file.value) return;
  if (isOversized.value) {
    return toast('File melebihi batas maksimal 10 MB.', 'error');
  }

  const fd = new FormData();
  fd.append('media', file.value);
  if (uploaderName.value.trim()) {
    fd.append('uploader_name', uploaderName.value.trim());
  }
  if (caption.value.trim()) {
    fd.append('caption', caption.value.trim());
  }

  uploading.value = true;
  progress.value = 0;
  uploadedBytes.value = 0;
  totalUploadBytes.value = file.value.size;

  try {
    activeUploadPromise = api.upload(fd, (p, loaded, total) => {
      progress.value = p;
      if (loaded) uploadedBytes.value = loaded;
      if (total) totalUploadBytes.value = total;
    });

    const res = await activeUploadPromise;
    message.value = res.message;
    toast(res.message || 'Kenangan berhasil dikirim untuk ditinjau! 🕊️');
    removePicked();
    caption.value = '';
    emit('uploaded');

    setTimeout(() => {
      router.push('/review-status');
    }, 600);
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    uploading.value = false;
    activeUploadPromise = null;
  }
}

const emit = defineEmits(['uploaded']);
</script>

<template>
  <section id="upload" class="card">
    <div class="card-header">
      <div class="header-icon">📷</div>
      <div>
        <h2>Bagikan Foto atau Video</h2>
        <p class="section-desc">
          Siapa pun dapat mengunggah kenangan foto atau video untuk Christiona. Semua file tersimpan di server dan akan tampil setelah disetujui keluarga/admin.
        </p>
      </div>
    </div>

    <form @submit.prevent="submit">
      <div
        class="file-dropzone"
        :class="{ dragover: dragging }"
        @click="input.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div style="font-size: 2rem">⬆️</div>
        <p class="dropzone-text">{{ file ? 'Pilih file lain' : 'Klik atau seret & lepas foto / video di sini' }}</p>
        <span class="dropzone-sub">Terbuka untuk semua • JPG, PNG, WEBP, MP4 — Maksimal 10 MB</span>
        <input ref="input" type="file" accept="image/*,video/*" hidden @change="pick($event.target.files[0])" />
      </div>

      <div v-if="file" class="preview-area" style="position: relative; margin-top: 1rem;">
        <div class="preview-badges" style="position: absolute; top: 8px; left: 8px;">
          <span v-if="isOversized" class="badge-oversized">⛔ &gt; 10 MB</span>
          <span v-else-if="isHeavy" class="badge-heavy">⚠️ File Cukup Besar</span>
        </div>
        <button type="button" class="remove-chip-btn" style="top: 8px; right: 8px;" @click="removePicked" title="Hapus file">&times;</button>
        <video v-if="isVideo" :src="previewUrl" controls style="max-height: 240px; border-radius: 10px; width: 100%; object-fit: contain; background: #000;"></video>
        <img v-else :src="previewUrl" alt="Preview" style="max-height: 240px; border-radius: 10px; width: 100%; object-fit: contain; background: #000;" />
        <p class="file-name-label" style="margin-top: 0.5rem;">
          {{ file.name }} · <strong :style="{ color: isOversized ? 'var(--danger)' : (isHeavy ? 'var(--gold)' : 'inherit') }">{{ sizeLabel }}</strong>
        </p>
      </div>

      <!-- PERINGATAN 1: MELEBIHI 10 MB -->
      <div v-if="isOversized" class="upload-alert alert-error">
        <div class="alert-icon">⛔</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>Ukuran File Melebihi Batas 10 MB</strong>
          </div>
          <p class="alert-desc">
            File "{{ file.name }}" berukuran {{ sizeLabel }}. Batas maksimal unggahan adalah 10 MB.
          </p>
          <div class="heavy-tips">
            <div class="tip-item">❌ Silakan pilih file yang lebih kecil atau kompres video Anda sebelum mengunggah.</div>
          </div>
        </div>
      </div>

      <!-- PERINGATAN 2: UKURAN CUKUP BESAR (5MB - 10MB) -->
      <div v-else-if="isHeavy" class="upload-alert alert-warning">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>Pemberitahuan Ukuran File ({{ sizeLabel }})</strong>
          </div>
          <p class="alert-desc">
            File ini berukuran cukup besar. Unggahan melalui jaringan seluler mungkin memerlukan sedikit waktu.
          </p>
          <div class="heavy-tips">
            <div class="tip-item">📱 Tetap buka halaman ini selama proses unggah berjalan.</div>
          </div>
        </div>
      </div>

      <!-- Nama Pengirim (Opsional) -->
      <div v-if="!state.user" class="form-group" style="margin-top: 1rem;">
        <label for="card-uploader-name">Nama Anda (Opsional)</label>
        <input 
          id="card-uploader-name" 
          v-model="uploaderName" 
          type="text" 
          placeholder="contoh: Maria, Tante, Sahabat (atau kosongkan untuk 'Keluarga & Sahabat')" 
        />
      </div>

      <div class="form-group" style="margin-top: 1rem;">
        <label for="caption">Keterangan atau Kenangan (Opsional)</label>
        <textarea id="caption" v-model="caption" rows="2" placeholder="Ceritakan kenangan tentang foto ini…"></textarea>
      </div>

      <!-- Live Progress -->
      <div v-if="uploading" class="upload-progress-container">
        <div class="progress-header">
          <span class="progress-status">
            <span class="pulse-dot"></span>
            Mengunggah file...
          </span>
          <span class="progress-numbers">
            {{ uploadedMBFormatted }} / {{ totalMBFormatted }} ({{ progress }}%)
          </span>
        </div>
        <div class="progress">
          <div class="progress-bar animated-stripes" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-subnote">
          <span>📡 Mengirim data ke server...</span>
          <button type="button" class="btn-cancel-upload" @click="cancelUpload">✕ Batalkan</button>
        </div>
      </div>

      <div class="upload-actions" style="margin-top: 1.25rem;">
        <button 
          class="btn btn-primary" 
          :disabled="!file || uploading || isOversized"
        >
          <span v-if="uploading">Mengunggah... ({{ progress }}%)</span>
          <span v-else-if="isOversized">⛔ File Terlalu Besar (&gt;10 MB)</span>
          <span v-else>⬆️ Unggah Kenangan</span>
        </button>
      </div>
      <div v-if="message" class="alert alert-success" style="margin-top: 1rem;">{{ message }}</div>
    </form>
  </section>
</template>
