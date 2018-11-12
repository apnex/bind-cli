#!/usr/bin/env node
const execSync = require('child_process').execSync;
const hd = require('heredoc');
const xrndc = require('./rndc-api.js');
const xfile = require('./xfile.js');
const xzonedb = require('./xzonedb.js');

// constructor
let args = process.argv.slice(2);
let self = drvZones.prototype;
let rndc = new xrndc();
let file = new xfile();
let zonedb = new xzonedb();
let zoneDir = '/var/bind/';
function drvZones(opts) {
        this.cache = {};
}
module.exports = drvZones;

// main
self.getZones = async function() {
	let data = await zonedb.load()

	// make a generic 'flatten' function
	let zoneData = [];
	for(let zone in data) {
		data[zone].forEach((item) => {
			let record = Object.assign({
				'zone':	zone,
			}, item);
			zoneData.push(record);
		});
	}

	return zoneData;
};

self.addZone = async function(zone, subnet) {
	if(zone && subnet) {
		zone = await self.buildFwd(zone, subnet);
		//console.log('-- zone: [' + zone + '] creation complete!');
		zone = await self.buildRev(zone, subnet);
		//console.log('-- zone: [' + zone + '] creation complete!');
	}
	return zone;
};

self.delZone = async function(zone) {
	if(zone) {
		zone = await self.deleteZone(zone);
		//console.log('-- zone: [' + zone + '] deletion complete!');
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

		//let $myAddr = findIp('8.8.8.8'); // route lookup for eth0 IP
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
		var zoneRev = hd.strip(function () {/*
			<host>		IN	PTR	ns1.<zone>.
		*/});

		//let $myAddr = findIp('8.8.8.8'); // route lookup for eth0 IP
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
		console.log('-- zone: [' + zoneName + '] exists! --');
	} else {
		console.log('-- zone: [' + zoneName + '] does not exist!');
		let data = await file.write(fileName, fileData);
		console.log('-- zone: file [' + fileName + '] created --');
		await rndc.add(zoneName, fileName)
		console.log('-- zone: file [' + fileName + '] loaded --');
		await zonedb.refresh();
		console.log('-- zone: db update completed --');
	}
	return zoneName;
}

self.deleteZone = async function(zoneName) {
	let data = await zonedb.load()
	if(data && data[zoneName]) {
		console.log('-- zone: [' + zoneName + '] exists! --');
		await rndc.del(zoneName);
		console.log('-- zone: [' + zoneName + '] deleted --');
		await zonedb.refresh();
		console.log('-- zone: db update completed --');
	} else {
		console.log('-- zone: [' + zoneName + '] does not exist!');
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
