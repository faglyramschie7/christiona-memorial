<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { state, toast } from '../store';
import Icon from '../components/Icon.vue';

const router = useRouter();

const selectedFiles = ref([]);
const uploaderName = ref(state.user ? state.user.name : '');
const caption = ref('');
const progress = ref(0);
const uploading = ref(false);
const dragging = ref(false);
const fileInput = ref(null);

const totalSize = computed(() => {
  const bytes = selectedFiles.value.reduce((acc, f) => acc + f.file.size, 0);
  return (bytes / 1048576).toFixed(2);
});

function addFiles(files) {
  if (!files || !files.length) return;

  const validFiles = Array.from(files).filter(f => {
    const isMedia = f.type.startsWith('image/') || f.type.startsWith('video/');
    if (!isMedia) {
      toast(`Skipped "${f.name}": Only images and videos are permitted.`, 'error');
      return false;
    }
    if (f.size > 100 * 1048576) {
      toast(`Skipped "${f.name}": Exceeds 100MB limit.`, 'error');
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
      isVideo: f.type.startsWith('video/'),
      sizeLabel: (f.size / 1048576).toFixed(2) + ' MB'
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

async function handleMultiUpload() {
  if (!selectedFiles.value.length) {
    return toast('Please select at least one image or video to upload.', 'error');
  }

  uploading.value = true;
  progress.value = 0;

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

    const res = await api.upload(formData, (p) => (progress.value = p));
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
  }
}
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
          <strong>Selected: {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'file' : 'files' }} ({{ totalSize }} MB total)</strong>
          <button type="button" class="btn btn-outline btn-sm" @click="clearAll">Clear All</button>
        </div>

        <div class="multi-preview-grid">
          <div v-for="(item, index) in selectedFiles" :key="index" class="preview-item">
            <button type="button" class="remove-chip-btn" @click="removeFile(index)" title="Remove this file">&times;</button>
            <video v-if="item.isVideo" :src="item.previewUrl" controls class="item-media"></video>
            <img v-else :src="item.previewUrl" :alt="item.file.name" class="item-media" />
            <div class="item-info">
              <span class="item-name">{{ item.file.name }}</span>
              <span class="item-size">{{ item.sizeLabel }}</span>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-sm" style="margin-top: 0.8rem;" @click="fileInput.click()">
          ➕ Add More Files
        </button>
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

      <!-- Progress bar -->
      <div v-if="uploading" class="progress-wrap">
        <div class="progress">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">Uploading {{ selectedFiles.length }} items: {{ progress }}%</div>
      </div>

      <!-- Upload Action -->
      <div class="composer-actions">
        <span v-if="!selectedFiles.length" style="color: var(--text-muted); font-size: 0.85rem;">
          Select at least 1 image or video to upload
        </span>
        <span v-else style="color: var(--gold); font-size: 0.85rem;">
          Ready to upload {{ selectedFiles.length }} items
        </span>

        <button 
          type="button" 
          class="btn btn-primary" 
          :disabled="uploading || !selectedFiles.length"
          @click="handleMultiUpload"
        >
          <span v-if="uploading">Uploading...</span>
          <span v-else>⬆️ Upload All Files</span>
        </button>
      </div>

      <div class="moderation-notice">
        🛡️ <em>Anyone can upload. All files are safely stored in the <code>upload/</code> folder and will be displayed on the main feed and slideshow once approved by admin.</em>
      </div>
    </div>
  </main>
</template>
