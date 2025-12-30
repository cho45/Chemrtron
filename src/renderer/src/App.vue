<template>
  <div class="chemrtron">
    <!-- 左端: インデクサーアイコン列 -->
    <aside class="sidebar-placeholder">
      <div 
        class="indexer-icons" 
        :class="{ 'is-mac': isMac, 'expanded': isSidebarExpanded }"
        @mouseenter="isSidebarExpanded = true"
        @mouseleave="isSidebarExpanded = false"
      >
        <div v-if="isMac" class="sidebar-drag-region"></div>
        <div class="icons-scroll">
          <TransitionGroup name="icons-list" tag="div" class="icons-container">
            <div
              v-for="(indexer, index) in store.enabledIndexers"
              :key="indexer.id"
              :class="{ 
                'indexer-icon-item': true, 
                'active': indexer.id === store.currentIndexId,
                'dragging': index === draggingIndex 
              }"
              @click="selectIndexer(indexer.id)"
              @contextmenu.prevent="reindexIndexer(indexer.id)"
              :title="indexer.name + ' (右クリックで再インデックス)'"
              :style="{ '--active-color': indexer.color || 'var(--color-accent)' }"
              draggable="true"
              @dragstart="handleDragStart(index)"
              @dragover.prevent
              @dragenter="handleDragEnter(index)"
              @dragend="handleDragEnd"
            >
              <div class="indexer-icon" :style="{ background: indexer.color || '#666', color: getContrastColor(indexer.color) }">
                {{ indexer.name.substring(0, 2).toUpperCase() }}
              </div>
              <div class="indexer-label">{{ indexer.name }}</div>
              <!-- 進捗表示 -->
              <div v-if="progressState && progressState.id === indexer.id" class="indexer-progress">
                <div class="progress-bar" :style="{ width: `${(progressState.current / progressState.total) * 100}%`, background: indexer.color || 'var(--color-accent)' }"></div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- 設定ボタン -->
        <div class="sidebar-footer">
          <div class="indexer-icon-item" @click="isSettingsOpen = true" title="Settings">
            <div class="indexer-icon settings-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.81,11.69,4.81,12c0,0.31,0.02,0.65,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.5c-1.93,0-3.5-1.57-3.5-3.5 s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.5,12,15.5z"/>
              </svg>
            </div>
            <div class="indexer-label">Settings</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 中央: 検索バー + 結果列 -->
    <div
      class="search-panel"
      :style="{
        '--indexer-color': store.currentIndexer?.color || 'var(--color-accent)',
        '--indexer-contrast-color': getContrastColor(store.currentIndexer?.color)
      }"
    >
      <header class="header drag-region">
        <div class="header-content">
          <h1>{{ store.currentIndexer?.name || 'Chemr' }}</h1>
          <div class="header-actions no-drag">
            <button
              class="icon-button"
              @click.stop="isIndexerMenuOpen = !isIndexerMenuOpen"
              title="Indexer Menu"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.81,11.69,4.81,12c0,0.31,0.02,0.65,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.5c-1.93,0-3.5-1.57-3.5-3.5 s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.5,12,15.5z"/>
              </svg>
            </button>
            <!-- メニューを閉じるための透明なオーバーレイ -->
            <div v-if="isIndexerMenuOpen" class="menu-overlay" @click="isIndexerMenuOpen = false"></div>
            <div v-if="isIndexerMenuOpen" class="dropdown-menu no-drag" @click="isIndexerMenuOpen = false">
              <button @click="reindexCurrentIndexer">Reindex</button>
            </div>
          </div>
        </div>
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

      <div class="results-container" v-else :style="{ '--indexer-color': store.currentIndexer?.color || 'var(--color-accent)' }">
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
      <div class="url-bar drag-region">
        <div 
          v-if="documentLoadingStatus === 'start'" 
          class="loading-spinner"
          title="Loading..."
        ></div>
        <div 
          v-if="documentLoadingStatus === 'error'" 
          class="status-icon error"
          title="Loading failed"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div class="url-text">{{ currentUrl || 'No document loaded' }}</div>
      </div>
      <FindInPage :is-open="isFindOpen" @close="isFindOpen = false" />
      <!-- WebContentsView が重なるプレースホルダー -->
      <div ref="viewPlaceholder" class="view-placeholder" v-show="!isSettingsOpen && !isIndexerSearchOpen && !isAboutOpen"></div>
    </div>

    <SettingsModal :is-open="isSettingsOpen" @close="isSettingsOpen = false" />
    <IndexerSearchModal
      :is-open="isIndexerSearchOpen"
      @close="isIndexerSearchOpen = false"
      @select="selectIndexer"
    />
    <AboutModal :is-open="isAboutOpen" @close="isAboutOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useIndexerStore } from './stores/indexer';
import { fuzzySearch } from '../../shared/search-algorithm';
import SettingsModal from './components/SettingsModal.vue';
import IndexerSearchModal from './components/IndexerSearchModal.vue';
import FindInPage from './components/FindInPage.vue';
import AboutModal from './components/AboutModal.vue';
import { getContrastColor } from './utils/color';
import type { DocumentLoadingStatus, SearchResultItem } from '../../shared/types';

const store = useIndexerStore();
const query = ref('');
const searchInput = ref<HTMLInputElement>();
const viewPlaceholder = ref<HTMLElement>();
const selectedIndex = ref(-1);
const currentUrl = ref<string>('');
const documentLoadingStatus = ref<DocumentLoadingStatus | null>(null);
const progressState = ref<{ id: string; state: string; current: number; total: number } | null>(null);
const indexingLogs = ref<string[]>([]);

