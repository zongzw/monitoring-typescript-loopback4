#!/bin/bash

cdir=`cd $(dirname $0); pwd`
echo $cdir

export ROOTDIR=$cdir
chmod -R 777 $ROOTDIR/data/grafana
docker-compose -f $ROOTDIR/docker-compose.yml up -d --force-recreate

