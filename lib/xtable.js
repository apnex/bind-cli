#!/usr/bin/env node
var xcell = require('./xcell.js');
var self = xtable.prototype;

// constructor
function xtable(opts) { // Object.assign?
	this.cache = {};
	this.view = [];
	this.header = opts.header;
	this.cell = new xcell({
		data: opts.data
	});
	this.data = this.cell.data;
	this.filters = [];
}
module.exports = xtable;

self.out = function(cols) {
	if(this.cell.data.length > 0) {
		if(!this.header) {
			// learn cols from first data record if no header defined
			this.header = [];
			for(let item in this.cell.data[0]) {
				this.header.push(item);
			}
		}
		if(!cols) {
			cols = this.header;
		}
		var col = {};
		for(let item of cols) {
			col[item] = item;
		}
		this.runColWidth(col);

		// scan widths data
		if(this.view.length == 0) {
			this.run();
		}
		for(let item of this.view) { // map?
			this.runColWidth(item);
		}

		// build string header
		let headString = '';
		let dashString = '';
		let spacer = ' ';
		//for(let item of cols) { // map?
		cols.map((item) => { // map?
			headString += item + spacer.repeat(this.cache[item] - item.length + 2); // remove 2 space at end?
			dashString += '-'.repeat(this.cache[item]) + spacer.repeat(2);
		});
		console.log(headString);
		console.log(dashString);

		// build string data
		for(let item of this.view) {
			let dataString = '';
			for(let col of cols) {
				if(item[col]) {
					dataString += item[col] + spacer.repeat(this.cache[col] - item[col].length + 2);
				} else {
					dataString += spacer.repeat(this.cache[col] + 2);
				}
			}
			console.log(dataString);
		}
	}
}

// determine maximum string length for column
self.runColWidth = function(item) {
	for(let key in item) {
		if(item[key]) {
			if(!this.cache[key] || this.cache[key] < item[key].length) {
				this.cache[key] = item[key].length;
			}
		}
        }
};

// stringify this.filters[];
self.filterString = function() {
	let string = '';
	let comma = '';
	this.filters.map((filter) => {
		string += comma + filter.field + ':' + filter.value;
		comma = ',';
	});
	return string;
};

// parse and construct filter objects
self.buildFilters = function(string) {
	let filters = [];
	var rgxFilter = new RegExp('([^,:]+):([^,:]*)', 'g');
	while(m = rgxFilter.exec(string)) {
		let val1 = m[1];
		let val2 = m[2];
		filters.push({
			field: val1,
			value: val2
		});
	}
	if(filters.length == 0) {
		if(!string) string = '';
		filters.push({
			field: 'key', // need to move this default into opts
			value: string
		});
	}
	filters.forEach((filter) => {
		this.addFilter(filter);
	});
};

// add map
self.addMap = function(field, mapper) {
	this.cell.addMap(field, mapper);
	return this;
};

// add filter
self.addFilter = function(filter) {
	this.filters.push(filter);
	this.cell.addFilter(filter);
	return this;
};

// filter and transform current view
self.run = function(data = this.data) {
	this.view = this.cell.run(data);
};
