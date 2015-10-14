
var app =  require('app');
var ipc = require('ipc');
var fs = require('fs');
var os = require('os');
var path = require('path');
var BrowserWindow = require('browser-window');
var Channel = require('./src/channel');
var config = require('./config');
var serializeError = require('./src/utils').serializeError;
var mkdirp = require('mkdirp');

require('crash-reporter').start();

var Main = {
	init : function () {
		var self = this;

		mkdirp.sync(config.cachePath);
		mkdirp.sync(config.indexerPath);

		app.on('window-all-closed', function() {
			if (process.platform != 'darwin') {
				app.quit();
			}
		});

		app.on('ready', self.ready.bind(self));
	},

	ready : function () {
		var self = this;

		self.main = new BrowserWindow({width: 1280, height: 900});
		self.main.loadUrl('file://' + __dirname + '/viewer.html');
		if (config.DEBUG) self.main.openDevTools();
		self.main.on('closed', function () {
			self.main = null;
		});

		ipc.on('viewer', self.handleViewerIPC.bind(self));

		self.openIndexerProcess();
	},

	openIndexerProcess : function () {
		var self = this;
		if (self.indexer) {
			self.indexer.window.close();
		}

		self.indexer = new Channel({
			ready : function () {
				var self = this;
				return new Promise(function (resolve, reject) {
					self.window = new BrowserWindow({width: 800, height: 600, x: 0, y: 0, show: config.DEBUG });
					self.window.loadUrl('file://' + __dirname + '/indexer.html');
					if (config.DEBUG) self.window.openDevTools();
					self.window.webContents.on('did-finish-load', resolve);
				});
			},
			recv : function (callback) {
				ipc.on('indexer', function (e, args) {
					// console.log('[main][chan=indexer] ipc.on', args);
					callback(args);
				});
			},
			send : function (args) {
				this.window.send('indexer', args);
			},

			notification : function (args) {
				self.main.webContents.send('viewer', args);
			}
		});
	},

	handleViewerIPC : function (e, args) {
		var self = this;
		console.log('[main][chan=viewer] ipc.on', args);

		var func = self.IPCMethods[args.method];

		var promise;
		if (func) {
			try {
				promise = func.call(self, args.params);
			} catch (e) {
				promise = Promise.reject(e);
			}
		} else {
			promise = Promise.reject("no such method");
		}

		promise.then(function (result) {
			e.sender.send('viewer', {
				id: args.id,
				result: result
			});
		}, function (error) {
			// console.log('Error', serializeError(error));
			e.sender.send('viewer', {
				id: args.id,
				error: serializeError(error)
			});
		});
	},

	IPCMethods : {
		echo : function (params) {
			return this.indexer.request('echo', params);
		},

		debug : function (params) {
			var self = this;
			console.log('ipc debug', params);
			if (config.DEBUG != params.debug) {
				if (params.debug) {
					self.main.openDevTools();
					self.indexer.window.openDevTools();
					self.indexer.window.show();
				} else {
					self.main.closeDevTools();
					self.indexer.window.closeDevTools();
					self.indexer.window.hide();
				}
				config.DEBUG = params.debug;
			}
			return Promise.resolve();
		},

		getIndex : function (params) {
			var self = this;

			var filename = path.join(config.cachePath, params.id + '.dat');

			return new Promise(function (resolve, reject) {
				if (!params.reindex) {
					fs.readFile(filename, 'utf8', function (err, data) {
						if (err) return reject(err);
						resolve(data);
					});
				} else {
					return reject('force index');
				}
			}).
			catch(function (error) {
				console.log('REINDEX', error);
				return self.indexer.request('createIndex', { id : params.id }).
					then(function (data) {
						console.log('INDEXED', data.length);
						return new Promise(function (resolve, reject) {
							console.log('WRITE INDEX TO', filename);
							var meta = "\x01" + JSON.stringify({
								created: new Date().getTime()
							}) + "\n";
							fs.writeFile(filename, meta + data, 'utf8', function (err) {
								if (err) return reject(err);
								resolve(data);
							});
						});
					});
			});
		}
	}
};


Main.init();

