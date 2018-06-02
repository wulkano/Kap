import unhandled from 'electron-unhandled';

export const init = () => {};

export const report = err => {
  console.error(err);
};

export const log = () => {};

unhandled({
  logger: report
});
