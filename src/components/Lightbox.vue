<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import MediaRotation from './MediaRotation.vue';
import { state } from '../store';

const currentItem = computed(() => {
  if (!state.lightbox) return null;
  if (state.lightbox.items && state.lightbox.items.length > 0) {
    const idx = state.lightbox.currentIndex || 0;
    return state.lightbox.items[idx];
  }
  return {
    filename: state.lightbox.src ? state.lightbox.src.replace('/upload/', '') : '',
    src: state.lightbox.src,
    mimetype: state.lightbox.video ? 'video/mp4' : 'image/jpeg',
    caption: state.lightbox.caption || ''
  };
});

function onRotated(media) {
  if (!state.lightbox || !media) return;
  state.lightbox.items[state.lightbox.currentIndex || 0] = media;
  state.lightbox.onMediaSaved?.();
}

const currentSrc = computed(() => {
  if (!currentItem.value) return '';
  if (currentItem.value.src) return currentItem.value.src;
  return `/upload/${currentItem.value.filename}`;
});

const isVideo = computed(() => {
  if (!currentItem.value) return false;
  if (currentItem.value.video !== undefined) return !!currentItem.value.video;
  return (currentItem.value.mimetype || '').startsWith('video');
});

const totalCount = computed(() => state.lightbox?.items?.length || 1);
const currentIndex = computed(() => state.lightbox?.currentIndex || 0);

function next() {
  if (!state.lightbox?.items?.length || state.lightbox.items.length <= 1) return;
  state.lightbox.currentIndex = (state.lightbox.currentIndex + 1) % state.lightbox.items.length;
}

function prev() {
  if (!state.lightbox?.items?.length || state.lightbox.items.length <= 1) return;
  state.lightbox.currentIndex = (state.lightbox.currentIndex - 1 + state.lightbox.items.length) % state.lightbox.items.length;
}

const close = () => {
  state.lightbox = null;
};

const onKey = (e) => {
  if (!state.lightbox) return;
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
};

let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;

function onTouchStart(e) {
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }
}

function onTouchMove(e) {
  if (e.touches && e.touches.length > 0) {
    const diffX = e.touches[0].clientX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;
    if (Math.abs(diffX) > 10) {
      isSwiping = true;
    }
  }
}

function onTouchEnd(e) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchStartX;
    const diffY = endY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX < 0) {
        next();
      } else {
        prev();
      }
    }
  }
  setTimeout(() => {
    isSwiping = false;
  }, 100);
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div 
    v-if="state.lightbox" 
    class="lightbox" 
    @click="close"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
  >
    <button class="lightbox-close" aria-label="Tutup" @click="close">&times;</button>

    <!-- Multi-item Counter Badge -->
    <div v-if="totalCount > 1" class="lightbox-counter">
      {{ currentIndex + 1 }} / {{ totalCount }}
    </div>

    <!-- Navigation Arrows -->
    <button 
      v-if="totalCount > 1" 
      class="lightbox-arrow lightbox-arrow-left" 
      aria-label="Sebelumnya"
      @click.stop="prev"
    >
      &#8249;
    </button>

    <div class="lightbox-content" @click.stop>
      <video 
        v-if="isVideo" 
        :key="currentSrc" 
        :src="currentSrc" 
        controls 
        autoplay 
        playsinline 
      />
      <img 
        v-else 
        :key="currentSrc" 
        :src="currentSrc" 
        :alt="currentItem?.caption || 'Memorial Photo'" 
        draggable="false" 
      />
      <MediaRotation v-if="state.user?.role === 'admin' && state.lightbox?.adminKind && currentItem?.id" :key="currentItem.id" :item="currentItem" :kind="state.lightbox.adminKind" @saved="onRotated" />
      <div v-if="currentItem?.caption || currentItem?.user_name" class="lightbox-caption-bar">
        <p v-if="currentItem.caption" class="lightbox-caption-text">“{{ currentItem.caption }}”</p>
        <span v-if="currentItem.user_name" class="lightbox-caption-author">Oleh: {{ currentItem.user_name }}</span>
      </div>
    </div>

    <button 
      v-if="totalCount > 1" 
      class="lightbox-arrow lightbox-arrow-right" 
      aria-label="Berikutnya"
      @click.stop="next"
    >
      &#8250;
    </button>
  </div>
</template>
