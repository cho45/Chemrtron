const electron = require('electron');
const remote = electron.remote;
const glob = remote.require('glob');
const path = remote.require('path');
const fs = remote.require('fs');
const config = remote.require('./config');

export const Chemr = {};

Chemr.Index = function () { this.init.apply(this, arguments) };
Chemr.Index.prototype = {
	init : function (definition) {
		this.id = definition.id;
		this.name = definition.name;
		this.icon = definition.icon;
		this.definition = definition;
		if (!this.definition.item) this.definition.item = function (i) { return i };
	},

	search : function (query) {
		var self = this;
		var convert  = self.definition.beforeSearch || function (a) { return a.replace(/\s+/g, '.*?') };

		return new Promise(function (resolve, reject) {
			var itr  = self.createSearchIterator(convert(query));
			var max  = 300;
			var res  = [];
			for (var i = 0, item = null; i < max && (item = itr.next()); i++) {
				res.push(item);
			}

			// scoring and sort
			var regex = new RegExp(query.replace(/\s+/g, '').split('').map(function (c) {
				c = c.replace(/\W/g,'\\$&');
				return '([^' + c + ']*)(' + c + ')?';
			}).join(''), 'i');

			res = res.
				map(function (item) {
					var str   = item[0];
					var matched = regex.exec(str);
					if (matched) {
						var matchCount = 0;
						var formatted = '';
						for (var i = 1, len = matched.length; i < len; i += 2) {
							if (matched[i]) {
								formatted += escapeHTML(matched[i]);
							}
							if (matched[i+1]) {
								matchCount++;
								formatted += '<b>' + escapeHTML(matched[i+1]) + '</b>';
							}
						}
						formatted += escapeHTML(str.slice(matched[0].length));

						var score = str.length - matchCount;

						item[2] = formatted;
						item.score = score;
					} else {
						item[2] = item[0];
						item.score = str.length * 100;
					}
					return self.definition.item(item);
				}).
				sort(function (a, b) {
					return a.score - b.score;
				});

			resolve(res);
		});
	},

	createSearchIterator : function (query) {
		var self = this;
		var q = new RegExp(query.source || query, "gmi");
		return {
			hasNext : true,
			next : function () {
				if (!this.hasNext) {
					return null;
				}

				// by mala http://la.ma.la/blog/diary_200604021538.htm
				var match = q.exec(self.data);
				if (!match) {
					this.hasNext = false;
					return null;
				}
				var start = self.data.lastIndexOf("\n", match.index) + 1;
				var tab   = self.data.lastIndexOf("\t", match.index) + 1;
				var end   = self.data.indexOf("\n", start);
				if (end === -1) end = self.data.length - 1;
				q.lastIndex = end + 1;

				if (self.data.length - 1 <= end + 1) {
					this.hasNext = false;
				}

				if (start > tab) {
					return self.data.slice(start, end).split("\t");
				} else {
					return this.next();
				}
			}
		};
	},

	openIndex : function (args) {
		var self = this;
		if (!self.data || args.reindex) {
			return Chemr.IPC.request('getIndex', { id : self.id, reindex: args.reindex, docset: self.definition.docset }).
				then(function (data) {
					if (data.charCodeAt(0) === 0x01) {
						var firstLF = data.indexOf('\n');
						self.meta = JSON.parse(data.substring(1, firstLF));
						self.data = data.substring(firstLF);
					} else {
						self.meta = null;
						self.data = "\n" + data + "\n";
					}
					console.log('openIndex', self.data.length, 'meta', self.meta);
					return self;
				});
		} else {
			return Promise.resolve(self);
		}
	},

	/** for indexer process */
	runIndexer : function (progress) {
		if (!progress) progress = function () {};

		var context = new Chemr.Index.IndexerContext(this.id, progress);

		var promise = this.definition.index.call(context, context).
		then(function (data) {
			if (!data) {
				data = context.finalize();
			}
			context.done();
			return data;
		});

		promise.indexerContext = context;

		return promise;
	}
};
Chemr.Index.IndexerContext = function () { this.init.apply(this, arguments) };
Chemr.Index.IndexerContext.prototype = {
	init : function (id, progress) {
		this.id = id;
		this.index = [];
		this.progress = progress;
		this.current = 0;
		this.total = 1;
		this.canceled = false;
		this.progress("init", this.current, this.total);
	},

	pushIndex: function (name, url) {
		if (!url) url = "";
		// console.log('pushIndex', name, url);
		name = name.replace(/\s+/g, ' ');
		var line = name + "\t" + url + "\n";
		this.index[this.index.length] = line;
	},

	cancel : function () {
		this.canceled = true;
	},

	finalize : function () {
		var ret = [];
		var index = this.index;
		var seen = {};
		for (var i = 0, len = index.length; i < len; i++) {
			var item = index[i];
			if (!seen[i]) {
				seen[i] = true;
				ret[ret.length] = item;
			}
		}
		return ret.join('');
	},

	fetchDocument : function (url, opts) {
		var self = this;
		if (self.canceled) return Promise.reject('canceled');

		if (!opts) opts = {};
		console.log('FETCH', url);
		return new Promise(function (resolve, reject) {
			if (!opts.selfProgress) {
				self.progress("fetch.start", self.current, ++self.total);
			}

			var iframe = document.createElement('iframe');
			// enable sandbox
			iframe.sandbox = "";
			document.body.appendChild(iframe);
			var timer = setTimeout(function () {
				reject('timeout');
			}, 30 * 1000);
			var ready = function () {
				clearTimeout(timer);
				console.log('iframe DOMContentLoaded');
				var document = iframe.contentDocument;

				if (opts.srcdoc) {
					// use url instead of about:srcdoc
					var base = document.createElement('base');
					base.href = url;
					document.head.appendChild(base);
				}

				resolve(document);
				iframe.parentNode.removeChild(iframe);
				if (!opts.selfProgress) {
					self.progress("fetch.done", ++self.current, self.total);
				}

				// fire at once
				ready = function () {};
			};

			setTimeout(function check () {
				var document = iframe.contentDocument;
				if (
					document &&
					document.URL && 
					document.URL.indexOf("about:") !== 0 &&
					document.readyState === "interactive" // interactive means DOMContentLoaded is fired
				) {
					return ready();
				}
				setTimeout(check, 1);
			}, 1);

			iframe.onload = ready;
			if (opts.srcdoc) {
				// load to about:srcdoc for ignore x-frame-options
				self.fetchText(url).then(function (text) {
					iframe.srcdoc = text;
				});
			} else {
				iframe.src = url;
			}
		});
	},

	fetchJSON : function (url) {
		return this.fetchText(url).then(function (string) {
			return JSON.parse(string);
		});
	},

	fetchText : function (url) {
		return this.fetchAsXHR({ method: 'GET', url: url }).then(function (req) {
			if (req.status === 200) {
				return req.responseText;
			} else {
				return Promise.reject(req);
			}
		});
	},

	fetchAsXHR : function (opts) {
		var self = this;
		if (self.canceled) return Promise.reject('canceled');
		return new Promise(function (resolve, reject) {
			self.progress("fetch.start", self.current, ++self.total);
			var req = new XMLHttpRequest();
			req.overrideMimeType("text/plain; charset=" + document.characterSet);
			req.open(opts.method, opts.url, true);
			if (opts.headers) {
				for (var k in opts.headers) if (opts.headers.hasOwnProperty(k)) {
					req.setRequestHeader(k, opts.headers[k]);
				}
			}
			req.onreadystatechange = function () {
				if (req.readyState === 4) {
					self.progress("fetch.done", ++self.current, self.total);
					resolve(req);
				}
			};
			req.onerror = function () {
				self.progress("fetch.done", ++self.current, self.total);
				reject(req);
			};
			req.send(opts.data || null);
		});
	},


	//		return self.fetch('foobar').then(function (toc) {
	//			return self.crawl(list, function (url, doc) {
	//			});
	//		});
	crawl: function (list, callback) {
		var self = this;
		self.total += list.length;
		self.progress("crawl.start", self.current, self.total);
		var seen = {};
		function _crawl() {
			if (self.canceled) return Promise.reject('canceled');

			if (list.length) {
				console.log('CRAWL REMAIN', list.length);
				var url = list.shift();
				var req =  (typeof url === 'string') ? url : url.url;
				if (seen[req]) {
					self.progress("crawl.progress", ++self.current, self.total);
					return _crawl();
				} else {
					seen[req] = true;
					return self.fetchDocument(req, { selfProgress: true }).then(function (doc) {
						self.progress("crawl.progress", ++self.current, self.total);
						callback.call({
							pushPage : function (url) {
								self.progress("crawl.progress", self.current, ++self.total);
								list.push(url);
							}
						}, url, doc);

						return _crawl();
					});
				}
			}
		}

		return _crawl();
	},

	done : function () {
		this.progress("done", ++this.current, this.total);
	}
};

