var remote = require('remote');
var glob = remote.require('glob');
var fs = remote.require('fs');

var Chemr = {};

Chemr.Index = function () { this.init.apply(this, arguments) };
Chemr.Index.prototype = {
	init : function (definition) {
		this.id = definition.id;
		this.name = definition.name;
		this.definition = definition;
		if (!this.definition.item) this.definition.item = function (i) { return i };
	},

	search : function (query) {
		var self = this;
		var convert  = self.definition.beforeSearch || function (a) { return a.replace(/\s+/g, '.*?') };
		query    = convert(query);

		return new Promise(function (resolve, reject) {
			var itr  = self.createSearchIterator(query);
			var max  = 300;
			var res  = [];
			for (var i = 0, item = null; i < max && (item = itr.next()); i++) {
				res.push(item);
			}

			// scoring and sort
			var regex = new RegExp('(' + query.replace(/\s+/, ' ').split('').map(function (c) {
				return c.replace(/\W/g,'\\$&').replace(/\\ /g, '.*?');
			}).join(')?.*?(') + ')?', 'i');

			res = res.
				map(function (i) {
					var str   = i[0];
					var match = regex.exec(str);
					if (match) {
						var score = Math.abs(str.length - (match.length - 1));

						var t = "";
						for (var j = 0, k = 1, len = str.length; j < len; j++) {
							if (str[j] == match[k]) {
								t += '<b>' + escapeHTML(str[j]) + '</b>';
								k++;
							} else {
								t += escapeHTML(str[j]);
							}
						}
						t += escapeHTML(str.slice(j));
						i[2] = t;
						i.score = score;
					} else {
						i[2] = i[0];
						i.score = str.length * 100;
					}
					return self.definition.item(i);
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
			return Chemr.IPC.request('getIndex', { id : self.id, reindex: args.reindex }).
				then(function (data) {
					self.data = "\n" + data + "\n";
					return self;
				});
		} else {
			return Promise.resolve(self);
		}
	},

	/** for indexer process */
	runIndexer : function (progress) {
		if (!progress) progress = function () {};

		var current = 0;
		var total = 1;

		progress("init", current, total);

		return this.definition.index.call({
			fetchDocument : function (url) {
				console.log('FETCH', url);
				return new Promise(function (resolve, reject) {
					progress("fetch.start", current, ++total);

					var iframe = document.createElement('iframe');
					// enable sandbox
					iframe.sandbox = "";
					document.body.appendChild(iframe);
					iframe.onload = function () {
						console.log('iframe DOMContentLoaded');
						var document = iframe.contentDocument;
						resolve(document);
						iframe.parentNode.removeChild(iframe);
						progress("fetch.done", ++current, total);
					};
					iframe.src = url;
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
				return new Promise(function (resolve, reject) {
					progress("fetch.start", current, ++total);
					var req = new XMLHttpRequest();
					req.overrideMimeType("text/plain; charset=" + document.characterSet);
					req.open(opts.method, opts.url, true);
					if (opts.headers) {
						for (var k in opts.headers) if (opts.headers.hasOwnProperty(k)) {
							req.setRequestHeader(k, opts.headers[k]);
						}
					}
					req.onreadystatechange = function () {
						if (req.readyState == 4) {
							progress("fetch.done", ++current, total);
							resolve(req);
						}
					};
					req.onerror = function () {
						progress("fetch.done", ++current, total);
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
				var index = [];
				total += list.length;
				progress("crawl.start", current, total);
				function _crawl() {
					if (list.length) {
						console.log('CRAWL REMAIN', list.length);
						var url = list.shift();
						return self.fetchDocument(url).then(function (doc) {
							progress("crawl.progress", ++current, total);
							callback.call({
								pushPage : function (url) {
									total++;
									progress("crawl.progress", current, ++total);
									list.push(url);
								},

								pushIndex : function (name, url) {
									index.push(name + "\t" + url);
								}
							}, url, doc);

							return _crawl();
						});
					} else {
						return Promise.resolve(index.join("\n"));
					}
				}

				return _crawl();
			}
		}).
		then(function (data) {
			progress("done", ++current, total);
			return data;
		});
	}
};
Chemr.IPC = null;

Chemr.Index.loadIndexers = function () {
	Chemr.Index.indexers = new Promise(function (resolve, reject) {
		glob(__dirname + '/indexers/*.js', {}, function (err, files) {
			if (err) {
				console.log(err);
				return;
			}

			var promises = [];
			for (var i = 0, it; (it = files[i]); i++) {
				promises.push(new Promise(function (resolve, reject) {
					fs.readFile(it, "utf-8", function (err, content) {
						if (err) {
							console.log(err);
							resolve(null);
							return;
						}
						var index = new Chemr.Index(eval(content));
						console.log('Initilized', index.id);
						resolve(index);
					});
				}));
			}

			console.log('Loading all indexers');
			Promise.all(promises).then(resolve);
		});
	});
	return Chemr.Index.indexers;
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

Chemr.Index.loadIndexers();

