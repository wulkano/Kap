import moment from 'moment';
import prettyMilliseconds from 'pretty-ms';

export interface ConvertOptions {
  inputPath: string;
  outputPath: string;
  shouldCrop: boolean;
  startTime: number;
  endTime: number;
  width: number;
  height: number;
  fps: number;
  shouldMute: boolean;
  onProgress: (action: string, progress: number, estimate?: string) => void;
}

export const makeEven = (n: number) => 2 * Math.round(n / 2);

export const areDimensionsEven = ({width, height}: {width: number, height: number}) => width % 2 === 0 && height % 2 === 0;

const timeRegex = /time=\s*(\d\d:\d\d:\d\d.\d\d)/gm;
const speedRegex = /speed=\s*(-?\d+(,\d+)*(\.\d+(e\d+)?)?)/gm;

export const extractProgressFromStderr = (stderr: string, durationMs: number) => {
  const data = stderr.trim();

  const speed = Number.parseFloat(speedRegex.exec(data)?.[1] ?? '0');
  const processedMs = moment.duration(timeRegex.exec(data)?.[1] ?? 0).asMilliseconds();

  if (speed > 0 && processedMs > 0) {
    const progress = processedMs / durationMs;

    // Wait 2 seconds in the conversion for speed to be stable
    if (processedMs > 2 * 1000) {
      const msRemaining = (durationMs - processedMs) / speed;

      return {
        progress,
        estimate: prettyMilliseconds(Math.max(msRemaining, 1000), {compact: true})
      };
    }

    return {progress};
  }

  return undefined;
};

type ArgType = string[] | string | { args: string[], if: boolean };

// Resolve conditional args
//
// conditionalArgs(['default', 'args'], {args: ['ignore', 'these'], if: false});
// => ['default', 'args']
export const conditionalArgs = (...args: ArgType[]): string[] => {
  return args.flatMap(arg => {
    if (typeof arg === 'string') {
      return [arg];
    }

    if (Array.isArray(arg)) {
      return arg;
    }

    return arg.if ? arg.args : [];
  });
};
