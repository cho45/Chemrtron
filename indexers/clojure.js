indexer = {
	id: 'clojure',
	name: 'Clojure',
	icon: 'http://clojure.org/file/view/clojure-icon.gif',

	index : function (ctx) {
		return ctx.fetchDocument('http://clojure.github.io/clojure/').then(function (document) {
			var links = document.querySelectorAll('#var-tag[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};


