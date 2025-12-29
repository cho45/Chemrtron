const electron = require('electron');
const ipc = electron.ipcRenderer;
var serializeError = require('./utils').serializeError;
var Content = {
	init : function () {
		var self = this;
		ipc.on('content', self.handleIPC.bind(self));
	},

	handleIPC : function (e, args) {
		var self = this;
		console.log('[content]', e, args);

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
			ipc.sendToHost('content', {
				id: args.id,
				result: result
			});
		}, function (error) {
			console.log('Error', serializeError(error));
			ipc.sendToHost('content', {
				id: args.id,
				error: serializeError(error)
			});
		});
	},

	IPCMethods : {
		echo : function (params) {
			return Promise.resolve(params);
		},

		"eval" : function (params) {
			var ret = eval(params.string);
			console.log('eval', params.string, ret);
			if (typeof ret === 'function') {
				return new Promise(ret);
			} else {
				return Promise.resolve(ret);
			}
		}
	}
};

Content.init();
