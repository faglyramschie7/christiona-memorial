<script setup>
import { ref, reactive, onMounted } from 'vue';
import { api, formatDate } from '../api';
import { state, toast } from '../store';
import HeroSection from '../components/HeroSection.vue';

const posts = ref([]);
const loading = ref(true);
const activeMediaIndex = ref({});
const touchTracker = reactive({});

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

function nextPostMedia(post) {
  if (!post.mediaList || post.mediaList.length <= 1) return;
  const pid = post.post_id || post.id;
  const current = activeMediaIndex.value[pid] || 0;
  activeMediaIndex.value[pid] = (current + 1) % post.mediaList.length;
}

function prevPostMedia(post) {
  if (!post.mediaList || post.mediaList.length <= 1) return;
  const pid = post.post_id || post.id;
  const current = activeMediaIndex.value[pid] || 0;
  activeMediaIndex.value[pid] = (current - 1 + post.mediaList.length) % post.mediaList.length;
}

function onTouchStart(postId, e) {
  if (!e.touches || e.touches.length === 0) return;
  touchTracker[postId] = {
    startX: e.touches[0].clientX,
    startY: e.touches[0].clientY,
    moved: false
  };
}

function onTouchMove(postId, e) {
  if (!touchTracker[postId] || !e.touches || e.touches.length === 0) return;
  const diffX = e.touches[0].clientX - touchTracker[postId].startX;
  const diffY = e.touches[0].clientY - touchTracker[postId].startY;
  if (Math.abs(diffX) > 10) {
    touchTracker[postId].moved = true;
  }
}

function onTouchEnd(post, e) {
  const pid = post.post_id || post.id;
  const track = touchTracker[pid];
  if (!track || !e.changedTouches || e.changedTouches.length === 0) return;

  const diffX = e.changedTouches[0].clientX - track.startX;
  const diffY = e.changedTouches[0].clientY - track.startY;

  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
    if (diffX < 0) {
      nextPostMedia(post);
    } else {
      prevPostMedia(post);
    }
  }

  setTimeout(() => {
    if (touchTracker[pid]) {
      touchTracker[pid].moved = false;
    }
  }, 120);
}

function handleMediaClick(post) {
  const pid = post.post_id || post.id;
  if (touchTracker[pid]?.moved) return;
  openMedia(getActiveMedia(post), post);
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

function openMedia(mediaItem, post = null) {
  if (!mediaItem || !mediaItem.filename) return;
  const list = post?.mediaList && post.mediaList.length > 0 ? post.mediaList : [mediaItem];
  const idx = post ? (activeMediaIndex.value[post.post_id || post.id] || 0) : 0;
  state.lightbox = {
    items: list,
    currentIndex: idx,
    src: `/upload/${mediaItem.filename}`,
    video: mediaItem.mimetype?.startsWith('video'),
    caption: post?.caption || mediaItem.caption || ''
  };
}

onMounted(loadFeed);
</script>

<template>
  <div>
    <HeroSection />

    <main class="feed-container">
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
          <div 
            v-if="getActiveMedia(post).filename" 
            class="media-carousel-wrap"
            @touchstart.passive="onTouchStart(post.post_id || post.id, $event)"
            @touchmove.passive="onTouchMove(post.post_id || post.id, $event)"
            @touchend="onTouchEnd(post, $event)"
          >
            <div 
              class="insta-media" 
              :class="{ 'video-media': getActiveMedia(post).mimetype.startsWith('video') }"
              @click="handleMediaClick(post)"
            >
              <video 
                v-if="getActiveMedia(post).mimetype.startsWith('video')" 
                :key="getActiveMedia(post).id || getActiveMedia(post).filename"
                :src="`/upload/${getActiveMedia(post).filename}#t=0.1`" 
                controls 
                preload="metadata"
                playsinline
              ></video>
              <img 
                v-else 
                :key="getActiveMedia(post).id || getActiveMedia(post).filename"
                :src="`/upload/${getActiveMedia(post).filename}`" 
                :alt="post.caption || 'Memorial memory'" 
                loading="lazy" 
                draggable="false"
              />
            </div>

            <!-- Multi-Media Navigation Arrows -->
            <button 
              v-if="post.mediaList && post.mediaList.length > 1 && (activeMediaIndex[post.post_id || post.id] || 0) > 0"
              class="feed-carousel-arrow arrow-left" 
              @click.stop="prevPostMedia(post)"
              aria-label="Sebelumnya"
            >
              &#8249;
            </button>
            <button 
              v-if="post.mediaList && post.mediaList.length > 1 && (activeMediaIndex[post.post_id || post.id] || 0) < post.mediaList.length - 1"
              class="feed-carousel-arrow arrow-right" 
              @click.stop="nextPostMedia(post)"
              aria-label="Berikutnya"
            >
              &#8250;
            </button>

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
              @click="openMedia(getActiveMedia(post), post)" 
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
