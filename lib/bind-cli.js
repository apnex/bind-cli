#!/usr/bin/env node
const args = process.argv;
const xtable = require('./xtable.js'); // view
const dnsApi = require('./bind-api.js'); // login, getFiles, build downloadURL, indexing
const client = new dnsApi();

// called from shell
if(args[1].match(/bind-cli/g)) {
	switch(args[2]) {
		case 'list':
			list();
		break;
		case 'zone.list':
			zoneList(args[3]);
		break;
		case 'zone.create':
			zoneCreate(args[3], args[4]);
		break;
		case 'zone.delete':
			zoneDelete(args[3]);
		break;
		case 'record.create':
			recordCreate(args[3], args[4]);
		break;
		case 'record.delete':
			recordDelete(args[3]);
		break;
		default:
			console.log('No command specified - type <list> for help');
	}
}

// build, filter and output table to stdout
function list(string) {
	let cmds = [
		'list',
		'zone.list',
		'zone.create',
		'zone.delete',
		'record.create',
		'record.delete'
	];
	process.stdout.write(cmds.join(' '));
}

// build, filter and output table to stdout
function zoneList(string) {
	filter(string).then((table) => {
		table.out([
			'zone',
			'key',
			'ttl',
			'view',
			'type',
			'value'
		]);
		console.log('[ ' + table.view.length + '/' + table.data.length + ' ] entries - filter [ ' + table.filterString() + ' ]');
	});
}

// load data and filter table
function filter(string) {
	return new Promise(function(resolve, reject) {
		client.getZones().then((data) => {
			let table = new xtable({data});
			table.buildFilters(string);
			table.run();
			resolve(table);
		});
	});
}

// cmds
function zoneCreate(zone, subnet) {
	client.addZone(zone, subnet).then((data) => {
		console.log('Finished CMD zone.create');
	});
}

function zoneDelete(zone) {
	client.delZone(zone).then((data) => {
		console.log('Finished CMD zone.delete');
	});
}

function recordCreate(name, addr) {
	client.addRecord(name, addr).then((data) => {
		console.log('Finished CMD record.create');
	});
}

function recordDelete(name) {
	client.delRecord(name).then((data) => {
	        console.log('Finished CMD record.delete');
	});
}

