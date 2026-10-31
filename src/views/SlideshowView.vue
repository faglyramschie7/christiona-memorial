<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api, formatDate } from '../api';
import { toast } from '../store';
import Icon from '../components/Icon.vue';

const mediaList = ref([]);
const currentIndex = ref(0);
const isPlaying = ref(true);
const loading = ref(true);
let timer = null;

const currentItem = computed(() => {
  if (!mediaList.value.length) return null;
  return mediaList.value[currentIndex.value];
});

async function loadMedia() {
  loading.value = true;
  try {
    const all = await api.approved();
    // Only include posts that actually have photos or videos
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
}

function prevSlide() {
  if (!mediaList.value.length) return;
  currentIndex.value = (currentIndex.value - 1 + mediaList.value.length) % mediaList.value.length;
}

function togglePlay() {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    startAutoPlay();
  } else {
    stopAutoPlay();
  }
}

function startAutoPlay() {
  stopAutoPlay();
  timer = setInterval(() => {
    nextSlide();
  }, 4500);
}

function stopAutoPlay() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function handleKeydown(e) {
  if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
}

onMounted(async () => {
  await loadMedia();
  if (mediaList.value.length) {
    startAutoPlay();
  }
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  stopAutoPlay();
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <main class="slideshow-page">
    <!-- Top info bar -->
    <div class="slideshow-header">
      <div class="slideshow-title-box">
        <span class="gold-sub">In Cherished Memory</span>
        <h1 class="slideshow-name">Christiona Adolfin Mona</h1>
      </div>
      <div v-if="mediaList.length" class="slideshow-counter">
        {{ currentIndex + 1 }} / {{ mediaList.length }}
      </div>
    </div>

    <!-- Empty state if no photos uploaded yet -->
    <div v-if="loading" class="empty-state" style="margin: 3rem auto; max-width: 500px;">
      <p>Loading memorial moments...</p>
    </div>

    <div v-else-if="!mediaList.length" class="empty-state" style="margin: 3rem auto; max-width: 500px;">
      <p style="font-size: 2.2rem; margin-bottom: 0.5rem;">🕊️</p>
      <h3>No Photos or Videos Uploaded Yet</h3>
      <p class="section-desc" style="margin-top: 0.5rem;">
        Be the first to share photos of Christiona to appear in this memorial slideshow.
      </p>
      <router-link to="/create" class="btn btn-primary" style="margin-top: 1.25rem;">
        Upload First Photo
      </router-link>
    </div>

    <!-- Active Slideshow Display -->
    <div v-else class="slideshow-container">
      <div class="slide-stage" @click="togglePlay">
        <transition name="slide-fade" mode="out-in">
          <div :key="currentItem.id" class="slide-element">
            <video 
              v-if="currentItem.mimetype.startsWith('video')" 
              :src="`/upload/${currentItem.filename}`" 
              controls 
              autoplay 
              muted 
              class="slide-media"
            ></video>
            <img 
              v-else 
              :src="`/upload/${currentItem.filename}`" 
              :alt="currentItem.caption || 'Memory'" 
              class="slide-media" 
            />
          </div>
        </transition>

        <!-- Navigation Chevrons -->
        <button class="slide-arrow prev-arrow" @click.stop="prevSlide" title="Previous photo">
          <Icon name="chevron-left" :size="28" />
        </button>
        <button class="slide-arrow next-arrow" @click.stop="nextSlide" title="Next photo">
          <Icon name="chevron-right" :size="28" />
        </button>
      </div>

      <!-- Slide Details / Caption Banner -->
      <div class="slide-caption-bar">
        <div class="caption-content">
          <p v-if="currentItem.caption" class="slide-text">"{{ currentItem.caption }}"</p>
          <div class="slide-meta">
            <span>Shared by <strong>{{ currentItem.user_name || 'Loved One' }}</strong></span>
            <span>•</span>
            <span>{{ formatDate(currentItem.created_at) }}</span>
          </div>
        </div>

        <div class="slide-controls">
          <button class="control-btn" @click="togglePlay" :title="isPlaying ? 'Pause' : 'Play'">
            <Icon :name="isPlaying ? 'pause' : 'play'" :size="20" />
            <span>{{ isPlaying ? 'Pause' : 'Play' }}</span>
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
