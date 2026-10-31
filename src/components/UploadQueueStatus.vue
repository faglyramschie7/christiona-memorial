<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { state, toast } from '../store';
import { api } from '../api';
const jobs = ref([]), error = ref('');
const transfers = ref({});
function onProgress(event) {
  const transfer = event.detail;
  if (transfer.active) transfers.value[transfer.id] = transfer;
  else { delete transfers.value[transfer.id]; refresh(); }
}
window.addEventListener('admin-upload-progress', onProgress);
let timer;
const labels = { queued: 'Menunggu giliran', processing: 'Mengoptimalkan', failed: 'Gagal', done: 'Selesai' };
async function refresh() {
  try { jobs.value = (await api.uploadJobs()).filter(job => job.status !== 'done'); error.value = ''; }
  catch (e) { error.value = e.message; }
}
async function retry(id) {
  try { await api.retryUploadJob(id); await refresh(); }
  catch (e) { toast(e.message, 'error'); }
}
watch(() => state.sessionLoaded && state.user?.role === 'admin', ready => {
  clearInterval(timer);
  if (ready) { refresh(); timer = setInterval(refresh, 5000); }
  else jobs.value = [];
}, { immediate: true });
onUnmounted(() => { clearInterval(timer); window.removeEventListener('admin-upload-progress', onProgress); });
</script>
<template>
  <section v-if="jobs.length || error || Object.keys(transfers).length" class="queue-status card">
    <strong>Status Unggahan</strong>
    <div v-for="transfer in transfers" :key="transfer.id" class="transfer-row">
      <div class="progress-heading"><span>{{ transfer.title }} · Mengunggah</span><strong>{{ transfer.percent }}%</strong></div>
      <div class="progress-track" role="progressbar" :aria-valuenow="transfer.percent" aria-valuemin="0" aria-valuemax="100" :aria-label="transfer.title"><div class="progress-fill" :style="{ width: transfer.percent + '%' }"></div></div>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <div v-for="job in jobs.slice(0, 8)" :key="job.id" class="queue-row">
      <div class="job-detail"><span>{{ job.title || 'Media' }} <small>· {{ labels[job.status] }}</small><small v-if="job.error" role="alert"> — {{ job.error }}</small></span>
      <div v-if="job.status === 'processing' || job.status === 'queued'" class="progress-track indeterminate" :aria-label="labels[job.status]" role="progressbar"><div class="progress-fill"></div></div>
      <div v-else-if="job.status === 'done'" class="completion">100%</div></div>
      <button v-if="job.status === 'failed'" class="btn btn-outline btn-sm" @click="retry(job.id)">Coba Lagi</button>
    </div>
    <p class="section-desc">Media tampil otomatis setelah optimasi selesai.</p>
  </section>
</template>
<style scoped>
.transfer-row { padding: 1rem 0; }
.progress-heading { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: .6rem; }
.progress-track { height: 7px; overflow: hidden; background: #282d3a; border-radius: 8px; margin-top: .6rem; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #b38c2c, #edcf7a); border-radius: inherit; transition: width .3s ease; }
.indeterminate .progress-fill { width: 35%; animation: processing 1.5s ease-in-out infinite; }
@keyframes processing { from { transform: translateX(-110%); } to { transform: translateX(390%); } }
.job-detail { flex: 1; min-width: 0; }
.completion { color: var(--gold); font-size: .8rem; margin-top: .4rem; }
@media (prefers-reduced-motion: reduce) { .indeterminate .progress-fill { animation: none; width: 100%; opacity: .6; } }
.queue-status { padding: 1.25rem; margin: 1.5rem 0; }
.queue-row { display: flex; justify-content: space-between; gap: 1rem; padding: .65rem 0; border-bottom: 1px solid #282d3a; overflow-wrap: anywhere; }
small, .section-desc { color: #a5adbd; }
.section-desc { margin-top: .75rem; font-size: .85rem; }
</style>
