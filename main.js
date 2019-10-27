
const electron = require('electron');
const {app} = electron;
const ipc = electron.ipcMain;
const {BrowserWindow} = electron;
const {globalShortcut} = electron;
const {protocol} = electron;
const fs = require('fs');
const path = require('path');
const Channel = require('./src/channel');
const config = require('./config');
const serializeError = require('./src/utils').serializeError;
const mkdirp = require('mkdirp');
const SQL = require('sql.js');

protocol.registerSchemesAsPrivileged([{ scheme: "esm" }]);

// electron.crashReporter.start();
const Main = {
	init : function () {
		mkdirp.sync(config.cachePath);
		mkdirp.sync(config.indexerPath);
		mkdirp.sync(config.indexerBuiltinPath);

		app.on('ready', this.ready.bind(this));
		app.on('will-quit', this.willQuit.bind(this));
	},

	ready : function () {

		protocol.registerBufferProtocol("esm", async (req, cb) => {
			const relpath = req.url.replace("esm://", "")
			const filepath = path.resolve(__dirname, relpath)
			console.log('esm scheme load file from', filepath);
			const data = await fs.promises.readFile(filepath)
			cb({ mimeType: "text/javascript", data })
		})

		this.main = new BrowserWindow({
			width: 1440,
			height: 900, 
			titleBarStyle: 'hidden-inset',
			webPreferences: {
				webviewTag: true,
				nodeIntegration: true,
				contextIsolation: false,
				// preload: __dirname + '/preload.js',
			}
		});
		this.main.loadURL('file://' + __dirname + '/src/viewer.html');
		if (config.DEBUG) this.main.openDevTools();
		this.main.on('closed', () => {
			this.main = null;
			app.quit();
		});

		ipc.on('viewer', this.handleViewerIPC.bind(this));

		this.openIndexerProcess();
	},

	willQuit : function () {
		globalShortcut.unregisterAll();
	},

	openIndexerProcess : function () {
		if (this.indexer) {
			this.indexer.window.close();
		}

		const {main} = this;

		this.indexer = new Channel({
			ready : function () {
				return new Promise((resolve, reject) => {
					this.window = new BrowserWindow({
						width: 800,
						height: 600,
						x: 0,
						y: 0,
						show: config.DEBUG,
						webPreferences: {
							webviewTag: false,
							nodeIntegration: true,
							nodeIntegrationInSubFrames: false,
							contextIsolation: true,
							// preload: __dirname + '/preload.js',
						}
					});
					this.window.loadURL('file://' + __dirname + '/src/indexer.html');
					if (config.DEBUG) this.window.openDevTools();
					this.window.webContents.on('did-finish-load', resolve);
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
				main.webContents.send('viewer', args);
			}
		});
	},

	handleViewerIPC : async function (e, args) {
		console.log('[main][chan=viewer] ipc.on', args);

		var func = this.IPCMethods[args.method];

		var promise;
		if (func) {
			try {
				promise = func.call(this, args.params);
			} catch (e) {
				promise = Promise.reject(e);
			}
		} else {
			promise = Promise.reject("no such method");
		}

		try {
			const result = await promise;
			e.sender.send('viewer', {
				id: args.id,
				result: result
			});
		} catch (error) {
			// console.log('Error', serializeError(error));
			e.sender.send('viewer', {
				id: args.id,
				error: serializeError(error)
			});
		}
	},

	IPCMethods : {
		echo : function (params) {
			return this.indexer.request('echo', params);
		},

		settings: function (settings) {
			console.log(settings);
			if (config.DEBUG !== settings.developerMode) {
				if (settings.developerMode) {
					this.main.openDevTools();
					this.indexer.window.openDevTools();
					this.indexer.window.show();
				} else {
					this.main.closeDevTools();
					this.indexer.window.closeDevTools();
					this.indexer.window.hide();
				}
				config.DEBUG = settings.developerMode;
			}

			globalShortcut.unregisterAll();
			if (settings.globalShortcut) {
				var key = settings.globalShortcut.
					replace(/Meta/, 'Super').
					replace(/Key(.)/, '$1').
					replace(/Digit(.)/, '$1').
					replace(/Arrow([^ ]+)/, '$1').
					replace(/ \+ /g, '+');
				console.log('globalShortcut.register', key);
				try {
					var ret = globalShortcut.register(key, function() {
						console.log('globalShortcut');
						this.main.focus();
					});
					if (!ret) {
						console.log('registration failed');
					}
				} catch (e) {
					console.log(e);
				}
			}

			return Promise.resolve();
		},

		getIndex : async function (params) {
			if (!params.docset) {
				const filename = path.join(config.cachePath, params.id + '.dat');

				let reindex = params.reindex;

				let index;
				try {
					index = await fs.promises.readFile(filename, 'utf8');
				} catch (error) {
					console.log(`ERROR reading index ${filename}`);
					reindex = true;
				}

				if (reindex) {
					const data = await this.indexer.request('createIndex', { id : params.id });
					console.log('INDEXED', data.length);
					const meta = "\x01" + JSON.stringify({
						created: new Date().getTime()
					}) + "\n";
					index = meta + data;
					fs.promises.writeFile(filename, index, 'utf8');
				}

				return index;
			} else {
				var docset = params.docset;
				// var docroot = path.join(docset, 'Contents/Resources/Documents');
				var dbfile = path.join(docset, 'Contents/Resources/docSet.dsidx');

				var buf = require('fs').readFileSync(dbfile);

				var db = new SQL.Database(buf);
				var rows = db.exec('SELECT name, path FROM searchIndex')[0].values;
				var ret = '';
				for (var i = 0, it; (it = rows[i]); i++) {
					console.log(it);
					ret += it[0] + '\t' + it[1] + '\n';
				}

				return Promise.resolve(ret);
			}
		}
	}
};


Main.init();

