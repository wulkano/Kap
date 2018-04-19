const {dialog} = require('electron');
const desktopIcons = require('hide-desktop-icons');
const createAperture = require('aperture');

const settings = require('./common/settings');
const {openEditorWindow} = require('./editor');

const aperture = createAperture();

const startRecording = async bounds => {
  const past = Date.now();
  const {id: displayId} = require('electron').screen.getPrimaryDisplay();

  const {
    showCursor,
    highlightClicks,
    recordAudio,
    audioInputDeviceId,
    hideDesktopIcons
  } = settings.getAll();
  console.log(settings.getAll());

  const apertureOpts = {
    // We have to convert this to a number as there was a bug
    // previously that set FPS to string in the preferences
    fps: 30,

    cropArea: bounds,
    showCursor,
    highlightClicks,
    displayId: String(displayId)
  };

  if (recordAudio === true) {
    // In case for some reason the default audio device is not set
    // use the first available device for recording
    if (audioInputDeviceId) {
      apertureOpts.audioDeviceId = audioInputDeviceId;
    } else {
      const [defaultAudioDevice] = await aperture.audioDevices();
      apertureOpts.audioDeviceId = defaultAudioDevice && defaultAudioDevice.id;
    }
  }

  if (hideDesktopIcons) {
    await desktopIcons.hide();
  }

  try {
    console.log(apertureOpts);
    await aperture.startRecording(apertureOpts);
    // IpcRenderer.send('did-start-recording');
    console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
  } catch (err) {
    // This prevents the button from being reset, since the recording has not yet started
    // This delay is due to internal framework delays in aperture native code
    if (err.message.includes('stopRecording')) {
      console.log(`Recording not yet started, can't stop recording before it actually started`);
      return;
    }

    // IpcRenderer.send('will-stop-recording');
    // reportError(err);
    dialog.showErrorBox('Recording error', err.message);
  }
};

const stopRecording = async () => {
  const filePath = await aperture.stopRecording();
  console.log(filePath);

  if (settings.get('hideDesktopIcons')) {
    desktopIcons.show();
  }

  openEditorWindow({filePath});
};

module.exports = {startRecording, stopRecording};
