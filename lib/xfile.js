#!/usr/bin/env node
var fs = require('fs');

// constructor
var self = xfile.prototype;
function xfile($opts) {
        this.log = 0;
}
module.exports = xfile;

// main
self.read = function(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file, 'utf8', (err, data) => {
			//setTimeout(function() {
				resolve(data);
			//}, 100);
		});
	});
};

self.write = function(file, string) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(file, string, 'utf8', (err) => {
			//setTimeout(function() {
				resolve(file);
			//}, 100);
		});
	});
};
