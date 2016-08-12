const {app, BrowserWindow, ipcMain} = require('electron');
const aperture = require('../aperture').main;

let win;

function createWindow() {
	win = new BrowserWindow({width: 800, height: 600});

	win.loadURL(`file://${__dirname}/index.html`);

	win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});

	ipcMain.on('renderer-ready', (event, arg) => {
		console.log(arg);
		event.sender.send('start-capturing', Date.now());
	});
}

app.on('ready', () => {
	aperture.init();
	createWindow();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (win === null) {
		createWindow();
	}
});
