
indexer = {
	id: 'lua',
	name: 'Lua',

	index : function (ctx) {
		return ctx.fetchDocument('http://www.lua.org/manual/5.3/').then(function (document) {

			var links = document.querySelectorAll('table.menubar a');
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};


