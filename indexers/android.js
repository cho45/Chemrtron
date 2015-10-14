indexer = {
	id: 'android',
	name: 'Android',
	icon: 'http://developer.android.com/images/brand/Android_Robot_100.png',
	copyright: 'The Android robot is reproduced or modified from work created and shared by Google and used according to terms described in the Creative Commons 3.0 Attribution License. http://developer.android.com/distribute/tools/promote/brand.html',

	index : function (ctx) {
		var targets = [
			'http://developer.android.com/reference/packages.html',
			'http://developer.android.com/reference/classes.html'
		];

		return ctx.crawl(targets, function (url, document) {
			var links = document.querySelectorAll('#jd-content .jd-linkcol a[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};

