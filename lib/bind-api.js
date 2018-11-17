#!/usr/bin/env node
const xzones = require('./drv.zones.js');
const xrecords = require('./drv.records.js');

// constructor
const drvZones = new xzones();
const drvRecords = new xrecords();
function dnsApi(opts) {
	this.options =  Object.assign({}, opts);
}
module.exports = dnsApi;
var self = dnsApi.prototype;

self.getZones = function() {
	return new Promise(function(resolve, reject) {
		drvZones.getZones().then((result) => {
			resolve(result);
		});
        });
}

self.addZone = function(zone, subnet) {
	return new Promise(function(resolve, reject) {
		drvZones.addZone(zone, subnet).then((result) => {
			resolve(result);
		});
        });
}

self.delZone = function(zone) {
	return new Promise(function(resolve, reject) {
		drvZones.delZone(zone).then((result) => {
			resolve(result);
		});
        });
}

self.addRecord = function(name, addr) {
	return new Promise(function(resolve, reject) {
		drvRecords.addRecord(name, addr).then((result) => {
			resolve(result);
		});
        });
}

self.expRecord = function() {
	return new Promise(function(resolve, reject) {
		drvRecords.exportRecord().then((result) => {
			resolve(result);
		});
        });
}

self.impRecord = function() {
	return new Promise(function(resolve, reject) {
		drvRecords.importRecord().then((result) => {
			resolve(result);
		});
        });
}

self.delRecord = function(name) {
	return new Promise(function(resolve, reject) {
		drvRecords.delRecord(name).then((result) => {
			resolve(result);
		});
        });
}

