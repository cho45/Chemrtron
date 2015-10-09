indexer = {
	id: 'ecma-262-3rd-ja',
	name: 'ECMAScript 3rd JA',

	index : function (page, document) {
		return this.fetchDocument("http://www2u.biglobe.ne.jp/~oz-07ams/2002/ecma262r3/fulltoc.html").then(function (document) {
			var ret = "";
			var anchors  = $X(".//dt/a", document, Array);
			var index    = new Array(anchors.length);
			for (var i = 0, len = index.length; i < len; i++) {
				var a    = anchors[i];
				var name = $X(".", a, String).replace(/^[\d\s.]*/, "");
				var url  = a.href;
				ret += name + "\t" + url + "\n";
			}
			return ret;
		});
	}
};

