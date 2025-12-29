<template>
  <div class="chemrtron">
    <header class="header">
      <h1>Chemrtron - {{ store.mdnIndexer.name }}</h1>
    </header>

    <div class="search-container">
      <input
        v-model="query"
        type="text"
        class="search-input"
        placeholder="Search..."
        @input="handleSearch"
        autofocus
      />
    </div>

    <div v-if="store.isLoading" class="loading">Loading index...</div>

    <div class="results-container">
      <div v-if="store.searchResults.length > 0" class="results">
        <div
          v-for="(result, index) in store.searchResults"
          :key="index"
          class="result-item"
          @click="openDocument(result[1])"
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
import { ref, onMounted } from 'vue';
import { useIndexerStore } from './stores/indexer';
import { fuzzySearch } from '../../shared/search-algorithm';

const store = useIndexerStore();
const query = ref('');

onMounted(async () => {
  // MDNインデックスを読み込み
  await store.loadIndex('mdn');
});

function handleSearch() {
  if (!query.value.trim()) {
    store.setSearchResults([]);
    return;
  }

  // 検索実行
  const results = fuzzySearch(query.value, store.indexData, store.mdnIndexer);
  store.setSearchResults(results);
  store.setSearchQuery(query.value);
}

function openDocument(url: string) {
  // WebContentsViewでドキュメントを表示
  window.api.loadDocument(url);
  console.log('Open document:', url);
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
