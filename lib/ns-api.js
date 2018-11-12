#!/usr/bin/env node
const execSync = require('child_process').execSync;
var hd = require('heredoc');

// constructor
var self = nsApi.prototype;
function nsApi(opts) {
        this.log = 0;
}
module.exports = nsApi;

// methods
self.cmd = function(cmd) {
	return new Promise(function(resolve, reject) {
		try {
			console.log(cmd);
	        	execSync(cmd);
			setTimeout(function() {
				resolve(true);
			}, 100);
		} catch(e) {
			if(e.stdout.toString().length > 0) {
				console.log(e.stdout.toString());
				reject(null);
			}
		}
	});
};

self.add = function(entry) {
	return new Promise(function(resolve, reject) {
		let spec = hd.strip(function () {/*
			nsupdate -l -v -4 <<-NSEOF
			update add <key> <ttl> <type> <value>
			send
			quit
			NSEOF*/}
		);
		spec = spec.replace(/<key>/g, entry.key);
		spec = spec.replace(/<ttl>/g, entry.ttl);
		spec = spec.replace(/<type>/g, entry.type);
		spec = spec.replace(/<value>/g, entry.value);
		self.cmd(spec).then((data) => {
			resolve(true);
		});
	});
};

self.del = function(entry) {
	return new Promise(function(resolve, reject) {
		let spec = hd.strip(function () {/*
			nsupdate -l -v -4 <<-NSEOF
			update delete <name>
			send
			quit
			NSEOF*/}
		);
		spec = spec.replace(/<name>/g, entry);
		self.cmd(spec).then((data) => {
			resolve(true);
		});
	});
};
