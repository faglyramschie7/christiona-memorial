<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import SlideshowView from './SlideshowView.vue';
const route = useRoute();
const feed = ref([]), collection = ref([]), loading = ref(true), error = ref('');
async function load() {
  loading.value = true; error.value = '';
  try { [feed.value, collection.value] = await Promise.all([api.approved(), api.library()]); }
  catch (e) { error.value = e.message; }
  finally { loading.value = false; }
}
onMounted(load);
</script>
<template>
  <SlideshowView v-if="route.query.source" :key="String(route.query.source)" />
  <main v-else class="main-container showcase-page">
    <div class="showcase-heading"><span>KENANGAN CHRISTIONA</span><h1>Slideshow</h1><p>Pilih kiriman keluarga atau koleksi penampilan untuk ditonton.</p></div>
    <p v-if="loading">Memuat kenangan...</p>
    <div v-else-if="error" role="alert">{{ error }} <button class="btn btn-outline" @click="load">Coba Lagi</button></div>
    <div v-else class="showcase-grid">
      <router-link v-if="feed.length" :to="{ path: '/slideshow', query: { source: 'feed' } }" class="showcase-card">
        <div class="showcase-preview">
          <video v-if="feed.find(item => item.filename)?.mimetype?.startsWith('video')" :src="`/upload/${feed.find(item => item.filename).filename}#t=0.1`" muted preload="metadata" playsinline />
          <img v-else-if="feed.find(item => item.filename)" :src="`/upload/${feed.find(item => item.filename).filename}`" alt="Kenangan keluarga" />
          <span class="showcase-play">▶</span>
        </div>
        <div class="showcase-caption"><h2>Feed</h2><p>Semua kiriman keluarga &amp; sahabat</p></div>
      </router-link>
      <router-link v-for="item in collection" :key="item.id" :to="{ path: '/slideshow', query: { source: item.id } }" class="showcase-card">
        <div class="showcase-preview">
          <video v-if="item.mimetype.startsWith('video')" :src="`/upload/${item.filename}#t=0.1`" muted preload="metadata" playsinline />
          <img v-else :src="`/upload/${item.filename}`" :alt="item.title" loading="lazy" />
          <span class="showcase-play">▶</span>
        </div>
        <div class="showcase-caption"><h2>{{ item.title }}</h2><p>Koleksi Christiona</p></div>
      </router-link>
      <p v-if="!feed.length && !collection.length" class="empty-state">Belum ada kenangan untuk ditampilkan.</p>
    </div>
  </main>
</template>
<style scoped>
.showcase-page { padding-bottom: 5rem; }
.showcase-heading { margin: 2rem 0; }
.showcase-heading > span { color: var(--gold); font-size: .75rem; letter-spacing: .15em; }
.showcase-heading h1 { margin: .5rem 0; }
.showcase-heading p, .showcase-caption p { color: #a5adbd; }
.showcase-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
.showcase-card { overflow: hidden; border: 1px solid #282d3a; border-radius: 16px; background: #151821; text-decoration: none; color: #fff; transition: border-color .2s, transform .2s; }
.showcase-card:hover { border-color: var(--gold); transform: translateY(-3px); }
.showcase-preview { height: 220px; position: relative; background: #080a0e; }
.showcase-preview img, .showcase-preview video { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.showcase-play { position: absolute; inset: 0; margin: auto; width: 48px; height: 48px; border-radius: 50%; background: #0009; color: var(--gold); display: grid; place-items: center; }
.showcase-caption { padding: 1.25rem; }
.showcase-caption h2 { font-size: 1.2rem; overflow-wrap: anywhere; }
.showcase-caption p { margin-top: .4rem; font-size: .85rem; }
</style>
