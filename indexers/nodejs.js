indexer = {
	id: 'nodejs',
	name: 'Node.js',

	index : function () {
		var self = this;
		return self.fetchDocument("https://nodejs.org/docs/latest/api/index.html").then(function (document) {
			var links = Array.prototype.map.call(document.querySelectorAll('#apicontent a'), function (i) {
				return i.href;
			});

			return self.crawl(links, function (url, document) {
				var toc = document.querySelectorAll('#toc a');
				for (var i = 0, it; (it = toc[i]); i++) {
					var name = $X('.', it, String);
					this.pushIndex(name, it.href);
				}
			});
		});
	}
};

