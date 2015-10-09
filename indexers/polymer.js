indexer = {
	id: 'polymer',
	name: 'Polymer Elements',

	index : function () {
		return this.fetchJSON('https://elements.polymer-project.org/catalog.json').
		then(function (data) {
			var index = "";
			for (var i = 0, it; (it = data.elements[i]); i++) {
				console.log(it);
				index += it.name + "\t\n";
			}
			return index;
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

