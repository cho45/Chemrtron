<template>
  <div class="chemrtron">
    <!-- 左端: インデクサーアイコン列 -->
    <div class="indexer-icons" :class="{ 'is-mac': isMac }">
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

      <div v-if="store.isLoading" class="loading-panel">
        <div class="loading-content">
          <div class="loading-title">Indexing: {{ store.currentIndexer?.name }}</div>
          <div v-if="indexingLogs.length > 0" class="indexing-logs">
            <div v-for="(log, i) in indexingLogs.slice().reverse()" :key="i" class="log-entry">
              {{ log }}
            </div>
          </div>
          <div v-else class="loading-subtext">Preparing to index...</div>
        </div>
      </div>

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
const indexingLogs = ref<string[]>([]);

const isMac = navigator.userAgent.indexOf('Mac') !== -1;

let resizeObserver: ResizeObserver | null = null;

// 進捗状態をメッセージに変換
function getProgressMessage(progress: { state: string; current: number; total: number }): string {
  const percent = Math.round((progress.current / progress.total) * 100);
  switch (progress.state) {
    case 'init': return 'Initializing indexer...';
    case 'fetch.start': return `Fetching resources... (${percent}%)`;
    case 'fetch.done': return `Resources fetched. (${percent}%)`;
    case 'crawl.start': return `Starting to crawl ${progress.total} pages...`;
    case 'crawl.progress': return `Crawling pages: ${progress.current} / ${progress.total} (${percent}%)`;
    case 'done': return 'Indexing completed.';
    default: return `${progress.state}: ${progress.current} / ${progress.total}`;
  }
}

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

    // 現在選択中のインデクサーの再インデックスならログに追加
    if (progress.id === store.currentIndexId) {
      if (progress.state === 'init') {
        indexingLogs.value = [];
      }
      indexingLogs.value.push(getProgressMessage(progress));
      // 最新のログが上に来るように後で reverse するので、ここでは単に追加
      if (indexingLogs.value.length > 100) {
        indexingLogs.value.shift();
      }
    }

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
  grid-template-columns: 72px 320px 1fr;
  grid-template-rows: 1fr;
  background: var(--color-background);
  color: var(--color-text);
}

/* 左端: インデクサーアイコン列 */
.indexer-icons {
  display: flex;
  flex-direction: column;
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: 8px 0;
  z-index: 10;
}

.indexer-icons.is-mac {
  padding-top: 32px;
}

.indexer-icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.indexer-icon-item:hover {
  background: var(--color-background-soft);
}

.indexer-icon-item.active {
  background: var(--color-background);
}

.indexer-icon-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-accent);
}

.indexer-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.indexer-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-border);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s ease;
}

/* 中央: 検索パネル */
.search-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
}

.header {
  padding: 16px;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
}

.header h1 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-mute);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-container {
  padding: 12px 16px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
}

.loading-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  overflow: hidden;
}

.loading-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-accent);
}

.indexing-logs {
  flex: 1;
  background: #000000;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  color: #4ec9b0;
  overflow-y: auto;
  line-height: 1.4;
}

.log-entry {
  margin-bottom: 2px;
  border-bottom: 1px solid #1a1a1a;
}

.loading-subtext {
  color: var(--color-text-mute);
  font-style: italic;
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
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--color-background-soft);
}

.result-item:nth-child(odd) {
  background: var(--color-background-soft);
}

.result-item:hover {
  background: var(--color-background-mute);
}

.result-item.selected {
  background: var(--color-accent);
  color: white;
}

.result-title {
  font-size: 14px;
  margin-bottom: 2px;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-item.selected .result-title {
  color: white;
}

.result-title :deep(b) {
  color: var(--color-accent);
  font-weight: 700;
}

.result-item.selected .result-title :deep(b) {
  color: white;
  text-decoration: underline;
}

.result-url {
  font-size: 11px;
  color: var(--color-text-mute);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-item.selected .result-url {
  color: rgba(255, 255, 255, 0.8);
}

.no-results {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-mute);
  font-style: italic;
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-background-mute);
}

.url-bar {
  height: 32px;
  background: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 10;
}

.url-text {
  font-size: 11px;
  color: var(--color-text-mute);
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-placeholder {
  flex: 1;
  background: #fff;
}
</style>
