indexer = {
	id: 'ruby',
	name: 'Ruby',
	icon: 'https://www.ruby-lang.org/images/header-ruby-logo.png',

	index : function (ctx) {
		return ctx.fetchDocument('http://docs.ruby-lang.org/en/2.2.0/table_of_contents.html').then(function (document) {
			console.log(document);

			var modules = document.querySelectorAll('li.class a, li.module a');
			for (var i = 0, it; (it = modules[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}

			var methods = document.querySelectorAll('li.method');
			for (var i = 0, it; (it = methods[i]); i++) {
				var link = it.querySelector('a');
				var module = it.querySelector('.container').textContent;
				ctx.pushIndex(module + link.textContent, link.href);
			}
		});
	},

	CSS : function () {
		return 'nav[role=navigation] { display: none } main[role=main] { margin: 0 }';
	}
};
