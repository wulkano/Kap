import {AppProps} from 'next/app';
import {useState, useEffect} from 'react';
import useDarkMode from '../hooks/dark-mode';
import GlobalStyles from '../utils/global-styles';
import SentryErrorBoundary from '../utils/sentry-error-boundary';
import {WindowArgsProvider} from '../hooks/window-args';
import classNames from 'classnames';

function Kap(props: AppProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        <WindowArgsProvider>
          <Component {...pageProps} />
          <GlobalStyles />
        </WindowArgsProvider>
      </SentryErrorBoundary>
    </div>
  );
};

export default Kap;
