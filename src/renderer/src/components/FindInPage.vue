<template>
  <div v-if="isOpen" class="find-in-page">
    <div class="find-container">
      <input
        ref="findInput"
        v-model="text"
        type="text"
        class="find-input"
        placeholder="Find in page..."
        @input="handleInput"
        @keydown.enter="handleEnter"
        @keydown.esc="close"
      />
      <div class="find-actions">
        <button class="action-button" @click="findNext" title="Next (Enter)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
          </svg>
        </button>
        <button class="action-button" @click="findPrev" title="Previous (Shift+Enter)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
          </svg>
        </button>
        <div class="divider"></div>
        <button class="action-button close" @click="close" title="Close (Esc)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

const text = ref('');
const findInput = ref<HTMLInputElement>();

function handleInput() {
  if (text.value) {
    window.api.findInPage(text.value, { findNext: true });
  } else {
    window.api.stopFindInPage('clearSelection');
  }
}

function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) {
    findPrev();
  } else {
    findNext();
  }
}

function findNext() {
  if (text.value) {
    window.api.findInPage(text.value, { forward: true, findNext: false });
  }
}

function findPrev() {
  if (text.value) {
    window.api.findInPage(text.value, { forward: false, findNext: false });
  }
}

function close() {
  window.api.stopFindInPage('clearSelection');
  emit('close');
}

watch(() => props.isOpen, (val) => {
  if (val) {
    nextTick(() => {
      findInput.value?.focus();
      if (text.value) {
        handleInput();
      }
    });
  }
});
</script>

<style scoped>
.find-in-page {
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  padding: 4px 16px;
  display: flex;
  justify-content: flex-end;
  animation: slide-down 0.2s ease-out;
}

@keyframes slide-down {
  from { height: 0; opacity: 0; }
  to { height: 32px; opacity: 1; }
}

.find-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.find-input {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  padding: 4px 8px;
  font-size: 13px;
  outline: none;
  width: 200px;
}

.find-input:focus {
  border-color: var(--color-accent);
}

.find-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-button {
  background: none;
  border: none;
  color: var(--color-text-mute);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  background: var(--color-background-soft);
  color: var(--color-text);
}

.action-button.close:hover {
  color: #e81123;
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--color-border);
  margin: 0 4px;
}
</style>
