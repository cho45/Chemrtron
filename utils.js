var http = function (opts) {
	return new Promise(function (resolve, reject) {
		var req = new XMLHttpRequest();
		req.overrideMimeType("text/plain; charset=" + document.characterSet);
		req.open(opts.method, opts.url, true);
		if (opts.headers) {
			for (var k in opts.headers) if (opts.headers.hasOwnProperty(k)) {
				req.setRequestHeader(k, opts.headers[k]);
			}
		}
		req.onreadystatechange = function () {
			if (req.readyState == 4) resolve(req);
		};
		req.onerror = function () {
			reject(req);
		};
		req.send(opts.data || null);
	});
};
http.get   = function (url)       { return http({method:"get",  url:url}) };
http.post  = function (url, data) { return http({method:"post", url:url, data:data, headers:{"Content-Type":"application/x-www-form-urlencoded"}}) };


function escapeHTML (t) {
	return t.replace(/[&<>]/g, function (_) { return {'&':'&amp;','<':'&lt;','>':'&gt;'}[_] });
}

// extend version of $X
// $X(exp);
// $X(exp, context);
// $X(exp, type);
// $X(exp, context, type);
function $X (exp, context, type /* want type */) {
	if (typeof context == "function") {
		type    = context;
		context = null;
	}
	if (!context) context = document;
	exp = (context.ownerDocument || context).createExpression(exp, function (prefix) {
		var o = document.createNSResolver(context)(prefix);
		if (o) return o;
		return (document.contentType == "application/xhtml+xml") ? "http://www.w3.org/1999/xhtml" : "";
	});

	switch (type) {
		case String:  return exp.evaluate(context, XPathResult.STRING_TYPE, null).stringValue;
		case Number:  return exp.evaluate(context, XPathResult.NUMBER_TYPE, null).numberValue;
		case Boolean: return exp.evaluate(context, XPathResult.BOOLEAN_TYPE, null).booleanValue;
		case Array:
			var result = exp.evaluate(context, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
			for (var ret = [], i = 0, len = result.snapshotLength; i < len; i++) {
				ret.push(result.snapshotItem(i));
			}
			return ret;
		case undefined:
			var result = exp.evaluate(context, XPathResult.ANY_TYPE, null); // no warnings
			switch (result.resultType) {
				case XPathResult.STRING_TYPE : return result.stringValue;
				case XPathResult.NUMBER_TYPE : return result.numberValue;
				case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
				case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
					// not ensure the order.
					var ret = [], i = null; // no warnings
					while ((i = result.iterateNext())) ret.push(i);
					return ret;
			}
			return null;
		default: throw(TypeError("$X: specified type is not valid type."));
	}
}


function serializeError (e) {
	console.log('serializeError', e, e.stack);
	var stack = e.stack;
	return {
		name : String(e),
		stack : e.stack
	};
}
