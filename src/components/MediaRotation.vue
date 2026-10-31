<script setup>
import { ref } from 'vue';
import { api } from '../api';
import { toast } from '../store';
const props = defineProps({ item: Object, kind: { default: 'feed' } });
const emit = defineEmits(['saved']);
const busy = ref(false);
async function rotate(degrees) {
  busy.value = true;
  try { const result = await api.rotateMedia(props.kind, props.item.id, degrees); emit('saved', result.media); toast('Media diputar.'); }
  catch (e) { toast(e.message, 'error'); } finally { busy.value = false; }
}
</script>
<template>
  <div class="media-rotation" @click.stop @keydown.stop>
    <button type="button" :disabled="busy" aria-label="Putar media 90 derajat ke kiri" @click="rotate(-90)">↶</button>
    <button type="button" :disabled="busy" aria-label="Putar media 90 derajat ke kanan" @click="rotate(90)">↷</button>
    <small v-if="busy">Memproses...</small>
  </div>
</template>
<style scoped>
.media-rotation { position: absolute; bottom: 8px; right: 8px; z-index: 5; display: flex; gap: 4px; align-items: center; background: #080a0ee8; border: 1px solid #e8c66866; border-radius: 8px; padding: 4px; color: var(--gold); }
button { min-width: 36px; min-height: 36px; color: inherit; background: transparent; border: 0; border-radius: 5px; font-size: 1.5rem; cursor: pointer; }
button:hover { background: #e8c66822; }
button:disabled { opacity: .5; cursor: wait; }
</style>
