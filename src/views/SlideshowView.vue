<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api, formatDate } from '../api';
import { toast } from '../store';
import Icon from '../components/Icon.vue';

const mediaList = ref([]);
const currentIndex = ref(0);
const isPlaying = ref(true);
const loading = ref(true);
const isFullscreen = ref(false);
const showOverlay = ref(true);
let timer = null;
let overlayTimer = null;

const currentItem = computed(() => {
  if (!mediaList.value.length) return null;
  return mediaList.value[currentIndex.value];
});

async function loadMedia() {
  loading.value = true;
  try {
    const all = await api.approved();
    mediaList.value = all.filter(item => item.filename && item.filename.length > 0);
  } catch (e) {
    toast('Failed to load memorial media', 'error');
  } finally {
    loading.value = false;
  }
}

function nextSlide() {
  if (!mediaList.value.length) return;
  currentIndex.value = (currentIndex.value + 1) % mediaList.value.length;
  resetOverlayFade();
}

function prevSlide() {
  if (!mediaList.value.length) return;
  currentIndex.value = (currentIndex.value - 1 + mediaList.value.length) % mediaList.value.length;
  resetOverlayFade();
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    startAutoPlay();
  } else {
    stopAutoPlay();
  }
  resetOverlayFade();
}

function startAutoPlay() {
  stopAutoPlay();
  timer = setInterval(() => {
    nextSlide();
  }, 5000);
}

function stopAutoPlay() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function toggleNativeFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    isFullscreen.value = true;
  } else {
    document.exitFullscreen().catch(() => {});
    isFullscreen.value = false;
  }
  resetOverlayFade();
}

function resetOverlayFade() {
  showOverlay.value = true;
  if (overlayTimer) clearTimeout(overlayTimer);
  overlayTimer = setTimeout(() => {
    if (isPlaying.value) {
      showOverlay.value = false;
    }
  }, 4000);
}

function handleKeydown(e) {
  if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === 'f' || e.key === 'F') toggleNativeFullscreen();
  resetOverlayFade();
}

onMounted(async () => {
  await loadMedia();
  if (mediaList.value.length) {
    startAutoPlay();
  }
  window.addEventListener('keydown', handleKeydown);
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
  resetOverlayFade();
});

onUnmounted(() => {
  stopAutoPlay();
  if (overlayTimer) clearTimeout(overlayTimer);
  window.removeEventListener('keydown', handleKeydown);
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
});
</script>

<template>
  <div 
    class="fullscreen-slideshow" 
    :class="{ 'controls-hidden': !showOverlay }"
    @mousemove="resetOverlayFade" 
    @touchstart="resetOverlayFade"
  >
    <!-- Background Ambient Glow based on current photo -->
    <div 
      v-if="currentItem && !currentItem.mimetype.startsWith('video')" 
      class="ambient-backdrop" 
      :style="{ backgroundImage: `url(/upload/${currentItem.filename})` }"
    ></div>

    <!-- Empty or Loading States -->
    <div v-if="loading" class="fullscreen-center-msg">
      <div class="candle-container">
        <div class="candle-flame"></div>
        <div class="candle-stick"></div>
      </div>
      <p style="margin-top: 1rem; color: var(--gold); letter-spacing: 0.1em;">
        Loading memories for Christiona...
      </p>
    </div>

    <div v-else-if="!mediaList.length" class="fullscreen-center-msg empty-box">
      <p style="font-size: 2.8rem; margin-bottom: 0.5rem;">🕊️</p>
      <h2>No Photos in Slideshow Yet</h2>
      <p style="color: var(--text-muted); max-width: 420px; margin: 0.75rem auto 1.5rem;">
        Photos and videos approved by admin will play here in full-screen memorial tribute.
      </p>
      <router-link to="/create" class="btn btn-primary">
        Upload a Photo or Video
      </router-link>
    </div>

    <!-- Active Media Stage -->
    <template v-else>
      <div class="fullscreen-stage" @click="togglePlay">
        <transition name="ambient-fade" mode="out-in">
          <div :key="currentItem.id" class="media-wrapper">
            <video 
              v-if="currentItem.mimetype.startsWith('video')" 
              :src="`/upload/${currentItem.filename}`" 
              controls 
              autoplay 
              playsinline
              class="fullscreen-media"
            ></video>
            <img 
              v-else 
              :src="`/upload/${currentItem.filename}`" 
              :alt="currentItem.caption || 'Memorial Photo'" 
              class="fullscreen-media" 
            />
          </div>
        </transition>

        <!-- Lateral Chevron Controls -->
        <button 
          class="fs-arrow fs-prev" 
          @click.stop="prevSlide" 
          title="Previous (Left Arrow)"
        >
          <Icon name="chevron-left" :size="32" />
        </button>
        <button 
          class="fs-arrow fs-next" 
          @click.stop="nextSlide" 
          title="Next (Right Arrow)"
        >
          <Icon name="chevron-right" :size="32" />
        </button>
      </div>

      <!-- Top Overlay Header -->
      <header class="fs-top-bar">
        <div class="fs-memorial-info">
          <span class="fs-badge">In Loving Memory</span>
          <h2 class="fs-subject-name">Christiona Adolfin Mona</h2>
        </div>

        <div class="fs-top-actions">
          <span class="fs-counter">{{ currentIndex + 1 }} / {{ mediaList.length }}</span>
          <button 
            class="fs-btn-icon" 
            @click="toggleNativeFullscreen" 
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'"
          >
            <Icon :name="isFullscreen ? 'minimize' : 'maximize'" :size="20" />
          </button>
        </div>
      </header>

      <!-- Bottom Overlay: Caption & Playback bar -->
      <footer class="fs-bottom-bar">
        <div class="fs-caption-box">
          <p v-if="currentItem.caption" class="fs-caption-text">
            “{{ currentItem.caption }}”
          </p>
          <div class="fs-meta-row">
            <span class="fs-author">Shared by <strong>{{ currentItem.user_name || 'Family & Friends' }}</strong></span>
            <span>•</span>
            <span>{{ formatDate(currentItem.created_at) }}</span>
          </div>
        </div>

        <div class="fs-playback-controls">
          <button class="fs-play-btn" @click="togglePlay" :title="isPlaying ? 'Pause' : 'Play (Space)'">
            <Icon :name="isPlaying ? 'pause' : 'play'" :size="20" />
            <span>{{ isPlaying ? 'Pause' : 'Play' }}</span>
          </button>
        </div>
      </footer>
    </template>
  </div>
</template>
