export default {
	id: 'mysql',
	name: 'MySQL',
	color: '#e97b00',

	index : function (ctx) {
		return ctx.fetchDocument('https://dev.mysql.com/doc/refman/8.0/en/').then(function (document) {
			var links = document.querySelectorAll('#tocdetail a[href]');
			for (var i = 0, it; (it = links[i]); i++) {
				if (it.className == 'tocdetail') continue;
				ctx.pushIndex(it.textContent, it.href);
			}
		});
	}
};



