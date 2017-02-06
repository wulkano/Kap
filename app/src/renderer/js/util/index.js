import {readFile} from 'fs'
import {resolve as resolvePath, join as joinPath} from 'path'

export default function loadSvg(name) {
  return new Promise((resolve, reject) => {
    const filePath = resolvePath(joinPath(__dirname, 'static', `${name}.svg`))
    readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      }
      resolve(data)
    })
  })
}
