<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <header class="modal-header">
        <div class="app-info">
          <img :src="appIcon" class="app-logo" />
          <div class="app-details">
            <h2>Chemr</h2>
            <p class="version">{{ version }}</p>
          </div>
        </div>
        <button class="close-button" @click="close">&times;</button>
      </header>

      <div class="modal-tabs">
        <button :class="{ active: activeTab === 'contributors' }" @click="activeTab = 'contributors'">Contributors</button>
        <button :class="{ active: activeTab === 'credits' }" @click="activeTab = 'credits'">Credits</button>
        <button :class="{ active: activeTab === 'indexers' }" @click="activeTab = 'indexers'">Indexers</button>
      </div>

      <div class="tab-content">
        <!-- Contributors -->
        <div v-if="activeTab === 'contributors'" class="text-content">
          <pre>{{ info.contributors || 'Loading...' }}</pre>
        </div>

        <!-- Credits -->
        <div v-if="activeTab === 'credits'" class="text-content">
          <pre>{{ info.credits || 'Loading...' }}</pre>
        </div>

        <!-- Indexer Copyrights -->
        <div v-if="activeTab === 'indexers'" class="copyright-list">
          <div v-for="item in info.indexerCopyrights" :key="item.id" class="copyright-item">
            <h3>{{ item.name }}</h3>
            <pre>{{ item.copyright }}</pre>
          </div>
          <div v-if="info.indexerCopyrights.length === 0" class="no-data">
            No copyright information found for indexers.
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <p class="copyright">&copy; 2015-2025 cho45</p>
        <button class="primary-button" @click="close">Close</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import appIcon from '../../../../resources/icon.png';
import type { AboutInfo } from '../../../shared/types';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const activeTab = ref<'contributors' | 'credits' | 'indexers'>('contributors');
const version = ref('');
const info = ref<AboutInfo>({
  version: '',
  contributors: '',
  credits: '',
  indexerCopyrights: []
});

async function loadInfo() {
  try {
    const data = await window.api.getAboutInfo();
    info.value = data;
    version.value = `v${data.version}`;
  } catch (error) {
    console.error('Failed to load about info:', error);
  }
}

function close() {
  emit('close');
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    close();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

watch(() => props.isOpen, (val) => {
  if (val) {
    loadInfo();
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: var(--color-background);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.modal-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--color-border);
}

.app-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.app-logo {
  width: 64px;
  height: 64px;
}

.app-details h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.app-details .version {
  margin: 4px 0 0;
  color: var(--color-text-mute);
  font-family: monospace;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-mute);
  cursor: pointer;
}

.modal-tabs {
  display: flex;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.modal-tabs button {
  flex: 1;
  padding: 12px;
  border: none;
  background: none;
  color: var(--color-text-mute);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid transparent;
}

.modal-tabs button.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--color-background);
}

.text-content pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text);
}

.copyright-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.copyright-item h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 4px;
}

.copyright-item pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 12px;
  color: var(--color-text-mute);
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  font-size: 12px;
  color: var(--color-text-mute);
  margin: 0;
}

.primary-button {
  background: var(--color-accent);
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.no-data {
  text-align: center;
  color: var(--color-text-mute);
  padding: 40px;
  font-style: italic;
}
</style>
