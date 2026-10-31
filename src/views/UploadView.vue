<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { state, toast } from '../store';
import Icon from '../components/Icon.vue';

const router = useRouter();

const selectedFiles = ref([]);
const uploaderName = ref(state.user ? state.user.name : '');
const caption = ref('');
const progress = ref(0);
const uploadedBytes = ref(0);
const totalUploadBytes = ref(0);
const uploading = ref(false);
const dragging = ref(false);
const fileInput = ref(null);
let activeUploadPromise = null;

// Batas total 10 MB sesuai permintaan
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total
const HEAVY_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB peringatan

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 MB';
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(0) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const totalBytes = computed(() => {
  return selectedFiles.value.reduce((acc, f) => acc + f.file.size, 0);
});

const totalSizeMB = computed(() => {
  return (totalBytes.value / (1024 * 1024)).toFixed(1);
});

const uploadedMBFormatted = computed(() => {
  return formatBytes(uploadedBytes.value);
});

const totalUploadMBFormatted = computed(() => {
  return formatBytes(totalUploadBytes.value || totalBytes.value);
});

const isTotalOversized = computed(() => totalBytes.value > MAX_TOTAL_SIZE);
const isHeavyBatch = computed(() => totalBytes.value > HEAVY_TOTAL_SIZE && !isTotalOversized.value);

function addFiles(files) {
  if (!files || !files.length) return;

  const validFiles = Array.from(files).filter(f => {
    const isMedia = f.type.startsWith('image/') || f.type.startsWith('video/') ||
      /\.(jpe?g|png|webp|gif|mp4|webm|mov|quicktime|m4v)$/i.test(f.name);
    if (!isMedia) {
      toast(`File "${f.name}" dilewati: Hanya foto dan video yang diizinkan.`, 'error');
      return false;
    }
    return true;
  });

  for (const f of validFiles) {
    if (selectedFiles.value.some(existing => existing.file.name === f.name && existing.file.size === f.size)) {
      continue;
    }

    selectedFiles.value.push({
      file: f,
      previewUrl: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(f.name),
      sizeLabel: formatBytes(f.size)
    });
  }
}

function removeFile(index) {
  const removed = selectedFiles.value.splice(index, 1);
  if (removed.length && removed[0].previewUrl) {
    URL.revokeObjectURL(removed[0].previewUrl);
  }
}

function clearAll() {
  for (const item of selectedFiles.value) {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  }
  selectedFiles.value = [];
  if (fileInput.value) fileInput.value.value = '';
}

function onDrop(e) {
  dragging.value = false;
  if (e.dataTransfer.files && e.dataTransfer.files.length) {
    addFiles(e.dataTransfer.files);
  }
}

function cancelUpload() {
  if (activeUploadPromise && activeUploadPromise.abort) {
    activeUploadPromise.abort();
  }
  uploading.value = false;
  toast('Unggahan dibatalkan.', 'info');
}

async function handleMultiUpload() {
  if (!selectedFiles.value.length) {
    return toast('Silakan pilih minimal 1 foto atau video untuk diunggah.', 'error');
  }

  if (isTotalOversized.value) {
    return toast(`Total ukuran file (${totalSizeMB.value} MB) melebihi batas maksimal 10 MB. Silakan kurangi file.`, 'error');
  }

  uploading.value = true;
  progress.value = 0;
  uploadedBytes.value = 0;
  totalUploadBytes.value = totalBytes.value;

  try {
    const formData = new FormData();
    for (const item of selectedFiles.value) {
      formData.append('media', item.file);
    }
    if (uploaderName.value.trim()) {
      formData.append('uploader_name', uploaderName.value.trim());
    }
    if (caption.value.trim()) {
      formData.append('caption', caption.value.trim());
    }

    activeUploadPromise = api.upload(formData, (p, loaded, total) => {
      progress.value = p;
      if (loaded) uploadedBytes.value = loaded;
      if (total) totalUploadBytes.value = total;
    });

    const res = await activeUploadPromise;
    toast(res.message || 'Kenangan berhasil dikirim untuk ditinjau! 🕊️');

    clearAll();
    caption.value = '';

    // Push ke halaman review status
    setTimeout(() => {
      router.push('/review-status');
    }, 600);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    uploading.value = false;
    activeUploadPromise = null;
  }
}

