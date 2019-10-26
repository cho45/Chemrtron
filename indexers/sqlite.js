export default {
	id: 'sqlite',
	name: 'SQLite',
	color: '#044a64',

	index : function (ctx) {
		var list = [
			'https://www.sqlite.org/keyword_index.html',
			'https://www.sqlite.org/doclist.html'
		];
		return ctx.crawl(list, function (url, document) {
			var links = document.querySelectorAll('ol li a[href], ul li a[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};
