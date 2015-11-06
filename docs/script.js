(function () {
	// code highlight
	var definition = [
		{
			name: 'identifier',
			match: /^[A-Za-z0-9_]+(?=\s*[:\(])/
		},
		{
			name: 'string',
			match: /'(?:[^']|\\')+'|"(?:[^"]|\\")+"/
		},
		{
			name: 'keyword',
			match: /function|return|true|false/
		},
		{
			name: 'type',
			match: /Array|Object|String|Promise|string|number|void|null|any|XMLHttpRequest|HTMLDocument|IndexerContext|Item/
		}
	];

	var re = new RegExp('(' + definition.map(function (x) { return x.match.source }).join(')|(') +')', 'g');
	
	var nodes = document.querySelectorAll('code');
	for (var i = 0, it; (it = nodes[i]); i++) {
		var text = it.textContent;
		var html = '';
		var matched, last = 0;
		while ((matched = re.exec(text)) !== null) {
			html += escapeHTML(text.substring(last, matched.index));
			last = matched.index + matched[0].length;
			for (var j = 1, len = matched.length; j < len; j++) {
				if (matched[j]) {
					html += '<span class="' + definition[j-1].name + '">' + escapeHTML(matched[0]) + '</span>';
					break;
				}
			}
		}
		html += escapeHTML(text.substring(last));

		it.innerHTML = html;
	}

	function escapeHTML (str) {
		return str.replace(/[<>&]/g, function (_) {
			return {
				'<' : '&lt;',
				'>' : '&gt;',
				'&' : '&amp;'
			}[_];
		});
	}
})();
