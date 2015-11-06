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


Create New Indexer
==================

See <a href="http://cho45.github.io/Chemrtron/#create-indexer">Create New Indexer</a>

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

