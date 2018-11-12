#!/bin/bash
echo "-- shutting down running containers --"
docker rm -f -v $(docker ps -qa) 2>/dev/null
echo "-- removing untagged containers --"
docker rmi -f $(docker images -q -f dangling=true) 2>/dev/null
#docker rmi -f $(docker images -a -q) 2>/dev/null
echo "-- removing orphaned volumes --"
docker rm -v $(docker ps -a -q -f status=exited) 2>/dev/null
