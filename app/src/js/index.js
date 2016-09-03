document.addEventListener('DOMContentLoaded', () => {
	const aperture = require('aperture.js')();
	let recording = false;

	function startRecording() {
		const past = Date.now();

		recording = true;
		aperture.startRecording()
			.then(() => {
				console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
			})
			.catch(console.error);
				recording = false;
	}

	function askUserToSaveFile(opts) {
		if (!opts.filePath || !opts.fileName) {
			throw new Error('askUserToSaveFile must be called with {filePath, fileName}');
		}

		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = opts.filePath;
		a.download = opts.fileName;
		document.body.appendChild(a);
		a.click();
	}

	function stopRecording() {
		aperture.stopRecording()
			.then(filePath => {
				recording = false;
				const fileName = `Screen record ${Date()}.mp4`;
				askUserToSaveFile({fileName, filePath});
			});
	}

	document.querySelector('#start').onclick = () => {
		if (recording) {
			stopRecording();
		} else {
			startRecording();
		}
	};
});
