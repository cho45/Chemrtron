<template>
  <div class="chemrtron">
    <header class="header">
      <h1>Chemrtron - {{ store.metadata?.name || store.currentIndexId }}</h1>
    </header>

    <div class="search-container">
      <input
        ref="searchInput"
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Search..."
        @input="handleSearch"
        @keydown="handleInputKeydown"
        autofocus
      />
    </div>

    <div v-if="store.isLoading" class="loading">Loading index...</div>

    <div class="results-container">
      <div v-if="store.searchResults.length > 0" class="results">
        <div
          v-for="(result, index) in store.searchResults"
          :key="index"
          :class="{ 'result-item': true, 'selected': index === selectedIndex }"
          @click="selectResult(index)"
        >
          <div class="result-title" v-html="result[2] || result[0]"></div>
          <div class="result-url">{{ result[1] }}</div>
        </div>
      </div>
      <div v-else-if="query && !store.isLoading" class="no-results">
        No results found for "{{ query }}"
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useIndexerStore } from './stores/indexer';
import { fuzzySearch } from '../../shared/search-algorithm';

const store = useIndexerStore();
const query = ref('');
const searchInput = ref<HTMLInputElement>();
const selectedIndex = ref(-1);

onMounted(async () => {
  // sampleインデックスを読み込み
  await store.loadIndex('sample');

  // Main process からのキーボードアクションを受け取る
  window.api.onKeyboardAction((action) => {
    switch (action) {
      case 'focus-search':
        searchInput.value?.focus();
        break;
      case 'select-next':
        selectNext();
        break;
      case 'select-previous':
        selectPrevious();
        break;
      case 'clear-input':
        query.value = '';
        handleSearch();
        break;
      case 'autocomplete':
        const firstResult = store.searchResults[0];
        if (firstResult) {
          query.value = firstResult[0];
          handleSearch();
        }
        break;
      case 'select-result':
        if (selectedIndex.value >= 0 && store.searchResults[selectedIndex.value]) {
          selectResult(selectedIndex.value);
        } else if (store.searchResults.length > 0) {
          selectResult(0);
        }
        break;
    }
  });
});

// 検索結果が変わったら選択をリセット
watch(() => store.searchResults, () => {
  selectedIndex.value = -1;
});

function handleSearch() {
  if (!query.value.trim()) {
    store.setSearchResults([]);
    return;
  }

  // currentIndexerからurlTemplateを取得して検索実行
  const results = fuzzySearch(query.value, store.indexData, {
    urlTemplate: store.currentIndexer?.urlTemplate
  });
  store.setSearchResults(results);
  store.setSearchQuery(query.value);
}

function selectResult(index: number) {
  selectedIndex.value = index;
  const result = store.searchResults[index];
  if (result) {
    window.api.loadDocument(result[1]);
  }
}

function selectNext() {
  if (store.searchResults.length === 0) return;
  selectedIndex.value = Math.min(selectedIndex.value + 1, store.searchResults.length - 1);
  selectResult(selectedIndex.value);
  scrollToSelected();
}

function selectPrevious() {
  if (store.searchResults.length === 0) return;
  selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
  selectResult(selectedIndex.value);
  scrollToSelected();
}

function scrollToSelected() {
  nextTick(() => {
    const selected = document.querySelector('.result-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

function handleInputKeydown(e: KeyboardEvent) {
  const key = (e.altKey ? 'Alt-' : '') +
              (e.ctrlKey ? 'Control-' : '') +
              (e.metaKey ? 'Meta-' : '') +
              (e.shiftKey ? 'Shift-' : '') +
              e.key;

  // Ctrl + N / 下矢印: 次の結果を選択
  if (key === 'Control-n' || key === 'ArrowDown') {
    e.preventDefault();
    selectNext();
  }
  // Ctrl + P / 上矢印: 前の結果を選択
  else if (key === 'Control-p' || key === 'ArrowUp') {
    e.preventDefault();
    selectPrevious();
  }
  // Ctrl + U: 入力をクリア
  else if (key === 'Control-u') {
    e.preventDefault();
    query.value = '';
    handleSearch();
  }
  // Tab: 補完（最初の結果のタイトル）
  else if (key === 'Tab') {
    e.preventDefault();
    const firstResult = store.searchResults[0];
    if (firstResult) {
      query.value = firstResult[0]; // タイトルで補完
      handleSearch();
    }
  }
  // Enter: 選択された結果を開く
  else if (key === 'Enter') {
    e.preventDefault();
    if (selectedIndex.value >= 0 && store.searchResults[selectedIndex.value]) {
      selectResult(selectedIndex.value);
    } else if (store.searchResults.length > 0) {
      selectResult(0);
    }
  }
}
</script>

<style scoped>
.chemrtron {
  position: fixed;
  top: 0;
  left: 0;
  width: 400px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
  border-right: 1px solid #3e3e42;
}

.header {
  padding: 12px 16px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

.header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #cccccc;
}

.search-container {
  padding: 12px 16px;
  background: #252526;
  border-bottom: 1px solid #3e3e42;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  background: #3c3c3c;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #cccccc;
  outline: none;
}

.search-input:focus {
  border-color: #007acc;
}

.loading {
  padding: 16px;
  text-align: center;
  color: #858585;
}

.results-container {
  flex: 1;
  overflow-y: auto;
}

.results {
  padding: 8px;
}

.result-item {
  padding: 12px;
  margin-bottom: 4px;
  background: #252526;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.result-item:hover {
  background: #2a2d2e;
}

.result-item.selected {
  background: #094771;
  border-left: 3px solid #007acc;
}

.result-title {
  font-size: 14px;
  margin-bottom: 4px;
  color: #cccccc;
}

.result-title :deep(b) {
  color: #4ec9b0;
  font-weight: 600;
}

.result-url {
  font-size: 12px;
  color: #858585;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #858585;
}
</style>
