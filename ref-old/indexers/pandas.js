indexer = {
	id: 'pandas',
	name: 'pandas',
	color: '#6BA81E',

	index : function (ctx) {
		return ctx.fetchDocument("http://pandas.pydata.org/pandas-docs/stable/api.html").then(function (document) {
			var items = document.querySelectorAll("tr");
			console.log(items.length);

			for (var i = 0, it; (it = items[i]); i++) {
				var link = it.childNodes[0].querySelector("a");
				var name = link.querySelector("span").textContent;
				ctx.pushIndex(name, link.href);
			}
		});
	}
};
