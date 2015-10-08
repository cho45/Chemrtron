indexer = {
	id: 'cpan',
	name: 'CPAN',

	index : function () {
		console.log('fetch http://www.cpan.org/modules/02packages.details.txt');
		return http.get('http://www.cpan.org/modules/02packages.details.txt').
		then(function (req) {
			if (!req.responseText) throw "responseText is empty";
			console.log('loaded, creating index...');
			return req;
		}).
		then(function (req) {
			var reg = /^([a-z0-9:_]*?[a-z0-9_])\s+/img;
			var str = req.responseText;
			var index = "";
			while (reg.exec(str)) {
				index += RegExp.$1 + "\t\n";
			}
			console.log('done');
			return index;
		});
	},

	item : function (item) {
		item[1] = "http://search.cpan.org/perldoc?" + encodeURIComponent(item[0]);
		return item;
	},

	beforeSearch : function (query) {
		return query.replace(/\s+/g, '.*?').replace(/;/g, ':');
	}
};
