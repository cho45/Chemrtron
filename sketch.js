//#!node

var glob = require('glob');
var path = require('path');
var fs = require('fs');

var Indexer = {
	indexers : [],
	_indexersById: {}
};

glob('./indexers/*.js', {}, function (err, files) {
	if (err) {
		console.log(err);
		return;
	}

	for (var i = 0, it; (it = files[i]); i++) {
		var indexer = require(it);
		Indexer.indexers.push(indexer);
		if (indexer.init) {
			indexer.init();
		}
		Indexer._indexersById[indexer.id] = indexer;
		console.log('Indexer', indexer.name, indexer.id, 'is initialized');
	}

});

module.exports = Indexer;

// indexer はクロスオリジン特権が必要
// indexer はサンドボックス化されたウィンドウが必要
//
