import {remote} from 'electron';
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

    const window = remote.getCurrentWindow();
    const bounds = window.getBounds();

    if (isConversionWindowState) {
      previousWindowSizeRef.current = {
        width: bounds.width,
        height: bounds.height
      };

      window.setBounds(resizeKeepingCenter(bounds, {width: CONVERSION_WIDTH, height: CONVERSION_HEIGHT}), true);
      window.resizable = false;
      window.fullScreenable = false;
    } else {
      window.resizable = true;
      window.fullScreenable = true;
      window.setBounds(resizeKeepingCenter(bounds, previousWindowSizeRef.current), true);
    }
  }, [isConversionWindowState]);
};
