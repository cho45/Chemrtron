// indexer window process execute:
//   * create index
//   * emit event around index creation

console.log('config', config);
const ipc = electron.ipcRenderer;
const Indexer = {
	init : function () {
		ipc.on('indexer', this.handleIPC.bind(this));
	},

	handleIPC : function (e, args) {
		console.log('[indexer]', e, args);

		const func = this.IPCMethods[args.method];

		let promise;
		if (func) {
			try {
				promise = func.call(this, args.params);
			} catch (e) {
				promise = Promise.reject(e);
			}
		} else {
			promise = Promise.reject("no such method");
		}

		promise.then(
			(result) => {
				ipc.send('indexer', {
					id: args.id,
					result: result
				});
			},
			(error) => {
				console.log('Error', serializeError(error));
				ipc.send('indexer', {
					id: args.id,
					error: serializeError(error)
				});
			}
		);
	},

	IPCMethods : {
		echo : async function (params) {
			return params;
		},

		createIndex : async function (params) {
			const id = params.id;

			// reload indexers
			Chemr.Index.loadIndexers();

			console.log('CREATE INDEX', id);
			const index = await Chemr.Index.byId(params.id);
			console.log('CREATE INDEX runIndexer', index);
			return await index.runIndexer((state, current, total) => {
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
		}
	}
};

Indexer.init();

