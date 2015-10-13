indexer = {
	id: 'mysql',
	name: 'MySQL',

	index : function (ctx) {
		return ctx.fetchDocument('http://dev.mysql.com/doc/refman/5.6/en/index.html').then(function (document) {
			var links = document.querySelectorAll('#tocdetail a[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				if (it.className == 'tocdetail') continue;
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	},

	CSS: function () {
		return "#header, #nav_container, .page_sidebar { display: none } #page.sidebar { padding: 16px; margin: 0 !important }";
	}
};



