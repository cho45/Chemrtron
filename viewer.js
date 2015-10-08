var remote = require('remote');
var ipc = require('ipc');
var Channel = require('./channel');

Chemr.IPC = new Channel({
	recv : function (callback) {
		ipc.on('viewer', function (args) {
			console.log('[viewer]', args);
			callback(args);
		});
	},

	send : function (args) {
		ipc.send('viewer', args);
	},

	notification : function (args) {
		console.log(args);
	}
});

window.onload = function () {
	var frame = document.getElementById('frame');
	frame.onload = function () {
		console.log('onload');
	};

	window.onkeydown = function (e) {
		console.log(e);
		var key = (e.altKey?"Alt-":"")+(e.ctrlKey?"Control-":"")+(e.metaKey?"Meta-":"")+(e.shiftKey?"Shift-":"")+e.key;   

		if (key === 'Meta-l') {
			input.focus();
		}
	};

	var select = document.getElementById('select');
	select.onchange = function () {
		var option = select.childNodes[select.selectedIndex];
		var url = option.value;
		frame.src = url;
	};

	var input = document.getElementById('input');
	input.onkeydown = function (e) {
		var key = (e.altKey?"Alt-":"")+(e.ctrlKey?"Control-":"")+(e.metaKey?"Meta-":"")+(e.shiftKey?"Shift-":"")+e.key;   

		if (key === 'Enter') {
			e.preventDefault();
		} else 
		if (key === 'Control-n' || key === 'ArrowDown') {
			e.preventDefault();

			var option = select.childNodes[select.selectedIndex + 1]; // no warnings
			if (option) option.selected = true;
			select.onchange();
		} else
		if (key === 'Control-p' || key === 'ArrowUp') {
			e.preventDefault();

			var option = select.childNodes[select.selectedIndex - 1]; // no warnings
			if (option) option.selected = true;
			select.onchange();
		} else
		if (key === 'Tab') {
			e.preventDefault();

			// complete common match
			var option = select.childNodes[select.selectedIndex + 1]; // no warnings
			if (option) {
				input.value = option.title;
			}
		}


		setTimeout(function () {
			if (input.prevValue !== input.value) {
				input.prevValue = input.value;
				search();
			}
		}, 0);
	};

	var index = Chemr.Index.byId('nodejs').then(function (index) { return index.openIndex({ reindex: false }) });
	search();

	function search () {
		index.then(function (index) {
			index.search(input.value).then(function (res) {
				select.innerHTML = '';
				for (var i = 0, len = res.length; i < len; i++) {
					var item = res[i];
					var option = document.createElement('option');
					option.innerHTML = item[2] + (Chemr.DEBUG ? '<div class="info">[' + item.score + '] ' + item[1] + '</div>' : '');
					option.value     = item[1];
					option.title     = item[0];
					select.add(option, null);
				}
			});
		});
	}
};
