#!/usr/bin/env node
const fs = require('fs');
const hd = require('heredoc');
const xrules = require('./xrules.js');

// constructor
var self = xzone.prototype;
function xzone($opts) {
	//this.cache = {};
}
module.exports = xzone;

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
					for(let key in vals) {
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
