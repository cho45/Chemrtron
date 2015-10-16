//#!node

var fs = require('fs');
var glob = require('glob');
var path = require('path');

glob(__dirname + '/../indexers/*.js', {}, function (err, files) {
	if (err) throw err;
	for (var i = 0, it; (it = files[i]); i++) {
		var content = fs.readFileSync(it, "utf-8");
		var data = eval(content + "\n//# sourceURL=" + it);

		var name = data.name;
		var url = 'https://github.com/cho45/Chemrtron/tree/master/indexers/' + path.basename(it);
		console.log('<a href="' + url + '">' + name + '</a>');
	}
});


