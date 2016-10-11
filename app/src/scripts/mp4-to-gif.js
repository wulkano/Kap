import {join as joinPath} from 'path';

import execa from 'execa';
import moment from 'moment';
import tmp from 'tmp';

const ffmpeg = joinPath(__dirname, '..', 'vendor', 'ffmpeg');

const durationRegex = /Duration: (\d\d:\d\d:\d\d.\d\d)/gm;
const frameRegex = /frame=\s+(\d+)/gm;

function convert(filePath, progressCallback) {
  return new Promise((resolve, reject) => {
    const palettePath = tmp.tmpNameSync({postfix: '.png'});
    const gifPath = tmp.tmpNameSync({postfix: '.gif'});

    execa(ffmpeg, [
      '-i',
      filePath,
      '-vf',
      'fps=30,scale=-1:-1:flags=lanczos,palettegen',
      palettePath
    ])
      .then(() => {
        const converter = execa(ffmpeg, [
          '-i',
          filePath,
          '-i',
          palettePath,
          '-filter_complex',
          'fps=30,scale=-1:-1:flags=lanczos[x]; [x][1:v]paletteuse',
          gifPath
        ]);

        let amountOfFrames;

        converter.stderr.on('data', data => {
          data = data.toString().trim();
          const matchesDuration = durationRegex.exec(data);
          const matchesFrame = frameRegex.exec(data);

          if (matchesDuration) {
            amountOfFrames = Math.ceil(moment.duration(matchesDuration[1]).asSeconds() * 30);
          } else if (matchesFrame) {
            const currentFrame = matchesFrame[1];
            progressCallback(Math.ceil(currentFrame / amountOfFrames * 100));
          }
        });
        converter.on('error', reject);
        converter.on('exit', code => {
          if (code === 0) {
            resolve(gifPath);
          } else {
            reject(code);
          }
        });
      })
      .catch(reject);
  });
}

exports.convert = convert;

// time ffmpeg -i original.mp4 -vf fps=30,scale=480:-1::flags=lanczos,palettegen palette.png
// time ffmpeg -i original.mp4 -i palette.png -filter_complex 'fps=30,scale=-1:-1:flags=lanczos[x]; [x][1:v]paletteuse' palette.gif
