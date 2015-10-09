indexer = {
	id: 'cpan',
	name: 'CPAN',

	index : function () {
		console.log('fetch http://www.cpan.org/modules/02packages.details.txt');
		return this.fetchText('http://www.cpan.org/modules/02packages.details.txt').
		then(function (str) {
			var reg = /^([a-z0-9:_]*?[a-z0-9_])\s+/img;
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
