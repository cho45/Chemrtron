// indexer window process execute:
//   * create index
//   * emit event around index creation

console.log('config', config);
const ipc = electron.ipcRenderer;
var Indexer = {
	init : function () {
		var self = this;
		ipc.on('indexer', self.handleIPC.bind(self));
	},

	handleIPC : function (e, args) {
		var self = this;
		console.log('[indexer]', e, args);

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
			ipc.send('indexer', {
				id: args.id,
				result: result
			});
		}, function (error) {
			console.log('Error', serializeError(error));
			ipc.send('indexer', {
				id: args.id,
				error: serializeError(error)
			});
		});
	},

	IPCMethods : {
		echo : function (params) {
			return Promise.resolve(params);
		},

		createIndex : function (params) {
			var id = params.id;

			// reload indexers
			Chemr.Index.loadIndexers();

			console.log('CREATE INDEX', id);
			return Chemr.Index.byId(params.id).
				then(function (index) {
					console.log('CREATE INDEX runIndexer', index);
					return index.runIndexer(function (state, current, total) {
						ipc.send('indexer', {
							id : null,
							result: {
								type: "progress",
								id : id,
								state: state,
								current: current,
								total: total
							}
						});
					});
				});
		}
	}
};

Indexer.init();

