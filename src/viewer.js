
import { Chemr } from "esm://src/chemr.js";
const electron = require('electron');
const ipc = electron.ipcRenderer;
const app = electron.remote.app;
const Menu =  electron.remote.Menu;
const Channel = require('./channel.js');

Vue.use(VueMaterial.default);

window.App = new Vue({
	el: '#app',
	data: {
		index: null,

		currentLocation: "",

		progress: {
			indeterminate: false
		},
	},
	methods: {
		test: function () {
			this.$refs.webview.loadURL('http://example.com');
		},

		selectIndex: async function (id) {
			const index = await Chemr.Index.byId(id);
			await index.openIndex({ reindex: false });
			this.index = index;
		},

		search: async function () {
			const res = await this.index.search(this.$refs.input.value);
			console.log(res);
		},
	},
	mounted: function () {
		console.log('mounted');
		console.log({Chemr});

		Chemr.IPC = new Channel({
			recv : function (callback) {
				ipc.on('viewer', function (e, args) {
					console.log('[viewer]', args);
					callback(args);
				});
			},

			send : function (args) {
				ipc.send('viewer', args);
			},

			notification : (args) => {
				// console.log(args);
				if (args.result && args.result.type === 'progress') {
					this.handleIndexerProgress(args.result);
				}
			}
		});

		const webview = this.$refs.webview;
		webview.addEventListener('load-commit', (e) => {
			if (e.isMainFrame) {
				console.log('webview.load-commit');
				if (!this.index) return;
				this.index.then(function (index) {
					if (index.definition.CSS) {
						webview.insertCSS(index.definition.CSS());
					}
					if (index.definition.JS) {
						webview.executeJavaScript(index.definition.JS(), false);
					}
				});
			}
		});
		webview.addEventListener('dom-ready', (e) => {
			this.currentLocation = webview.getURL();
			console.log('webview.dom-ready');
		});
		webview.addEventListener('did-finish-load', (e) => {
			console.log('webview is onloaded', webview.getURL());
		});
		webview.addEventListener('did-fail-load', (e) => {
			console.log('did-fail-load');
		});
		webview.addEventListener('did-start-loading', (e) => {
			this.progress.indeterminate = true;
		});
		webview.addEventListener('did-stop-loading', (e) => {
			console.log('stop spinner');
			this.progress.indeterminate = false;
		});
		webview.addEventListener('did-get-response-details', (e) => {
			console.log('did-get-response-details', e);
		});
		webview.addEventListener('did-get-redirect-request', (e) => {
			console.log('did-get-redirect-request', e);
			if (e.isMainFrame) {
				this.currentLocation = e.newURL;
			}
		});
		webview.addEventListener('page-title-set', (e) => {
			console.log('page-title-set', e);
		});
		webview.addEventListener('page-favicon-updated', (e) => {
			console.log('page-favicon-updated', e);
		});
		webview.addEventListener('console-message', (e) => {
			console.log('[WebView]', e.message);
		});
		webview.addEventListener('contextmenu', (e) => {
			console.log('webview contextmenu', e);
			var menu = Menu.buildFromTemplate([
				{
					label: 'Back',
					click: function () {
						webview.goBack();
					},
					enabled: webview.canGoBack()
				},
				{
					label: 'Forward',
					click: function () {
						webview.goForward();
					},
					enabled: webview.canGoForward()
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
						require('shell').openExternal(webview.src);
					}
				}
			]);
			menu.popup(remote.getCurrentWindow());
		});
	}
});
