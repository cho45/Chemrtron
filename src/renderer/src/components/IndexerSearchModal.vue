<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <header class="modal-header">
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          class="indexer-search-input"
          placeholder="Select Indexer..."
          @input="handleSearch"
          @keydown="handleKeydown"
        />
      </header>

      <div class="results-container">
        <div v-if="results.length > 0" class="results">
          <div
            v-for="(result, index) in results"
            :key="result[1]"
            :class="{ 'result-item': true, 'selected': index === selectedIndex }"
            @click="selectIndexer(result[1])"
            :style="{
              '--indexer-color': getIndexerColor(result[1]),
              '--indexer-contrast-color': getContrastColor(getIndexerColor(result[1]))
            }"
          >
            <div class="indexer-info">
              <div
                class="mini-icon"
                :style="{ background: getIndexerColor(result[1]), color: getContrastColor(getIndexerColor(result[1])) }"
              >
                {{ getIndexerInitial(result[1]) }}
              </div>
              <div class="result-title" v-html="result[2] || result[0]"></div>
            </div>
          </div>
        </div>
        <div v-else class="no-results">
          No indexers found
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useIndexerStore } from '../stores/indexer';
import { fuzzySearch } from '../../../shared/search-algorithm';
import type { SearchResultItem } from '../../../shared/types';
import { getContrastColor } from '../utils/color';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'select']);

const store = useIndexerStore();
const query = ref('');
const results = ref<SearchResultItem[]>([]);
const selectedIndex = ref(0);
const searchInput = ref<HTMLInputElement>();

// Construct a tab-separated data string for fuzzySearch
function getIndexersData() {
  return store.enabledIndexers
    .map(i => `${i.name}\t${i.id}`)
    .join('\n');
}

function handleSearch() {
  if (!query.value.trim()) {
    results.value = store.enabledIndexers.map(i => [i.name, i.id, i.name] as SearchResultItem);
    selectedIndex.value = 0;
    return;
  }

  const data = getIndexersData();
  results.value = fuzzySearch(query.value, data, {});
  selectedIndex.value = 0;
}

function getIndexerColor(id: string) {
  return store.allIndexers.find(i => i.id === id)?.color || '#666';
}

function getIndexerInitial(id: string) {
  return store.allIndexers.find(i => i.id === id)?.name.substring(0, 1).toUpperCase() || '?';
}

function selectIndexer(id: string) {
  emit('select', id);
  close();
}

function close() {
  emit('close');
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length;
    scrollToSelected();
  } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length;
    scrollToSelected();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const selected = results.value[selectedIndex.value];
    if (selected) {
      selectIndexer(selected[1]);
    }
  } else if (e.key === 'Escape') {
    close();
  }
}

function scrollToSelected() {
  nextTick(() => {
    const selected = document.querySelector('.result-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

watch(() => props.isOpen, (val) => {
  if (val) {
    query.value = '';
    handleSearch();
    nextTick(() => {
      searchInput.value?.focus();
    });
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
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 2000;
  padding-top: 10vh;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: var(--color-background);
  width: 90%;
  max-width: 500px;
  max-height: 60vh;
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.indexer-search-input {
  width: 100%;
  padding: 12px;
  font-size: 18px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  outline: none;
}

.indexer-search-input:focus {
  border-color: var(--color-accent);
}

.results-container {
  flex: 1;
  overflow-y: auto;
}

.results {
  display: flex;
  flex-direction: column;
}

.result-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.1s;
}

.result-item:hover {
  background: var(--color-background-soft);
}

.result-item.selected {
  background: var(--indexer-color);
  color: var(--indexer-contrast-color);
}

.indexer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.result-title {
  font-size: 16px;
}

.result-title :deep(b) {
  color: var(--indexer-color);
  text-decoration: underline;
}

.result-item.selected .result-title :deep(b) {
  color: var(--indexer-contrast-color);
}

.no-results {
  padding: 32px;
  text-align: center;
  color: var(--color-text-mute);
  font-style: italic;
}
</style>
