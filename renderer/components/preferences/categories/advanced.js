import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../../containers';

import Item from '../item';
import Switch from '../item/switch';
import Select from '../item/select';

import Category from './category';

class Advanced extends React.Component {
  static defaultProps = {
    audioDevices: []
  }

  render() {
    const {
      showCursor,
      highlightClicks,
      hideDesktopIcons,
      doNotDisturb,
      record60fps,
      recordKeyboardShortcut,
      toggleSetting,
      audioInputDeviceId,
      setAudioInputDeviceId,
      audioDevices,
      recordAudio
    } = this.props;

    const devices = audioDevices.map(device => ({
      label: device.name,
      value: device.id
    }));

    return (
      <Category>
        <Item
          title="Show mouse cursor"
          subtitle="Display the cursor in your Kaptures"
        >
          <Switch
            checked={showCursor}
            onClick={
              () => {
                if (showCursor) {
                  toggleSetting('highlightClicks', false);
                }
                toggleSetting('showCursor');
              }
            }/>
        </Item>
        <Item subtitle="Highlight clicks">
          <Switch
            checked={highlightClicks}
            disabled={!showCursor}
            onClick={() => toggleSetting('highlightClicks')}
          />
        </Item>
        <Item
          title="Hide desktop icons"
          subtitle="Temporarily hide the desktop icons while recording"
        >
          <Switch checked={hideDesktopIcons} onClick={() => toggleSetting('hideDesktopIcons')}/>
        </Item>
        <Item
          title="Do Not Disturb"
          subtitle="Activate “Do Not Disturb” while recording"
        >
          <Switch checked={doNotDisturb} onClick={() => toggleSetting('doNotDisturb')}/>
        </Item>
        <Item
          title="Capture at 60 FPS"
          subtitle="The default is 30 FPS"
        >
          <Switch
            checked={record60fps}
            onClick={() => toggleSetting('record60fps')}/>
        </Item>
        <Item
          title="Audio recording"
          subtitle="Record audio from input device"
        >
          <Switch
            checked={recordAudio}
            onClick={() => toggleSetting('recordAudio')}/>
        </Item>
        <Item subtitle="Select input device">
          <Select
            options={devices}
            selected={audioInputDeviceId}
            onSelect={setAudioInputDeviceId}/>
        </Item>
        <Item
          title="Keyboard shortcut to record"
          subtitle={['Start recording by pressing Command+Shift+5.', 'You have to restart Kap for this to take effect.']}
        >
          <Switch
            checked={recordKeyboardShortcut}
            onClick={() => toggleSetting('recordKeyboardShortcut')}/>
        </Item>
      </Category>
    );
  }
}

Advanced.propTypes = {
  showCursor: PropTypes.bool,
  highlightClicks: PropTypes.bool,
  hideDesktopIcons: PropTypes.bool,
  doNotDisturb: PropTypes.bool,
  record60fps: PropTypes.bool,
  recordKeyboardShortcut: PropTypes.bool,
  toggleSetting: PropTypes.func.isRequired,
  audioInputDeviceId: PropTypes.string,
  setAudioInputDeviceId: PropTypes.func.isRequired,
  audioDevices: PropTypes.array,
  recordAudio: PropTypes.bool
};

export default connect(
  [PreferencesContainer],
  ({
    showCursor,
    highlightClicks,
    hideDesktopIcons,
    doNotDisturb,
    record60fps,
    recordAudio,
    recordKeyboardShortcut,
    audioInputDeviceId,
    audioDevices
  }) => ({
    showCursor,
    highlightClicks,
    hideDesktopIcons,
    doNotDisturb,
    record60fps,
    recordAudio,
    recordKeyboardShortcut,
    audioInputDeviceId,
    audioDevices
  }),
  ({toggleSetting, setAudioInputDeviceId}) => ({toggleSetting, setAudioInputDeviceId})
)(Advanced);
