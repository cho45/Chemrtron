indexer = {
	id: 'polymer',
	name: 'Polymer Elements',
	color: '#E91E63',

	index : function (ctx) {
		return ctx.fetchJSON('https://elements.polymer-project.org/catalog.json').
		then(function (data) {
			for (var i = 0, it; (it = data.elements[i]); i++) {
				ctx.pushIndex(it.name);
			}
		});
	},

	item : function (item) {
		item[1] = 'https://elements.polymer-project.org/elements/' + item[0];
		return item;
	},

	beforeSearch : function (query) {
		return query.replace(/\s+/g, '.*?').replace(/;/g, ':');
	}
};

