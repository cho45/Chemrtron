indexer = {
	id: 'arduino',
	name: 'Arduino',

	index : function (ctx) {
		console.log("Arduino");
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

