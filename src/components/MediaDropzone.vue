<script setup>
import { ref } from 'vue';
const props = defineProps({ accept: String, disabled: Boolean, label: String });
const file = defineModel({ default: null });
const input = ref(null);
const dragging = ref(false);
function pick(files) {
  if (props.disabled) return;
  file.value = files?.[0] || null;
}
function drop(event) {
  dragging.value = false;
  pick(event.dataTransfer.files);
}
</script>
<template>
  <div class="media-dropzone" :class="{ dragging, disabled }"
    @dragover.prevent="dragging = !disabled" @dragleave.prevent="dragging = false" @drop.prevent="drop">
    <button type="button" :disabled="disabled" @click="input.click()">
      <span class="drop-symbol" aria-hidden="true">↑</span>
      <strong>{{ file ? file.name : 'Seret & lepas file di sini' }}</strong>
      <span>{{ file ? 'Klik atau lepas file lain untuk mengganti' : 'atau klik untuk memilih file' }}</span>
      <small>{{ label }}</small>
    </button>
    <input ref="input" type="file" :accept="accept" :disabled="disabled" :aria-label="label" hidden @change="pick($event.target.files); $event.target.value = ''" />
  </div>
</template>
<style scoped>
.media-dropzone { border: 2px dashed #414755; border-radius: 12px; background: #0b0e14; transition: border-color .2s, background .2s; }
.media-dropzone.dragging, .media-dropzone:focus-within { border-color: var(--gold); background: rgba(231,193,97,.08); }
button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .65rem; width: 100%; min-height: 190px; padding: 1.5rem; color: #fff; background: transparent; border: none; font: inherit; cursor: pointer; }
strong { max-width: 100%; overflow-wrap: anywhere; }
span:not(.drop-symbol), small { color: #a5adbd; }
.drop-symbol { color: var(--gold); font-size: 2rem; }
.disabled { opacity: .6; }
button:disabled { cursor: wait; }
</style>
