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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB server ceiling
const HEAVY_FILE_SIZE = 20 * 1024 * 1024; // 20MB single file warning threshold
const HEAVY_BATCH_SIZE = 40 * 1024 * 1024; // 40MB batch warning threshold

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

const oversizedFiles = computed(() => {
  return selectedFiles.value.filter(item => item.isOversized);
});

const hasOversized = computed(() => oversizedFiles.value.length > 0);

const heavyFiles = computed(() => {
  return selectedFiles.value.filter(item => item.isHeavy);
});

const isHeavyBatch = computed(() => {
  return heavyFiles.value.length > 0 || totalBytes.value > HEAVY_BATCH_SIZE;
});

function addFiles(files) {
  if (!files || !files.length) return;

  const validFiles = Array.from(files).filter(f => {
    const isMedia = f.type.startsWith('image/') || f.type.startsWith('video/') ||
      /\.(jpe?g|png|webp|gif|mp4|webm|mov|quicktime|m4v)$/i.test(f.name);
    if (!isMedia) {
      toast(`Skipped "${f.name}": Only images and videos are permitted.`, 'error');
      return false;
    }
    return true;
  });

  for (const f of validFiles) {
    if (selectedFiles.value.some(existing => existing.file.name === f.name && existing.file.size === f.size)) {
      continue;
    }
    const isOversized = f.size > MAX_FILE_SIZE;
    const isHeavy = f.size > HEAVY_FILE_SIZE && !isOversized;

    selectedFiles.value.push({
      file: f,
      previewUrl: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(f.name),
      sizeLabel: formatBytes(f.size),
      isOversized,
      isHeavy
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
  toast('Upload cancelled.', 'info');
}

async function handleMultiUpload() {
  if (!selectedFiles.value.length) {
    return toast('Please select at least one image or video to upload.', 'error');
  }

  if (hasOversized.value) {
    return toast('Cannot upload: One or more files exceed the 100MB server limit. Please remove them first.', 'error');
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
    toast(res.message || 'Photos uploaded successfully! 🕊️');

    clearAll();
    caption.value = '';

    setTimeout(() => {
      router.push('/');
    }, 1200);
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
    e.returnValue = 'Upload is in progress. Leaving this page will cancel your upload.';
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
      <router-link to="/" class="back-link">← Back to Feed</router-link>
      <h1 class="page-title">Share Photos &amp; Videos</h1>
      <p class="section-desc">
        Anyone can upload photos and video memories of <strong>Christiona Adolfin Mona</strong> without signing in.
        All uploads are securely saved in the upload folder and will appear on the main feed and slideshow once approved by admin.
      </p>
    </div>

    <!-- Multi-Upload Card (Open to all, zero login barrier) -->
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
        <p class="dropzone-text">Click or drag &amp; drop multiple images and videos here</p>
        <span class="dropzone-sub">Open for everyone • JPG, PNG, WEBP, MP4, WEBM (Up to 10 files, 100MB each)</span>
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
          <strong>Selected: {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'file' : 'files' }} ({{ totalSizeMB }} MB total)</strong>
          <button type="button" class="btn btn-outline btn-sm" @click="clearAll">Clear All</button>
        </div>

        <div class="multi-preview-grid">
          <div 
            v-for="(item, index) in selectedFiles" 
            :key="index" 
            class="preview-item"
            :class="{ 'is-oversized': item.isOversized, 'is-heavy': item.isHeavy }"
          >
            <!-- Heavy / Oversized Badges on Thumbnails -->
            <div class="preview-badges">
              <span v-if="item.isOversized" class="badge-oversized" title="Exceeds 100MB server limit">⛔ &gt; 100MB</span>
              <span v-else-if="item.isHeavy" class="badge-heavy" title="Heavy file - takes longer to upload">⚠️ Heavy</span>
            </div>

            <button type="button" class="remove-chip-btn" @click="removeFile(index)" title="Remove this file">&times;</button>
            <video v-if="item.isVideo" :src="item.previewUrl" controls class="item-media"></video>
            <img v-else :src="item.previewUrl" :alt="item.file.name" class="item-media" />
            <div class="item-info">
              <span class="item-name">{{ item.file.name }}</span>
              <span class="item-size" :style="{ color: item.isOversized ? 'var(--danger)' : (item.isHeavy ? 'var(--gold)' : 'inherit') }">
                {{ item.sizeLabel }}
              </span>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.8rem;" @click="fileInput.click()">
          ➕ Add More Files
        </button>
      </div>

      <!-- PRE-UPLOAD WARNING 1: OVERSIZED (>100MB) ALERT (Shown before clicking!) -->
      <div v-if="hasOversized" class="upload-alert alert-error">
        <div class="alert-icon">⛔</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>File Exceeds Server Limit (Max 100MB per file)</strong>
            <span class="warning-tag" style="background: rgba(255,82,82,0.25); color: #ff8585; border-color: rgba(255,82,82,0.4)">
              {{ oversizedFiles.length }} Over Limit
            </span>
          </div>
          <p class="alert-desc">
            The following {{ oversizedFiles.length === 1 ? 'file is' : 'files are' }} larger than 100MB and will cause the upload to disconnect:
            <strong>{{ oversizedFiles.map(f => `${f.file.name} (${f.sizeLabel})`).join(', ') }}</strong>.
          </p>
          <div class="heavy-tips">
            <div class="tip-item">❌ Please click the <strong>&times;</strong> button on the oversized file thumbnail to remove it, or compress the video before uploading.</div>
          </div>
        </div>
      </div>

      <!-- PRE-UPLOAD WARNING 2: HEAVY FILE (>20MB or batch >40MB) WARNING (Shown before clicking!) -->
      <div v-else-if="selectedFiles.length && isHeavyBatch" class="upload-alert alert-warning">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>Heavy Upload Detected ({{ totalSizeMB }} MB total)</strong>
            <span class="warning-tag">{{ heavyFiles.length }} large {{ heavyFiles.length === 1 ? 'item' : 'items' }}</span>
          </div>
          <p class="alert-desc">
            You have selected heavy media (such as high-res video <strong>{{ heavyFiles.map(f => `${f.file.name} [${f.sizeLabel}]`).join(', ') }}</strong>). 
            Uploading heavy files over mobile data or unstable Wi-Fi can trigger <em>"Connection lost during upload"</em>.
          </p>
          <div class="heavy-tips">
            <div class="tip-item">📱 <strong>Keep Screen Active:</strong> Do not lock your phone or switch apps while uploading.</div>
            <div class="tip-item">📶 <strong>Stable Network:</strong> Use high-speed Wi-Fi if available.</div>
            <div class="tip-item">💡 <strong>Pro-Tip:</strong> Uploading 1 or 2 large videos at a time is much faster and prevents network timeouts.</div>
          </div>
        </div>
      </div>

      <!-- Optional Name -->
      <div class="form-group" style="margin-top: 1.25rem;">
        <label for="uploader-name">Your Name (Optional)</label>
        <input 
          id="uploader-name" 
          v-model="uploaderName" 
          type="text" 
          placeholder="e.g. Maria, Auntie, Colleague (or leave blank for Loved One)" 
        />
      </div>

      <!-- Caption / Memory Description -->
      <div class="form-group">
        <label for="upload-caption">Caption or Story (Optional)</label>
        <textarea 
          id="upload-caption" 
          v-model="caption" 
          rows="3" 
          placeholder="Share where these photos were taken, or a note for Christiona..."
          class="composer-textarea"
        ></textarea>
      </div>

      <!-- ENHANCED LIVE PROGRESS (During Upload) -->
      <div v-if="uploading" class="upload-progress-container">
        <div class="progress-header">
          <span class="progress-status">
            <span class="pulse-dot"></span>
            Uploading {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'item' : 'items' }}...
          </span>
          <span class="progress-numbers">
            {{ uploadedMBFormatted }} / {{ totalUploadMBFormatted }} ({{ progress }}%)
          </span>
        </div>

        <div class="progress">
          <div class="progress-bar animated-stripes" :style="{ width: progress + '%' }"></div>
        </div>

        <div class="progress-subnote">
          <span>📡 Streaming data safely to server. Please keep this screen open.</span>
          <button type="button" class="btn-cancel-upload" @click="cancelUpload">✕ Cancel Upload</button>
        </div>
      </div>

      <!-- Upload Action Button -->
      <div class="composer-actions">
        <span v-if="!selectedFiles.length" style="color: var(--text-muted); font-size: 0.85rem;">
          Select at least 1 image or video to upload
        </span>
        <span v-else-if="hasOversized" style="color: var(--danger); font-size: 0.85rem;">
          ⛔ Remove oversized file(s) to continue
        </span>
        <span v-else-if="isHeavyBatch" style="color: var(--gold); font-size: 0.85rem;">
          ⚠️ Heavy batch ({{ totalSizeMB }} MB) ready
        </span>
        <span v-else style="color: var(--gold); font-size: 0.85rem;">
          Ready to upload {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'file' : 'files' }} ({{ totalSizeMB }} MB)
        </span>

        <button 
          type="button" 
          class="btn btn-primary" 
          :disabled="uploading || !selectedFiles.length || hasOversized"
          @click="handleMultiUpload"
        >
          <span v-if="uploading">Uploading... ({{ progress }}%)</span>
          <span v-else-if="hasOversized">⛔ Remove &gt;100MB File(s)</span>
          <span v-else-if="isHeavyBatch">⬆️ Upload All Files (⚠️ Heavy: {{ totalSizeMB }} MB)</span>
          <span v-else>⬆️ Upload All Files ({{ totalSizeMB }} MB)</span>
        </button>
      </div>

      <div class="moderation-notice">
        🛡️ <em>Anyone can upload. All files are safely stored in the <code>upload/</code> folder and will be displayed on the main feed and slideshow once approved by admin.</em>
      </div>
    </div>
  </main>
</template>
