#!/usr/bin/env node
const xzonedb = require('./xzonedb.js');
const xnsupdate = require('./nsupdate-api.js');
const xcell = require('./xcell.js');
const xzones = require('./drv.zones.js');

// colours
const chalk = require('chalk');
const red = chalk.bold.red;
const orange = chalk.keyword('orange');
const green = chalk.green;
const blue = chalk.blueBright;

// constructor
const zonedb = new xzonedb();
const nsupdate = new xnsupdate();
const drvZones = new xzones();
function drvRecords(opts) {
	this.log = 0;
}
module.exports = drvRecords;
var self = drvRecords.prototype;

// main
self.addRecord = async function(name, addr) {
	if(name && addr) {
		console.log('[' + green('INFO') + ']: bind [' + green('record.create') + '] records [' + blue(name) + ':' + blue(addr) + ']');
		let zoneName = name.split('.').splice(1).join('.')
		await drvZones.addZone(zoneName, addr);
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
	} else {
		console.log('[' + red('ERROR') + ']: usage ' + blue('record.create <name> <addr>'));
	}
	return true;
}

self.exportRecord = async function() {
	let zoneData = await drvZones.getZones();
	let cell = new xcell({
		data: zoneData
	});
	cell.addFilter({
		field: 'type',
		value: '^A$'
	});
	cell.addFilter({
		field: 'key',
		value: '^(?!ns1\.).*$'
	});

	let data = [];
	cell.run().forEach((item) => {
		data.push({
			name: item.key,
			addr: item.value
		});
	});
	console.log(JSON.stringify(data, null, "\t"));
	return data;
}

self.importRecord = async function() {
	let records = require('./records.json');
	for(let item of records) {
		await self.addRecord(item.name, item.addr);
	}
	return records;
}

self.delRecord = async function(key) {
	if(key) {
		await zonedb.refresh();
		console.log('[' + green('INFO') + ']: bind [' + green('record.delete') + '] records [' + blue(key) + ']');
		await nsupdate.del({
			key: key
		});
	} else {
		console.log('[' + red('ERROR') + ']: usage ' + blue('record.delete <name>'));
	}

	await self.syncPtr();
	await self.syncZone();
	return true;
}

self.syncPtr = async function() {
	// build cells
	let zoneData = await drvZones.getZones();
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
			console.log('[' + green('INFO') + ']: PTR [' + green(item.key) + '] has no A record - deleting');
			await nsupdate.del({
				key: item.key
			});
		}
	}
	return true;
}

self.syncZone = async function() {
	let data = await zonedb.load();
	let zoneData = await drvZones.getZones();

	for(let zone in data) {
		if(zone.match(new RegExp('.in-addr.arpa$', 'i'))) {
			let cellA = new xcell({
				data: zoneData
			});
			cellA.addFilter({
				field: 'zone',
				value: zone
			});
			cellA.addFilter({
				field: 'type',
				value: 'PTR'
			});
			if(cellA.run().length == 0) { // zone empty
				console.log('[' + green('INFO') + ']: zone [' + green(zone) + '] has no PTR record - deleting');
				await drvZones.delZone(zone);
			}
		}
		if(zone.match(new RegExp('(?<!.in-addr.arpa)$', 'i'))) {
			let cellB = new xcell({
				data: zoneData
			});
			cellB.addFilter({
				field: 'zone',
				value: zone
			});
			cellB.addFilter({
				field: 'type',
				value: '^A$'
			});
			cellB.addFilter({
				field: 'key',
				value: '^(?!ns1\.).*$'
			});
			if(cellB.run().length == 0) { // zone empty
				console.log('[' + green('INFO') + ']: zone [' + green(zone) + '] has no A record - deleting');
				await drvZones.delZone(zone);
			}
		}
	}
	return true;
}
