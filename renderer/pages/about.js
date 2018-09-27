import electron from 'electron';
import React from 'react';

export default class AboutPage extends React.Component {
  state = {}

  componentDidMount() {
    const {app} = electron.remote;
    this.ipc = require('electron-better-ipc');

    this.setState({
      name: app.getName(),
      version: app.getVersion()
    });

    this.ipc.answerMain('icon', icon => this.setState({icon}));
  }

  componentDidUpdate() {
    this.ipc.callMain('about-ready');
  }

  openPrivacy = () => {
    electron.remote.shell.openExternal('https://github.com/wulkano/kap/blob/master/PRIVACY.md');
  }

  render() {
    const {name, icon, version} = this.state;

    if (!name) {
      return null;
    }

    return (
      <div className="container cover-window">
        <img className="icon" src={`data:image/png;base64, ${icon}`}/>
        <div className="name">{name}</div>
        <div className="version">Version {version}</div>
        <div className="copyright">Copyright © Wulkano</div>
        <div className="privacy" onClick={this.openPrivacy}>Privacy</div>
        <style jsx global>{`
          html {
            font-size: 62.5%;
          }

          html,
          body,
          .cover-window {
            margin: 0;
            width: 100vw;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          }

          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #ececec;
          }

          .icon {
            width: 64px;
            height: 64px;
            margin: 8px 0;
          }

          .name {
            font-weight: bold;
            font-size: 1.6rem;
          }

          .version,
          .copyright {
            margin-top: 8px;
          }

          .privacy {
            margin-top: 8px;
            color: #007aff;
            font-weight: 500;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }
}
