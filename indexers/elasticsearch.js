indexer = {
	id: 'elasticsearch',
	name: 'Elasticsearch',

	index : function (ctx) {
		return ctx.fetchDocument('https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html').then(function (document) {
			var links = document.querySelectorAll('.toc a[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};

