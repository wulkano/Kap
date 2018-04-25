const electron = require('electron');

const {app, Notification} = electron;

const notify = text => {
  const notification = new Notification({
    title: app.getName(),
    body: text
  });

  notification.show();
};

module.exports = {
  notify
};
