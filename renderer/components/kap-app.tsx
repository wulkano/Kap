import {AppProps} from 'next/app';
import classNames from 'classnames';

import useDarkMode from '../hooks/dark-mode';
import GlobalStyles from '../utils/global-styles';
import SentryErrorBoundary from '../utils/sentry-error-boundary';
import {WindowStateProvider} from '../hooks/window-state';

const KapApp = ({Component, pageProps}: AppProps) => {
  const isDarkMode = useDarkMode();
  const className = classNames('cover-window', {dark: isDarkMode});

  return (
    <div className={className}>
      <SentryErrorBoundary>
        <WindowStateProvider>
          <Component {...pageProps}/>
          <GlobalStyles/>
        </WindowStateProvider>
      </SentryErrorBoundary>
    </div>
  );
};

export default KapApp;
