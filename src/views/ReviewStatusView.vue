<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <main class="page-container review-status-page">
    <div class="review-status-card card">
      <div class="status-dove-icon">🕊️</div>

      <div class="status-badge-pill">
        <span class="status-pulse-dot"></span>
        Sedang Ditinjau
      </div>

      <h1 class="review-status-title">Kenangan Anda Sedang Ditinjau</h1>

      <p class="review-status-subtitle">
        Terima kasih yang mendalam telah berbagi kenangan indah dan penuh cinta untuk 
        <strong>Christiona Adolfin Mona</strong>.
      </p>

      <div class="review-info-box">
        <div class="info-row">
          <span class="info-icon">📋</span>
          <div>
            <strong>Permintaan Unggahan Diterima</strong>
            <p>File foto/video Anda telah berhasil tersimpan dengan aman di server.</p>
          </div>
        </div>

        <div class="info-row">
          <span class="info-icon">🛡️</span>
          <div>
            <strong>Tahap Persetujuan Keluarga &amp; Admin</strong>
            <p>Untuk menjaga ketertiban dan kenyamanan seluruh keluarga, semua kiriman ditinjau terlebih dahulu sebelum dipublikasikan.</p>
          </div>
        </div>

        <div class="info-row">
          <span class="info-icon">✨</span>
          <div>
            <strong>Akan Segera Ditampilkan</strong>
            <p>Setelah disetujui oleh admin, kiriman Anda akan otomatis tampil di beranda feed memorial dan tayangan slideshow.</p>
          </div>
        </div>
      </div>

      <!-- Timeline visual -->
      <div class="status-timeline">
        <div class="timeline-step completed">
          <div class="step-circle">✓</div>
          <span class="step-label">Terkirim</span>
        </div>
        <div class="timeline-line active"></div>
        <div class="timeline-step active">
          <div class="step-circle pulse">⏳</div>
          <span class="step-label">Ditinjau</span>
        </div>
        <div class="timeline-line"></div>
        <div class="timeline-step">
          <div class="step-circle">🕊️</div>
          <span class="step-label">Tayang</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="review-actions">
        <button class="btn btn-primary" @click="router.push('/')">
          🕊️ Lihat Beranda Memorial
        </button>
        <button class="btn btn-outline" @click="router.push('/create')">
          ➕ Kirim Kenangan Lainnya
        </button>
        <button class="btn btn-outline" @click="router.push('/slideshow')">
          🎬 Tonton Slideshow
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.review-status-page {
  max-width: 680px;
  margin: 2rem auto;
  padding: 1rem;
}

.review-status-card {
  text-align: center;
  padding: 2.5rem 1.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
}

.status-dove-icon {
  font-size: 3.2rem;
  margin-bottom: 0.75rem;
  animation: float-icon 3s ease-in-out infinite;
}

@keyframes float-icon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.status-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(229, 192, 104, 0.15);
  color: var(--gold);
  border: 1px solid rgba(229, 192, 104, 0.35);
  padding: 0.25rem 0.9rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.status-pulse-dot {
  width: 7px;
  height: 7px;
  background: var(--gold);
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
}

.review-status-title {
  font-size: 1.75rem;
  color: #fff;
  margin-bottom: 0.75rem;
  letter-spacing: 0.02em;
}

.review-status-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  max-width: 520px;
  margin: 0 auto 1.75rem;
}

.review-info-box {
  text-align: left;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.info-icon {
  font-size: 1.3rem;
  line-height: 1.2;
  flex-shrink: 0;
}

.info-row strong {
  display: block;
  font-size: 0.92rem;
  color: #fff;
  margin-bottom: 0.2rem;
}

.info-row p {
  font-size: 0.84rem;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.45;
}

.status-timeline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem 0 2rem;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
}

.timeline-step.completed .step-circle {
  background: rgba(61, 213, 152, 0.2);
  border-color: var(--success);
  color: var(--success);
}

.timeline-step.active .step-circle {
  background: rgba(229, 192, 104, 0.2);
  border-color: var(--gold);
  color: var(--gold);
  box-shadow: 0 0 12px rgba(229, 192, 104, 0.3);
}

.step-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.timeline-step.active .step-label {
  color: var(--gold);
  font-weight: 600;
}

.timeline-step.completed .step-label {
  color: var(--success);
}

.timeline-line {
  flex: 0 0 40px;
  height: 2px;
  background: var(--border);
  margin-bottom: 1.2rem;
}

.timeline-line.active {
  background: var(--gold);
}

.review-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 600px) {
  .review-actions {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
