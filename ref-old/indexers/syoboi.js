indexer = {
	id: 'cal.syoboi.jp',
	name: 'しょぼいカレンダー',

	index : function (ctx) {
		return ctx.fetchJSON('http://cal.syoboi.jp/json.php?Req=TitleLarge').then(function (data) {
			var titles = data.Titles;
			for (var key in titles) if (titles.hasOwnProperty(key)) {
				var title = titles[key];
				var name = title.Title;
				if (title.TitleYomi) {
					name += " (" + title.TitleYomi + ")";
				}
				ctx.pushIndex(name, title.TID);
			}
		});

//		var list = [
//			'http://cal.syoboi.jp/list',
//			'http://cal.syoboi.jp/list?cat=10'
//		];
//
//		return ctx.crawl(list, function (url, document) {
//			var links = document.querySelectorAll('#TitleList a[href]');
//			for (var i = 0, it; (it = links[i]); i++) {
//				ctx.pushIndex(it.textContent, it.href);
//			}
//		});
	},

	item : function (item) {
		item[1] = "http://cal.syoboi.jp/tid/" + encodeURIComponent(item[1]);
		return item;
	}
};
