import test from 'ava';

const { Application } = require('spectron')
const assert = require('assert')
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')


describe('Application launch', function () {
  this.timeout(10000)

  beforeEach(async function () {
    this.app = new Application({
      // Your electron path can be any binary
      // i.e for OSX an example path could be '/Applications/MyApp.app/Contents/MacOS/MyApp'
      // But for the sake of the example we fetch it from our node_modules.
      path: electronPath,

      
      args: [path.join(__dirname, '..')]
    })
    await this.app.start()
  })

  afterEach(async function () {
    if (this.app && this.app.isRunning()) {
      await this.app.stop()
    }
  })

  it('shows an initial window', async function () {
    const count = await this.app.client.getWindowCount()
    assert.equal(count, 1)
    // Please note that getWindowCount() will return 2 if `dev tools` are opened.
    // assert.equal(count, 2)
  })
})



test.beforeEach(async t => {
  t.context.app = new Application({
    path: '/home/mt/Kap/'
  });

  await t.context.app.start();
});

test.afterEach.always(async t => {
  await t.context.app.stop();
});

test('launch', async t => {
  const app = t.context.app;
  await app.client.waitUntilWindowLoaded();

  const win = app.browserWindow;
  t.is(await app.client.getWindowCount(), 1);
  t.false(await win.isMinimized());
  t.false(await win.isDevToolsOpened());
  t.true(await win.isVisible());
  t.true(await win.isFocused());

  const {width, height} = await win.getBounds();
  t.true(width > 0);
  t.true(height > 0);
});