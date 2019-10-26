export default {
	id: 'ios',
	name: 'iOS Developer Library',

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
		item[1] = "https://developer.apple.com/library/ios/navigation/" + item[1];
		return item;
	}
};

