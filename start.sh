#!/bin/bash
touch /etc/resolv.conf
echo "-- shutting down running containers --"
docker rm -f -v $(docker ps -q) 2>/dev/null
echo "-- removing untagged containers --"
docker rmi -f $(docker images -q --filter dangling=true) 2>/dev/null
echo "-- removing orphaned volumes --"
docker rm -f $(docker ps -qa -f status=exited) 2>/dev/null

echo "-- starting constellation --"
docker run -d -P --net host \
	-v ${PWD}:/root/code \
	--name dns apnex/bind-cli
