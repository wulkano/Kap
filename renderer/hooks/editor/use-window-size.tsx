import {ipcRenderer} from 'electron-better-ipc';
import {Rectangle} from 'electron/renderer';
import {useEffect, useRef} from 'react';
import {resizeKeepingCenter} from 'utils/window';

const CONVERSION_WIDTH = 370;
const CONVERSION_HEIGHT = 392;
const DEFAULT_EDITOR_WIDTH = 768;
const DEFAULT_EDITOR_HEIGHT = 480;

export const useEditorWindowSizeEffect = (isConversionWindowState: boolean) => {
  const previousWindowSizeRef = useRef<{width: number; height: number}>();

  useEffect(() => {
    if (!previousWindowSizeRef.current) {
      previousWindowSizeRef.current = {
        width: DEFAULT_EDITOR_WIDTH,
        height: DEFAULT_EDITOR_HEIGHT
      };
      return;
    }

    ipcRenderer.callMain<never, Rectangle>('get-bounds').then(bounds => {
      if (isConversionWindowState) {
        previousWindowSizeRef.current = {
          width: bounds.width,
          height: bounds.height
        };

        ipcRenderer.callMain('resize-window', {
          bounds: resizeKeepingCenter(bounds, {width: CONVERSION_WIDTH, height: CONVERSION_HEIGHT}),
          resizable: false,
          fullScreenable: false
        });
      } else {
        ipcRenderer.callMain('resize-window', {
          bounds: resizeKeepingCenter(bounds, previousWindowSizeRef.current),
          resizable: true,
          fullScreenable: true
        });
      }
    });
  }, [isConversionWindowState]);
};
