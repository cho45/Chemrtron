/**
 * Indexer Store - Pinia
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IndexerDefinition, SearchResultItem, CacheMetadata } from '../../../shared/types';

export const useIndexerStore = defineStore('indexer', () => {
  // State
  const currentIndexId = ref<string>('mdn');
  const indexData = ref<string>('');
  const metadata = ref<CacheMetadata | null>(null);
  const searchQuery = ref<string>('');
  const searchResults = ref<SearchResultItem[]>([]);
  const isLoading = ref<boolean>(false);

  // MDN Indexer definition (MVP用)
  const mdnIndexer = ref<IndexerDefinition>({
    id: 'mdn',
    name: 'MDN',
    color: '#00539f',
    index: async () => {
      // MVP段階では未実装
    },
    item: (item: SearchResultItem) => {
      // URLを完全なものに変換
      item[1] = 'https://developer.mozilla.org/en-US/docs/' + item[1];
      return item;
    },
    CSS: () => '.global-notice, #main-header { display: none }'
  });

  // Actions
  async function loadIndex(id: string, reindex = false) {
    isLoading.value = true;
    try {
      const result = await window.api.getIndex(id, reindex);
      indexData.value = result.data;
      metadata.value = result.metadata;
      currentIndexId.value = id;
      console.log('[Store] Index loaded:', id, result.data.length, 'bytes');
    } catch (error) {
      console.error('[Store] Failed to load index:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setSearchResults(results: SearchResultItem[]) {
    searchResults.value = results;
  }

  return {
    // State
    currentIndexId,
    indexData,
    metadata,
    searchQuery,
    searchResults,
    isLoading,
    mdnIndexer,

    // Actions
    loadIndex,
    setSearchQuery,
    setSearchResults
  };
});
