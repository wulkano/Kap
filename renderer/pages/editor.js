import path from 'path';
import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';

import Editor from '../components/editor';

export default class extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired
  }

  static getInitialProps() {
    const src = `file://${path.join(__dirname, '../../../../test/fixtures/kap-beta.mp4')}`;
    return {src};
  }

  render() {
    const {src} = this.props;

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
