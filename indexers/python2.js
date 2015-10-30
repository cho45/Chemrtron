
indexer = {
	id: 'python2',
	name: 'Python 2',

	index : function (ctx) {
		return ctx.fetchDocument('https://docs.python.org/2/genindex-all.html').then(function (document) {
			var data = document.querySelectorAll('table.indextable td > dl > *');

			var dt;
			for (var i = 0, it; (it = data[i]); i++) {
				switch (it.nodeName) {
					case 'DT':
						dt = it.textContent.replace(/\(.+\)\s*$/, '');
						var a = it.querySelector('a');
						if (a) {
							ctx.pushIndex(a.textContent, a.href);
						}
						break;
					case 'DD':
						var links = it.querySelectorAll('a');
						for (var j = 0, link; (link = links[j]); j++) {
							ctx.pushIndex(dt + ' ' + link.textContent, link.href);
						}
						break;
				}
			}
		});
	}
};


