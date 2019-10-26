export default {
	id: 'cpan',
	name: 'CPAN',

	index : function (ctx) {
		console.log('fetch http://www.cpan.org/modules/02packages.details.txt');
		return ctx.fetchText('http://www.cpan.org/modules/02packages.details.txt').
		then(function (str) {
			var reg = /^([a-z0-9:_]*?[a-z0-9_])\s+/img;
			while (reg.exec(str)) {
				ctx.pushIndex(RegExp.$1);
			}
			console.log('done');
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
