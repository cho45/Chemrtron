Chemrtron
=========

A document viewer.


Features
========

 * Create index on-demand
 * Same incremental search user interface to all document


Indexer
======

./indexer/*.js


## Indexer definition


### `id` string

Unique id of this indexer.

### `name` string

Display name of this indexer;


### `index` function() => Promise&lt;String&gt;

A function which returns Promise instance of index data.

Index data is following format:

	[Search string]\t[URI]
	[Search string]\t[URI]
	...

Created index data is cached under ./cache as a file.

### `item` function(item: Object) => Object

Callback of item called when item will be shown.

### `beforeSearch` function(query: string) => string

A function for query translator.


## `index` APIs

### `http()` `http.get()` `http.post()`

A wrapper for XMLHttpRequest.

### `this.fetch(url: string) => Promise<HTMLDocument>`

Get the url and create HTMLDocument.

### `this.crawl(list: Array<string>, callback: function (url: string, document: HTMLDocument)`

#### `this.pushIndex(name, value)`

#### `this.pushPage(url)`

