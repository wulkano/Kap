import test from 'ava';
import supportedVideoExtensions from '../main/common/constants';

test('it should support mp4 mov and m4v', t => {
  t.deepEqual(supportedVideoExtensions, {supportedVideoExtensions: ['mp4', 'mov', 'm4v']});
});

test('file extensions should equal .mp4 .mov and .m4v', t => {
  const supportedVideoExtensions = ['mp4', 'mov', 'm4v'];
  const fileExtensions = supportedVideoExtensions.map(ext => `.${ext}`);
  t.deepEqual(fileExtensions, ['.mp4', '.mov', '.m4v']);
});
