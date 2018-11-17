#!/usr/bin/env node
const execSync = require('child_process').execSync;
const hd = require('heredoc');
const xrndc = require('./rndc-api.js');
const xfile = require('./xfile.js');
const xzonedb = require('./xzonedb.js');

// colours
const chalk = require('chalk');
const red = chalk.bold.red;
const orange = chalk.keyword('orange');
const green = chalk.green;
const blue = chalk.blueBright;

// constructor
let args = process.argv.slice(2);
let rndc = new xrndc();
let file = new xfile();
let zonedb = new xzonedb();
let zoneDir = '/var/bind/';
function drvZones(opts) {
        this.cache = {};
}
let self = drvZones.prototype;
module.exports = drvZones;

// main
self.getZones = async function() { // make a generic 'flatten' function
	let data = await zonedb.load()
	let zoneData = [];
	for(let zone in data) {
		data[zone].forEach((item) => {
			zoneData.push(Object.assign({
				'zone':	zone,
			}, item));
		});
	}
	return zoneData;
};

self.addZone = async function(zone, subnet) {
	if(zone && subnet) {
		//console.log('[' + green('INFO') + ']: bind [' + green('zone.create') + '] zones [' + blue(zone) + ':' + blue(subnet) + ']');
		zone = await self.buildFwd(zone, subnet);
		zone = await self.buildRev(zone, subnet);
	} else {
		console.log('[' + red('ERROR') + ']: usage ' + blue('zone.create <name> <subnet>'));
	}
	return zone;
};

self.delZone = async function(zone) {
	if(zone) {
		zone = await self.deleteZone(zone);
	} else {
		console.log('[' + red('ERROR') + ']: usage ' + blue('zone.delete <name>'));
	}
	return zone;
};

self.buildFwd = function(zone, subnet) {
	return new Promise(function(resolve, reject) {
		var zoneBase = hd.strip(() => {/*
			$TTL 86400
			@ IN SOA ns1.<zone>. mail.<zone>. (
				100	; Serial
				3600	; Refresh
				1800	; Retry
				604800	; Expire
				86400	; Minimum TTL
			)
					IN	NS	ns1.<zone>.
		*/});
		var zoneFwd = hd.strip(() => {/*
			ns1		IN	A	<addr>
		*/});

		//let myAddr = findIp('8.8.8.8'); // route lookup for eth0 IP
		let myAddr = findIp('172.17.1.1'); // route lookup for eth0 IP
		zoneBase = zoneBase.replace(/<zone>/g, zone);
		zoneData = zoneFwd.replace(/<addr>/g, myAddr);

		let zoneName = zone;
		let fileName = zoneDir + zone + '.zone.fwd';
		let fileData = zoneBase + zoneData;

		// write, load and refresh zone
		self.createZone(zoneName, fileName, fileData).then((result) => {
			resolve(result);
		});
	});
};

self.buildRev = function(zone, subnet) {
	return new Promise(function(resolve, reject) {
		var zoneBase = hd.strip(() => {/*
			$TTL 86400
			@ IN SOA ns1.<zone>. mail.<zone>. (
				100	; Serial
				3600	; Refresh
				1800	; Retry
				604800	; Expire
				86400	; Minimum TTL
			)
					IN	NS	ns1.<zone>.
		*/});
		var zoneRev = hd.strip(() => {/*
			<host>		IN	PTR	ns1.<zone>.
		*/});

		//let myAddr = findIp('8.8.8.8'); // route lookup for eth0 IP
		let myAddr = findIp('172.17.1.1'); // route lookup for eth0 IP
		zoneBase = zoneBase.replace(/<zone>/g, zone);
		zoneData = zoneData.replace(/<host>/g, myAddr.match(/[^\.]+/g)[3]);
		zoneData = zoneData.replace(/<zone>/g, zone);

		let zoneName = subnet.match(/[^\.]+/g).splice(0,3).reverse().join('.') + '.in-addr.arpa';
		let fileName = zoneDir + zone + '.zone.rev';
		let fileData = zoneBase + zoneData;

		// write, load and refresh zone
		self.createZone(zoneName, fileName, fileData).then((result) => {
			resolve(result);
		});
	});
};

self.createZone = async function(zoneName, fileName, fileData) {
	let data = await zonedb.load()
	if(data && data[zoneName]) {
		console.log('[' + green('INFO') + ']: bind [' + green('zone.create') + '] zone [' + blue(zoneName) + '] exists!');
	} else {
		console.log('[' + green('INFO') + ']: bind [' + green('zone.create') + '] zone [' + blue(zoneName) + '] does not exist!');
		await file.write(fileName, fileData);
		await rndc.add(zoneName, fileName)
		console.log('[' + green('INFO') + ']: bind [' + green('zone.create') + '] zone [' + blue(zoneName) + '] created!');
		await zonedb.refresh();
	}
	return zoneName;
}

self.deleteZone = async function(zoneName) {
	let data = await zonedb.load()
	if(data && data[zoneName]) {
		console.log('[' + green('INFO') + ']: bind [' + green('zone.delete') + '] zone [' + blue(zoneName) + '] exists!');
		await rndc.del(zoneName);
		console.log('[' + green('INFO') + ']: bind [' + green('zone.delete') + '] zone [' + blue(zoneName) + '] deleted!');
		await zonedb.refresh();
	} else {
		console.log('[' + green('INFO') + ']: bind [' + green('zone.delete') + '] zone [' + blue(zoneName) + '] does not exist!');
	}
	return zoneName;
}

var findIp = function(addr) {
	let str = 'ip route get ' + addr;
	let srcIp = 0;
	try {
		let response = execSync(str).toString();
		srcIp = response.match(/src.([0-9\.]+)/)[1];
	} catch (ex) {
		console.log(ex.stdout.toString());
	}
	return srcIp;
};
