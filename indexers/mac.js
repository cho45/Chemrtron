export default {
	id: 'mac',
	name: 'Mac Developer Library',

	index : function (ctx) {
		return ctx.fetchJSON('https://developer.apple.com/library/archive/navigation/library.json').
		then(function (data) {
			var NAME = data.columns.name;
			var URL = data.columns.url;

			for (var i = 0, it; (it = data.documents[i]); i++) {
				ctx.pushIndex(it[NAME], it[URL]);
			}
		});
	},

	item : function (item) {
		item[1] = "https://developer.apple.com/library/mac/navigation/" + item[1];
		return item;
	}
};
