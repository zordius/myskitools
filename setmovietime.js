#!/usr/bin/env node

const fs = require('fs')
const { execSync } = require('child_process')
const VIRBDIR = `/Users/${process.env.USER}/Library/Application Support/Garmin/VIRB Edit/Database/4/RawMovies`
const dirs = fs.readdirSync(VIRBDIR).filter(D => D.match(/localized/))
const files = dirs.map(D => `${VIRBDIR}/${D}/movie.plist`)

const TimeZone = 'GMT+0900'
const currentFiles = fs.readdirSync('.').filter(D => D.match(/MP4/)).reduce((O, F) => ({
  ...O,
  [F]: true
}), {})

const getDuration = C => {
  const duration = C.match(/<key>TimeMappingMovieTime<\/key>\n\t\t\t<real>([\d\.]{4,20}|\d{1,3})<\/real>/)
	if (!duration) {
	  console.log(`ERROR to find duration in ${C} !!!!!`)
		process.exit(1)
	}
	return duration[1]
}

const updateTime = (C, S) => {
  const duration = getDuration(C)
  return C.replace(new RegExp('<key>TimeMappingMovieTime</key>\n\t\t\t<real>0.0</real>\n\t\t\t<key>TimeMappingTelemetryTime</key>\n\t\t\t<real>(.+)</real>'), `<key>TimeMappingMovieTime</key>\n\t\t\t<real>0.0</real>\n\t\t\t<key>TimeMappingTelemetryTime</key>\n\t\t\t<real>${S}</real>`).replace(new RegExp(`<key>TimeMappingMovieTime</key>\n\t\t\t<real>${duration}</real>\n\t\t\t<key>TimeMappingTelemetryTime</key>\n\t\t\t<real>(.+)</real>`), `<key>TimeMappingMovieTime</key>\n\t\t\t<real>${duration}</real>\n\t\t\t<key>TimeMappingTelemetryTime</key>\n\t\t\t<real>${S+1*duration}</real>`)
}

const contents = files.reduce((O, F) => {
  const content = {
    file: F,
    text: fs.readFileSync(F, 'utf8')
  }

	content.movie = content.text.match(/<key>Name<\/key>\n\t<string>(.+)<\/string>/)[1]

  if (!currentFiles[`${content.movie}.MP4`]) {
    console.log(`skip ${content.movie}`)
    return O
  }

  console.log(`PROCESS ${content.movie} for timestamp.`)

  content.duration = getDuration(content.text)

  const M = content.movie.match(/(\d\d\d\d)_(\d\d)(\d\d)_(\d\d)(\d\d)(\d\d)/)
	if (M) {
	  content.time = new Date(`${M[2]} ${M[3]} ${M[1]} ${M[4]}:${M[5]}:${M[6]} ${TimeZone}`).getTime() / 1000
  } else {
		const serial = content.movie.match(/G.(..)(.+)/)[1]
		content.order = (serial === 'PR') ? 0 : Number(serial)
    if (content.order === 0) {
      const MM = execSync(`exiftool -MediaCreateDate ${content.movie}.MP4`).toString().match(/(\d\d\d\d):(\d\d):(\d\d) (\d\d):(\d\d):(\d\d)/)
      content.time = new Date(`${MM[2]} ${MM[3]} ${MM[1]} ${MM[4]}:${MM[5]}:${MM[6]} ${TimeZone}`).getTime() / 1000
    }
  }

  O.push(content)
  return O
}, [])

let startTime = 0
contents.sort((A, B) => A.order - B.order).forEach(content => {
  if (!content.time) {
    content.time = startTime
  } else {
    startTime = content.time
  }
  startTime = startTime * 1 + content.duration * 1
  console.log(content.file, content.time, content.duration)
  content.update = updateTime(content.text, content.time)
  fs.writeFileSync(`${content.file}.bak`, content.text)
  fs.writeFileSync(content.file, content.update)
})

console.log(`Done!! You may use

cd ${VIRBDIR}
find . |grep bak |awk -F/ '{print "mv " $2 "/movie.plist.bak " $2 "/movie.plist"}' | sh

to recover from bak files.
`)
