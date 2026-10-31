<script setup>
import { ref, onMounted } from 'vue';
import { api, formatDate } from '../api';
import { toast } from '../store';

const tributes = ref([]);
const form = ref({ author_name: '', relationship: '', message: '', candle_lit: true });
const busy = ref(false);

async function load() {
  try {
    tributes.value = await api.tributes();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function submit() {
  busy.value = true;
  try {
    await api.postTribute(form.value);
    toast('Your message is now on the wall 🕯️');
    form.value = { author_name: '', relationship: '', message: '', candle_lit: true };
    await load();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section id="tributes" class="tribute-layout">
    <div class="card tribute-form-card">
      <div class="card-header">
        <div class="header-icon">✍️</div>
        <div>
          <h3>Write for Christiona</h3>
          <p class="section-desc">Leave a message, memory or prayer. No account needed.</p>
        </div>
      </div>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="t-name">Your name *</label>
          <input id="t-name" v-model="form.author_name" type="text" required maxlength="80" />
        </div>
        <div class="form-group">
          <label for="t-rel">Relationship</label>
          <input id="t-rel" v-model="form.relationship" type="text" maxlength="80" placeholder="e.g. Sister, Friend, Classmate" />
        </div>
        <div class="form-group">
          <label for="t-msg">Message *</label>
          <textarea id="t-msg" v-model="form.message" rows="5" required maxlength="2000"></textarea>
        </div>
        <label class="form-check">
          <input v-model="form.candle_lit" type="checkbox" /> 🕯️ Light a candle
        </label>
        <button class="btn btn-primary btn-block" :disabled="busy">
          {{ busy ? 'Posting…' : 'Post to the Wall' }}
        </button>
      </form>
    </div>

    <div>
      <div class="tributes-header">
        <h2>The Memorial Wall</h2>
        <span class="count-badge">{{ tributes.length }} {{ tributes.length === 1 ? 'message' : 'messages' }}</span>
      </div>
      <div v-if="!tributes.length" class="empty-state">Be the first to write a message for Christiona.</div>
      <div v-else class="tributes-list">
        <article v-for="t in tributes" :key="t.id" class="tribute-item">
          <div class="tribute-item-head">
            <div>
              <span class="tribute-author">{{ t.author_name }}</span>
              <span v-if="t.relationship" class="tribute-relation">• {{ t.relationship }}</span>
            </div>
            <span class="tribute-time">{{ formatDate(t.created_at) }}</span>
          </div>
          <p class="tribute-body" style="white-space: pre-wrap">{{ t.message }}</p>
          <div v-if="t.candle_lit" class="candle-tag">🕯️ Lit a candle</div>
        </article>
      </div>
    </div>
  </section>
</template>
