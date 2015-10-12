//#!node

var glob = require('glob');
var path = require('path');
var fs = require('fs');

var Indexer = {
	indexers : [],
	_indexersById: {}
};

glob('/usr/share/man/man?/*', {}, function (err, files) {
	if (err) {
		console.log(err);
		return;
	}

	for (var i = 0, it; (it = files[i]); i++) {
		console.log(it);
	}

});

