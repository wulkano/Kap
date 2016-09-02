document.addEventListener('DOMContentLoaded', () => {
	const aperture = require('aperture.js')();

	function startRecording() {
		const past = Date.now();

		aperture.startRecording()
			.then(() => {
				console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
			})
			.catch(console.error);
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
				const fileName = `Screen record ${Date()}.mp4`;
				askUserToSaveFile({fileName, filePath});
			});
	}

	document.querySelector('#start').onclick = startRecording;

	document.querySelector('#stop').onclick = stopRecording;
});
