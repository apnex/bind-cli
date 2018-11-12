#!/usr/bin/env node
var xdns = require('./dnsctl-rec-add.js');
var xzonedb = require('./xzonedb.js');
var args = process.argv.slice(2);
var async = require('async');

var $name = './zones.json';
var $dns = new xdns();
var $zonedb = new xzonedb();
if(args[0]) {
	$name = './' + args[0];
}
try {
	async.series([
		function($cb) {
			var zones = require($name);
			for(var dItem of zones) {
				console.log('Zone Name: ' + dItem.name);
				for(var eItem of dItem.nodes) {
					let $item = eItem.name + '.' + dItem.name;
					console.log($item + ' : ' + eItem.address);
					$dns.add($item, eItem.address);
				}
			}
			$cb(null); //wont work - no anchor for callback
		},
		function($cb) {
			setTimeout(function() {
				$zonedb.refresh($cb);
			}, 100);
		}
	]);
} catch(err) {
	console.log('-- warning: [' + $name + '] not found or contains errors!');
	console.log(err);
}
