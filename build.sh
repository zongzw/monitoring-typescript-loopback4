#!/bin/bash 

cdir=`cd $(dirname $0); pwd`
tdir=$cdir/release-package
mkdir -p $tdir
rm -rf $tdir/*

for n in data start.sh docker-compose.yml; do 
    echo $cdir/$n; 
    cp -r $cdir/$n $tdir
done

