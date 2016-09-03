const path = require('path');

const menubar = require('menubar')({
	index: `file://${__dirname}/dist/index.html`,
	icon: path.join(__dirname, 'static', 'iconTemplate.png'),
	width: 250,
	height: 150,
	transparent: true
});

if (process.env.DEBUG_FOCUS) {
	menubar.setOption('alwaysOnTop', true);
}

menubar.on('after-create-window', () => {
	menubar.window.openDevTools();
});
