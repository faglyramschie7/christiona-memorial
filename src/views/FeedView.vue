<script setup>
import { ref, onMounted } from 'vue';
import { api, formatDate } from '../api';
import { state, toast } from '../store';
import HeroSection from '../components/HeroSection.vue';

const posts = ref([]);
const loading = ref(true);

async function loadFeed() {
  loading.value = true;
  try {
    posts.value = await api.approved();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    loading.value = false;
  }
}

async function handleLike(post) {
  try {
    const res = await api.like(post.id);
    post.likes = res.likes;
    post.liked = true;
  } catch (e) {
    toast('Could not like post', 'error');
  }
}

function openMedia(post) {
  if (!post.filename) return;
  state.lightbox = {
    src: `/upload/${post.filename}`,
    video: post.mimetype?.startsWith('video')
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
          <span class="prompt-text">Share a memory, photo, video, or words for Christiona...</span>
        </div>
        <router-link to="/create" class="btn btn-primary btn-sm">
          <span>➕ Post</span>
        </router-link>
      </div>

      <!-- Feed Header -->
      <div class="feed-header">
        <h2>Memorial Feed</h2>
        <span class="feed-count">{{ posts.length }} {{ posts.length === 1 ? 'post' : 'posts' }}</span>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="empty-state">
        <p>Loading posts...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!posts.length" class="empty-state">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">🕊️</p>
        <p>No posts published on the feed yet.</p>
        <p class="section-desc">Be the first to share a warm memory, tribute, photo or video for Christiona.</p>
        <router-link to="/create" class="btn btn-primary" style="margin-top: 1rem;">
          Write First Post
        </router-link>
      </div>

      <!-- Instagram-Style Feed Stream -->
      <div v-else class="feed-stream">
        <article v-for="post in posts" :key="post.id" class="insta-card">
          <!-- Card Header: Author & Time -->
          <header class="insta-header">
            <div class="insta-author-info">
              <div class="insta-avatar">
                {{ (post.user_name || 'Loved One').charAt(0).toUpperCase() }}
              </div>
              <div class="insta-author-details">
                <span class="insta-author-name">{{ post.user_name || 'Loved One' }}</span>
                <span class="insta-post-date">{{ formatDate(post.created_at) }}</span>
              </div>
            </div>
            <span class="insta-badge">In Remembrance</span>
          </header>

          <!-- Card Media (if present: image or video) -->
          <div 
            v-if="post.filename" 
            class="insta-media" 
            :class="{ 'video-media': post.mimetype.startsWith('video') }"
            @click="openMedia(post)"
          >
            <video 
              v-if="post.mimetype.startsWith('video')" 
              :src="`/upload/${post.filename}#t=0.1`" 
              controls 
              preload="metadata"
              playsinline
            ></video>
            <img 
              v-else 
              :src="`/upload/${post.filename}`" 
              :alt="post.caption || 'Memorial memory'" 
              loading="lazy" 
            />
          </div>

          <!-- Card Action Icons: Like, Share / Fullscreen -->
          <div class="insta-actions">
            <button 
              class="action-btn like-btn" 
              :class="{ 'active': post.liked }" 
              @click="handleLike(post)"
              title="Leave a heart"
            >
              <span class="heart-icon">{{ post.liked ? '❤️' : '🤍' }}</span>
              <span class="like-counter">{{ post.likes || 0 }}</span>
            </button>
            <button 
              v-if="post.filename" 
              class="action-btn" 
              @click="openMedia(post)" 
              title="Expand media"
            >
              <span>🔍 View Full</span>
            </button>
          </div>

          <!-- Card Caption / Text content -->
          <div v-if="post.caption" class="insta-body">
            <div class="insta-caption" :class="{ 'text-only-card': !post.filename }">
              <span class="insta-caption-author">{{ post.user_name || 'Loved One' }}</span>
              <p class="caption-text">{{ post.caption }}</p>
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>
