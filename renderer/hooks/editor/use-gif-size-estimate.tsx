import {useState, useEffect, useRef} from 'react';
import {ipcRenderer} from 'electron-better-ipc';
import {Format} from 'common/types';

interface GifSizeEstimateOptions {
  inputPath: string;
  startTime: number;
  endTime: number;
  width: number;
  height: number;
  fps: number;
  shouldMute: boolean;
  format: Format;
}

interface GifSizeEstimateResult {
  size?: number;
  formattedSize?: string;
  isEstimating: boolean;
  error?: string;
}

let estimationCounter = 0;

export const useGifSizeEstimate = (options: GifSizeEstimateOptions): GifSizeEstimateResult => {
  const [result, setResult] = useState<GifSizeEstimateResult>({
    isEstimating: false
  });

  const estimationIdRef = useRef<string>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only estimate for GIF format
    if (options.format !== Format.gif) {
      setResult({isEstimating: false});
      return;
    }

    // Clear any pending estimation timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous estimation
    const cancelPrevious = async () => {
      if (estimationIdRef.current) {
        await ipcRenderer.callMain('cancel-gif-size-estimation', estimationIdRef.current);
      }
    };

    cancelPrevious();

    // Debounce the estimation to avoid too many requests
    timeoutRef.current = setTimeout(async () => {
      const estimationId = `gif-estimate-${++estimationCounter}`;
      estimationIdRef.current = estimationId;

      setResult({isEstimating: true});

      try {
        const response = await ipcRenderer.callMain<any, any>('estimate-gif-size', {
          estimationId,
          inputPath: options.inputPath,
          startTime: options.startTime,
          endTime: options.endTime,
          width: options.width,
          height: options.height,
          fps: options.fps,
          shouldMute: options.shouldMute
        });

        // Only update if this is still the current estimation
        if (estimationIdRef.current === estimationId) {
          if (response.success) {
            setResult({
              isEstimating: false,
              size: response.size,
              formattedSize: response.formattedSize
            });
          } else if (!response.canceled) {
            setResult({
              isEstimating: false,
              error: response.error
            });
          }
        }
      } catch {
        // Only update if this is still the current estimation
        if (estimationIdRef.current === estimationId) {
          setResult({
            isEstimating: false,
            error: 'Failed to estimate size'
          });
        }
      }
    }, 500); // 500ms debounce

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cancel estimation on cleanup
      if (estimationIdRef.current) {
        ipcRenderer.callMain('cancel-gif-size-estimation', estimationIdRef.current);
      }
    };
  }, [
    options.format,
    options.inputPath,
    options.startTime,
    options.endTime,
    options.width,
    options.height,
    options.fps,
    options.shouldMute
  ]);

  return result;
};
