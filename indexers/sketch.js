indexer = {
	id: 'sketch',
	name: 'sketch',

	index : function () {
		// return Promise.resolve("test\tfile://" + config.root + "/sketch/test.html\n");
		return this.fetch("file://" + config.root + "/sketch/test.html").then(function (document) {
			return "";
		});
	}
};

