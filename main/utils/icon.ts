
const fileIcon = require('file-icon');

export const getAppIcon = async (): Promise<string> => {
  const buffer = await fileIcon.buffer(process.pid);
  return buffer.toString('base64');
};
