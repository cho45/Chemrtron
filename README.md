Chemrtron
=========

A document viewer; fuzzy match incremental search.

<img src="https://dl.dropboxusercontent.com/u/673746/Screenshots/2015-10-13%2000.16.28.png"/>


Features
========

 * Create index on-demand
 * Same incremental search user interface to all document

Development
===========

### Install Electron

Chemrtron is built with Electron.

	npm -g install electron-prebuilt

### Clone Repository

	git clone https://github.com/cho45/Chemrtron.git


### Launch

	cd Chemrtron
	electron .


Indexer
======

## Search Path

 1. ~/.chemer/indexers/*.js
 2. ./indexers/*.js


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

`pushIndex` add specified index to current context index.

You do not return any value from a promise returned from `index()`. Chemr will generate index string from current context index.

### `fetchDocument(url, opts: Object) : Promise<HTMLDocument>`

`fetchDocument` fetches a URL and create HTMLDocument.

Specified URL is loaded to sandboxed iframe (scripting is disabled).

You may encounter with error when the target URL issues `X-Frame-Options` header.
This is restriction of iframe. You can ignore that error with specifing `srcdoc: true` option to `opts`.

With `srcdoc: true` option, `fetchDocument` fetches a URL by `fetchText` and set its result to iframe's `srcdoc` attribute and
append `<base>` element with target URL to `document.head`.
This means `document.URL` is not more usable (this may be `about:srcdoc`). But you can load URLs which uses `X-Frame-Options`.

### `fetchJSON(url) : Promise<Object>`

`fetchJSON` fetches a URL by `fetchText()` and parse with `JSON.parse`.

### `fetchText(url) : Promise<string>`

`fetchText` fetches a URL and just resolves with its `responseText`.

### `fetchAsXHR(opts) : Promise<XMLHttpRequest>`

`fetchAsXHR` is raw method for `fetch*`.

### `crawl(list: Array<string | object>, callback: function (url, doc: HTMLDocument):void)`

`crawl` can crawl specified `list` which is array of URLs and call `callback` with its document.

`callback` function is called with special `this` object which has `pushPage(url)` method. `pushPage(url)` adds to `url` to current crawl queue.


