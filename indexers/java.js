indexer = {
	id: 'javase',
	name: 'Java SE',

	index : function (ctx) {
		var hrefs = [];
		for (var i = 1; i <= 27; i++) {
			hrefs.push('http://docs.oracle.com/javase/8/docs/api/index-files/index-'+i+'.html');
		}

		return ctx.crawl(hrefs, function (url, document) {
			var dtList = document.querySelectorAll('.contentContainer dl dt');
			for (var i = 0, it; (it = dtList[i]); i++) {
				var nameLink = it.querySelector('a[href]');
				if (!nameLink) continue;
				ctx.pushIndex(it.textContent, nameLink.href);
			}
		});
	}
};