Chemr.IPC = null;

Chemr.Index.loadIndexers = function () {
	const loadFiles = function (target) {
		return new Promise(function (resolve, reject) {
			console.log('glob from', target);
			glob(target, {}, function (err, files) {
				if (err) {
					console.log(err);
					return;
				}

				var promises = [];
				files.forEach(function (it) {
					if (it.match(/\.js$/)) {
						promises.push(fromIndexerDefinition(it));
					} else 
					if (it.match(/\.docset$/)) {
						promises.push(fromDocset(it));
					} else {
						// ignore
					}
				});

				Promise.all(promises).then(resolve);
			});
		});

		async function fromIndexerDefinition (it) {
			console.log('fromIndexerDefinition', it);
			const definition = await import(`esm://${it}`);
			if (!definition.default) {
				throw new Error('failed to load indexer definition');
			}
			console.log(definition);

			const index = new Chemr.Index(definition.default);
			index.location = it;
			console.log('Initilized', index.id);
			return index;
		}

		function fromDocset (docset) {
			console.log('Load from docset: ', docset);
			return new Promise(function (resolve, reject) {
				var info = path.join(docset, 'Contents/Info.plist');
				fs.readFile(info, "utf-8", function (err, content) {
					if (err) {
						console.log(err);
						resolve(null);
						return;
					}

					//<key>CFBundleIdentifier</key>
					//<string>nodejs</string>
					//<key>CFBundleName</key>
					//<string>Node.js</string>
					var matchId = content.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
					var matchName = content.match(/<key>CFBundleName<\/key>\s*<string>([^<]+)<\/string>/);

					if (!matchId || !matchName) {
						console.log('Failed to get id/name from', docset, matchId, matchName);
						resolve(null);
						return;
					}

					var index = new Chemr.Index({
						id: matchId[1],
						name: matchName[1],
						docset: docset,
						item: function (item) {
							item[1] = docset + '/Contents/Resources/Documents/' + item[1];
							return item;
						}
					});

					index.location = docset;

					resolve(index);
				});
			});
		}
	};

	console.log('Loading all indexers');
	var loaded = {};
	var append = function (array) {
		for (var i = 0, it; (it = array[i]); i++) {
			if (loaded[it.name]) continue;
			this.push(it);
			loaded[it.name] = true;
		}
		return this;
	};

	Chemr.Index.indexers = Promise.resolve([]).
		then(function (ret) {
			return loadFiles(path.join(config.indexerPath, '*.js')).then(append.bind(ret));
		}).
		then(function (ret) {
			return loadFiles(path.join(config.docsetsPath, '*.docset')).then(append.bind(ret));
		}).
		then(function (ret) {
			return loadFiles(path.join(config.indexerBuiltinPath, '*.js')).then(append.bind(ret));
		}).
		then(function (ret) {
			return loadFiles(path.join(__dirname, '../indexers/*.js')).then(append.bind(ret));
		});
	console.log('loadIndexers end', Chemr.Index.indexers);
};


