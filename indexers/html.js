indexer = {
	id: 'html',
	name: 'HTML Standard',

	index : function (ctx) {
		return ctx.fetchDocument('https://html.spec.whatwg.org/multipage/').then(function (document) {
			var links = document.querySelectorAll('ol.toc a[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};


