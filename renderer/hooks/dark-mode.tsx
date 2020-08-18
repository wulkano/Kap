import {useState, useEffect} from 'react';

const useDarkMode = () => {
  const {darkMode} = require('electron-util');
  const [isDarkMode, setIsDarkMode] = useState(darkMode.isEnabled);

  useEffect(() => {
    return darkMode.onChange(() => {
      setIsDarkMode(darkMode.isEnabled);
    });
  }, []);

  return isDarkMode;
};

export default useDarkMode;
