<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { state, openAuth, toast } from '../store';
import Icon from '../components/Icon.vue';

const router = useRouter();

function handleLogout() {
  state.user = null;
  api.logout().catch(() => {});
  toast('Logged out successfully');
}

const selectedFiles = ref([]); // array of { file, previewUrl, isVideo, sizeLabel }
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
    // Avoid exact duplicate in current selection
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
  if (!state.user) {
    return openAuth('login');
  }

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
    if (caption.value.trim()) {
      formData.append('caption', caption.value.trim());
    }

    const res = await api.upload(formData, (p) => (progress.value = p));
    toast(res.message || 'Upload complete! 🕊️');

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
      <h1 class="page-title">Upload Images &amp; Videos</h1>
      <p class="section-desc">
        Select multiple photos and video clips celebrating <strong>Christiona Adolfin Mona</strong>.
        Uploaded files are saved to the <code>upload/</code> folder and will be published to the feed and slideshow after admin approval.
      </p>
    </div>

    <!-- Sign In Box if guest -->
    <div v-if="!state.user" class="card login-prompt-box">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔒</div>
      <h3>Sign in to Upload</h3>
      <p>Anyone can sign up or log in with an email in seconds to upload memories.</p>
      <div style="display:flex; justify-content:center; gap: 0.8rem; margin-top: 1rem;">
        <button class="btn btn-primary" @click="openAuth('login')">Sign In</button>
        <button class="btn btn-outline" @click="openAuth('register')">Register</button>
      </div>
    </div>

    <!-- Composer Card -->
    <div v-else class="card post-create-card">
      <!-- Author Header with quick Log Out link -->
      <div class="composer-author" style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap: 0.75rem;">
          <div class="insta-avatar">{{ state.user.name.charAt(0).toUpperCase() }}</div>
          <div>
            <strong style="color: #fff;">{{ state.user.name }}</strong>
            <div style="font-size: 0.78rem; color: var(--gold);">Posting for Christiona</div>
          </div>
        </div>
        <button type="button" class="btn btn-outline btn-sm" @click="handleLogout" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;">
          Log out
        </button>
      </div>
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
        <span class="dropzone-sub">Supports JPG, PNG, WEBP, GIF, MP4, WEBM (Up to 10 files, 100MB each)</span>
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

      <!-- Caption / Memory Description -->
      <div class="form-group" style="margin-top: 1.25rem;">
        <label for="upload-caption">Caption or Story (Optional)</label>
        <textarea 
          id="upload-caption" 
          v-model="caption" 
          rows="3" 
          placeholder="Share where these photos were taken, or a loving note for Christiona..."
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
          Select at least 1 image or video to proceed
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
        🛡️ <em>All uploaded images and videos go to the <code>upload/</code> folder and will appear on the public feed and slideshow once approved by admin.</em>
      </div>
    </div>
  </main>
</template>
