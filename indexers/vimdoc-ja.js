export default {
	id: 'vimdoc-ja',
	name: 'Vim ja',

	index : function (ctx) {
		var home = 'http://vim-jp.org/vimdoc-ja/';
		return ctx.crawl([ home ], function (url, document) {
			var crawler = this;
			if (url === home) {
				var links = document.querySelectorAll('body > nav a');
				for (var i = 0, it; (it = links[i]); i++) {
					crawler.pushPage(it.href);
				}
			}

			var targets = document.querySelectorAll('a.Identifier, a.Constant');
			for (var i = 0, it; (it = targets[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	},

	CSS : function () {
		return 'body > nav { display: none }';
	}
};


