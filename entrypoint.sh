#!/bin/sh

function start {
	ln -s /root/dnsctl-rec-add.js /usr/sbin/rec-add
	ln -s /root/dnsctl-rec-del.js /usr/sbin/rec-del
	ln -s /root/dnsctl-zone-add.js /usr/sbin/zone-add
	ln -s /root/dnsctl-zone-del.js /usr/sbin/zone-del
	ln -s /root/dnsctl-list.js /usr/sbin/list
	ln -s /root/dnsctl-load.js /usr/sbin/load
	ln -s /root/help.sh /usr/sbin/help
	/usr/sbin/named
	sleep 1
	/root/dnsctl-zone-add.js rhino.local 192.168.10.0
	sleep 1
	/root/dnsctl-load.js
	tail -f /var/log/named.log
}

function shell {
	/bin/sh
}

if [ -z "$1" ]
then
	start
else
	case $1 in
		shell)
			shell
		;;
		*)
			start
		;;
	esac
fi


