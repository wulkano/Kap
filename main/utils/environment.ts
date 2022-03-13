import electron from 'electron';

export const isDevelopment = () => {
  if (typeof electron === 'string') {
    throw new TypeError('Not running in an Electron environment!');
  }

  const isEnvSet = 'ELECTRON_IS_DEV' in process.env;
  const getFromEnv =
    Number.parseInt(process.env.ELECTRON_IS_DEV!, 10) === 1;

  return isEnvSet ? getFromEnv : !electron.app.isPackaged;
};
