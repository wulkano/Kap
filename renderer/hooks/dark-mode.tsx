import {useState, useEffect} from 'react';

const useDarkMode = () => {
  const {nativeTheme} = require('@electron/remote');
  const [isDarkMode, setIsDarkMode] = useState(nativeTheme.shouldUseDarkColors);

  const onThemeChange = callback => {
    const handler = () => {
      callback();
    };

    nativeTheme.on('updated', handler);

    return () => {
      nativeTheme.off('update', handler);
    };
  };

  useEffect(() => {
    return onThemeChange(() => {
      setIsDarkMode(nativeTheme.shouldUseDarkColors);
    });
  }, []);

  return isDarkMode;
};

export default useDarkMode;
