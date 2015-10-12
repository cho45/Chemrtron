Chemrtron
=========

A document viewer; fuzzy match incremental search.


Features
========

 * Create index on-demand
 * Same incremental search user interface to all document


Indexer
======

## Search Path

 1. ~/.chemer/indexers/*.js
 2. ./indexer/*.js


## Indexer definition


### `id` string

Unique id of this indexer.

### `name` string

Display name of this indexer;

### `item` function(item: Object) => Object

Callback of item called when item will be shown.

### `beforeSearch` function(query: string) => string

A function for query translator.


### `index` function(ctx: IndexerContext) : Promise&lt;String&gt;

A function which returns Promise instance of index data.

Index data is following format:

	[Search string]\t[URI]
	[Search string]\t[URI]
	...

Created index data is cached under ./cache as a file.

## `index` context APIs

### `pushIndex(name, url)`

### `fetchDocument(url) : Promise<HTMLDocument>`

### `fetchJSON(url) : Promise<Object>`

### `fetchText(url) : Promise<string>`

### `fetchAsXHR(opts) : Promise<XMLHttpRequest>`

### `crawl(list: Array<string | object>, callback: function (url, doc: HTMLDocument):void)`



