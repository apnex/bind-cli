#!/usr/bin/env node
const args = process.argv;
const xzones = require('./drv.zones.js');
const xrecords = require('./drv.records.js');

// constructor
function dnsApi(opts) {
	this.options =  Object.assign({}, opts);
}
module.exports = dnsApi;
var self = dnsApi.prototype;
var drvZones = new xzones();
var drvRecords = new xrecords();

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

self.delRecord = function(name) {
	return new Promise(function(resolve, reject) {
		drvRecords.delRecord(name).then((result) => {
			resolve(result);
		});
        });
}

