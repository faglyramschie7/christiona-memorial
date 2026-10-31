<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '../api';
const props = defineProps({ kind: String });
const emit = defineEmits(['changed']);
const jobs = ref([]), transfers = ref({});
let timer, previous = null, active = true;
async function refresh() {
  try {
    const all = (await api.uploadJobs()).filter(job => job.kind === props.kind);
    if (!active) return;
    const signature = JSON.stringify(all.map(job => [job.id, job.status]));
    if (signature !== previous) { previous = signature; emit('changed'); }
    jobs.value = all.filter(job => job.status !== 'done');
  } catch { /* Keep current cards and try again on the next poll. */ }
}
function progress(event) {
  const item = event.detail;
  if (item.kind !== props.kind) return;
  if (item.active) transfers.value[item.id] = item;
  else { delete transfers.value[item.id]; refresh(); }
}
async function retry(id) { await api.retryUploadJob(id); await refresh(); }
onMounted(() => { refresh(); timer = setInterval(refresh, 2000); window.addEventListener('admin-upload-progress', progress); });
onUnmounted(() => { active = false; clearInterval(timer); window.removeEventListener('admin-upload-progress', progress); });
</script>
<template>
  <article v-for="item in transfers" :key="item.id" class="pending-card" aria-live="polite">
    <div class="skeleton-square"><span class="spinner"></span><strong>{{ item.percent }}%</strong><span>Mengunggah</span></div>
    <strong>{{ item.title }}</strong><progress :value="item.percent" max="100"></progress>
  </article>
  <article v-for="job in jobs" :key="job.id" class="pending-card" aria-live="polite">
    <div class="skeleton-square" :class="{ failed: job.status === 'failed' }"><span v-if="job.status !== 'failed'" class="spinner"></span><span>{{ job.status === 'failed' ? 'Gagal diproses' : job.status === 'queued' ? 'Menunggu giliran' : 'Mengoptimalkan' }}</span></div>
    <strong>{{ job.title || 'Media' }}</strong>
    <button v-if="job.status === 'failed'" class="btn btn-outline" @click="retry(job.id)">Coba Lagi</button>
  </article>
</template>
<style scoped>
.pending-card { padding: 1rem; border: 1px solid #282d3a; border-radius: 16px; background: #151821; display: grid; gap: 1rem; align-content: start; min-width: 0; }
.pending-card > strong { overflow-wrap: anywhere; }
.skeleton-square { aspect-ratio: 1; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #e8c668; background: linear-gradient(110deg,#1b202b 25%,#2b3140 45%,#1b202b 65%); background-size: 250% 100%; animation: shimmer 2s linear infinite; }
.failed { animation: none; color: #f1a29b; }
.spinner { width: 30px; height: 30px; border: 2px solid #e8c66833; border-top-color: #e8c668; border-radius: 50%; animation: spin 1s linear infinite; }
progress { width: 100%; accent-color: #e8c668; }
@keyframes shimmer { to { background-position: -250% 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@media(prefers-reduced-motion: reduce) { .skeleton-square,.spinner { animation: none; } }
</style>
