const menubar = require('menubar')({
	index: `file://${__dirname}/dist/index.html`
});

menubar.on('after-create-window', () => {
	menubar.window.openDevTools();
});
