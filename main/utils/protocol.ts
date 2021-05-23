import {protocol} from 'electron';

export const setupProtocol = () => {
  // Fix protocol issue in order to support loading editor previews
  // https://github.com/electron/electron/issues/23757#issuecomment-640146333
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
  });
};
