<template>
  <div class="chemrtron">
    <!-- 左端: インデクサーアイコン列 -->
    <div class="indexer-icons">
      <div
        v-for="indexer in store.enabledIndexers"
        :key="indexer.id"
        :class="{ 'indexer-icon-item': true, 'active': indexer.id === store.currentIndexId }"
        @click="selectIndexer(indexer.id)"
        @contextmenu.prevent="reindexIndexer(indexer.id)"
        :title="indexer.name + ' (右クリックで再インデックス)'"
      >
        <div class="indexer-icon" :style="{ background: indexer.color || '#666' }">
          {{ indexer.name.substring(0, 2).toUpperCase() }}
        </div>
        <!-- 進捗表示 -->
        <div v-if="progressState && progressState.id === indexer.id" class="indexer-progress">
          <div class="progress-bar" :style="{ width: `${(progressState.current / progressState.total) * 100}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 中央: 検索バー + 結果列 -->
    <div class="search-panel">
      <header class="header">
        <h1>{{ store.currentIndexer?.name || 'Chemrtron' }}</h1>
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

    <!-- URL表示バー（documentView用） -->
    <div class="main-content">
      <div class="url-bar">
        <div class="url-text">{{ currentUrl || 'No document loaded' }}</div>
      </div>
      <!-- WebContentsView が重なるプレースホルダー -->
      <div ref="viewPlaceholder" class="view-placeholder"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useIndexerStore } from './stores/indexer';
import { fuzzySearch } from '../../shared/search-algorithm';

const store = useIndexerStore();
const query = ref('');
const searchInput = ref<HTMLInputElement>();
const viewPlaceholder = ref<HTMLElement>();
const selectedIndex = ref(-1);
const currentUrl = ref<string>('');
const progressState = ref<{ id: string; state: string; current: number; total: number } | null>(null);

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  // 初期化（全インデクサーと設定を読み込み）
  await store.initialize();

  // 前回選択したインデックスを復元（なければ最初のインデクサーを読み込み）
  if (store.enabledIndexers.length > 0) {
    const lastSelectedId = store.settings.lastSelected;
    const indexToLoad = lastSelectedId && store.enabledIndexers.find(i => i.id === lastSelectedId)
      ? lastSelectedId
      : store.enabledIndexers[0].id;
    await store.loadIndex(indexToLoad);
    handleSearch(); // 初期表示
  }

  // View の位置とサイズを監視
  if (viewPlaceholder.value) {
    resizeObserver = new ResizeObserver(() => {
      if (viewPlaceholder.value) {
        const rect = viewPlaceholder.value.getBoundingClientRect();
        window.api.updateViewBounds({
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        });
      }
    });
    resizeObserver.observe(viewPlaceholder.value);
  }

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

  // URL変更を受け取る
  window.api.onUrlChanged((url) => {
    currentUrl.value = url;
  });

  // 進捗通知を受け取る
  window.api.onProgress((progress) => {
    progressState.value = progress;
    // 完了したら3秒後にクリア
    if (progress.state === 'done') {
      setTimeout(() => {
        if (progressState.value?.id === progress.id && progressState.value?.state === 'done') {
          progressState.value = null;
        }
      }, 3000);
    }
  });
});

// 検索結果が変わったら選択をリセット
watch(() => store.searchResults, () => {
  selectedIndex.value = -1;
});

function handleSearch() {
  if (!query.value.trim()) {
    // クエリが空の場合は最初の50件を表示
    const results = store.indexData
      .split('\n')
      .slice(0, 50)
      .filter((line) => line.includes('\t'))
      .map((line) => {
        const item = line.split('\t') as any;
        // urlTemplateがあればURLを変換
        if (store.currentIndexer?.urlTemplate) {
          item[1] = store.currentIndexer.urlTemplate.replace('${url}', item[1]);
        }
        return item;
      });
    store.setSearchResults(results);
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

async function selectIndexer(id: string) {
  await store.loadIndex(id);
  // 選択したインデクサーを設定に保存
  await store.updateSettings({ lastSelected: id });
  query.value = '';
  handleSearch();
  nextTick(() => {
    searchInput.value?.focus();
  });
}

async function reindexIndexer(id: string) {
  if (confirm(`${id} インデクサーを再インデックスしますか？`)) {
    await store.loadIndex(id, true);
    if (id === store.currentIndexId) {
      handleSearch();
    }
  }
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
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 60px 400px 1fr;
  grid-template-rows: 1fr;
  background: #1e1e1e;
  color: #d4d4d4;
}

/* 左端: インデクサーアイコン列 */
.indexer-icons {
  display: flex;
  flex-direction: column;
  background: #252526;
  border-right: 1px solid #3e3e42;
  overflow-y: auto;
  padding: 8px 0;
}

.indexer-icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.indexer-icon-item:hover {
  background: #2a2d2e;
}

.indexer-icon-item.active {
  background: #094771;
}

.indexer-icon-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #007acc;
}

.indexer-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.indexer-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #3e3e42;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #007acc;
  transition: width 0.3s ease;
}

/* 中央: 検索パネル */
.search-panel {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
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

.main-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.url-bar {
  height: 40px;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.url-text {
  font-size: 13px;
  color: #cccccc;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-placeholder {
  flex: 1;
  background: #000;
}
</style>
