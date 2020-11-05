/* eslint-disable array-element-newline */
'use strict';

const {shell, clipboard} = require('electron');
const fs = require('fs');
const Store = require('electron-store');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const util = require('electron-util');
const execa = require('execa');
const tempy = require('tempy');

const {showDialog} = require('./dialog');
const {openEditorWindow} = require('./editor');
const plugins = require('./common/plugins');
const {generateTimestampedName} = require('./utils/timestamped-name');

const ffmpegPath = util.fixPathForAsarUnpack(ffmpeg.path);

const recordingHistory = new Store({
  name: 'recording-history',
  schema: {
    activeRecording: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        date: {
          type: 'string'
        },
        apertureOptions: {
          type: 'object'
        },
        plugins: {
          type: 'object'
        }
      }
    },
    recordings: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          date: {
            type: 'string'
          }
        }
      }
    }
  }
});

const setCurrentRecording = ({
  filePath,
  name = generateTimestampedName(),
  date = new Date().toISOString(),
  apertureOptions,
  plugins = {}
}) => {
  recordingHistory.set('activeRecording', {
    filePath,
    name,
    date,
    apertureOptions,
    plugins
  });
};

const updatePluginState = state => {
  recordingHistory.set('activeRecording.plugins', state);
};

const stopCurrentRecording = recordingName => {
  const {filePath, name} = recordingHistory.get('activeRecording');
  addRecording({
    filePath,
    name: recordingName || name,
    date: new Date().toISOString()
  });
  recordingHistory.delete('activeRecording');
};

const getPastRecordings = () => {
  const recordings = recordingHistory.get('recordings', []);
  const validRecordings = recordings.filter(({filePath}) => fs.existsSync(filePath));
  recordingHistory.set('recordings', validRecordings);
  return validRecordings;
};

const addRecording = newRecording => {
  const recordings = [newRecording, ...recordingHistory.get('recordings', [])];
  const validRecordings = recordings.filter(({filePath}) => fs.existsSync(filePath));
  recordingHistory.set('recordings', validRecordings);
  return validRecordings;
};

const cleanPastRecordings = () => {
  const recordings = getPastRecordings();
  for (const recording of recordings) {
    fs.unlinkSync(recording.filePath);
  }

  recordingHistory.set('recordings', []);
};

const cleanUpRecordingPlugins = usedPlugins => {
  const recordingPlugins = plugins.getRecordingPlugins();

  for (const pluginName of Object.keys(usedPlugins)) {
    const plugin = recordingPlugins.find(p => p.name === pluginName);
    for (const [serviceTitle, persistedState] of Object.entries(usedPlugins[pluginName])) {
      const service = plugin && plugin.recordServices.find(s => s.title === serviceTitle);

      if (service && service.cleanUp) {
        service.cleanUp(persistedState);
      }
    }
  }
};

const handleIncompleteRecording = async recording => {
  cleanUpRecordingPlugins(recording.plugins);

  try {
    await execa(ffmpegPath, [
      '-i', recording.filePath,
      // Verbosity level
      '-v', 'error',
      // Force file type to null (we don't want to actually generate a file)
      // https://trac.ffmpeg.org/wiki/Null
      '-f', 'null', '-'
    ]);
  } catch (error) {
    return handleCorruptRecording(recording, error.stderr);
  }

  return handleRecording(recording);
};

const handleRecording = async recording => {
  addRecording({
    filePath: recording.filePath,
    name: recording.name,
    date: recording.date
  });

  return showDialog({
    title: 'Kap didn\'t shut down correctly.',
    detail: 'Looks like Kap crashed during a recording. Kap was able to locate the file and it appears to be playable.',
    buttons: [
      'Close',
      {
        label: 'Show in Finder',
        action: () => {
          shell.showItemInFolder(recording.filePath);
        }
      },
      {
        label: 'Show in Editor',
        action: () => openEditorWindow(recording.filePath, {recordingName: recording.name})
      }
    ]
  });
};

const knownErrors = [{
  test: error => error.includes('moov atom not found'),
  fix: async filePath => {
    try {
      const outputPath = tempy.file({extension: 'mp4'});

      await execa(ffmpegPath, [
        '-i',
        filePath,
        // Copy both streams
        '-vcodec',
        'copy',
        '-acodec',
        'copy',
        // Attempt to move the moov atom to the start of the file
        '-movflags',
        'faststart',
        outputPath
      ]);

      return outputPath;
    } catch { }
  }
}];

const handleCorruptRecording = async (recording, error) => {
  const options = {
    title: 'Kap didn\'t shut down correctly.',
    detail: `Looks like Kap crashed during a recording. We were able to locate the file. Unfortunately, it appears to be corrupt.\n\n${error}`,
    cancelId: 0,
    defaultId: 2,
    buttons: [
      'Close',
      {
        label: 'Copy Error',
        action: () => {
          clipboard.writeText(error);
        }
      },
      {
        label: 'Show in Finder',
        action: () => {
          shell.showItemInFolder(recording.filePath);
        }
      }
    ]
  };

  const applicableErrors = knownErrors.filter(({test}) => test(error));

  if (applicableErrors.length === 0) {
    const Sentry = require('./utils/sentry').default;
    if (Sentry.isSentryEnabled) {
      // Collect info about possible unknown errors, to see if we can implement fixes using ffmpeg
      Sentry.captureException(new Error(`Corrupt recording: ${error}`));
    }

    return showDialog(options);
  }

  options.message = 'We can attempt to repair the recording.';
  options.defaultId = 3;
  options.buttons.push({
    label: 'Attempt to Fix',
    activeLabel: 'Attempting to Fix…',
    action: async (_, updateUi) => {
      for (const {fix} of applicableErrors) {
        // eslint-disable-next-line no-await-in-loop
        const outputPath = await fix(recording.filePath);

        if (outputPath) {
          addRecording({
            filePath: outputPath,
            name: recording.name,
            date: new Date().toISOString()
          });

          return updateUi({
            message: 'The recording was successfully repaired.',
            defaultId: 2,
            buttons: [
              'Close',
              {
                label: 'Show in Finder',
                action: () => {
                  shell.showItemInFolder(outputPath);
                }
              },
              {
                label: 'Show in Editor',
                action: () => openEditorWindow(outputPath, {recordingName: recording.name})
              }
            ]
          });
        }
      }

      return updateUi({
        message: 'Kap was unable to repair the recording.',
        defaultId: 2,
        buttons: [
          'Close',
          {
            label: 'Copy Error',
            action: () => {
              clipboard.writeText(error);
            }
          },
          {
            label: 'Show in Finder',
            action: () => {
              shell.showItemInFolder(recording.filePath);
            }
          }
        ]
      });
    }
  });

  return showDialog(options);
};

const hasActiveRecording = async () => {
  const activeRecording = recordingHistory.get('activeRecording');

  if (activeRecording) {
    await handleIncompleteRecording(activeRecording);
    recordingHistory.delete('activeRecording');
    return true;
  }

  return false;
};

module.exports = {
  recordingHistory,
  getPastRecordings,
  addRecording,
  hasActiveRecording,
  setCurrentRecording,
  updatePluginState,
  stopCurrentRecording,
  cleanPastRecordings
};
