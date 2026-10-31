<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { state, openAuth, toast } from '../store';

const router = useRouter();

const postType = ref('all'); // 'all' (Media + Text), 'media', 'text'
const file = ref(null);
const caption = ref('');
const previewUrl = ref('');
const progress = ref(0);
const uploading = ref(false);
const dragging = ref(false);
const fileInput = ref(null);

const isVideo = computed(() => file.value?.type.startsWith('video'));
const sizeLabel = computed(() => file.value ? (file.value.size / 1048576).toFixed(2) + ' MB' : '');

function pickFile(f) {
  if (!f) return;
  if (!/^(image|video)\//.test(f.type)) {
    return toast('Please select a valid image or video file.', 'error');
  }
  if (f.size > 100 * 1048576) {
    return toast('File is too large (max 100MB).', 'error');
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = f;
  previewUrl.value = URL.createObjectURL(f);
}

function removeFile() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = null;
  previewUrl.value = '';
  if (fileInput.value) fileInput.value.value = '';
}

function onDrop(e) {
  dragging.value = false;
  if (e.dataTransfer.files.length) {
    pickFile(e.dataTransfer.files[0]);
  }
}

async function handlePublish() {
  if (!state.user) {
    return openAuth('login');
  }

  const hasFile = !!file.value;
  const hasText = !!caption.value.trim();

  if (!hasFile && !hasText) {
    return toast('Please either add a photo/video or write some text.', 'error');
  }

  uploading.value = true;
  progress.value = 0;

  try {
    const formData = new FormData();
    if (hasFile) {
      formData.append('media', file.value);
    }
    if (hasText) {
      formData.append('caption', caption.value.trim());
    }

    const res = await api.upload(formData, (p) => (progress.value = p));
    toast(res.message || 'Post submitted successfully! 🕊️');
    
    // Reset form
    removeFile();
    caption.value = '';

    // Route back to feed
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
      <h1 class="page-title">Create a Post for Christiona</h1>
      <p class="section-desc">
        Share your cherished memories, photos, video clips, or loving words.
        Uploads are reviewed by admin to keep Christiona's memorial safe and peaceful.
      </p>
    </div>

    <!-- Sign in notice if not logged in -->
    <div v-if="!state.user" class="card login-prompt-box">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔒</div>
      <h3>Sign in to share your post</h3>
      <p>Anyone can sign up or log in with an email in seconds to share memories.</p>
      <div style="display:flex; justify-content:center; gap: 0.8rem; margin-top: 1rem;">
        <button class="btn btn-primary" @click="openAuth('login')">Sign In</button>
        <button class="btn btn-outline" @click="openAuth('register')">Register Free</button>
      </div>
    </div>

    <!-- Isolated Post Creator Form -->
    <div v-else class="card post-create-card">
      <!-- Author Header -->
      <div class="composer-author">
        <div class="insta-avatar">{{ state.user.name.charAt(0).toUpperCase() }}</div>
        <div>
          <strong style="color: #fff;">{{ state.user.name }}</strong>
          <div style="font-size: 0.78rem; color: var(--gold);">Posting in remembrance of Christiona Adolfin Mona</div>
        </div>
      </div>

      <!-- Text / Caption Area (Always available) -->
      <div class="form-group" style="margin-top: 0;">
        <textarea 
          v-model="caption" 
          rows="4" 
          placeholder="Write your story, memory, prayer, or thought for Christiona... (Text only is welcome!)"
          class="composer-textarea"
        ></textarea>
      </div>

      <!-- File Attachment Preview Area -->
      <div v-if="file" class="composer-preview">
        <button class="remove-media-btn" @click="removeFile" title="Remove attachment">&times;</button>
        <video v-if="isVideo" :src="previewUrl" controls class="media-elem"></video>
        <img v-else :src="previewUrl" alt="Selected upload" class="media-elem" />
        <div class="preview-filename">{{ file.name }} ({{ sizeLabel }})</div>
      </div>

      <!-- Dropzone (if no file chosen yet) -->
      <div 
        v-else 
        class="file-dropzone compact-dropzone" 
        :class="{ dragover: dragging }"
        @click="fileInput.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div class="drop-icon">📸 🎥</div>
        <p class="dropzone-text">Click or drag & drop a photo or video (Optional)</p>
        <span class="dropzone-sub">Supports JPG, PNG, WEBP, MP4, WEBM (Up to 100MB)</span>
        <input 
          ref="fileInput" 
          type="file" 
          accept="image/*,video/*" 
          hidden 
          @change="pickFile($event.target.files[0])" 
        />
      </div>

      <!-- Progress bar -->
      <div v-if="uploading" class="progress-wrap">
        <div class="progress">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="progress-text">Uploading post: {{ progress }}%</div>
      </div>

      <!-- Post Action Buttons -->
      <div class="composer-actions">
        <button 
          v-if="!file" 
          type="button" 
          class="btn btn-outline btn-sm" 
          @click="fileInput.click()"
        >
          📷 Attach Photo / Video
        </button>
        <button 
          v-else 
          type="button" 
          class="btn btn-outline btn-sm" 
          @click="removeFile"
        >
          🗑️ Clear Attachment
        </button>

        <button 
          type="button" 
          class="btn btn-primary" 
          :disabled="uploading || (!file && !caption.trim())"
          @click="handlePublish"
        >
          <span v-if="uploading">Publishing...</span>
          <span v-else>🕊️ Share Post</span>
        </button>
      </div>

      <div class="moderation-notice">
        ℹ️ <em>In honor of Christiona, all posts are safely reviewed by admin before appearing on the public feed.</em>
      </div>
    </div>
  </main>
</template>
