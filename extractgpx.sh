#!/bin/sh
FIRST=1

# JAPAN timezone
ISJPN="+09:00"

for filename in $(ls -tr *.MP4); do
 echo Fix $filename datetime...
 exiftool "-FileModifyDate<\${MediaCreateDate}$ISJPN" $filename
 exiftool -FileModifyDate -MediaCreateDate $filename
 echo Extract $filename...
 HeroineCLI $filename
 rm $filename.KML
 ~/gpx-stabilizer/fix.js $filename.GPX
 if [ $FIRST -eq 1 ]; then
   FN=$filename.all.gpx
   head -2 $filename.GPX.fixed.gpx > $FN
   FIRST=0
 fi
 grep '<trkpt' -B0 -A2 $filename.GPX.fixed.gpx | grep -v '\-\-' >> $FN
done
echo '    </trkseg></trk></gpx>' >> $FN
