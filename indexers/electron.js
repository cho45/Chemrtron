indexer = {
	id: 'electron',
	name: 'Electron',
	icon: 'http://electron.atom.io/images/favicon.ico',

	index : function (ctx) {
		return ctx.fetchDocument('http://electron.atom.io/docs/v0.33.0/').then(function (document) {
			var links = document.querySelectorAll('section.docs a[href]');
			var hrefs = [];
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
				hrefs.push(it.href);
			}

			return ctx.crawl(hrefs, function (url, document) {
				var headings = document.querySelectorAll('h2[id], h3[id]');
				for (var i = 0, it; (it = headings[i]); i++) {
					ctx.pushIndex(document.title + " " + it.textContent, document.URL + '#' + it.id);
				}
			});
		});
	}
};
