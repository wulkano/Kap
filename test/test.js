const path = require('path');
const test = require('ava');
const {Application} = require('spectron');

const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const appPath = path.join(__dirname, '../main/index.js');
test.beforeEach(async t => {
  t.context.app = new Application({
    path: electronPath,
    args: [appPath],
    chromeDriverArgs: ['no-sandbox'],
    env: {ELECTRON_ENABLE_LOGGING: true, ELECTRON_ENABLE_STACK_DUMPING: true, NODE_ENV: 'test'},
    startTimeout: 2000,
    waitTimeout: 5000,
    chromeDriverLogPath: '../chromedriverlog.txt'
  });
  await t.context.app.start();
});

test.afterEach.always(async t => {
  await t.context.app.stop();
});

test('launch app and get information', async t => {
  const {app} = t.context;
  const {client} = app;
  // Needs 2 windows because of dev tools
  t.is(await client.getWindowCount(), 2);
});
