#!/usr/bin/env node
const xfile = require('./xfile.js');
const rndcApi = require('./rndc-api.js');
const xrules = require('./xrules.js');

// constructor
const args = process.argv.slice(2);
const file = new xfile();
const rndc = new rndcApi();
function zoneDb(opts) {
	this.log = 0;
	this.dir = './';
}
module.exports = zoneDb;
var self = zoneDb.prototype;

// main
var bindDir = '/var/bind/';
self.refresh = async function() {
	await rndc.dump();
	let data = await file.read(bindDir + 'named_dump.db');
	let schema = await self.parse(data);
	await file.write(bindDir + 'zonedb.json', JSON.stringify(schema, null, 4));
	return schema;
};

self.load = function() {
	return new Promise(function(resolve, reject) {
		self.refresh().then((data) => {
			//console.log('load test');
			//console.log(JSON.stringify(data, null, "\t"));
			resolve(data);
		});
	});
};

self.parse = function(data) {
	return new Promise(function(resolve, reject) {
		data = data.replace(/\s+/g, " ");
		let rule = new RegExp('(?:' + xrules.zone.pattern + ')|(?:' + xrules.dns.pattern + ')', "g");
		let fields = [ // update to perform field merge
			'zone',
			'key',
			'ttl',
			'view',
			'type',
			'value'
		];
		let match;
		let zone;
		let tables = {};
		while(match = rule.exec(data)) {
			let vals = match.slice(1);
			if(vals[0]) {
				zone = vals[0];
			}
			if(vals[1]) {
				if(zone) {
					let entry = {};
					for(let key in vals) { // an index
						if(vals[key]) {
							entry[fields[key]] = vals[key];
						}
					}
					if(!tables[zone]) {
						tables[zone] = [];
					}
					tables[zone].push(entry);
				}
			}
		}
		resolve(tables);
	});
}
