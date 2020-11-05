import {AppProps} from 'next/app';
import {useState, useEffect} from 'react';
import useDarkMode from '../hooks/dark-mode';
import GlobalStyles from '../utils/global-styles';
import SentryErrorBoundary from '../utils/sentry-error-boundary';
import {WindowStateProvider} from '../hooks/window-state';
import classNames from 'classnames';
import {ipcRenderer} from 'electron-better-ipc';

function Kap(props: AppProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      console.log('SENDING');
      ipcRenderer.callMain('kap-window-mount');
    }
  }, [isMounted])

  if (!isMounted) {
    return null;
  }

  return <MainApp {...props}/>
}

const MainApp = ({Component, pageProps}: AppProps) => {
  const isDarkMode = useDarkMode();
  const className = classNames('cover-window', {dark: isDarkMode});

  return (
    <div className={className}>
      <SentryErrorBoundary>
        <WindowStateProvider>
          <Component {...pageProps} />
          <GlobalStyles />
        </WindowStateProvider>
      </SentryErrorBoundary>
    </div>
  );
};

export default Kap;
