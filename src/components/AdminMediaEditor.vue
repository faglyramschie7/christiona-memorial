<script setup>
import { ref } from 'vue';
import { api } from '../api';
import { toast } from '../store';
const props = defineProps({ item: Object, kind: { default: 'feed' } });
const emit = defineEmits(['saved']);
const editing = ref(false), text = ref(''), sender = ref(''), busy = ref(false);
function edit() { text.value = props.item.caption ?? props.item.title ?? ''; sender.value = props.item.user_name || ''; editing.value = true; }
async function save() {
  busy.value = true;
  try { await api.editMedia(props.kind, props.item.post_id || props.item.id, { caption: text.value, user_name: sender.value }); editing.value = false; emit('saved'); toast('Teks disimpan.'); }
  catch (e) { toast(e.message, 'error'); } finally { busy.value = false; }
}
</script>
<template>
  <div class="media-editor">
    <button v-if="!editing" type="button" class="btn btn-outline edit-trigger" @click="edit">Edit {{ kind === 'feed' ? 'Kiriman' : 'Judul' }}</button>
    <form v-else class="editor-panel" @submit.prevent="save">
      <header class="editor-heading"><strong>{{ kind === 'feed' ? 'Edit Kiriman' : 'Edit Judul Koleksi' }}</strong><span>Perbarui informasi yang ditampilkan.</span></header>
      <label v-if="kind === 'feed'" class="editor-field">
        <span>Nama pengirim</span>
        <input v-model="sender" maxlength="150" :disabled="busy" autocomplete="off" placeholder="Nama pengirim" />
      </label>
      <label class="editor-field">
        <span>{{ kind === 'feed' ? 'Cerita kenangan' : 'Judul koleksi' }}</span>
        <textarea v-if="kind === 'feed'" v-model="text" rows="4" maxlength="10000" :disabled="busy" placeholder="Tuliskan cerita atau keterangan kenangan..."></textarea>
        <input v-else v-model="text" maxlength="200" required :disabled="busy" placeholder="Judul koleksi" />
      </label>
      <div class="editor-actions">
        <button type="button" class="btn btn-outline" :disabled="busy" @click="editing = false">Batal</button>
        <button class="btn btn-primary" :disabled="busy">{{ busy ? 'Menyimpan...' : 'Simpan Perubahan' }}</button>
      </div>
    </form>
  </div>
</template>
<style scoped>
.media-editor { margin-top: 1rem; }
.edit-trigger { width: 100%; min-height: 42px; }
.editor-panel { display: grid; gap: 1.25rem; padding: 1.25rem; border: 1px solid #343b49; border-radius: 12px; background: #10131b; }
.editor-heading { display: grid; gap: .25rem; }
.editor-heading strong { color: #f1f3f7; font-size: .95rem; }
.editor-heading > span { color: #929cad; font-size: .8rem; line-height: 1.5; }
.editor-field { display: grid; gap: .5rem; }
.editor-field > span { color: #cbd2df; font-size: .8rem; font-weight: 600; }
input, textarea { display: block; width: 100%; box-sizing: border-box; background: #090c12; color: #f1f3f7; padding: .75rem .85rem; border: 1px solid #343b49; border-radius: 8px; font: inherit; font-size: .9rem; line-height: 1.6; transition: border-color .15s, box-shadow .15s; }
input { min-height: 46px; }
textarea { min-height: 120px; resize: vertical; }
input:focus, textarea:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px #e8c66818; }
.editor-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: .65rem; padding-top: 1rem; border-top: 1px solid #282e3a; }
.editor-actions .btn { min-height: 42px; padding: .6rem .9rem; font-size: .8rem; }
@media(max-width:400px) { .editor-panel { padding: 1rem; } .editor-actions .btn { flex: 1; } }
</style>
