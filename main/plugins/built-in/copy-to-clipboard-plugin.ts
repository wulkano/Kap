import {clipboard} from 'electron';
import {ShareServiceContext} from '../service-context';

const plist = require('plist');

const copyFileReferencesToClipboard = (filePaths: string[]) => {
  clipboard.writeBuffer('NSFilenamesPboardType', Buffer.from(plist.build(filePaths)));
};

const action = async (context: ShareServiceContext) => {
  const filePath = await context.filePath();
  copyFileReferencesToClipboard([filePath]);
  context.notify(`The ${context.prettyFormat} has been copied to the clipboard`);
};

const copyToClipboard = {
  title: 'Copy to Clipboard',
  formats: [
    'gif',
    'apng',
    'mp4'
  ],
  action
};

export const shareServices = [copyToClipboard];