Chemr.Index.byId = function (id) {
	return this.indexers.then(function (indexers) {
		for (var i = 0, len = indexers.length; i < len; i++) {
			if (indexers[i].id === id) {
				return indexers[i];
			}
		}
	});
};

Chemr.Index.updateBuiltinIndexers = function (progress) {
	var metafile = path.join(config.indexerBuiltinPath, 'meta.json');
	var meta = new Promise(function (resolve, reject) {
		fs.readFile(metafile, 'utf-8', function (err, data) {
			if (err) return reject(err);
			resolve(JSON.parse(data));
		});
	}).
	catch(function (e) {
		console.log('meta file is not readable', e);
		return {
			timestamp: 0,
			fileList: []
		};
	});

	var remote = GET('https://api.github.com/repos/cho45/Chemrtron/contents/indexers').then(function (string) {
		return JSON.parse(string);
	});

	return Promise.all([ meta, remote ]).then(function (_) {
		var local = _[0].fileList, remote = _[1];
		console.log('promise.all', _);
		progress('log', 'Local  file list length: ' + local.length);
		progress('log', 'Remote file list length: ' + remote.length);

		var localByName = local.reduce(function (r, i) {
			r[i.name] = i;
			return r;
		}, {});

		return remote.reduce(function (promise, it) {
			var shouldUpdate = !localByName[it.name] || localByName[it.name].sha !== it.sha;
			progress('file', 'Checking update ' + it.name + (shouldUpdate ? ' -> will be updated' : ' -> already updated'));
			console.log('remote', it.name, 'shouldUpdate:', shouldUpdate);
			if (!shouldUpdate) return promise;
			return promise.then(function () {
				progress('file', 'Updating ' + it.name);
				console.log('GET ', it.download_url);
				return GET(it.download_url).then(function (string) {
					var filename = path.join(config.indexerBuiltinPath, it.name);
					console.log('WRITE ', filename);
					progress('file', 'Updated ' + it.name);
					return writeFile(filename, string);
				}).
				catch(function (e) {
					progress('error', 'Error on updating ' + it.name + ' : ' + e);
					console.log('Error on updating', it.name, ' SKIP');
				});
			});
		}, Promise.resolve()).
			then(function () {
				return writeFile(metafile, JSON.stringify({
					timestamp : new Date().getTime(),
					fileList : remote
				}));
			});
	}).
	then(function () {
		progress('log', 'all done');
	});

	function GET (uri) {
		return new Promise(function (resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", uri);
			xhr.onload = function () {
				resolve(xhr.responseText);
			};
			xhr.onerror = function (e) {
				reject(e);
			};
			xhr.send();
		});
	}

	function writeFile (path, content) {
		return new Promise(function (resolve, reject) {
			fs.writeFile(path, content, 'utf-8', function (err) {
				if (err) return reject(err);
				resolve();
			});
		});
	}
};

Chemr.Index.loadIndexers();

