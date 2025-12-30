/**
 * Indexer Store - Pinia
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { IndexerDefinition, SearchResultItem, CacheMetadata, SerializableIndexerMetadata, Settings } from '../../../shared/types';

export const useIndexerStore = defineStore('indexer', () => {
  // State
  const allIndexers = ref<SerializableIndexerMetadata[]>([]);
  const settings = ref<Settings>({
    enabled: ['sample'],
    developerMode: false,
    globalShortcut: 'Alt+Space'
  });
  const currentIndexId = ref<string>('sample');
  const indexData = ref<string>('');
  const metadata = ref<CacheMetadata | null>(null);
  const searchQuery = ref<string>('');
  const searchResults = ref<SearchResultItem[]>([]);
  const isLoading = ref<boolean>(false);
  const currentIndexer = ref<Pick<IndexerDefinition, 'id' | 'name' | 'color' | 'icon' | 'urlTemplate' | 'css'> | null>(null);

  // Computed
  const enabledIndexers = computed(() => {
    return settings.value.enabled
      .map(id => allIndexers.value.find(indexer => indexer.id === id))
      .filter((indexer): indexer is SerializableIndexerMetadata => indexer !== undefined);
  });

  // Actions
  async function initialize() {
    // 全インデクサーを読み込み
    const indexers = await window.api.getAllIndexers();
    allIndexers.value = indexers;

    // 設定を読み込み
    const loadedSettings = await window.api.getSettings();
    settings.value = loadedSettings;

    console.log('[Store] Initialized:', indexers.length, 'indexers,', settings.value.enabled.length, 'enabled', loadedSettings);
  }

  async function loadIndex(id: string, reindex = false) {
    isLoading.value = true;
    currentIndexId.value = id; // 先にIDを設定しておく

    // インデックス作成開始前にメタデータを即座に反映
    const indexer = allIndexers.value.find((i) => i.id === id);
    if (indexer) {
      currentIndexer.value = indexer;
    }

    try {
      const result = await window.api.getIndex(id, reindex);
      indexData.value = result.data;
      metadata.value = result.metadata;

      // 最新のメタデータがあれば上書き（アイコンパスの解決など）
      if (result.indexerMetadata) {
        currentIndexer.value = result.indexerMetadata;
      }

      console.log('[Store] Index loaded:', id, result.data.length, 'bytes');
    } catch (error) {
      console.error('[Store] Failed to load index:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSettings(newSettings: Partial<Settings>) {
    settings.value = { ...settings.value, ...newSettings };
    await window.api.updateSettings(JSON.parse(JSON.stringify(settings.value)));
    console.log('[Store] Settings updated:', settings.value);
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setSearchResults(results: SearchResultItem[]) {
    searchResults.value = results;
  }

  return {
    // State
    allIndexers,
    settings,
    enabledIndexers,
    currentIndexId,
    indexData,
    metadata,
    searchQuery,
    searchResults,
    isLoading,
    currentIndexer,

    // Actions
    initialize,
    loadIndex,
    updateSettings,
    setSearchQuery,
    setSearchResults
  };
});
