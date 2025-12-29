indexer = {
	id: 'arduino',
	name: 'Arduino',
	color: '#00979C',

	index : function (ctx) {
		return ctx.crawl([
			"https://www.arduino.cc/en/Reference/HomePage",
			"https://www.arduino.cc/en/Reference/Libraries"
		], function (url, document) {
			Array.prototype.map.call(document.querySelectorAll('#wikitext .wikilink'), function (el) {
					ctx.pushIndex(el.textContent, el.href);
			});
		});
	}
};

