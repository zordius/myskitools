#!/bin/sh
sed -i '' -e 's/mytracks://g; s/<extensions>//; s/<length>.*//; s/<.extensions>//' $1
