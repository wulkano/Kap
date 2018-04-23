import React from 'react';
import PropTypes from 'prop-types';

import {connect, PreferencesContainer} from '../../../containers';

import Item from '../item';
import Button from '../item/button';
import Switch from '../item/switch';

import Category from './category';

class General extends React.Component {
  static defaultProps = {
    kapturesDir: ''
  }

  render() {
    const {
      kapturesDir,
      openOnStartup,
      allowAnalytics,
      toggleSetting,
      pickKapturesDir,
      setOpenOnStartup
    } = this.props;

    const shortDir = `.../${kapturesDir.split('/').pop()}`;

    return (
      <Category>
        <Item title="Save to…" subtitle={shortDir} tooltip={kapturesDir}>
          <Button title="Choose" onClick={pickKapturesDir}/>
        </Item>
        <Item title="Start automatically" subtitle="Launch Kap on system startup">
          <Switch checked={openOnStartup} onClick={setOpenOnStartup}/>
        </Item>
        <Item title="Allow analytics" subtitle="Help us improve Kap by sending anonymous usage stats">
          <Switch checked={allowAnalytics} onClick={() => toggleSetting('allowAnalytics')}/>
        </Item>
      </Category>
    );
  }
}

General.propTypes = {
  kapturesDir: PropTypes.string,
  openOnStartup: PropTypes.bool,
  allowAnalytics: PropTypes.bool,
  toggleSetting: PropTypes.func.isRequired,
  pickKapturesDir: PropTypes.func.isRequired,
  setOpenOnStartup: PropTypes.func.isRequired
};

export default connect(
  [PreferencesContainer],
  ({kapturesDir, openOnStartup, allowAnalytics}) => ({kapturesDir, openOnStartup, allowAnalytics}),
  ({toggleSetting, pickKapturesDir, setOpenOnStartup}) => ({toggleSetting, pickKapturesDir, setOpenOnStartup})
)(General);
