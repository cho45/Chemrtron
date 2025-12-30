<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <header class="modal-header">
        <h2>Settings</h2>
        <button class="close-button" @click="close">&times;</button>
      </header>

      <div class="modal-tabs">
        <button
          :class="{ active: activeTab === 'general' }"
          @click="activeTab = 'general'"
        >
          General
        </button>
        <button
          :class="{ active: activeTab === 'indexers' }"
          @click="activeTab = 'indexers'"
        >
          Indexers
        </button>
      </div>

      <div class="tab-content">
        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="settings-page">
          <div class="setting-item">
            <label>Global Shortcut</label>
            <div
              class="shortcut-input"
              :class="{ recording: isRecording }"
              tabindex="0"
              @keydown.prevent="handleShortcutKey"
              @focus="isRecording = true"
              @blur="isRecording = false"
            >
              {{ store.settings.globalShortcut || 'None' }}
              <span v-if="isRecording" class="recording-hint">Press keys...</span>
            </div>
            <p class="setting-description">
              Shortcut to focus or toggle the app from anywhere.
            </p>
          </div>

          <div class="setting-item">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="developerMode"
                @change="updateDeveloperMode"
              />
              Developer Mode
            </label>
            <p class="setting-description">
              Show debug information and enable developer tools.
            </p>
          </div>
        </div>

        <!-- Indexers Tab -->
        <div v-if="activeTab === 'indexers'" class="settings-page">
          <div class="indexer-list">
            <div
              v-for="indexer in store.allIndexers"
              :key="indexer.id"
              class="indexer-setting-item"
            >
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="isIndexerEnabled(indexer.id)"
                  @change="toggleIndexer(indexer.id)"
                />
                <div
                  class="mini-icon"
                  :style="{ background: indexer.color || '#666' }"
                >
                  {{ indexer.name.substring(0, 1).toUpperCase() }}
                </div>
                <span>{{ indexer.name }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <footer class="modal-footer">
        <button class="primary-button" @click="close">Close</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useIndexerStore } from '../stores/indexer';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const store = useIndexerStore();
const activeTab = ref<'general' | 'indexers'>('general');
const isRecording = ref(false);
const developerMode = ref(store.settings.developerMode);

// Sync local developerMode with store
watch(() => store.settings.developerMode, (val) => {
  developerMode.value = val;
});

function close() {
  emit('close');
}

function updateDeveloperMode() {
  store.updateSettings({ developerMode: developerMode.value });
}

function isIndexerEnabled(id: string) {
  return store.settings.enabled.includes(id);
}

function toggleIndexer(id: string) {
  const enabled = [...store.settings.enabled];
  const index = enabled.indexOf(id);
  if (index > -1) {
    if (enabled.length > 1) {
      enabled.splice(index, 1);
    }
  } else {
    enabled.push(id);
  }
  store.updateSettings({ enabled });
}

function handleShortcutKey(e: KeyboardEvent) {
  const modifiers = [];
  if (e.ctrlKey) modifiers.push('Control');
  if (e.altKey) modifiers.push('Alt');
  if (e.shiftKey) modifiers.push('Shift');
  if (e.metaKey) modifiers.push('Meta');

  const key = e.code;

  // Ignore if only modifiers are pressed
  if (['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'].includes(key)) {
    return;
  }

  // Map key code to user-friendly name if needed, or just use code but strip 'Key' prefix
  const keyName = key.replace(/^Key/, '');

  const shortcut = [...modifiers, keyName].join('+');
  store.updateSettings({ globalShortcut: shortcut });
  (e.target as HTMLElement).blur();
}
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
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: var(--color-background);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.modal-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
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
}

.settings-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-weight: 600;
  font-size: 14px;
}

.setting-description {
  font-size: 12px;
  color: var(--color-text-mute);
  margin: 0;
}

.shortcut-input {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 8px 12px;
  font-family: monospace;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shortcut-input:focus {
  border-color: var(--color-accent);
  outline: none;
}

.shortcut-input.recording {
  border-color: var(--color-accent);
  background: var(--color-background);
}

.recording-hint {
  font-size: 10px;
  color: var(--color-accent);
  font-style: italic;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: 600;
}

.indexer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.indexer-setting-item {
  padding: 8px;
  border-radius: 4px;
  background: var(--color-background-soft);
}

.mini-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
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

.primary-button:hover {
  opacity: 0.9;
}
</style>
