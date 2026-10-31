<script setup>
import { ref, onMounted } from 'vue';
import { api, formatDate } from '../api';
import { state, toast } from '../store';
import HeroSection from '../components/HeroSection.vue';

const posts = ref([]);
const loading = ref(true);
const activeMediaIndex = ref({});

async function loadFeed() {
  loading.value = true;
  try {
    const raw = await api.approved();
    const map = new Map();

    for (const item of raw) {
      const pid = item.post_id || item.id;
      if (!map.has(pid)) {
        map.set(pid, {
          ...item,
          post_id: pid,
          mediaList: [item]
        });
      } else {
        map.get(pid).mediaList.push(item);
      }
    }

    posts.value = Array.from(map.values());
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    loading.value = false;
  }
}

function getActiveMedia(post) {
  const list = post.mediaList || [post];
  const idx = activeMediaIndex.value[post.post_id || post.id] || 0;
  return list[idx] || list[0] || post;
}

function setMediaIndex(post, idx) {
  activeMediaIndex.value[post.post_id || post.id] = idx;
}

async function handleLike(post) {
  try {
    const res = await api.like(post.id);
    post.likes = res.likes;
    post.liked = true;
  } catch (e) {
    toast('Gagal menyukai postingan', 'error');
  }
}

function openMedia(mediaItem) {
  if (!mediaItem || !mediaItem.filename) return;
  state.lightbox = {
    src: `/upload/${mediaItem.filename}`,
    video: mediaItem.mimetype?.startsWith('video')
  };
}

onMounted(loadFeed);
</script>

<template>
  <div>
    <HeroSection />

    <main class="feed-container">
      <!-- Quick Post Action Banner -->
      <div class="feed-create-bar">
        <div class="user-prompt" @click="$router.push('/create')">
          <span class="user-circle">🕊️</span>
          <span class="prompt-text">Bagikan kenangan, foto, video, atau doa untuk Christiona...</span>
        </div>
        <router-link to="/create" class="btn btn-primary btn-sm">
          <span>➕ Bagikan</span>
        </router-link>
      </div>

      <!-- Feed Header -->
      <div class="feed-header">
        <h2>Memorial Feed</h2>
        <span class="feed-count">{{ posts.length }} {{ posts.length === 1 ? 'kiriman' : 'kiriman' }}</span>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="empty-state">
        <p>Memuat kenangan...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!posts.length" class="empty-state">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">🕊️</p>
        <p>Belum ada kiriman kenangan yang dipublikasikan.</p>
        <p class="section-desc">Jadilah yang pertama membagikan foto, video, atau kenangan hangat untuk Christiona.</p>
        <router-link to="/create" class="btn btn-primary" style="margin-top: 1rem;">
          Tulis Kenangan Pertama
        </router-link>
      </div>

      <!-- Instagram-Style Feed Stream -->
      <div v-else class="feed-stream">
        <article v-for="post in posts" :key="post.post_id || post.id" class="insta-card">
          <!-- Card Header: Author & Time -->
          <header class="insta-header">
            <div class="insta-author-info">
              <div class="insta-avatar">
                {{ (post.user_name || 'Loved One').charAt(0).toUpperCase() }}
              </div>
              <div class="insta-author-details">
                <span class="insta-author-name">{{ post.user_name || 'Keluarga & Sahabat' }}</span>
                <span class="insta-post-date">{{ formatDate(post.created_at) }}</span>
              </div>
            </div>
            <span class="insta-badge">Dalam Kenangan</span>
          </header>

          <!-- Card Media Area -->
          <div v-if="getActiveMedia(post).filename" class="media-carousel-wrap">
            <div 
              class="insta-media" 
              :class="{ 'video-media': getActiveMedia(post).mimetype.startsWith('video') }"
              @click="openMedia(getActiveMedia(post))"
            >
              <video 
                v-if="getActiveMedia(post).mimetype.startsWith('video')" 
                :src="`/upload/${getActiveMedia(post).filename}#t=0.1`" 
                controls 
                preload="metadata"
                playsinline
              ></video>
              <img 
                v-else 
                :src="`/upload/${getActiveMedia(post).filename}`" 
                :alt="post.caption || 'Memorial memory'" 
                loading="lazy" 
              />
            </div>

            <!-- Multi-Media Counter & Switcher Dots -->
            <div v-if="post.mediaList && post.mediaList.length > 1" class="media-counter-pill">
              {{ (activeMediaIndex[post.post_id || post.id] || 0) + 1 }} / {{ post.mediaList.length }}
            </div>

            <div v-if="post.mediaList && post.mediaList.length > 1" class="multi-media-indicator">
              <span 
                v-for="(m, idx) in post.mediaList" 
                :key="m.id" 
                class="media-dot" 
                :class="{ active: (activeMediaIndex[post.post_id || post.id] || 0) === idx }"
                @click.stop="setMediaIndex(post, idx)"
              ></span>
            </div>
          </div>

          <!-- Card Action Icons: Like, View Full -->
          <div class="insta-actions">
            <button 
              class="action-btn like-btn" 
              :class="{ 'active': post.liked }" 
              @click="handleLike(post)"
              title="Kirim cinta"
            >
              <span class="heart-icon">{{ post.liked ? '❤️' : '🤍' }}</span>
              <span class="like-counter">{{ post.likes || 0 }}</span>
            </button>
            <button 
              v-if="getActiveMedia(post).filename" 
              class="action-btn" 
              @click="openMedia(getActiveMedia(post))" 
              title="Perbesar media"
            >
              <span>🔍 Perbesar</span>
            </button>
          </div>

          <!-- Card Caption / Text content -->
          <div v-if="post.caption" class="insta-body">
            <div class="insta-caption" :class="{ 'text-only-card': !getActiveMedia(post).filename }">
              <span class="insta-caption-author">{{ post.user_name || 'Keluarga & Sahabat' }}</span>
              <p class="caption-text">{{ post.caption }}</p>
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>