function handleBeforeUnload(e) {
  if (uploading.value) {
    e.preventDefault();
    e.returnValue = 'Proses unggah sedang berlangsung. Menutup halaman ini akan membatalkan unggahan.';
    return e.returnValue;
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <main class="page-container">
    <div class="page-header">
      <router-link to="/" class="back-link">← Kembali ke Feed</router-link>
      <h1 class="page-title">Bagikan Foto &amp; Video Kenangan</h1>
      <p class="section-desc">
        Siapa pun dapat mengunggah kenangan foto dan video untuk <strong>Christiona Adolfin Mona</strong> tanpa perlu mendaftar/login.
        Semua kiriman akan disimpan dengan aman dan langsung ditinjau oleh keluarga/admin sebelum tampil di feed utama dan tayangan slideshow.
      </p>
    </div>

    <!-- Multi-Upload Card -->
    <div class="card post-create-card">
      <!-- Drag & Drop Multi-File Zone -->
      <div 
        class="file-dropzone multi-dropzone" 
        :class="{ dragover: dragging }"
        @click="fileInput.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div class="drop-icon">📸 🎥</div>
        <p class="dropzone-text">Klik atau seret &amp; lepas beberapa foto / video di sini</p>
        <span class="dropzone-sub">Terbuka untuk semua • JPG, PNG, WEBP, MP4 (Maksimal total seluruh file: 10 MB)</span>
        <input 
          ref="fileInput" 
          type="file" 
          accept="image/*,video/*" 
          multiple 
          hidden 
          @change="addFiles($event.target.files)" 
        />
      </div>

      <!-- Selected Files Gallery Preview -->
      <div v-if="selectedFiles.length" class="multi-preview-section">
        <div class="multi-preview-header">
          <strong>Dipilih: {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'file' : 'file' }} (Total: {{ totalSizeMB }} MB)</strong>
          <button type="button" class="btn btn-outline btn-sm" @click="clearAll">Hapus Semua</button>
        </div>

        <div class="multi-preview-grid">
          <div 
            v-for="(item, index) in selectedFiles" 
            :key="index" 
            class="preview-item"
            :class="{ 'is-oversized': isTotalOversized }"
          >
            <button type="button" class="remove-chip-btn" @click="removeFile(index)" title="Hapus file ini">&times;</button>
            <video v-if="item.isVideo" :src="item.previewUrl" controls class="item-media"></video>
            <img v-else :src="item.previewUrl" :alt="item.file.name" class="item-media" />
            <div class="item-info">
              <span class="item-name">{{ item.file.name }}</span>
              <span class="item-size">{{ item.sizeLabel }}</span>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.8rem;" @click="fileInput.click()">
          ➕ Tambah File Lainnya
        </button>
      </div>

      <!-- PERINGATAN 1: TOTAL MELEBIHI 10 MB (Ditampilkan sebelum klik tombol unggah) -->
      <div v-if="isTotalOversized" class="upload-alert alert-error">
        <div class="alert-icon">⛔</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>Total Ukuran Melebihi Batas 10 MB (Total: {{ totalSizeMB }} MB)</strong>
            <span class="warning-tag" style="background: rgba(255,82,82,0.25); color: #ff8585; border-color: rgba(255,82,82,0.4)">
              Melebihi Batas
            </span>
          </div>
          <p class="alert-desc">
            Batas maksimal seluruh file yang diunggah bersamaan adalah <strong>10 MB</strong>. Total file Anda saat ini adalah <strong>{{ totalSizeMB }} MB</strong>.
          </p>
          <div class="heavy-tips">
            <div class="tip-item">❌ Silakan klik tanda silang (<strong>&times;</strong>) pada file untuk mengurangi atau kompres video Anda agar total di bawah 10 MB.</div>
          </div>
        </div>
      </div>

      <!-- PERINGATAN 2: UKURAN CUKUP BESAR (5MB - 10MB) -->
      <div v-else-if="selectedFiles.length && isHeavyBatch" class="upload-alert alert-warning">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>Pemberitahuan Ukuran File (Total: {{ totalSizeMB }} MB)</strong>
            <span class="warning-tag">Ukuran Sedang/Besar</span>
          </div>
          <p class="alert-desc">
            Total unggahan mendekati batas 10 MB. Pengiriman melalui jaringan seluler atau koneksi lambat mungkin membutuhkan waktu beberapa saat.
          </p>
          <div class="heavy-tips">
            <div class="tip-item">📱 <strong>Tetap Buka Layar:</strong> Jangan kunci layar ponsel atau berpindah aplikasi selama pengiriman data.</div>
            <div class="tip-item">📶 <strong>Koneksi Stabil:</strong> Gunakan Wi-Fi jika tersedia untuk proses lebih cepat.</div>
          </div>
        </div>
      </div>

      <!-- Nama Pengirim (Opsional) -->
      <div class="form-group" style="margin-top: 1.25rem;">
        <label for="uploader-name">Nama Anda (Opsional)</label>
        <input 
          id="uploader-name" 
          v-model="uploaderName" 
          type="text" 
          placeholder="contoh: Maria, Tante, Rekan Kerja (atau kosongkan untuk 'Keluarga & Sahabat')" 
        />
      </div>

      <!-- Keterangan / Cerita Kenangan -->
      <div class="form-group">
        <label for="upload-caption">Keterangan atau Cerita Kenangan (Opsional)</label>
        <textarea 
          id="upload-caption" 
          v-model="caption" 
          rows="3" 
          placeholder="Tuliskan cerita singkat tentang momen ini, atau pesan kasih untuk Christiona..."
          class="composer-textarea"
        ></textarea>
      </div>

      <!-- LIVE PROGRESS (Selama Pengiriman Data) -->
      <div v-if="uploading" class="upload-progress-container">
        <div class="progress-header">
          <span class="progress-status">
            <span class="pulse-dot"></span>
            Mengirim {{ selectedFiles.length }} file ke server...
          </span>
          <span class="progress-numbers">
            {{ uploadedMBFormatted }} / {{ totalUploadMBFormatted }} ({{ progress }}%)
          </span>
        </div>

        <div class="progress">
          <div class="progress-bar animated-stripes" :style="{ width: progress + '%' }"></div>
        </div>

        <div class="progress-subnote">
          <span>📡 Mengunggah kenangan ke server. Mohon tetap buka halaman ini...</span>
          <button type="button" class="btn-cancel-upload" @click="cancelUpload">✕ Batalkan Unggahan</button>
        </div>
      </div>

      <!-- Tombol Aksi Upload -->
      <div class="composer-actions">
        <span v-if="!selectedFiles.length" style="color: var(--text-muted); font-size: 0.85rem;">
          Pilih minimal 1 foto atau video (Maksimal total 10 MB)
        </span>
        <span v-else-if="isTotalOversized" style="color: var(--danger); font-size: 0.85rem;">
          ⛔ Total {{ totalSizeMB }} MB melebihi batas 10 MB
        </span>
        <span v-else style="color: var(--gold); font-size: 0.85rem;">
          Siap diunggah: {{ selectedFiles.length }} file ({{ totalSizeMB }} MB)
        </span>

        <button 
          type="button" 
          class="btn btn-primary" 
          :disabled="uploading || !selectedFiles.length || isTotalOversized"
          @click="handleMultiUpload"
        >
          <span v-if="uploading">Mengunggah... ({{ progress }}%)</span>
          <span v-else-if="isTotalOversized">⛔ Kurangi File (&lt; 10 MB)</span>
          <span v-else>⬆️ Unggah Semua Kenangan ({{ totalSizeMB }} MB)</span>
        </button>
      </div>

      <div class="moderation-notice">
        🛡️ <em>Semua orang dapat mengunggah kenangan. Seluruh file akan disimpan di server dan langsung ditinjau oleh pihak keluarga/admin sebelum ditampilkan pada feed dan slideshow.</em>
      </div>
    </div>
  </main>
</template>
