#!/bin/sh
FIRST=1

# JAPAN timezone
ISJPN="+09:00"

BASEDIR=$(dirname "$0")

for filename in $(ls -tr *.MP4); do
 echo Fix $filename datetime...
 exiftool "-FileModifyDate<\${MediaCreateDate}$ISJPN" $filename
 exiftool -FileModifyDate -MediaCreateDate $filename
 echo Extract $filename...
 HeroineCLI $filename
 rm $filename.KML
 $BASEDIR/../gpx-stabilizer/fix.js $filename.GPX
 if [ $FIRST -eq 1 ]; then
   FN=$filename.all.gpx
   FN2=$filename.all.fixed.gpx
   head -20 $filename.GPX > $FN
   echo '  <trkseg>' > $FN
   head -2 $filename.GPX.fixed.gpx > $FN2
   FIRST=0
 fi
 grep '<trkpt' -B0 -A3 $filename.GPX | grep -v '\-\-' >> $FN
 grep '<trkpt' -B0 -A2 $filename.GPX.fixed.gpx | grep -v '\-\-' >> $FN2
done

echo '  </trkseg></trk></gpx>' >> $FN
echo '    </trkseg></trk></gpx>' >> $FN2
