document.addEventListener('DOMContentLoaded', () => {
	const aperture = require('aperture.js')();
	const spinnerFrames = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
	let currentSpinnerFrame = 0;

	let recording = false;

	function startSpinner() {
		spinnerIntervalId = setInterval(() => {
			const frame = spinnerFrames[currentSpinnerFrame];
			currentSpinnerFrame = ++currentSpinnerFrame % spinnerFrames.length;

			title.innerText = `Starting ${frame}`;
		}, 100);
	}

	function stopSpinner() {
		clearInterval(spinnerIntervalId);
	}

	function startRecording() {
		const past = Date.now();
		startSpinner();
		recording = true;
		aperture.startRecording()
			.then(() => {
				stopSpinner();
				title.innerText = 'Recording ✅';
				console.log(`Started recording after ${(Date.now() - past) / 1000}s`);
			})
			.catch(err => {
				recording = false;
				console.error(err);
				stopSpinner();
				title.innerText = 'Error 😔';
			});
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
				title.innerText = 'Focus';
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
