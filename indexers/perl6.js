indexer = {
	id: 'perl6',
	name: 'Perl6',
	icon: 'http://doc.perl6.org/images/camelia-small.png',
	copyright: 'This documentation is provided under the terms of the Artistic License 2.0. The Camelia image is copyright 2009 by Larry Wall.',

	index : function (ctx) {
		var targets = [
			'http://doc.perl6.org/language.html',
			'http://doc.perl6.org/type.html',
			'http://doc.perl6.org/routine.html'
		];

		return ctx.crawl(targets, function (url, document) {
			var links = Array.prototype.filter.call(document.querySelector('div nav').parentNode.querySelectorAll('table td'), function(n) { return n.parentNode.querySelector('td:nth-child(2)')==n; }).map(function(n) { return n.querySelector('a[href]'); })
			for (var i = 0, it; (it = links[i]); i++) {
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};

