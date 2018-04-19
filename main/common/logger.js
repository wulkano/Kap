let window;
let windowIsReady = false;
let pendingMessages = [];

function init(mainWindow) {
  window = mainWindow;

  window.on('show', () => {
    if (windowIsReady === false) {
      windowIsReady = true;
      for (const chunk of pendingMessages) {
        window.webContents.send('log', chunk);
      }
      pendingMessages = [];
    }
  });
}

function log(...msgs) {
  if (process.type === 'browser') { // Main process
    if (window && windowIsReady) {
      window.webContents.send('log', msgs);
    } else {
      pendingMessages.push(msgs);
    }
  } else {
    console.log(...msgs);
  }
}

exports.init = init;
exports.log = log;
