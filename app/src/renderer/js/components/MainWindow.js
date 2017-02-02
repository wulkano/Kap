import React from 'react';

// webpack stuff
/* eslint-disable import/no-unassigned-import */
require('../../css/main.css');
/* eslint-enable import/no-unassigned-import */

export default class MainWindow extends React.Component {
  render() {
    return (
      <div style={{width: '100%', height: '100%', background: 'slateblue'}}>
        <h2>Kap + React = ❤️</h2>
      </div>
    );
  }
}