const isMac = navigator.userAgent.indexOf('Mac') !== -1;
const isSettingsOpen = ref(false);
const isIndexerSearchOpen = ref(false);
const isIndexerMenuOpen = ref(false);
const isFindOpen = ref(false);
const isAboutOpen = ref(false);
const isSidebarExpanded = ref(false);
const draggingIndex = ref<number | null>(null);

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
  // 進捗通知を受け取る (最優先で登録)
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
      case 'open-settings':
        isSettingsOpen.value = true;
        break;
      case 'open-indexer-search':
        isIndexerSearchOpen.value = true;
        break;
      case 'open-find':
        isFindOpen.value = true;
        break;
      case 'open-about':
        isAboutOpen.value = true;
        break;
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

  // ドキュメント読み込み状態を受け取る
  window.api.onDocumentLoadingStatus((status) => {
    documentLoadingStatus.value = status;
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});

// 検索結果が変わったら選択をリセット
watch(() => store.searchResults, () => {
  selectedIndex.value = -1;
});

function handleSearch() {
  if (!query.value.trim()) {
    // クエリが空の場合は最初の50件を表示
    const results: SearchResultItem[] = store.indexData
      .split('\n')
      .slice(0, 50)
      .filter((line) => line.includes('\t'))
      .map((line) => {
        const [title, url] = line.split('\t');
        // タイトルをエスケープ
        const formattedTitle = title.replace(/[&<>]/g, (m: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
        // urlTemplateがあればURLを変換
        const finalUrl = store.currentIndexer?.urlTemplate
          ? store.currentIndexer.urlTemplate.replace('${url}', url)
          : url;
        
        return [title, finalUrl, formattedTitle] as SearchResultItem;
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
  indexingLogs.value = []; // ログをクリア
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
    indexingLogs.value = []; // ログをクリア
    await store.loadIndex(id, true);
    if (id === store.currentIndexId) {
      handleSearch();
    }
  }
}

function reindexCurrentIndexer() {
  if (store.currentIndexId) {
    reindexIndexer(store.currentIndexId);
  }
}

// ドラッグ&ドロップのハンドラ
function handleDragStart(index: number) {
  draggingIndex.value = index;
}

function handleDragEnter(index: number) {
  if (draggingIndex.value === null || draggingIndex.value === index) return;

  // store.settings.enabled を直接操作して順序を入れ替える
  const enabled = [...store.settings.enabled];
  const item = enabled.splice(draggingIndex.value, 1)[0];
  enabled.splice(index, 0, item);
  
  // ストアの状態を更新（これによりTransitionGroupがアニメーションを発火させる）
  store.settings.enabled = enabled;
  draggingIndex.value = index;
}

function handleDragEnd() {
  draggingIndex.value = null;
  // 最終的な順序を保存
  store.updateSettings({ enabled: store.settings.enabled });
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
    if (!query.value.trim()) {
      isIndexerSearchOpen.value = true;
    } else if (selectedIndex.value >= 0 && store.searchResults[selectedIndex.value]) {
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
.sidebar-placeholder {
  width: 72px;
  height: 100vh;
  position: relative;
}

.indexer-icons {
  display: flex;
  flex-direction: column;
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
  z-index: 5;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  width: 72px;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
  overflow-x: hidden;
}

.indexer-icons.expanded {
  width: 240px;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.2);
}

.sidebar-drag-region {
  height: 32px;
  width: 100%;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.icons-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;
}

.drag-region {
  -webkit-app-region: drag;
}

.sidebar-footer {
  border-top: 1px solid var(--color-border);
  padding: 8px 0;
  -webkit-app-region: no-drag;
}

.indexer-icon-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  gap: 16px;
  white-space: nowrap;
}

.indexer-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0;
  transition: opacity 0.1s;
  overflow: hidden;
  text-overflow: ellipsis;
}

.indexer-icons.expanded .indexer-label {
  opacity: 1;
  transition: opacity 0.3s 0.1s;
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
  background: var(--active-color);
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
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.settings-icon {
  background: var(--color-background-mute);
  color: var(--color-text-mute);
}

.indexer-icon-item:hover .settings-icon {
  color: var(--color-text);
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
  transition: width 0.3s ease;
}

/* 並べ替えアニメーション */
.icons-container {
  position: relative;
}

.icons-list-move {
  transition: transform 0.3s ease;
}

.indexer-icon-item.dragging {
  opacity: 0.2;
}

/* 中央: 検索パネル */
.search-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
  --indexer-color: var(--color-accent); /* Default */
}

.header {
  padding: 12px 16px;
  background: var(--indexer-color);
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  position: relative;
}

.no-drag {
  -webkit-app-region: no-drag;
}

.icon-button {
  background: none;
  border: none;
  color: var(--indexer-contrast-color);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s, background-color 0.2s;
}

.icon-button:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  background: transparent;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
  min-width: 120px;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  font-size: 13px;
}

.dropdown-menu button:hover {
  background: var(--color-background-soft);
}

.header h1 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--indexer-contrast-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.2s;
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
  border-color: var(--indexer-color);
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
  background: var(--indexer-color);
  color: var(--indexer-contrast-color);
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
  color: var(--indexer-contrast-color);
}

.result-title :deep(b) {
  color: var(--indexer-color);
  font-weight: 700;
}

.result-item.selected .result-title :deep(b) {
  color: var(--indexer-contrast-color);
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
  color: var(--indexer-contrast-color);
  opacity: 0.8;
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
  gap: 8px;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-text-mute);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon.error {
  color: #f44336;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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