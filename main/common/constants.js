'use strict';

const supportedVideoExtensions = ['mp4', 'mov', 'm4v'];

const formatExtensions = new Map([
  ['av1', 'mp4']
]);

const getFormatExtension = format => formatExtensions.get(format) || format;

module.exports = {
  supportedVideoExtensions,
  getFormatExtension,
  defaultInputDeviceId: 'SYSTEM_DEFAULT'
};
