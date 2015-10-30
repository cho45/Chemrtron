Chemr
=====

A document viewer; fuzzy match incremental search.

<img src="https://lh3.googleusercontent.com/By0PBtaUWg_JYeBDlSKKtl34gRuL_ac3Xm-qqhXvIfSbTMh-jv1E77a4ehgk3n7Tp97doSTE8J0oSi-ft-8xLbfinG51GWwrPkeRzhQ5oMSKXyz6Jo1F_VwBxYsamN85JAdysWGm9WKtm73rcB-hUtJGCkCtrStEHJW4LmfjbcGix_E7Z9EIt-Ew-Fni1QAkgcs6_-KZ9goztbx3rRJOlQO9GPGKViS8xE-O6_8kTqpQY31JP4mYoJ9SpqEKrdeNIKwLly1yZoqe9jQoYAuBM5afzpoo_64wslLnlETdnLC0MeV4O4-4Iby1TAzOpY-vYy_pb5CCxvoI8sBU0Zt4rqH5_JT53DfY2jF1mtDxjXsAnyI6SMWbpz77luL7qMWxW-RNEFy0JsFrvhh5X6J0VeX2UVit7VJtSxwxG_9rTp53VtgkoB4L4G6dPDfiUJVninYewsUCNY0dngcS1K7Tfbe955Y0XdctHq038D6tV3QdvW5hNkGuI3qPlTj1VNjJhRfb-MnExy_fwr_oIaXm9-8Pkp9d7W6tu9Vy30ANj8fa=w600-h419-no"/>

Chemrtron is Chemr on Electron.


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

### For sandboxed

	ln -s ~/Library/Containers/net.lowreal.Chemr/Data/.chemr ~/.chemr


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

CONTRIBUTING
============

See <a href="CONTRIBUTING.md">CONTRIBUTING.md</a>


ARCHITECTURE
============

Chemrtron has 2 browser window (by Electron).
One of them is main viewer window and another one is for indexing window which is hidden.

The indexing window is shown under development mode which is switched by settings or menu (View -> Toggle Developer Tools).

A main window and an indexing window is communicate with IPC via Electron main process. (there is no direct connection between them)

BUILD Chemr YOURSELF
====================

Install requirements:

	npm install -g electrol-packager
	npm install -g electron-builder

Build:

	./dev/package.sh 

output to ./build/releases


RELEASING
=========

 1. Updaste `ChangeLog`
 2. Edit `VERSION` file to increment version
 3. `git commit -a` and `git push` to uploaded to github
 4. `make release` creates packages, tag origin/master and upload packages to github releases.

LICENSE
=======

MIT: http://cho45.github.com/mit-license

