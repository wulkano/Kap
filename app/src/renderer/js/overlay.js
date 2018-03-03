import {ipcRenderer, screen, remote} from 'electron';
import {$} from '../js/utils';
import $j from 'jquery/dist/jquery.js';
import {default as createAperture, audioDevices} from 'aperture';
import desktopIcons from 'hide-desktop-icons';

import {init as initErrorReporter, report as reportError} from '../../common/reporter';
import {log} from '../../common/logger';

const aperture = createAperture();
const {app} = remote;
const settingsValues = app.kap.settings.getAll();

document.addEventListener('DOMContentLoaded', () => {
  const topOverlay = $j('.overlay-top');
  const leftOverlay = $j('.overlay-left');
  const bottomOverlay = $j('.overlay-bottom');
  const rightOverlay = $j('.overlay-right');
  const coordinates = $j('.coordinates');
  const dimensions = $j('.dimensions');
  const cropper = $j('.cropper');
  const html = $j('html');
  const controls = $j('.controls');
  const showCursor = $j('.show-cursor');
  const isMicOn = $j('.is-mic-on');
  const isMicOff = $j('.is-mic-off');
  const fullscreen = $j('.fullscreen');
  const exitFullscreen = $j('.exit-fullscreen');
  const linkRatio = $j('.link-ratio');
  const recordButton = $j('.record');
  const options = document.querySelector('.options');

  if(settingsValues.showCursor) {
    showCursor.addClass('active');
  }
  if(settingsValues.recordAudio) {
    isMicOn.show();
    isMicOff.hide();
  }
  if(settingsValues.dimensions.ratioLocked) {
    linkRatio.addClass('active');
  }

  showCursor.on('click', e => {
    app.kap.settings.set('showCursor', !settingsValues.showCursor);
    showCursor.toggleClass('active');
  });

  isMicOn.on('click', e => {
    app.kap.settings.set('recordAudio', false);
    isMicOn.hide();
    isMicOff.show();
  });

  isMicOff.on('click', e => {
    app.kap.settings.set('recordAudio', true);
    isMicOff.hide();
    isMicOn.show();
  });

  linkRatio.on('click', e => {
    const {dimensions} = settingsValues;
    const {ratioLocked} = dimensions;

    app.kap.settings.set('dimensions', {...dimensions, ratioLocked: !ratioLocked});
    linkRatio.toggleClass('active');
  })

  options.addEventListener('click', e => {
    const {bottom, left} = options.getBoundingClientRect();
    ipcRenderer.send('show-options-menu', {x: left, y: bottom});
    e.stopPropagation();
  });

  var lastBounds = {};
  var isFullscreen = false;

  fullscreen.on('click', e => {
    lastBounds = {
      top: topOverlay.height(),
      bottom: bottomOverlay.height(),
      left: leftOverlay.width(),
      right: rightOverlay.width()
    };

    topOverlay.height(0);
    bottomOverlay.height(0);
    leftOverlay.width(0);
    rightOverlay.width(0);

    fullscreen.hide();
    exitFullscreen.show();
    isFullscreen = true;
    controls.addClass('inset');
  });

  exitFullscreen.on('click', e => {
    topOverlay.height(lastBounds.top);
    bottomOverlay.height(lastBounds.bottom);
    leftOverlay.width(lastBounds.left);
    rightOverlay.width(lastBounds.right);

    fullscreen.show();
    exitFullscreen.hide();
    isFullscreen = false;
  });

  const {bounds: {height: screenHeight, width: screenWidth}, id: displayId} = screen.getPrimaryDisplay();

  var currentHandle;
  const handles = $j('.handle');
  const handlesMap = {
    'e': $j('.e:not(.n):not(.s)'),
    'w': $j('.w:not(.n):not(.s)'),
    'n': $j('.n:not(.e):not(.w)'),
    's': $j('.s:not(.e):not(.w)'),
    'ne': $j('.n.e'),
    'nw': $j('.n.w'),
    'se': $j('.s.e'),
    'sw': $j('.s.w'),
  };

  const switchHandle = (handle, from, to) => (
    handlesMap[handle.attr('class').split(' ').join('').replace('handle','').replace(from, to)]
  );

  const getWidth = () => Math.round(screenWidth - leftOverlay.width() - rightOverlay.width());
  const getHeight = () => Math.round(screenHeight - topOverlay.height() - bottomOverlay.height());

  const stopResizing = () => {
    enableMovement();
    dimensions.hide();
    controls.show();
  };

  const startResizing = handle => {
    dimensions.show().text(`${getWidth()} x ${getHeight()}`);
    disableMovement();
    controls.hide();

    if (isFullscreen) {
      isFullscreen = false;
      fullscreen.show();
      exitFullscreen.hide();
    }

    currentHandle = handle;
    const parents = currentHandle.parents();
    parents.on('mousemove', e => {
      if(currentHandle.hasClass('w')) {
        leftOverlay.width(e.pageX);
        if(screenWidth - e.pageX - rightOverlay.width() < -1) {
          currentHandle = switchHandle(currentHandle, 'w', 'e');
        }
      }
      if(currentHandle.hasClass('n')) {
        topOverlay.height(e.pageY);
        if(screenHeight - e.pageY - bottomOverlay.height() < -1) {
          currentHandle = switchHandle(currentHandle, 'n', 's');
        }
      }
      if(currentHandle.hasClass('e')) {
        rightOverlay.width(screenWidth - e.pageX);
        if(e.pageX - leftOverlay.width() < -1) {
          currentHandle = switchHandle(currentHandle, 'e', 'w');
        }
      }
      if(currentHandle.hasClass('s')) {
        bottomOverlay.height(screenHeight - e.pageY);
        if(e.pageY - topOverlay.height() < -1) {
          currentHandle = switchHandle(currentHandle, 's', 'n');
        }
      }

      dimensions.text(`${getWidth()} x ${getHeight()}`);
      if (dimensions.hasClass('follow-cursor')) {
        dimensions.offset({top: e.pageY, left: e.pageX});

        if (getWidth() - dimensions.width() > 5 && getHeight() - dimensions.height() > 5) {
          dimensions.removeClass('follow-cursor');
        }
      } else if (getWidth() - dimensions.width() < 5 || getHeight() - dimensions.height() < 5) {
        dimensions.addClass('follow-cursor');
        dimensions.offset({top: e.pageY, left: e.pageX});
      }
    })
    .on('mouseup', e => {
      stopResizing();
      parents.off('mousemove').off('mouseup');
    });
  };

  const showCrosshair = () => {
    html.addClass('selecting').on('mousemove', e => {
      coordinates.offset({
        top: e.pageY,
        left: e.pageX,
      });
      coordinates.find('.x').text(e.pageX);
      coordinates.find('.y').text(e.pageY);
    });
    coordinates.show();
  }

  const hideCrosshair = () => {
    html.removeClass('selecting').off('mousemove');
    coordinates.hide();
  }

  handles.on('mousedown', function(e) {
    e.stopPropagation();
    startResizing($j(this));
  });

  const enableMovement = () => {
    cropper.on('mousedown', e => {
      handles.hide();
      controls.hide();
      coordinates.show().offset({
        top: topOverlay.height(),
        left: leftOverlay.width(),
      });

      var offsetTop = e.pageY - topOverlay.height();
      var offsetLeft = e.pageX - leftOverlay.width();
      var offsetBottom = screenHeight - e.pageY - bottomOverlay.height();
      var offsetRight = screenWidth - e.pageX - rightOverlay.width();

      cropper.addClass('moving')
        .on('mousemove', e => {
          if (e.pageY < offsetTop || offsetBottom + e.pageY > screenHeight) {
            offsetTop = e.pageY - topOverlay.height();
            offsetBottom = screenHeight - e.pageY - bottomOverlay.height();
          } else {
            topOverlay.height(e.pageY - offsetTop);
            bottomOverlay.height(screenHeight - offsetBottom - e.pageY);
          }

          if (e.pageX < offsetLeft || offsetRight + e.pageX > screenWidth) {
            offsetLeft = e.pageX - leftOverlay.width();
            offsetRight = screenWidth - e.pageX - rightOverlay.width();
          } else {
            rightOverlay.width(screenWidth - offsetRight - e.pageX);
            leftOverlay.width(e.pageX - offsetLeft);
          }

          coordinates.offset({
            top: topOverlay.height(),
            left: leftOverlay.width(),
          });
          coordinates.find('.x').text(topOverlay.height());
          coordinates.find('.y').text(leftOverlay.width());
        })
        .on('mouseup', e => {
          handles.show();
          coordinates.hide();
          controls.show();
          cropper.removeClass('moving').off('mousemove').off('mouseup');
        });
    });
  };

  const disableMovement = () => {
    cropper.off('mousedown');
  }

  if (true) {
    handles.hide();
    showCrosshair();
    html.on('mousedown', e => {
      hideCrosshair();
      handles.show();

      leftOverlay.width(e.pageX);
      topOverlay.height(e.pageY);
      rightOverlay.width(screenWidth - e.pageX);
      bottomOverlay.height(screenHeight - e.pageY);

      startResizing(handlesMap.se);
      html.off('mousedown');
    });
  } else {
    leftOverlay.width(100);
    topOverlay.height(100);
    rightOverlay.width(100);
    bottomOverlay.height(200);
    enableMovement();
  }

  controls.on('mousedown', e => {
    e.stopPropagation();
  });

  async function startRecording() {
    ipcRenderer.send('will-start-recording');

    const past = Date.now();
    const cropperBounds = {
      x: leftOverlay.width(),
      y: bottomOverlay.height(),
      width: getWidth(),
      height: getHeight(),
    };

    // The dashed border is 1px wide
    cropperBounds.x += 1;
    cropperBounds.y += 1;
    cropperBounds.width -= 2;
    cropperBounds.height -= 2;

    // If we're recording fullscreen, set x, y to zero
    // if (dimensions.app && dimensions.app.isFullscreen) {
    //   cropperBounds.x = 0;
    //   cropperBounds.y = 0;
    // }

    // We need the most recent settings
    const {
      fps,
      showCursor,
      highlightClicks,
      recordAudio,
      audioInputDeviceId
    } = app.kap.settings.getAll();

    const apertureOpts = {
      // We have to convert this to a number as there was a bug
      // previously that set FPS to string in the preferences
      fps: Number(fps),

      cropArea: cropperBounds,
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
        const [defaultAudioDevice] = await audioDevices();
        apertureOpts.audioDeviceId = defaultAudioDevice && defaultAudioDevice.id;
      }
    }

    if (app.kap.settings.get('hideDesktopIcons')) {
      await desktopIcons.hide();
    }

    try {
      await aperture.startRecording(apertureOpts);
      ipcRenderer.send('did-start-recording');
      log(`Started recording after ${(Date.now() - past) / 1000}s`);
    } catch (err) {
      // This prevents the button from being reset, since the recording has not yet started
      // This delay is due to internal framework delays in aperture native code
      if (err.message.includes('stopRecording')) {
        log(`Recording not yet started, can't stop recording before it actually started`);
        return;
      }

      ipcRenderer.send('will-stop-recording');
      reportError(err);
      remote.dialog.showErrorBox('Recording error', err.message);
    }
  }

  async function stopRecording() {
    ipcRenderer.send('will-stop-recording');

    const filePath = await aperture.stopRecording();

    if (app.kap.settings.get('hideDesktopIcons')) {
      desktopIcons.show();
    }

    ipcRenderer.send('stopped-recording');
    ipcRenderer.send('open-editor-window', {filePath});
  }

  recordButton.on('click', e => {
    startRecording();
  });

  ipcRenderer.on('start-recording', () => startRecording());

  ipcRenderer.on('stop-recording', stopRecording);

  ipcRenderer.on('log', (event, msgs) => console.log(...msgs));

  ipcRenderer.on('asd', (event, bounds) => {
    console.log(bounds);
    setCropperSize(bounds);
  });

  window.addEventListener('keyup', e => {
    switch (event.key) {
      case 'Escape':
        ipcRenderer.send('close-cropper-window');
        break;
      default:
        break;
    }
  }, false);
});
