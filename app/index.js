const {homedir} = require('os');
const path = require('path');

const {app, BrowserWindow, ipcMain} = require('electron');
const aperture = require('aperture.js')();

let win;

function createWindow() {
	win = new BrowserWindow({width: 800, height: 600});

	win.loadURL(`file://${__dirname}/index.html`);

	win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});

	ipcMain.on('start-recording', event => {
		aperture.startRecording()
			.then(() => {
				event.sender.send('started-recording', Date.now());
			})
			.catch(console.error);
	});

	ipcMain.on('stop-recording', event => {
		console.log('ipc#stop-rec');
		aperture.stopRecording()
			.then(filePath => {
				event.sender.send('stopped-recording', filePath);
			})
			.catch(console.error);
	});
}

app.on('ready', () => {
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
