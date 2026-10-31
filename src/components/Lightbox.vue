<script setup>
import { onMounted, onUnmounted } from 'vue';
import { state } from '../store';

const close = () => (state.lightbox = null);
const onKey = (e) => e.key === 'Escape' && close();
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div v-if="state.lightbox" class="lightbox" @click="close">
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <video v-if="state.lightbox.video" :src="state.lightbox.src" controls autoplay @click.stop />
    <img v-else :src="state.lightbox.src" alt="" @click.stop />
  </div>
</template>
