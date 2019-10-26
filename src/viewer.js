
import { Chemr } from "esm://src/chemr.js";

new Vue({
	el: '#app',
	data: {
		hello: "world",
	},
	methods: {
	},
	mounted: function () {
		console.log('mounted');
		console.log({Chemr});
	}
});
