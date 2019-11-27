const {app} = require('electron');

const ensureDockIsShowing = async action => {
  const wasDockShowing = app.dock.isVisible();
  if (!wasDockShowing) {
    await app.dock.show();
  }

  await action();

  if (!wasDockShowing) {
    app.dock.hide();
  }
};

module.exports = {
  ensureDockIsShowing
};
