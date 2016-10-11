import {join as joinPath} from 'path';

import execa from 'execa';
import tmp from 'tmp';

const ffmpeg = joinPath(__dirname, '..', 'vendor', 'ffmpeg');

function convert(filePath) {
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

        converter.stderr.on('data', data => console.log(data.toString()));
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
