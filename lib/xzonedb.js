#!/usr/bin/env node
const xzone = require('./xzone.js');
const xfile = require('./xfile.js');
const rndcApi = require('./rndc-api.js');

// constructor
var args = process.argv.slice(2);
let zone = new xzone();
let file = new xfile();
let rndc = new rndcApi();
module.exports = zoneDb;
function zoneDb($opts) {
	this.log = 0;
	this.dir = './';
}
var self = zoneDb.prototype;

// main
var bindDir = '/var/bind/';
self.refresh = async function() {
	await rndc.dump();
	let data = await file.read(bindDir + 'named_dump.db');
	let schema = await zone.parse(data);
	await file.write(bindDir + 'zonedb.json', JSON.stringify(schema, null, 4));
	return;
};

self.load = function() {
	return new Promise(function(resolve, reject) {
		self.refresh().then(() => {
			resolve(require(bindDir + 'zonedb.json'));
		});
	});
};
