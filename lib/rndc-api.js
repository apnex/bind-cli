#!/usr/bin/env node
const execSync = require('child_process').execSync;
const hd = require('heredoc');

// constructor
function rndcApi($opts) {
	this.log = 0;
}
module.exports = rndcApi;
var self = rndcApi.prototype;

// methods
self.cmd = function(cmd) {
	return new Promise(function(resolve, reject) {
		try {
			//console.log(cmd)
	        	execSync(cmd);
			setTimeout(function() {
				resolve(true);
			}, 50);
		} catch(e) {
			if(e.stdout.toString().length > 0) {
				console.log(e.stdout.toString());
				reject(null);
			}
		}
	});
};

self.add = function(zone, file) {
	return new Promise(function(resolve, reject) {
		if(zone && file) {
		        var spec = hd.strip(() => {/*
				rndc addzone "<zone>" '{ type master; file "<file>"; update-policy local; };'*/}
			);
			spec = spec.replace(/<zone>/g, zone);
			spec = spec.replace(/<file>/g, file);
			self.cmd(spec).then((data) => {
				resolve(true);
			});
		}
	});
};

self.del = function(zone) {
	return new Promise(function(resolve, reject) {
		if(zone) {
			var spec = hd.strip(() => {/*
				rndc sync -clean
				rndc delzone -clean <zone>*/}
			);
			spec = spec.replace(/<zone>/g, zone);
			self.cmd(spec).then((data) => {
				resolve(true);
			});
		}
	});
};

self.dump = function() {
	return new Promise(function(resolve, reject) {
		var spec = hd.strip(() => {/*
			rndc dumpdb -zones*/}
		);
		self.cmd(spec).then((data) => {
			resolve(true);
		});
	});
};
