indexer = {
	id: 'nodejs',
	name: 'Node.js',
	icon: 'https://nodejs.org/static/images/logos/js-black.svg',

	index : function (ctx) {
		console.log(ctx);
		return ctx.fetchDocument("https://nodejs.org/docs/latest/api/index.html").then(function (document) {
			var links = Array.prototype.map.call(document.querySelectorAll('#apicontent a'), function (i) {
				return i.href;
			});

			return ctx.crawl(links, function (url, document) {
				var toc = document.querySelectorAll('#toc a');
				for (var i = 0, it; (it = toc[i]); i++) {
					var name = $X('.', it, String);
					ctx.pushIndex(name, it.href);
				}
			});
		});
	}
};

