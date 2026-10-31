<script setup>
import { ref, computed } from 'vue';
import { api } from '../api';
import { state, openAuth, toast } from '../store';

const file = ref(null);
const caption = ref('');
const previewUrl = ref('');
const progress = ref(0);
const uploading = ref(false);
const dragging = ref(false);
const message = ref('');
const input = ref(null);

const isVideo = computed(() => file.value?.type.startsWith('video'));
const sizeLabel = computed(() => (file.value ? (file.value.size / 1048576).toFixed(2) + ' MB' : ''));

function pick(f) {
  if (!f) return;
  if (!/^(image|video)\//.test(f.type)) return toast('Please choose an image or video file.', 'error');
  if (f.size > 100 * 1048576) return toast('File is too large (max 100MB).', 'error');
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = f;
  previewUrl.value = URL.createObjectURL(f);
  message.value = '';
}

function onDrop(e) {
  dragging.value = false;
  pick(e.dataTransfer.files[0]);
}

async function submit() {
  if (!file.value) return;
  const fd = new FormData();
  fd.append('media', file.value);
  fd.append('caption', caption.value);
  uploading.value = true;
  progress.value = 0;
  try {
    const res = await api.upload(fd, (p) => (progress.value = p));
    message.value = res.message;
    toast('Thank you for sharing a memory 🕊️');
    file.value = null;
    caption.value = '';
    previewUrl.value = '';
    if (input.value) input.value.value = '';
    emit('uploaded');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    uploading.value = false;
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
          Anyone can sign in and upload. Files are saved in the <code>upload/</code> folder and appear
          in the gallery only after the family approves them.
        </p>
      </div>
    </div>

    <div v-if="!state.user" class="login-prompt-box">
      <div style="font-size: 2rem">🔒</div>
      <h3>Sign in to upload</h3>
      <p>It only takes an email and a password.</p>
      <button class="btn btn-primary" @click="openAuth('register')">Sign In / Register</button>
    </div>

    <form v-else @submit.prevent="submit">
      <div
        class="file-dropzone"
        :class="{ dragover: dragging }"
        @click="input.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div style="font-size: 2rem">⬆️</div>
        <p class="dropzone-text">{{ file ? 'Choose a different file' : 'Click or drop a photo / video here' }}</p>
        <span class="dropzone-sub">JPG, PNG, WEBP, GIF, MP4, WEBM, MOV — up to 100MB</span>
        <input ref="input" type="file" accept="image/*,video/*" hidden @change="pick($event.target.files[0])" />
      </div>

      <div v-if="file" class="preview-area">
        <video v-if="isVideo" :src="previewUrl" controls style="max-height: 240px; border-radius: 10px"></video>
        <img v-else :src="previewUrl" alt="Preview" style="max-height: 240px; border-radius: 10px" />
        <p class="file-name-label">{{ file.name }} · {{ sizeLabel }}</p>
      </div>

      <div class="form-group">
        <label for="caption">Caption (optional)</label>
        <textarea id="caption" v-model="caption" rows="2" placeholder="Tell us about this memory…"></textarea>
      </div>

      <div v-if="uploading" class="progress-wrap">
        <div class="progress"><div class="progress-bar" :style="{ width: progress + '%' }"></div></div>
        <div class="progress-text">{{ progress }}%</div>
      </div>

      <div class="upload-actions">
        <button class="btn btn-primary" :disabled="!file || uploading">
          {{ uploading ? 'Uploading…' : 'Upload' }}
        </button>
      </div>
      <div v-if="message" class="alert alert-success">{{ message }}</div>
    </form>
  </section>
</template>
