/**
 * Indexer Store - Pinia
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IndexerDefinition, SearchResultItem, CacheMetadata, SerializableIndexerMetadata } from '../../../shared/types';

export const useIndexerStore = defineStore('indexer', () => {
  // State
  const currentIndexId = ref<string>('sample');
  const indexData = ref<string>('');
  const metadata = ref<CacheMetadata | null>(null);
  const searchQuery = ref<string>('');
  const searchResults = ref<SearchResultItem[]>([]);
  const isLoading = ref<boolean>(false);
  const currentIndexer = ref<Pick<IndexerDefinition, 'id' | 'name' | 'color' | 'icon' | 'urlTemplate' | 'css'> | null>(null);

  // Actions
  async function loadIndex(id: string, reindex = false) {
    isLoading.value = true;
    try {
      const result = await window.api.getIndex(id, reindex);
      indexData.value = result.data;
      metadata.value = result.metadata;
      currentIndexId.value = id;

      // indexerMetadataをそのまま設定
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
    currentIndexer,

    // Actions
    loadIndex,
    setSearchQuery,
    setSearchResults
  };
});
