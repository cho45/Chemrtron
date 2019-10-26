export default {
	id: 'golang',
	name: 'Go',
	icon: 'https://golang.org/doc/gopher/pkg.png',
	copyright: 'The Go gopher was designed by Renee French. (http://reneefrench.blogspot.com/)\nThe design is licensed under the Creative Commons 3.0 Attributions license.\nRead this article for more details: https://blog.golang.org/gopher',

	index : function (ctx) {
		return ctx.fetchDocument('https://golang.org/ref/spec').then(function (document) {
			var headings = document.querySelectorAll('h2[id], h3[id]');
			for (var i = 0, it; (it = headings[i]); i++) {
				ctx.pushIndex(it.textContent, document.URL + "#" + it.id);
			}
		}).
		then(function () {
			return ctx.fetchDocument('https://golang.org/pkg/').then(function (document) {
				var links = document.querySelectorAll('.pkg-dir .pkg-name a[href]');
				var hrefs = [];
				for (var i = 0, it; (it = links[i]); i++) {
					hrefs.push(it.href);
					ctx.pushIndex(it.textContent, it.href);
				}

				return ctx.crawl(hrefs, function (url, document) {
					var links = document.querySelectorAll('#manual-nav a[href]');
					for (var i = 0, it; (it = links[i]); i++) {
						ctx.pushIndex(it.textContent, it.href);
					}
				});
			});
		});
	}
};

