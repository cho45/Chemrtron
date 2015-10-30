
indexer = {
	id: 'ghc',
	name: 'Haskell (GHC)',

	index : function (ctx) {
		return ctx.fetchDocument('https://downloads.haskell.org/~ghc/latest/docs/html/libraries/doc-index-All.html').then(function (document) {
			var data = document.querySelectorAll('td.src, td.alt, td.module');

			var src, alt;
			for (var i = 0, it; (it = data[i]); i++) {
				switch (it.className) {
					case "src":
						src = it.textContent;
						break;
					case "alt":
						alt = it.textContent;
						break;
					case "module":
						var links = it.querySelectorAll('a');
						for (var j = 0, link; (link = links[j]); j++) {
							ctx.pushIndex([link.textContent, src, alt].join(' '), link.href);
						}
						break;
				}
			}
		});
	}
};


