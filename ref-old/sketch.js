//#!node

var glob = require('glob');
var path = require('path');
var fs = require('fs');

var sections = [];

var lines = fs.readFileSync('./CREDITS', 'utf-8').split(/\n/);
var current;
for (var i = 0, len = lines.length; i < len; i++) {
	var matched;
	if ((matched = lines[i].match(/^## (.+)/))) {
		if (current) {
			sections.push(current);
		}
		current = {
			name : matched[1],
			content: []
		};
	} else {
		current.content.push(lines[i]);
	}
}

console.log(sections);
