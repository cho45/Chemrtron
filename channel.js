var Channel = function () { this.init.apply(this, arguments) };
Channel.prototype = {
	init : function (args) {
		var self = this;
		self.recv = args.recv;
		self.send = args.send;
		self.notification = args.notification;

		self._id = 0;
		self._callbacks = {};

		self.ready = args.ready ? args.ready.call(self) : Promise.resolve();
		self.recv(function (args) {
			if (args.id) {
				self._callbacks[args.id](args);
			} else {
				if (self.notification) {
					self.notification(args);
				}
			}
		});
	},

	request : function (method, params) {
		var self = this;
		return self.ready.then(function () {
			return new Promise(function (resolve, reject) {
				var id = ++self._id;
				self._callbacks[id] = function (args) {
					delete self._callbacks[id];
					if (args.error) {
						reject(args.error);
					} else {
						resolve(args.result);
					}
				};
				self.send({ id: id, method: method, params: params });
			});
		});
	}
};


module.exports = Channel;
