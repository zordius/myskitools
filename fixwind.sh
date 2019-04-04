#!/bin/sh
ffmpeg -i $1 -c:v copy -af "equalizer=f=200:width_type=h:width=200:g=-20,equalizer=f=450:width_type=h:width=150:g=-15,equalizer=f=700:width_type=h:width=100:g=-10" -c:a aac $1.windfixed.mp4
