<script setup>
import { state } from '../store';
import { formatDate } from '../api';

const props = defineProps({ items: { type: Array, required: true } });
const open = (item, idx) => {
  state.lightbox = {
    items: props.items,
    currentIndex: idx,
    src: `/upload/${item.filename}`,
    video: item.mimetype.startsWith('video'),
    caption: item.caption || ''
  };
};
const isVideo = (item) => item.mimetype.startsWith('video');
</script>

<template>
  <section id="gallery">
    <div class="section-header">
      <div>
        <span class="badge">Approved</span>
        <h2>Moments &amp; Memories</h2>
        <p class="section-desc">Photos and videos shared by family and friends.</p>
      </div>
    </div>

    <div v-if="!items.length" class="empty-state">
      No photos or videos have been published yet.
    </div>

    <div v-else class="gallery-grid">
      <article v-for="(item, idx) in items" :key="item.id" class="gallery-card">
        <div class="gallery-media-wrapper" @click="open(item, idx)">
          <video v-if="isVideo(item)" :src="`/upload/${item.filename}#t=0.1`" preload="metadata" muted></video>
          <img v-else :src="`/upload/${item.filename}`" :alt="item.caption || 'Memory'" loading="lazy" />
          <span v-if="isVideo(item)" class="play-badge">▶</span>
        </div>
        <div class="gallery-info">
          <p v-if="item.caption" class="gallery-caption">“{{ item.caption }}”</p>
          <div class="gallery-meta">
            <span>By {{ item.user_name || 'a loved one' }}</span>
            <span>{{ formatDate(item.created_at) }}</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
