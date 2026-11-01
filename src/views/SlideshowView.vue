<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
import { api, formatDate } from '../api';
import { toast } from '../store';
import SlideshowBrowser from '../components/SlideshowBrowser.vue';
import Icon from '../components/Icon.vue';

const mediaList = ref([]);
const slideSeconds = ref(6);
const currentIndex = ref(0);
const isPlaying = ref(true);
const isMuted = ref(false);
const isLooping = ref(true);
const loading = ref(true);
const isFullscreen = ref(false);
const showOverlay = ref(true);
const showMemorialHeader = ref(false);
let memorialHeaderTimer = null;

function onMouseMove() {
  resetOverlayFade();
  showMemorialHeader.value = true;
  if (memorialHeaderTimer) clearTimeout(memorialHeaderTimer);
  memorialHeaderTimer = setTimeout(() => {
    showMemorialHeader.value = false;
  }, 3500);
}
const videoRef = ref(null);
const musicRef = ref(null);
const musicSrc = ref('/audio/he-leadeth-me.mp3');
const backgroundMusicEnabled = computed(() => route.query.source === 'feed');
function playMusic() {
  if (!musicRef.value) return;
  if (!backgroundMusicEnabled.value) { musicRef.value.pause(); return; }
  musicRef.value.volume = currentItem.value?.mimetype?.startsWith('video') ? 0.25 : 0.6;
  if (isPlaying.value && currentItem.value) musicRef.value.play().catch(() => {});
}
let timer = null;
let overlayTimer = null;

const currentItem = computed(() => {
  if (!mediaList.value.length) return null;
  return mediaList.value[currentIndex.value];
});

watch([isPlaying, currentItem], () => {
  if (isPlaying.value && currentItem.value) playMusic();
  else musicRef.value?.pause();
});

async function loadMedia() {
  loading.value = true;
  try {
    const [feed, library] = await Promise.all([api.approved(), api.library()]);
    const source = route.query.source;
    const all = source === 'feed' ? feed : source && source !== 'all' ? library.filter(item => item.id === source) : [...feed, ...library];
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
  scheduleNextSlide();
}

function prevSlide() {
  if (!mediaList.value.length) return;
  currentIndex.value = (currentIndex.value - 1 + mediaList.value.length) % mediaList.value.length;
  resetOverlayFade();
  scheduleNextSlide();
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    scheduleNextSlide();
    if (videoRef.value && currentItem.value?.mimetype?.startsWith('video')) {
      videoRef.value.play().catch(() => {});
    }
  } else {
    stopAutoPlay();
    if (videoRef.value && currentItem.value?.mimetype?.startsWith('video')) {
      videoRef.value.pause();
    }
  }
  resetOverlayFade();
}

function scheduleNextSlide() {
  stopAutoPlay();
  if (!isPlaying.value || !currentItem.value) return;

  const isVideo = currentItem.value.mimetype?.startsWith('video');
  if (isVideo) {
    // For videos: wait until the video finishes playing (@ended event)
    nextTick(() => {
      if (videoRef.value) {
        videoRef.value.play().catch(() => {});
      }
    });
    return;
  }

  // Only photos use the configured duration.
  const scheduledItem = currentItem.value;
  timer = setTimeout(() => {
    if (currentItem.value !== scheduledItem || videoRef.value || currentItem.value?.mimetype?.startsWith('video')) return;
    nextSlide();
  }, slideSeconds.value * 1000);
}

function startAutoPlay() {
  scheduleNextSlide();
}

function stopAutoPlay() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function onVideoEnded(event) {
  // Ignore stale events from a video that is leaving the stage.
  if (event.target !== videoRef.value || !event.target.ended) return;
  stopAutoPlay();
  if (route.query.source !== 'feed') {
    if (isPlaying.value && isLooping.value) {
      event.target.currentTime = 0;
      event.target.play().catch(() => {});
    } else {
      isPlaying.value = false;
    }
    return;
  }
  if (isPlaying.value) {
    const endedVideo = event.target;
    timer = setTimeout(() => {
      if (isPlaying.value && videoRef.value === endedVideo && endedVideo.ended) nextSlide();
    }, 800);
  }
}

function onVideoError(event) {
  if (event.target !== videoRef.value) return;
  stopAutoPlay();
  isPlaying.value = false;
  toast('Video gagal dimuat. Silakan coba putar lagi.', 'error');
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
  if (e.target instanceof Element && e.target.closest('video, button, a, input, textarea, select, [contenteditable]')) return;
  if (e.key === 'ArrowRight') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === 'f' || e.key === 'F') toggleNativeFullscreen();
  resetOverlayFade();
}

