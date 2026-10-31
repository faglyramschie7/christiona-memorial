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
  // 6 seconds per slide for a relaxed cinematic memorial pace
  timer = setInterval(() => {
    nextSlide();
  }, 6000);
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
  }, 3500);
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
    class="cinematic-slideshow-view" 
    :class="{ 'ui-hidden': !showOverlay }"
    @mousemove="resetOverlayFade" 
    @touchstart="resetOverlayFade"
    @click="resetOverlayFade"
  >
    <!-- Dynamic Ambient Backdrop Glow -->
    <div 
      v-if="currentItem && !currentItem.mimetype.startsWith('video')" 
      class="ambient-kenburns-backdrop" 
      :style="{ backgroundImage: `url(/upload/${currentItem.filename})` }"
    ></div>

    <!-- Always-visible upload address (top right) -->
    <router-link to="/create" class="upload-url-pill" title="Unggah foto & video kenangan">
      <span class="upload-url-label">Unggah foto &amp; video di</span>
      <strong class="upload-url-domain">christionamona.app</strong>
    </router-link>

    <!-- Loading State -->
    <div v-if="loading" class="center-banner">
      <div class="candle-container">
        <div class="candle-flame"></div>
        <div class="candle-stick"></div>
      </div>
      <p class="loading-sub">Remembering Christiona Adolfin Mona...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!mediaList.length" class="center-banner empty-memorial-card">
      <p style="font-size: 3rem; margin-bottom: 0.5rem;">🕊️</p>
      <h2>No Photos in Slideshow Yet</h2>
      <p class="section-desc" style="margin: 0.75rem 0 1.5rem;">
        Upload photos and videos for Christiona. Approved media will play here automatically in full screen.
      </p>
      <router-link to="/create" class="btn btn-primary">
        Upload First Photo
      </router-link>
    </div>

    <!-- Active Cinematic Stage -->
    <template v-else>
      <div class="stage-viewport" @click="togglePlay">
        <transition name="cinematic-crossfade" mode="out-in">
          <div :key="currentItem.id" class="slide-layer">
            <!-- Video -->
            <video 
              v-if="currentItem.mimetype.startsWith('video')" 
              :src="`/upload/${currentItem.filename}`" 
              controls 
              autoplay 
              playsinline
              class="slide-fit-media"
            ></video>

            <!-- Photo with Ken Burns slow subtle zoom effect -->
            <img 
              v-else 
              :src="`/upload/${currentItem.filename}`" 
              :alt="currentItem.caption || 'Memorial Photo'" 
              class="slide-fit-media ken-burns-fx" 
            />
          </div>
        </transition>

        <!-- Previous / Next Controls -->
        <button 
          class="stage-arrow arrow-left" 
          @click.stop="prevSlide" 
          title="Previous"
        >
          <Icon name="chevron-left" :size="34" />
        </button>
        <button 
          class="stage-arrow arrow-right" 
          @click.stop="nextSlide" 
          title="Next"
        >
          <Icon name="chevron-right" :size="34" />
        </button>
      </div>

      <!-- Top Overlay: Minimal Memorial Header with Back button -->
      <header class="stage-top-overlay">
        <div class="subject-tag" style="display:flex; align-items:center; gap: 0.85rem;">
          <router-link to="/" class="fs-btn-icon" title="Exit to Feed">
            <Icon name="arrow-left" :size="20" />
          </router-link>
          <div>
            <span class="sub-label">In Loving Memory</span>
            <h2 class="sub-name">Christiona Adolfin Mona</h2>
          </div>
        </div>

        <div class="top-controls">
          <span class="slide-badge">{{ currentIndex + 1 }} / {{ mediaList.length }}</span>
          <button 
            class="icon-action-pill" 
            @click.stop="toggleNativeFullscreen" 
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'"
          >
            <Icon :name="isFullscreen ? 'minimize' : 'maximize'" :size="20" />
          </button>
        </div>
      </header>

      <!-- Bottom Overlay: Caption & Playback -->
      <footer class="stage-bottom-overlay">
        <div class="caption-wrapper">
          <p v-if="currentItem.caption" class="caption-text">
            “{{ currentItem.caption }}”
          </p>
          <div class="meta-row">
            <span>By <strong>{{ currentItem.user_name || 'Loved One' }}</strong></span>
            <span>•</span>
            <span>{{ formatDate(currentItem.created_at) }}</span>
          </div>
        </div>

        <div class="playback-box">
          <button class="play-toggle-btn" @click.stop="togglePlay">
            <Icon :name="isPlaying ? 'pause' : 'play'" :size="18" />
            <span>{{ isPlaying ? 'Pause' : 'Play' }}</span>
          </button>
        </div>
      </footer>
    </template>
  </div>
</template>
