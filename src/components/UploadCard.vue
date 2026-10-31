<script setup>
import { ref, computed } from 'vue';
import { api } from '../api';
import { state, toast } from '../store';

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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const HEAVY_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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
    return toast('Please choose an image or video file.', 'error');
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
  toast('Upload cancelled.', 'info');
}

async function submit() {
  if (!file.value) return;
  if (isOversized.value) {
    return toast('Cannot upload: File exceeds the 100MB server limit.', 'error');
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
    toast(res.message || 'Thank you for sharing a memory 🕊️');
    removePicked();
    caption.value = '';
    emit('uploaded');
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
        <h2>Share a Photo or Video</h2>
        <p class="section-desc">
          Anyone can upload photos and videos in memory of Christiona. All files are safely stored in the <code>upload/</code> folder and will appear after admin approval.
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
        <p class="dropzone-text">{{ file ? 'Choose a different file' : 'Click or drop a photo or video here' }}</p>
        <span class="dropzone-sub">Open for everyone • JPG, PNG, WEBP, MP4, WEBM — up to 100MB</span>
        <input ref="input" type="file" accept="image/*,video/*" hidden @change="pick($event.target.files[0])" />
      </div>

      <div v-if="file" class="preview-area" style="position: relative; margin-top: 1rem;">
        <div class="preview-badges" style="position: absolute; top: 8px; left: 8px;">
          <span v-if="isOversized" class="badge-oversized">⛔ &gt; 100MB</span>
          <span v-else-if="isHeavy" class="badge-heavy">⚠️ Heavy File</span>
        </div>
        <button type="button" class="remove-chip-btn" style="top: 8px; right: 8px;" @click="removePicked" title="Remove file">&times;</button>
        <video v-if="isVideo" :src="previewUrl" controls style="max-height: 240px; border-radius: 10px; width: 100%; object-fit: contain; background: #000;"></video>
        <img v-else :src="previewUrl" alt="Preview" style="max-height: 240px; border-radius: 10px; width: 100%; object-fit: contain; background: #000;" />
        <p class="file-name-label" style="margin-top: 0.5rem;">
          {{ file.name }} · <strong :style="{ color: isOversized ? 'var(--danger)' : (isHeavy ? 'var(--gold)' : 'inherit') }">{{ sizeLabel }}</strong>
        </p>
      </div>

      <!-- PRE-UPLOAD WARNING 1: OVERSIZED (>100MB) ALERT -->
      <div v-if="isOversized" class="upload-alert alert-error">
        <div class="alert-icon">⛔</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>File Exceeds Server Limit (Max 100MB)</strong>
          </div>
          <p class="alert-desc">
            "{{ file.name }}" is {{ sizeLabel }}. The server cannot accept files over 100MB and will disconnect.
          </p>
          <div class="heavy-tips">
            <div class="tip-item">❌ Please choose a smaller file or compress your video before uploading.</div>
          </div>
        </div>
      </div>

      <!-- PRE-UPLOAD WARNING 2: HEAVY FILE (>20MB) ALERT -->
      <div v-else-if="isHeavy" class="upload-alert alert-warning">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title-row">
            <strong>Heavy File Warning ({{ sizeLabel }})</strong>
            <span class="warning-tag">Large File</span>
          </div>
          <p class="alert-desc">
            This media is relatively heavy. Over mobile data or slow connections, uploads may stall or disconnect (<em>"Connection lost"</em>).
          </p>
          <div class="heavy-tips">
            <div class="tip-item">📱 Keep this tab open and your screen active during upload.</div>
            <div class="tip-item">📶 Wi-Fi connection recommended for fast and stable uploads.</div>
          </div>
        </div>
      </div>

      <!-- Optional Name (If guest) -->
      <div v-if="!state.user" class="form-group" style="margin-top: 1rem;">
        <label for="card-uploader-name">Your Name (Optional)</label>
        <input 
          id="card-uploader-name" 
          v-model="uploaderName" 
          type="text" 
          placeholder="e.g. Maria, Auntie, Colleague (or leave blank for Loved One)" 
        />
      </div>

      <div class="form-group" style="margin-top: 1rem;">
        <label for="caption">Caption or Story (Optional)</label>
        <textarea id="caption" v-model="caption" rows="2" placeholder="Tell us about this memory…"></textarea>
      </div>

      <!-- Enhanced Live Progress -->
      <div v-if="uploading" class="upload-progress-container">
        <div class="progress-header">
          <span class="progress-status">
            <span class="pulse-dot"></span>
            Uploading file...
          </span>
          <span class="progress-numbers">
            {{ uploadedMBFormatted }} / {{ totalMBFormatted }} ({{ progress }}%)
          </span>
        </div>
        <div class="progress">
          <div class="progress-bar animated-stripes" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-subnote">
          <span>📡 Streaming data safely to server...</span>
          <button type="button" class="btn-cancel-upload" @click="cancelUpload">✕ Cancel</button>
        </div>
      </div>

      <div class="upload-actions" style="margin-top: 1.25rem;">
        <button 
          class="btn btn-primary" 
          :disabled="!file || uploading || isOversized"
        >
          <span v-if="uploading">Uploading... ({{ progress }}%)</span>
          <span v-else-if="isOversized">⛔ File Too Large (&gt;100MB)</span>
          <span v-else-if="isHeavy">⬆️ Upload (⚠️ Heavy: {{ sizeLabel }})</span>
          <span v-else>⬆️ Upload Memory</span>
        </button>
      </div>
      <div v-if="message" class="alert alert-success" style="margin-top: 1rem;">{{ message }}</div>
    </form>
  </section>
</template>
