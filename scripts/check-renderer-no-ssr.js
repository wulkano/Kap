const assert = require('assert');
const path = require('path');
const Module = require('module');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const originalLoad = Module._load;
const loadedElectronModules = [];

Module._load = function (request, parent, isMain) {
  if (request === 'electron' || request.startsWith('electron-')) {
    loadedElectronModules.push(request);
  }

  return originalLoad.call(this, request, parent, isMain);
};

let markup;

try {
  const appPath = path.join(__dirname, '..', 'renderer', '.next', 'server', 'pages', '_app.js');
  const MainApp = require(appPath).default;
  const TestPage = () => React.createElement('main', null, 'renderer');

  markup = renderToStaticMarkup(React.createElement(MainApp, {
    Component: TestPage,
    pageProps: {}
  }));
} finally {
  Module._load = originalLoad;
}

assert.deepStrictEqual(
  loadedElectronModules,
  [],
  `The server renderer loaded Electron modules: ${loadedElectronModules.join(', ')}`
);
assert.strictEqual(markup, '', 'The server renderer produced application markup');

console.log('Renderer server shell is client-only');
