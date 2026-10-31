<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import Icon from './Icon.vue';
const route = useRoute();
const items = ref([]), strip = ref(null);
onMounted(async () => {
  try {
    const [feed, collection] = await Promise.all([api.approved(), api.library()]);
    const cover = feed.find(item => item.filename);
    items.value = [...(feed.length ? [{ ...cover, id: 'feed', title: 'Feed' }] : []), ...collection];
  } catch { /* Playback remains available if browsing cannot load. */ }
});
function scroll(direction) { strip.value?.scrollBy({ left: direction * strip.value.clientWidth * .75, behavior: 'smooth' }); }
</script>
<template>
  <section v-if="items.length" class="slideshow-browser" aria-label="Jelajahi koleksi" @click.stop @keydown.stop>
    <button class="browser-handle" aria-label="Tampilkan koleksi">Koleksi <span aria-hidden="true">⌃</span></button>
    <div class="browser-panel">
      <div class="browser-heading">Pilih Kenangan</div>
      <div class="browser-row">
        <button class="browser-arrow" aria-label="Gulir ke kiri" @click="scroll(-1)"><Icon name="chevron-left" :size="24" /></button>
        <div ref="strip" class="browser-strip">
          <router-link v-for="item in items" :key="item.id" :to="{ path: '/slideshow', query: { source: item.id } }" class="browser-card" :class="{ selected: route.query.source === item.id }" :aria-current="route.query.source === item.id ? 'true' : undefined">
            <video v-if="item.mimetype?.startsWith('video')" :src="`/upload/${item.filename}#t=0.1`" muted playsinline preload="metadata" />
            <img v-else-if="item.filename" :src="`/upload/${item.filename}`" alt="" loading="lazy" />
            <div v-else class="browser-placeholder">Feed</div>
            <span>{{ item.title }}</span>
          </router-link>
        </div>
        <button class="browser-arrow" aria-label="Gulir ke kanan" @click="scroll(1)"><Icon name="chevron-right" :size="24" /></button>
      </div>
    </div>
  </section>
</template>
<style scoped>
.slideshow-browser { position: absolute; bottom: 0; left: 0; right: 0; z-index: 30; height: 32px; }
.browser-handle { position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); color: var(--gold); background: #111827cc; border: 1px solid #e8c66855; border-radius: 20px; padding: 5px 18px; cursor: pointer; }
.browser-panel { position: absolute; bottom: 0; left: 0; right: 0; padding: 18px 20px 12px; background: linear-gradient(0deg,#080a10 80%,#080a10ee); border-top: 1px solid #e8c66844; transform: translateY(100%); opacity: 0; visibility: hidden; transition: transform .25s ease, opacity .25s ease, visibility .25s; }
.slideshow-browser:hover .browser-panel,.slideshow-browser:focus-within .browser-panel { transform: translateY(0); opacity: 1; visibility: visible; }
.browser-heading { color: var(--gold); font-weight: 600; margin: 0 44px 12px; }
.browser-row { display: flex; gap: 12px; align-items: center; }
.browser-strip { display: grid; grid-auto-flow: column; grid-auto-columns: 160px; gap: 12px; overflow-x: auto; scrollbar-width: thin; scrollbar-color: #c6a54e #171b24; padding: 3px 2px 10px; scroll-snap-type: x mandatory; }
.browser-card { scroll-snap-align: start; border: 1px solid #303644; border-radius: 10px; overflow: hidden; background: #151821; color: white; text-decoration: none; }
.browser-card.selected,.browser-card:hover { border-color: var(--gold); }
.browser-card video,.browser-card img,.browser-placeholder { width: 100%; height: 95px; object-fit: cover; display: block; pointer-events: none; }
.browser-placeholder { display: grid; place-items: center; }
.browser-card span { display: block; padding: 8px; font-size: .8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.browser-arrow { flex-shrink: 0; width: 32px; height: 40px; border: 1px solid #414755; background: #171b24; color: var(--gold); border-radius: 8px; cursor: pointer; }
@media(max-width:600px) { .browser-panel { padding: 12px 8px; } .browser-row { gap: 6px; } .browser-strip { grid-auto-columns: 130px; } }
@media(prefers-reduced-motion:reduce) { .browser-panel { transition: none; } }
</style>
