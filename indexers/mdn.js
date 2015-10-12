indexer = {
	id: 'mdn',
	name: 'MDN',

	index : function (ctx) {
		var self = this;

		function _search(url) {
			console.log('MDN search', url);
			return self.fetchJSON(url).
			then(function (results) {
				console.log('MDN search', results.page, results.pages);

				for (var i = 0, it; (it = results.documents[i]); i++) {
					ctx.pushIndex(it.title, it.slug);
				}

				if (results.next) {
					return _search(results.next);
				} else {
					// all done
					return;
				}
			});
		}

		return _search('https://developer.mozilla.org/en-US/search.json?q=&topic=api&topic=css&topic=canvas&topic=html&topic=js&topic=webgl&per_page=100');
	},

	item : function (item) {
		item[1] = "https://developer.mozilla.org/en-US/" + item[1];
		return item;
	},

	CSS : function () {
		return '.global-notice, #main-header { display: none }';
	}
};

