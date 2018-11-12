#!/usr/bin/env node
const execSync = require('child_process').execSync;
const xnsupdate = require('./ns-api.js');
const xzonedb = require('./xzonedb.js');

// constructor
var self = drvRecords.prototype;
var nsupdate = new xnsupdate();
var zonedb = new xzonedb();
function drvRecords(opts) {
	this.log = 0;
}
module.exports = drvRecords;

// main
self.addRecord = async function(name, addr) {
	if(name && addr) {
		await nsupdate.add({ // forward entry
			key: name,
			ttl: "86400",
			type: "A",
			value: addr
		});
		await nsupdate.add({ // reverse entry
			key: (addr.match(/[^\.]+/g).reverse().join('.') + '.in-addr.arpa'),
			ttl: "86400",
			type: "PTR",
			value: name
		});
	}
	return true;
}

self.delRecord = async function(key) {
	if(key) {
		let data = await zonedb.load()
		if(data) {
			await nsupdate.del(key);
			return true;
		}
	}
}
