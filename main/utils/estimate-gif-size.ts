// How long a slice of the recording is exported in the background to estimate
// the size of the full GIF export. The sample runs through the exact GIF
// pipeline (ffmpeg palette + gifsicle), so the estimate tracks the real
// encoder; one second is enough for the sample to be representative while
// keeping the background export cheap.
export const GIF_SIZE_SAMPLE_SECONDS = 1;

export interface GifSizeSampleWindow {
  sampleStart: number;
  sampleEnd: number;
  sampleFrames: number;
  totalFrames: number;
}

export const getGifSampleWindow = ({startTime, endTime, fps}: {startTime: number; endTime: number; fps: number}): GifSizeSampleWindow => {
  const duration = Math.max(0, endTime - startTime);
  const totalFrames = Math.max(1, Math.round(duration * fps));
  const sampleDuration = Math.min(GIF_SIZE_SAMPLE_SECONDS, duration);
  const sampleFrames = Math.max(1, Math.round(sampleDuration * fps));

  return {
    sampleStart: startTime,
    sampleEnd: startTime + sampleDuration,
    sampleFrames,
    totalFrames
  };
};

export const estimateGifSizeBytes = ({sampleBytes, sampleFrames, totalFrames}: {sampleBytes: number; sampleFrames: number; totalFrames: number}): number => {
  if (sampleBytes <= 0 || sampleFrames <= 0) {
    return 0;
  }

  if (totalFrames <= sampleFrames) {
    return sampleBytes;
  }

  return Math.round((sampleBytes * totalFrames) / sampleFrames);
};
