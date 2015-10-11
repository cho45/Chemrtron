var remote = require('remote');
var ipc = require('ipc');
var Channel = require('./src/channel');

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

		settings : {
			type: Object,
			value: {}
		},

		settingsTabSelected: {
			type: Number,
			value: 1
		}
	},

	observers: [
		"settingsChanged(settings.*)",
		"settingsChanged(settings.indexers.*)",
		"settingsChanged(indexers.*)"
	],

	ready: function() {
		var self = this;
		Chemr.IPC = new Channel({
			recv : function (callback) {
				ipc.on('viewer', function (args) {
					console.log('[viewer]', args);
					callback(args);
				});
			},

			send : function (args) {
				ipc.send('viewer', args);
			},

			notification : function (args) {
				console.log(args);
				if (args.result && args.result.type === 'progress') {
					self.handleIndexerProgress(args.result);
				}
			}
		});

		self.openDialog(self.$.settings);

		var indexListOpened = false;
		self.$.indexList.onmouseenter = function () {
			indexListOpened = true;
			self.debounce('indexListHover', function () {
				self.toggleClass('open', indexListOpened, self.$.indexList);
			}, 3000);
		};
		self.$.indexList.onmouseleave = function () {
			indexListOpened = false;
			self.toggleClass('open', indexListOpened, self.$.indexList);
		};
	},

	attached: function() {
		var self = this;

		var frame = document.getElementById('frame');
		console.log(frame);
		frame.addEventListener('load-commit', function (e) {
			if (e.isMainFrame) {
				console.log('frame.load-commit');
				if (!self.index) return;
				self.index.then(function (index) {
					if (index.definition.CSS) {
						frame.insertCSS(index.definition.CSS());
					}
				});
			}
		});
		frame.addEventListener('dom-ready', function (e) {
			console.log('frame.dom-ready');
		});
		frame.addEventListener('did-finish-load', function (e) {
			console.log('frame is onloaded');
		});
		frame.addEventListener('did-start-loading', function (e) {
			console.log('start spinner');
			self.$.progress.indeterminate = true;
		});
		frame.addEventListener('did-stop-loading', function (e) {
			console.log('stop spinner');
			self.$.progress.indeterminate = false;
		});
		frame.addEventListener('console-message', function(e) {
			console.log('[WebView]', e.message);
		});
		self.frame = frame;

		window.onkeydown = function (e) {
			var key = (e.altKey?"Alt-":"")+(e.ctrlKey?"Control-":"")+(e.metaKey?"Meta-":"")+(e.shiftKey?"Shift-":"")+e.key;   
			console.log(key);

			if (key === 'Meta-l') {
				self.$.input.inputElement.focus();
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

		self.$.select.onchange = function () {
			self.debounce('load', function () {
				var option = select.childNodes[select.selectedIndex];
				var url = option.value;
				console.log('load', url);
				frame.stop();
				frame.src = url;
			}, 500);
		};

		self.$.input.inputElement.onkeydown = function (e) {
			var key = (e.altKey?"Alt-":"")+(e.ctrlKey?"Control-":"")+(e.metaKey?"Meta-":"")+(e.shiftKey?"Shift-":"")+e.key;   
			var select = self.$.select;
			var input = self.$.input.inputElement;

			if (key === 'Enter') {
				e.preventDefault();
			} else 
			if (key === 'Control-n' || key === 'ArrowDown') {
				e.preventDefault();

				var option = select.childNodes[select.selectedIndex + 1]; // no warnings
				if (option) option.selected = true;
				select.onchange();
			} else
			if (key === 'Control-p' || key === 'ArrowUp') {
				e.preventDefault();

				var option = select.childNodes[select.selectedIndex - 1]; // no warnings
				if (option) option.selected = true;
				select.onchange();
			} else
			if (key === 'Control-u') {
				e.preventDefault();
				input.value = "";
			} else
			if (key === 'Tab') {
				e.preventDefault();

				// complete common match
				var option = select.childNodes[select.selectedIndex + 1]; // no warnings
				if (option) {
					input.value = option.title;
				}
			}


			setTimeout(function () {
				if (input.prevValue !== input.value) {
					input.prevValue = input.value;
					self.search();
				}
			}, 0);
		};
	},

	firstLetter: function (str) {
		return str.charAt(0).toUpperCase();
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
			catch(function (error) { alert(error) });
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
			catch(function (error) { alert(error) });

		// set after reindex completed
		index.then(function () {
			self.set('index', index);
		});
	},

	search : function () {
		var self = this;
		self.index.then(function (index) {
			self.set('settings.lastQuery', self.$.input.value);
			index.search(self.$.input.value).then(function (res) {
				self.$.select.innerHTML = '';
				for (var i = 0, len = res.length; i < len; i++) {
					var item = res[i];
					var option = document.createElement('option');
					option.className = "chemr-viewer";
					option.innerHTML = item[2] + (Chemr.DEBUG ? '<div class="info">[' + item.score + '] ' + item[1] + '</div>' : '');
					option.value     = item[1];
					option.title     = item[0];
					self.$.select.add(option, null);
				}

//				self.$.select.childNodes[0].selected = true;
//				self.$.select.onchange();
			});
		});
	},

	initializeDefaultSettings : function () {
		this.settings = {
			enabled: [],
			developerMode: false,

			lastQuery: "",
			lastSelected: null
		};
	},

	loadedSettings : function () {
		var self = this;
		self.settingsChanged({});

		Chemr.Index.indexers.then(function (indexers) {
			for (var i = 0, it; (it = indexers[i]); i++) {
				console.log(self.settings);
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
		self.$.toastProgress.text = "Reindex... " + progress.state + " [" + progress.current + "/" + progress.total + "] (" + Math.round(progress.current / progress.total * 100) + "%)";
		self.$.toastProgressProgress.value = Math.round(progress.current / progress.total * 100);
		if (progress.state === 'done') {
			self.$.toastProgress.duration = 3000;
		} else {
			self.$.toastProgress.duration = 0xffffff;
		}
		self.$.toastProgress.show();
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
		document.title = self.settings.developerMode? "ｷﾒｪwwwww" : "Chemr";

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
				// self.$.storage.save();
			}
		}
	}
});
