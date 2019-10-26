export default {
	id: 'mdn',
	name: 'MDN',
	color: '#00539f',

	index : function (ctx) {
		var self = this;

		function addIndex(page) {
			ctx.pushIndex(page.title, page.slug);
			for (let subpage of page.subpages) {
				addIndex(subpage);
			}
		}

		function _search(url) {
			console.log('MDN search', url);
			return self.fetchJSON(url).
			then(function (results) {
				console.log(results);

				addIndex(results);
			});
		}

		return _search('https://developer.mozilla.org/en-US/docs/Web$children');
	},

	item : function (item) {
		item[1] = "https://developer.mozilla.org/en-US/docs/" + item[1];
		return item;
	},

	CSS : function () {
		return '.global-notice, #main-header { display: none }';
	}
};

