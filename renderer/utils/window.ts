
export const resizeKeepingCenter = (
  bounds: Electron.Rectangle,
  newSize: {width: number, height: number}
): Electron.Rectangle => {
  const cx = Math.round(bounds.x + (bounds.width / 2));
  const cy = Math.round(bounds.y + (bounds.height / 2));

  return {
    x: Math.round(cx - (newSize.width / 2)),
    y: Math.round(cy - (newSize.height / 2)),
    width: newSize.width,
    height: newSize.height
  };
};
