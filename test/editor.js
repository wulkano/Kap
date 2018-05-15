const {app} = require('electron');
const {openEditorWindow} = require('../main/editor');

app.once('ready', () => {
  openEditorWindow({alwaysOnTop: true});
});
