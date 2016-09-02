const path = require('path');

const menubar = require('menubar')({
	index: `file://${__dirname}/dist/index.html`,
	icon: path.join(__dirname, 'static', 'icon.png')
});

menubar.on('after-create-window', () => {
	menubar.window.openDevTools();
});
