import {ipcRenderer} from 'electron-better-ipc';
import React from 'react';

class SentryErrorBoundary extends React.Component<{children: React.ReactNode}> {
  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
    ipcRenderer.callMain('capture-error', {error, errorInfo});
    // This is needed to render errors correctly in development / production
    super.componentDidCatch(error, errorInfo);
  }

  render() {
    return this.props.children;
  }
}

export default SentryErrorBoundary;
