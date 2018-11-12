#!/usr/bin/env node
const hd = require('heredoc');

var rules = {};
rules.zone = {
	pattern: hd.strip(function() {/*
		Zone\sdump\sof\s'([\w\s.-]+)/IN'
	*/}).replace(/\s*/g, ""),
	fields: [
		'zone'
	]
};
rules.dns = {
	pattern: hd.strip(function() {/*
		([a-z0-9.-]+)\s+(\d+)\s+(IN)\s+([A-Z]+)\s*
		([a-z\s0-9.-]*?)
		(?=\s*(?:
			[^a-z\s0-9.-]|
			[a-z0-9.-]+\s+\d+\s+IN\s+[A-Z]+
		)|$)
	*/}).replace(/\s*/g, ""),
	fields: [
		'key',
		'ttl',
		'view',
		'type',
		'value'
	]
};

module.exports = rules;

