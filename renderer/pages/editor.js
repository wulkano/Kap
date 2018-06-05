// import ipc from 'electron-better-ipc';
import electron from 'electron';
import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

import Editor from '../components/editor';

export default class extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired
  }

  constructor(props) {
    super(props);

    this.state = {
      src: ''
    };

    if (!electron.ipcRenderer) {
      return;
    }

    const ipc = require('electron-better-ipc');

    ipc.answerMain('filePath', async filePath => {
      await new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
        // TODO fix me
        this.onFinishLoading = resolve;
        console.log('Got', filePath);
        this.setState({src: `file://${filePath}`});
      });

      return true;
    });
  }

  componentDidUpdate() {
    console.log('Finish loading is', this.onFinishLoading);
    console.log('src is', this.state.src);

    if (this.onFinishLoading && this.state.src) {
      console.log('Resolved it');
      this.onFinishLoading();
      delete this.onFinishLoading;
    }
  }

  render() {
    const {src} = this.state;

    return (
      <div className="root">
        <Head>
          <meta httpEquiv="Content-Security-Policy" content="media-src file:;"/>
        </Head>
        <Editor src={src}/>
        <style jsx global>{`
          body {
            margin: 0;
            -webkit-app-region: drag;
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
            user-select: none;
            cursor: default;
          }

          * { box-sizing: border-box; }
        `}</style>
      </div>
    );
  }
}
