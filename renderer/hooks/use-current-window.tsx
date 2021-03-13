import {remote} from 'electron';

export const useCurrentWindow = () => {
  return remote.getCurrentWindow();
};
