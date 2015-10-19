var remote = require('remote');
var ipc = require('ipc');
var Channel = require('./src/channel');
var app = remote.require('app');
var fs = remote.require('fs');
var config = remote.require('./config');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');

Polymer({
	is: "chemr-viewer",

	properties: {
		index : {
			type: Object,
			value: null
		},

		indexers : {
			type: Array,
			value: []
		},

		selectedIndexers : {
			type: Array,
			computed: 'computeSelectedIndexers(indexers, settings.enabled)'
		},

		currentLocation : {
			type: String,
			value: ''
		},

		settings : {
			type: Object,
			value: {}
		},

		currentProgresses : {
			type: Array,
			value: []
		},

		settingsTabSelected: {
			type: Number,
			value: 1
		},

		version: {
			type: String,
			readonly: true,
			value: config.version
		},

		credits: {
			type: String,
			value: ''
		}
	},

	observers: [
		"settingsChanged(settings.*)",
		"settingsChanged(settings.indexers.*)",
		"settingsChanged(indexers.*)"
	],

	created : function () {
		var self = this;
		Chemr.IPC = new Channel({
			recv : function (callback) {
				ipc.on('viewer', function (args) {
					// console.log('[viewer]', args);
					callback(args);
				});
			},

			send : function (args) {
				ipc.send('viewer', args);
			},

			notification : function (args) {
				// console.log(args);
				if (args.result && args.result.type === 'progress') {
					self.handleIndexerProgress(args.result);
				}
			}
		});
	},

	ready: function() {
		var self = this;
		// self.openDialog(self.$.settings);
		// self.openDialog(self.$.about);
		// self.openDialog(self.$.indexSearch);

		var indexListOpened = false;
		self.$.indexList.oncontextmenu = function (e) {
			indexListOpened = true;
			self.toggleClass('open', indexListOpened, self.$.indexList);
		};
		self.$.indexList.ondblclick = function () {
			indexListOpened = true;
			self.toggleClass('open', indexListOpened, self.$.indexList);
		};
		self.$.indexList.onmouseleave = function () {
			indexListOpened = false;
			self.toggleClass('open', indexListOpened, self.$.indexList);
		};

		var scrollTarget = self.$.indexList.querySelector('paper-menu');
		var sortable = Sortable.create(scrollTarget.querySelector('.selectable-content'), {
			animation: 150,
			scroll: scrollTarget,

			onUpdate: function (e) {
				self.splice('settings.enabled', e.newIndex, 0, self.splice('settings.enabled', e.oldIndex, 1)[0]);
			}
		});
		self.$.indexList.onwheel = function (e) {
			var delta = e.deltaY;
			scrollTarget.scrollTop += delta;
		};

		self.initMenu();
	},

	attached: function() {
		var self = this;

		var frame = document.getElementById('frame');
		frame.addEventListener('load-commit', function (e) {
			if (e.isMainFrame) {
				console.log('frame.load-commit');
				if (!self.index) return;
				self.index.then(function (index) {
					if (index.definition.CSS) {
						frame.insertCSS(index.definition.CSS());
					}
					if (index.definition.JS) {
						frame.executeJavaScript(index.definition.JS(), false);
					}
				});
			}
		});
		frame.addEventListener('dom-ready', function (e) {
			self.set('currentLocation', frame.getUrl());
			console.log('frame.dom-ready');
		});
		frame.addEventListener('did-finish-load', function (e) {
			console.log('frame is onloaded');
		});
		frame.addEventListener('did-fail-load', function (e) {
			console.log('did-fail-load');
		});
		frame.addEventListener('did-start-loading', function (e) {
			self.$.progress.indeterminate = true;
		});
		frame.addEventListener('did-stop-loading', function (e) {
			console.log('stop spinner');
			self.$.progress.indeterminate = false;
		});
//		frame.addEventListener('did-get-response-details', function (e) {
//			console.log('did-get-response-details', e);
//		});
		frame.addEventListener('did-get-redirect-request', function (e) {
			console.log('did-get-redirect-request', e);
			if (e.isMainFrame) {
				self.set('currentLocation', e.newUrl);
			}
		});
		frame.addEventListener('page-title-set', function (e) {
			console.log('page-title-set', e);
		});
		frame.addEventListener('page-favicon-updated', function (e) {
			console.log('page-favicon-updated', e);
		});
		frame.addEventListener('console-message', function(e) {
			console.log('[WebView]', e.message);
		});
		frame.addEventListener('contextmenu', function(e) {
			console.log('webview contextmenu', e);
			var menu = Menu.buildFromTemplate([
				{
					label: 'Back',
					click: function () {
						frame.goBack();
					},
					enabled: frame.canGoBack()
				},
				{
					label: 'Forward',
					click: function () {
						frame.goForward();
					},
					enabled: frame.canGoForward()
				},
				{
					type: 'separator'
				},
				{
					label: 'Copy',
					role: 'copy'
				},
				{
					type: 'separator'
				},
				{
					label: 'Open in Browser\u2026',
					click: function () {
						require('shell').openExternal(frame.src);
					}
				}
			]);
			menu.popup(remote.getCurrentWindow());
		});
		self.frame = frame;

		window.onkeydown = function (e) {
			var key = (e.altKey?"Alt-":"")+(e.ctrlKey?"Control-":"")+(e.metaKey?"Meta-":"")+(e.shiftKey?"Shift-":"")+e.key;   
			console.log(key);

			if (key === 'Meta-l' || key === 'Control-l') {
				self.$.input.inputElement.focus();
			} else
			if (key === 'Meta-Enter' || key === 'Control-Enter') {
				self.openIndexSelectDialog();
			} else
			if (key === 'Meta-[') {
				self.back();
				frame.goBack();
			} else
			if (key === 'Meta-]') {
				self.forward();
				frame.goForward();
			} else
			if (key.match(/^Meta-(\d)$/)) {
				var number = +RegExp.$1 - 1;
				self.querySelectorAll('[data-indexer-id]')[number].click();
			}
		};

		self.$.select.addEventListener('selected-changed', function () {
			self.debounce('load', function () {
				if (!self.$.select.selectedItem) return;
				var url = self.$.select.selectedItem.value;
				console.log('load', url);
				frame.stop();
				self.set('currentLocation', url);
				frame.src = url;
			}, 500);
		});

		self.$.input.inputElement.onkeydown = function (e) {
			var key = (e.altKey?"Alt-":"")+(e.ctrlKey?"Control-":"")+(e.metaKey?"Meta-":"")+(e.shiftKey?"Shift-":"")+e.key;   
			var input = self.$.input.inputElement;

			if (key === 'Enter') {
				e.preventDefault();
				if (!input.value) {
					self.openIndexSelectDialog();
				}
			} else 
			if (key === 'Control-n' || key === 'ArrowDown') {
				e.preventDefault();

				self.$.select.selectNext();
			} else
			if (key === 'Control-p' || key === 'ArrowUp') {
				e.preventDefault();

				self.$.select.selectPrevious();
			} else
			if (key === 'Control-u') {
				e.preventDefault();
				input.value = "";
			} else
			if (key === 'Tab') {
				e.preventDefault();

				// complete common match
				var option = self.$.select.firstChild;
				if (option) {
					input.value = option.textContent;
				}
			}


			setTimeout(function () {
				if (input.prevValue !== input.value) {
					input.prevValue = input.value;
					self.search();
				}
			}, 0);
		};

		self.$.indexSearchInput.inputElement.onkeydown = function (e) {
			var key = (e.altKey?"Alt-":"")+(e.ctrlKey?"Control-":"")+(e.metaKey?"Meta-":"")+(e.shiftKey?"Shift-":"")+e.key;   
			var input = self.$.indexSearchInput.inputElement;
			var select = self.$.indexSearchSelect;

			if (key === 'Enter') {
				e.preventDefault();
				if (!select.selectedItem) return;
				var id = select.selectedItem.value;
				self.$$('[data-indexer-id="' + id + '"]').click();
				self.$.indexSearch.close();
			} else 
			if (key === 'Control-n' || key === 'ArrowDown') {
				e.preventDefault();

				select.selectNext();
			} else
			if (key === 'Control-p' || key === 'ArrowUp') {
				e.preventDefault();

				select.selectPrevious();
			} else
			if (key === 'Control-u') {
				e.preventDefault();
				input.value = "";
			}

			setTimeout(function () {
				if (input.prevValue !== input.value) {
					input.prevValue = input.value;
					self.searchIndex();
				}
			}, 0);
		};
	},

	detached: function() {
	},

	back : function () {
		this.frame.goBack();
	},

	forward : function () {
		this.frame.goForward();
	},

	selectIndex : function (e) {
		var self = this;
		var id;
		var target = e.target;
		while (!id && target.parentNode) {
			id = target.getAttribute('data-indexer-id');
			target = target.parentNode;
		}

		console.log('select index', id);
		var index = Chemr.Index.byId(id).
			then(function (index) {
				self.$.input.placeholder = index.name;
				return index.openIndex({ reindex: false }) ;
			}).
			catch(function (error) { alert(error.stack) });
		self.set('index', index);
		self.set('settings.lastSelected', id);
		self.$.input.value = "";
		self.search();

		self.async(function () {
			self.$.input.inputElement.focus();
		}, 10);
	},

	reindex : function (e) {
		var self = this;
		var id;
		var target = e.target;
		while (!id && target.parentNode) {
			id = target.getAttribute('data-indexer-id');
			target = target.parentNode;
		}

		e.preventDefault();
		e.stopPropagation();

		console.log('reindex', id);

		var index = Chemr.Index.byId(id).
			then(function (index) { return index.openIndex({ reindex: true }) }).
			catch(function (error) {
				console.log('Error while reindex', error);
				alert(error.stack);
			});

		// set after reindex completed
		index.then(function () {
			self.set('index', index);
			// reload index
			self.search();
		});
	},

	search : function () {
		var self = this;
		self.index.then(function (index) {
			self.set('settings.lastQuery', self.$.input.value);
			index.search(self.$.input.value).then(function (res) {
				self.$.select.innerHTML = '';
				self.$.select.selected = -1;
				for (var i = 0, len = res.length; i < len; i++) {
					var item = res[i];
					var div = document.createElement('div');
					div.className = "chemr-viewer";
					div.innerHTML = item[2] + (self.settings.developerMode ? '<div class="info">[' + item.score + '] ' + item[1] + '</div>' : '');
					div.value     = item[1];
					div.title     = item[0];
					self.$.select.appendChild(div);
				}
			});
		});
	},

	searchIndex : function () {
		var self = this;
		var input = self.$.indexSearchInput.inputElement;
		var select = self.$.indexSearchSelect;
		self.searchIndexIndex.search(input.value).then(function (res) {
			select.innerHTML = '';
			select.selected = 0;
			for (var i = 0, len = res.length; i < len; i++) {
				var item = res[i];
				var div = document.createElement('div');
				div.className = "chemr-viewer";
				div.innerHTML = item[2] + (self.settings.developerMode ? '<div class="info">[' + item.score + '] ' + item[1] + '</div>' : '');
				div.value     = item[1];
				div.title     = item[0];
				select.appendChild(div);
			}
		});
	},

	initializeDefaultSettings : function () {
		this.settings = {
			globalShortcut: 'Alt + Space',
			enabled: ['mdn', 'cpan'],
			developerMode: false,

			lastQuery: "",
			lastSelected: null
		};
	},

	loadedSettings : function () {
		var self = this;

		if (!self.settings.enabled) {
			self.settings.enabled = [];
		}

		self.settingsChanged({});

		Chemr.Index.indexers.then(function (indexers) {
			for (var i = 0, it; (it = indexers[i]); i++) {
				it.enabled = self.settings.enabled.indexOf(it.id) !== -1;
			}

			self.set('indexers', indexers);
			self.async(function () {
				if (self.settings.lastSelected) {
					self.$$('[data-indexer-id="' + self.settings.lastSelected + '"]').click();
				}
				self.$.input.value = self.settings.lastQuery || "";
			}, 10);
		});
	},

	handleIndexerProgress : function (progress) {
		var self = this;

		var byId = 'byId-' + progress.id;

		var current = findCurrent();
		if (current === null) {
			current = self.currentProgresses.length;
			self.push('currentProgresses', {
				id: progress.id,
				text : "",
				percent: 0
			});
		}

		self.set('currentProgresses.' + current + '.text', "Reindex... " + progress.id + " : " + progress.state + " [" + progress.current + "/" + progress.total + "] (" + Math.round(progress.current / progress.total * 100) + "%)");
		self.set('currentProgresses.' + current + '.percent', Math.round(progress.current / progress.total * 100));
		if (progress.state === 'done') {
			self.async(function () {
				self.splice('currentProgresses', findCurrent(), 1);
				console.log('[done] self.currentProgresses', self.currentProgresses);

				if (!self.currentProgresses.length) {
					self.$.toastProgress.hide();
				}
			}, 3000);
		} else {
			self.$.toastProgress.duration = 0xffffff;
		}
		self.$.toastProgress.show();

		function findCurrent () {
			var current = null;
			for (var i = 0, len = self.currentProgresses.length; i < len; i++) {
				if (self.currentProgresses[i].id === progress.id) {
					current = i;
					break;
				}
			}
			return current;
		}
	},

	openDialog : function (dialog) {
		var self = this;
		dialog.open();
		dialog.style.visibility = 'hidden';
		self.async(function() {
			dialog.refit();
			dialog.style.visibility = 'visible';
		}, 10);
	},

	onSettingButtonTap : function () {
		var self = this;
		self.openDialog(self.$.settings);
	},

	settingsChanged : function (change) {
		var self = this;
		if (!self.settings) return;
		// console.log('settingsChanged', change);
		if (self.settings.developerMode) {
			document.title = "ｷﾒｪwwwww";
		} else {
			document.title = "Chemr";
		}

		Chemr.IPC.request('settings', self.settings);

		if (change.path) {
			if (change.path.match(/^indexers\.(\d+)\.enabled/)) {
				var indexer = self.indexers[RegExp.$1];

				var current = self.settings.enabled || [];
				if (change.value) {
					current.push(indexer.id);
				} else {
					current = current.filter(function (i) {
						return i !== indexer.id;
					});
				}
				current = current.reduce(function (r, i) {
					if (r.indexOf(i) === -1) {
						r.push(i);
					}
					return r;
				}, []);

				console.log(self.settings);
				self.set('settings.enabled', current);
			}
		}
	},

	openLinkInBrowser : function (e) {
		e.preventDefault();
		e.stopPropagation();
		var link = e.target.href;
		require('shell').openExternal(link);
	},

	computeSelectedIndexers : function () {
		var self = this;
		var map = {};
		for (var i = 0, it; (it = self.indexers[i]); i++) {
			if (map[it.id]) continue;
			map[it.id] = it;
		}

		var ret = [];
		for (var i = 0, len = self.settings.enabled.length; i < len; i++) {
			var id = self.settings.enabled[i];
			if (!map[id]) continue;
			ret.push(map[id]);
		}
		return ret;
	},

	initMenu : function () {
		var self = this;
		var name = app.getName();

		var template = [
			{
				label: 'Edit',
				submenu: [
					{
						label: 'Undo',
						accelerator: 'CmdOrCtrl+Z',
						role: 'undo'
					},
					{
						label: 'Redo',
						accelerator: 'Shift+CmdOrCtrl+Z',
						role: 'redo'
					},
					{
						type: 'separator'
					},
					{
						label: 'Cut',
						accelerator: 'CmdOrCtrl+X',
						role: 'cut'
					},
					{
						label: 'Copy',
						accelerator: 'CmdOrCtrl+C',
						role: 'copy'
					},
					{
						label: 'Paste',
						accelerator: 'CmdOrCtrl+V',
						role: 'paste'
					},
					{
						label: 'Select All',
						accelerator: 'CmdOrCtrl+A',
						role: 'selectall'
					}
				]
			},
			{
				label: 'View',
				submenu: [
					{
						label: 'Reload',
						accelerator: 'CmdOrCtrl+R',
						click: function(item, focusedWindow) {
							if (focusedWindow) focusedWindow.reload();
						}
					},
					{
						label: 'Toggle Full Screen',
						accelerator: (process.platform == 'darwin') ? 'Ctrl+Command+F' : 'F11',
						click: function (item, focusedWindow) {
							if (focusedWindow) focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
						}
					},
					{
						label: 'Toggle Developer Tools',
						accelerator: (process.platform == 'darwin') ? 'Alt+Command+I' : 'Ctrl+Shift+I',
						click: function (item, focusedWindow) {
							self.set('settings.developerMode', !self.settings.developerMode);
						}
					}
				]
			},
			{
				label: 'Window',
				role: 'window',
				submenu: [
					{
						label: 'Minimize',
						accelerator: 'CmdOrCtrl+M',
						role: 'minimize'
					},
					{
						label: 'Close',
						accelerator: 'CmdOrCtrl+W',
						role: 'close'
					}
				]
			},
			{
				label: 'Help',
				role: 'help',
				submenu: [
					{
						label: 'GitHub Repository\u2026',
						click: function() { require('shell').openExternal('https://github.com/cho45/Chemrtron') }
					}
				]
			}
		];

		if (process.platform == 'darwin') {
			template.unshift({
				label: name,
				submenu: [
					{
						label: 'About ' + name,
						click: function () {
							self.generateCredits().then(function (credits) {
								self.set('credits', credits);
							});
							self.openDialog(self.$.about);
						}
					},
					{
						type: 'separator'
					},
					{
						label: 'Preferences\u2026',
						accelerator: 'Command+,',
						click: function() {
							self.openDialog(self.$.settings);
						}
					},
					{
						type: 'separator'
					},
					{
						label: 'Services',
						role: 'services',
						submenu: []
					},
					{
						type: 'separator'
					},
					{
						label: 'Hide ' + name,
						accelerator: 'Command+H',
						role: 'hide'
					},
					{
						label: 'Hide Others',
						accelerator: 'Command+Shift+H',
						role: 'hideothers'
					},
					{
						label: 'Show All',
						role: 'unhide'
					},
					{
						type: 'separator'
					},
					{
						label: 'Quit',
						accelerator: 'Command+Q',
						click: function() { app.quit(); }
					}
				]
			});

			// Window menu.
			template[3].submenu.push(
				{
					type: 'separator'
				},
				{
					label: 'Bring All to Front',
					role: 'front'
				}
			);
		} else {
			template.unshift({
				label: 'App',
				submenu: [
					{
						label: 'Preferences\u2026',
						accelerator: 'Command+,',
						click: function() {
							self.openDialog(self.$.settings);
						}
					},
					{
						type: 'separator'
					},
					{
						label: 'Quit',
						accelerator: 'Command+Q',
						click: function() { app.quit(); }
					}
				]
			});

			template[template.length-1].submenu.push(
				{
					label: 'About ' + name,
					click: function () {
						self.generateCredits().then(function (credits) {
							self.set('credits', credits);
						});
						self.openDialog(self.$.about);
					}
				}
			);
		}

		Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	},

	openIndexSelectDialog : function () {
		var self = this;
		var data = '';
		for (var i = 0, it; (it = self.selectedIndexers[i]); i++) {
			data += it.name + '\t' + it.id + '\n';
		}
		self.searchIndexIndex = new Chemr.Index({});
		self.searchIndexIndex.data = '\n' + data;
		self.$.indexSearchInput.value = '';
		self.openDialog(self.$.indexSearch);
		self.async(function () {
			self.$.indexSearchInput.inputElement.focus();
			self.searchIndex();
		}, 10);
	},

	generateCredits : function () {
		var ret = fs.readFileSync(path.join(__dirname, 'CREDITS'), 'utf8');
		ret += '\n\n';
		return Chemr.Index.indexers.then(function (indexers) {
			for (var i = 0, len = indexers.length; i < len; i++) {
				var index = indexers[i];
				var copyright = index.definition.copyright || '';
				if (copyright) {
					ret += '## Indexer ' + index.name + ' (' + index.id + ')\n';
					ret += copyright + '\n\n';
				}
			}
			return ret;
		});
	},

	iconStyleFor : function (item) {
		console.log('iconStyleFor', item);
		return 'font-size: 12px; text-overflow: ellipsis; width: 100%; height: 100%; background: ' + (item.definition.color || '#333');
	}
});