let touchStartX = 0;
let touchStartY = 0;
let isTouchSwiping = false;

function onTouchStart(e) {
  resetOverlayFade();
  if (e.touches && e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isTouchSwiping = false;
  }
}

function onTouchMove(e) {
  if (e.touches && e.touches.length > 0) {
    const diffX = e.touches[0].clientX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;
    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      isTouchSwiping = true;
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
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }
  setTimeout(() => {
    isTouchSwiping = false;
  }, 120);
}

onMounted(async () => {
  try {
    const settings = await api.slideshowSettings();
    if (Number.isInteger(settings.seconds) && settings.seconds >= 2 && settings.seconds <= 120) slideSeconds.value = settings.seconds;
  } catch { /* Keep the default timing when settings are unavailable. */ }
  try {
    const music = await api.slideshowMusic();
    musicSrc.value = music.songs.find(song => song.id === music.selectedId)?.src || musicSrc.value;
  } catch { /* Use the original song if unavailable. */ }
  await loadMedia();
  playMusic();
  window.addEventListener('pointerdown', playMusic);
  window.addEventListener('keydown', playMusic);
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
  if (memorialHeaderTimer) clearTimeout(memorialHeaderTimer);
  musicRef.value?.pause();
  window.removeEventListener('pointerdown', playMusic);
  window.removeEventListener('keydown', playMusic);
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
    :class="{ 'ui-hidden': !showOverlay, 'arrows-hidden': !showMemorialHeader, 'memorial-header-hidden': isFullscreen && !showMemorialHeader }"
    @mousemove="onMouseMove" 
    @touchstart="resetOverlayFade"
    @click="resetOverlayFade"
  >
    <audio :muted="isMuted" v-if="backgroundMusicEnabled" ref="musicRef" :src="musicSrc" loop preload="auto"></audio>
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
      <div 
        class="stage-viewport" 
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend="onTouchEnd"
      >
        <transition name="cinematic-crossfade" mode="out-in">
          <div :key="currentItem.id" class="slide-layer">
            <!-- Video: Plays until finished before auto-advancing -->
            <video 
              v-if="currentItem.mimetype.startsWith('video')" 
              ref="videoRef"
              :key="currentItem.id || currentItem.filename"
              :src="`/upload/${currentItem.filename}`" 
              :muted="isMuted"
              controls 
              autoplay
              playsinline
              class="slide-fit-media"
              @ended="onVideoEnded"
              @error="onVideoError"
              @click.stop
            ></video>

            <!-- Photo with Ken Burns slow subtle zoom effect -->
            <img 
              v-else 
              :src="`/upload/${currentItem.filename}`" 
              :alt="currentItem.caption || 'Memorial Photo'" 
              class="slide-fit-media ken-burns-fx" 
              draggable="false"
            />
          </div>
        </transition>

        <!-- Previous / Next Controls -->
        <button 
          v-if="mediaList.length > 1"
          class="stage-arrow arrow-left" 
          @click.stop="prevSlide" 
          title="Previous"
        >
          <Icon name="chevron-left" :size="34" />
        </button>
        <button 
          v-if="mediaList.length > 1"
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
          <router-link to="/slideshow" class="fs-btn-icon" title="Exit to Feed">
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
          <button v-if="route.query.source !== 'feed' && currentItem?.mimetype?.startsWith('video')" class="play-toggle-btn" :class="{ 'loop-active': isLooping }" @click.stop="isLooping = !isLooping" :aria-pressed="isLooping" :aria-label="isLooping ? 'Disable loop' : 'Enable loop'" :title="isLooping ? 'Disable loop' : 'Enable loop'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3" /></svg>
          </button>
          <button class="play-toggle-btn" @click.stop="isMuted = !isMuted" :aria-label="isMuted ? 'Unmute' : 'Mute'" :title="isMuted ? 'Unmute' : 'Mute'" :aria-pressed="isMuted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H3v6h3l5 4V5Z" />
              <path v-if="isMuted" d="m17 9 5 6m0-6-5 6" />
              <template v-else><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></template>
            </svg>
          </button>
          <button class="play-toggle-btn" @click.stop="togglePlay">
            <Icon :name="isPlaying ? 'pause' : 'play'" :size="18" />
            <span>{{ isPlaying ? 'Pause' : 'Play' }}</span>
          </button>
        </div>
      </footer>
    </template>
    <SlideshowBrowser />
  </div>
</template>
