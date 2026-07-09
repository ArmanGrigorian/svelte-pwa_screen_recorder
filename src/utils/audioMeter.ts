export interface AudioMeterController {
	stop: () => void;
}

export function createAudioMeter(
	stream: MediaStream,
	onLevelUpdate: (level: number) => void
): AudioMeterController | null {
	if (typeof window === 'undefined') return null;

	const audioTracks = stream.getAudioTracks();
	if (audioTracks.length === 0) {
		onLevelUpdate(0);
		return null;
	}

	try {
		const AudioContextClass =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (!AudioContextClass) return null;

		const audioCtx = new AudioContextClass();
		if (audioCtx.state === 'suspended') {
			audioCtx.resume().catch(() => {});
		}
		const analyser = audioCtx.createAnalyser();
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = 0.8;

		const source = audioCtx.createMediaStreamSource(stream);
		source.connect(analyser);

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		let animationFrameId: number | null = null;
		let isRunning = true;

		const updateMeter = () => {
			if (!isRunning) return;

			analyser.getByteFrequencyData(dataArray);
			let sum = 0;
			for (let i = 0; i < dataArray.length; i++) {
				sum += dataArray[i];
			}
			const average = sum / dataArray.length;
			// Convert 0-255 average to 0-100 percentage
			const percentage = Math.min(100, Math.round((average / 128) * 100));
			onLevelUpdate(percentage);

			animationFrameId = requestAnimationFrame(updateMeter);
		};

		updateMeter();

		return {
			stop: () => {
				isRunning = false;
				if (animationFrameId) cancelAnimationFrame(animationFrameId);
				try {
					source.disconnect();
					if (audioCtx.state !== 'closed') {
						audioCtx.close();
					}
				} catch (e) {
					console.error('Error closing audio meter context', e);
				}
				onLevelUpdate(0);
			}
		};
	} catch (err) {
		console.error('Failed to create audio meter:', err);
		onLevelUpdate(0);
		return null;
	}
}
