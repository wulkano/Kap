import test from 'ava';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import execa from 'execa';

test('it should be able to find ffmpeg', t => {
  t.deepEqual(ffmpeg, ffmpeg);
});

test('it should be able to find execa', t => {
  t.deepEqual(execa, execa);
});

