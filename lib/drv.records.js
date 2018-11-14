#!/usr/bin/env node
const xzonedb = require('./xzonedb.js');
const xnsupdate = require('./nsupdate-api.js');
const xcell = require('./xcell.js');

// constructor
const zonedb = new xzonedb();
const nsupdate = new xnsupdate();
function drvRecords(opts) {
	this.log = 0;
}
module.exports = drvRecords;
var self = drvRecords.prototype;

// main
self.addRecord = async function(name, addr) {
	if(name && addr) {
		console.log("[INFO]: bind [records.create] records [" + name + ":" + addr + "]");
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
		await zonedb.refresh();
		console.log("[INFO]: bind [records.delete] records [" + key + "]");
		await nsupdate.del({
			key: key
		});
	}
	await self.syncPtr();
	return true;
}

self.syncPtr = async function() {
	// flatten data
	let data = await zonedb.load();
	let zoneData = [];
	for(let zone in data) {
		data[zone].forEach((item) => {
			zoneData.push(Object.assign({
				'zone':	zone,
			}, item));
		});
	}

	// build cells
	let cellA = new xcell({
		data: zoneData
	});
	cellA.addFilter({
		field: 'type',
		value: '^A$'
	});
	let cellPtr = new xcell({
		data: zoneData
	});
	cellPtr.addFilter({
		field: 'type',
		value: 'PTR'
	});

	// index
	let cache = [];
	cellA.run().forEach((item) => {
		cache[item.key] = 1;
	});

	// delete
	for(let item of cellPtr.run()) {
		if(!cache[item.value]) {
			console.log('[INFO]: record PTR [' + item.key + '] has no A record - deleting');
			await nsupdate.del({
				key: item.key
			});
		}
	}
	return true;
}
