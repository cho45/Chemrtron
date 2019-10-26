export default {
	id: 'html',
	name: 'HTML Standard',
	logo: 'http://www.w3.org/html/logo/downloads/HTML5_Logo_512.png',
	copyright: 'The logo, icons, and website are licensed under Creative Commons Attribution 3.0 Unported\nhttp://www.w3.org/html/logo/faq.html#how-licenced',

	index : function (ctx) {
		return ctx.fetchDocument('https://html.spec.whatwg.org/multipage/').then(function (document) {
			var links = document.querySelectorAll('ol.toc a[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};


