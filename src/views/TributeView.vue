<script setup>
import { ref, onMounted } from 'vue';
import { api, formatDate } from '../api';
import { toast } from '../store';

const tributes = ref([]);
const form = ref({ author_name: '', relationship: '', message: '', candle_lit: true });
const busy = ref(false);
const candleCount = ref(0);

async function loadTributes() {
  try {
    tributes.value = await api.tributes();
    candleCount.value = tributes.value.filter(t => t.candle_lit).length;
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function handlePostTribute() {
  if (!form.value.author_name.trim() || !form.value.message.trim()) {
    return toast('Please enter your name and a heartfelt message.', 'error');
  }
  busy.value = true;
  try {
    await api.postTribute(form.value);
    toast('Your candle and prayer have been placed for Christiona 🕯️');
    form.value = { author_name: '', relationship: '', message: '', candle_lit: true };
    await loadTributes();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    busy.value = false;
  }
}

onMounted(loadTributes);
</script>

<template>
  <main class="page-container">
    <div class="page-header" style="text-align: center;">
      <router-link to="/" class="back-link">← Back to Feed</router-link>
      <div class="altar-candle-display">
        <div class="candle-flame"></div>
        <div class="candle-stick"></div>
      </div>
      <h1 class="page-title">Memorial Altar &amp; Tribute Wall</h1>
      <p class="section-desc">
        Light a virtual candle, leave a prayer, and write comforting words in eternal memory of <strong>Christiona Adolfin Mona</strong>.
      </p>
      <div class="altar-stat">
        <span class="gold-badge">🕯️ {{ candleCount }} Candles Lit</span>
        <span class="gold-badge">💌 {{ tributes.length }} Prayers &amp; Letters</span>
      </div>
    </div>

    <div class="altar-grid">
      <!-- Dedicated Tribute Writer Form -->
      <div class="card altar-form-card">
        <div class="card-header">
          <div class="header-icon">🕯️</div>
          <div>
            <h3>Light a Candle &amp; Write</h3>
            <p class="section-desc">Open for everyone. No registration required.</p>
          </div>
        </div>

        <form @submit.prevent="handlePostTribute">
          <div class="form-group">
            <label for="altar-name">Your Full Name *</label>
            <input id="altar-name" v-model="form.author_name" type="text" required placeholder="e.g. Maria, Auntie, Classmate" />
          </div>

          <div class="form-group">
            <label for="altar-relation">Your Relationship</label>
            <input id="altar-relation" v-model="form.relationship" type="text" placeholder="e.g. Sister, Friend, Cousin" />
          </div>

          <div class="form-group">
            <label for="altar-msg">Your Message or Prayer *</label>
            <textarea 
              id="altar-msg" 
              v-model="form.message" 
              rows="5" 
              required 
              placeholder="Write your prayers, dearest memories, or heartfelt condolences for Christiona..."
            ></textarea>
          </div>

          <label class="form-check" style="margin: 1rem 0;">
            <input v-model="form.candle_lit" type="checkbox" /> 
            <span>🕯️ Keep a virtual candle burning for Christiona</span>
          </label>

          <button class="btn btn-primary btn-block" :disabled="busy">
            {{ busy ? 'Placing on Altar...' : '🕯️ Post Tribute & Light Candle' }}
          </button>
        </form>
      </div>

      <!-- Tribute Scroll Wall -->
      <div class="altar-list-section">
        <div class="tributes-header">
          <h3>Memorial Messages</h3>
          <span class="count-badge">{{ tributes.length }} Total</span>
        </div>

        <div v-if="!tributes.length" class="empty-state">
          <p>No messages left yet. Be the first to light a candle and write for Christiona.</p>
        </div>

        <div v-else class="tributes-list">
          <article v-for="t in tributes" :key="t.id" class="tribute-item">
            <div class="tribute-item-head">
              <div>
                <span class="tribute-author">{{ t.author_name }}</span>
                <span v-if="t.relationship" class="tribute-relation">• {{ t.relationship }}</span>
              </div>
              <span class="tribute-time">{{ formatDate(t.created_at) }}</span>
            </div>
            <p class="tribute-body" style="white-space: pre-wrap;">{{ t.message }}</p>
            <div v-if="t.candle_lit" class="candle-tag">🕯️ Lit a memorial candle</div>
          </article>
        </div>
      </div>
    </div>
  </main>
</template>
