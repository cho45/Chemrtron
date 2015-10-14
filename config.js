
var path = require('path');
var os = require('os');

var home = path.join(os.homedir(), '.chemr');

module.exports = {
	DEBUG: false,
	cachePath: path.join(home, 'cache'),
	indexerPath: path.join(home, 'indexers'),
	root: __dirname
};

