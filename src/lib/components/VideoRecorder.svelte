<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type {
		RecorderType,
		RecordingOptions,
		RecordingHistoryItem,
		StudioTab
	} from '../../types/recorder.js';
	import {
		saveRecordingToDB,
		getSavedRecordings,
		deleteRecordingFromDB,
		updateRecordingTitleInDB,
		clearAllRecordingsFromDB
	} from '../../utils/indexedDB.js';
	import { createAudioMeter, type AudioMeterController } from '../../utils/audioMeter.js';

	import Header from './Header.svelte';
	import StudioControls from './StudioControls.svelte';
	import ActiveRecordingOverlay from './ActiveRecordingOverlay.svelte';
	import PreviewStudio from './PreviewStudio.svelte';
	import RecordingsLibrary from './RecordingsLibrary.svelte';
	import PortfolioShowcase from './PortfolioShowcase.svelte';

	const AUDIO_BITRATE = 1_048_576;
	const COUNTDOWN_SECONDS = 3;

	let activeTab: StudioTab = $state('studio');
	let recorderState: RecorderType = $state('ready');
	let countdownSeconds = $state(COUNTDOWN_SECONDS);
	let recordingDuration = $state(0);
	let micAudioLevel = $state(0);
	let isTestingMic = $state(false);

	let options: RecordingOptions = $state({
		mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
		frameRate: 60,
		audioBitsPerSecond: AUDIO_BITRATE,
		videoBitsPerSecond: 6_000_000,
		audio: true,
		resolution: '1080p',
		sourceMode: 'screen_audio',
		includeMic: false
	});

	let chunks: Blob[] = $state([]);
	let savedRecordings: RecordingHistoryItem[] = $state([]);
	let currentReviewItem: RecordingHistoryItem | null = $state(null);

	let mediaRecorder: MediaRecorder | null = null;
	let mediaStream: MediaStream | null = null;
	let micStream: MediaStream | null = null;
	let audioMeterController: AudioMeterController | null = null;
	let durationInterval: number | null = null;
	let countdownInterval: number | null = null;

	let estimatedSizeMB = $derived(chunks.reduce((acc, c) => acc + c.size, 0) / (1024 * 1024));

	onMount(async () => {
		await loadSavedRecordings();
	});

	async function loadSavedRecordings() {
		try {
			savedRecordings = await getSavedRecordings();
		} catch (err) {
			console.error('Error loading saved recordings:', err);
		}
	}

	function handleUpdateOptions(newOpts: Partial<RecordingOptions>) {
		options = { ...options, ...newOpts };
	}

	async function toggleMicTest() {
		if (isTestingMic) {
			if (audioMeterController) {
				audioMeterController.stop();
				audioMeterController = null;
			}
			if (micStream) {
				micStream.getTracks().forEach((track) => track.stop());
				micStream = null;
			}
			isTestingMic = false;
			micAudioLevel = 0;
			return;
		}

		try {
			micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			isTestingMic = true;
			audioMeterController = createAudioMeter(micStream, (level) => {
				micAudioLevel = level;
			});
		} catch (err) {
			console.error('Failed to test microphone:', err);
			alert('Microphone access denied or unavailable.');
		}
	}

	function resetCountdown(): Promise<void> {
		recorderState = 'ready.countdown';
		countdownSeconds = COUNTDOWN_SECONDS;

		return new Promise((resolve) => {
			if (countdownInterval) window.clearInterval(countdownInterval);

			countdownInterval = window.setInterval(() => {
				countdownSeconds--;
				if (countdownSeconds === 0) {
					if (countdownInterval) window.clearInterval(countdownInterval);
					resolve();
				}
			}, 1000);
		});
	}

	function stopStreamTracks() {
		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null;
		}
		if (micStream) {
			micStream.getTracks().forEach((track) => track.stop());
			micStream = null;
		}
		if (audioMeterController) {
			audioMeterController.stop();
			audioMeterController = null;
		}
	}

	function stopRecording() {
		if (countdownInterval) window.clearInterval(countdownInterval);
		if (durationInterval) window.clearInterval(durationInterval);

		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		} else {
			stopStreamTracks();
			if (recorderState !== 'reviewing') {
				recorderState = 'ready';
			}
		}
	}

	async function startRecording() {
		try {
			if (isTestingMic) {
				if (audioMeterController) audioMeterController.stop();
				if (micStream) micStream.getTracks().forEach((t) => t.stop());
				isTestingMic = false;
			}

			// 1. Get Display Media
			const displayStream = await navigator.mediaDevices
				.getDisplayMedia({
					video: { frameRate: options.frameRate },
					audio: options.sourceMode !== 'screen_only'
				})
				.catch((err) => {
					if (err.name === 'NotAllowedError') {
						console.warn('Screen share cancelled by user');
						return null;
					}
					throw err;
				});

			if (!displayStream) {
				recorderState = 'ready';
				return;
			}

			let finalStream = displayStream;

			// 2. Mix Microphone if selected
			if (options.includeMic || options.sourceMode === 'screen_mic') {
				try {
					micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
					const AudioContextClass =
						window.AudioContext ||
						(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
					const audioCtx = new AudioContextClass();
					const dest = audioCtx.createMediaStreamDestination();

					if (displayStream.getAudioTracks().length > 0) {
						const displaySource = audioCtx.createMediaStreamSource(displayStream);
						displaySource.connect(dest);
					}
					if (micStream.getAudioTracks().length > 0) {
						const micSource = audioCtx.createMediaStreamSource(micStream);
						micSource.connect(dest);
					}

					finalStream = new MediaStream([
						...displayStream.getVideoTracks(),
						...dest.stream.getAudioTracks()
					]);
				} catch (e) {
					console.warn('Could not mix microphone, proceeding with screen audio only', e);
				}
			}

			mediaStream = finalStream;
			mediaStream.addEventListener('inactive', stopRecording);
			displayStream.getVideoTracks().forEach((track) => {
				track.addEventListener('ended', stopRecording);
			});

			await resetCountdown();

			chunks = [];
			let selectedMime = options.mimeType;
			if (!MediaRecorder.isTypeSupported(selectedMime)) {
				if (MediaRecorder.isTypeSupported('video/mp4')) {
					selectedMime = 'video/mp4';
				} else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
					selectedMime = 'video/webm;codecs=vp9,opus';
				} else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
					selectedMime = 'video/webm;codecs=vp8,opus';
				} else if (MediaRecorder.isTypeSupported('video/webm')) {
					selectedMime = 'video/webm';
				} else {
					selectedMime = '';
				}
			}

			mediaRecorder = new MediaRecorder(mediaStream, {
				...(selectedMime ? { mimeType: selectedMime } : {}),
				audioBitsPerSecond: options.audioBitsPerSecond,
				videoBitsPerSecond: options.videoBitsPerSecond
			});

			mediaRecorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					chunks.push(e.data);
				}
			};

			mediaRecorder.onstop = async () => {
				stopStreamTracks();
				if (durationInterval) window.clearInterval(durationInterval);

				if (chunks.length > 0) {
					const actualMime = mediaRecorder?.mimeType || selectedMime || 'video/webm';
					const finalBlob = new Blob(chunks, { type: actualMime });
					const id = `rec-${Date.now()}`;
					const now = Date.now();
					const dateStr = new Date(now).toISOString().slice(0, 10);

					currentReviewItem = {
						id,
						title: `Studio-Recording-${dateStr}`,
						duration: recordingDuration,
						blob: finalBlob,
						mimeType: actualMime,
						resolution: options.resolution,
						size: finalBlob.size,
						timestamp: now
					};
					recorderState = 'reviewing';
				} else {
					recorderState = 'ready';
				}
			};

			recorderState = 'recording';
			recordingDuration = 0;
			mediaRecorder.start(1000); // 1-second timeslices for live size estimation

			if (durationInterval) window.clearInterval(durationInterval);
			durationInterval = window.setInterval(() => {
				if (recorderState === 'recording') {
					recordingDuration++;
				}
			}, 1000);
		} catch (err) {
			console.error('Error starting studio recording:', err);
			stopStreamTracks();
			recorderState = 'ready';
		}
	}

	function pauseResumeRecording() {
		if (!mediaRecorder) return;
		if (mediaRecorder.state === 'recording') {
			mediaRecorder.pause();
			recorderState = 'paused';
		} else if (mediaRecorder.state === 'paused') {
			mediaRecorder.resume();
			recorderState = 'recording';
		}
	}

	async function takeSnapshotDuringRecording() {
		if (!mediaStream) return;
		const videoTrack = mediaStream.getVideoTracks()[0];
		if (!videoTrack) return;

		if ('ImageCapture' in window) {
			try {
				const capture = new (
					window as unknown as {
						ImageCapture: new (t: MediaStreamTrack) => { grabFrame: () => Promise<ImageBitmap> };
					}
				).ImageCapture(videoTrack);
				const bitmap = await capture.grabFrame();
				const canvas = document.createElement('canvas');
				canvas.width = bitmap.width;
				canvas.height = bitmap.height;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(bitmap, 0, 0);
					canvas.toBlob((blob) => {
						if (blob) {
							const url = URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = `snapshot-live-${Date.now()}.png`;
							a.click();
							URL.revokeObjectURL(url);
						}
					});
				}
				return;
			} catch (e) {
				console.warn('ImageCapture API not available or failed, falling back to video element', e);
			}
		}

		const videoEl = document.createElement('video');
		videoEl.srcObject = new MediaStream([videoTrack]);
		videoEl.muted = true;
		videoEl.playsInline = true;
		videoEl.onloadedmetadata = () => {
			videoEl.play();
			setTimeout(() => {
				const canvas = document.createElement('canvas');
				canvas.width = videoEl.videoWidth || 1920;
				canvas.height = videoEl.videoHeight || 1080;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
					canvas.toBlob((blob) => {
						if (blob) {
							const url = URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = `snapshot-live-${Date.now()}.png`;
							a.click();
							URL.revokeObjectURL(url);
						}
					});
				}
				videoEl.pause();
				videoEl.srcObject = null;
			}, 200);
		};
	}

	async function handleSaveToLibrary(item: RecordingHistoryItem) {
		await saveRecordingToDB(item);
		await loadSavedRecordings();
	}

	function handleDiscardReview() {
		currentReviewItem = null;
		recorderState = 'ready';
	}

	async function handleDeleteFromLibrary(id: string) {
		await deleteRecordingFromDB(id);
		await loadSavedRecordings();
	}

	async function handleRenameInLibrary(id: string, newTitle: string) {
		await updateRecordingTitleInDB(id, newTitle);
		await loadSavedRecordings();
	}

	async function handleClearAllLibrary() {
		await clearAllRecordingsFromDB();
		await loadSavedRecordings();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			e.target instanceof HTMLSelectElement
		) {
			return;
		}

		switch (e.key) {
			case 'R':
			case 'r':
				if (e.shiftKey && recorderState === 'ready') {
					startRecording();
				}
				break;
			case 'S':
			case 's':
				if (e.shiftKey && (recorderState === 'recording' || recorderState === 'paused')) {
					stopRecording();
				}
				break;
			case ' ':
				if (recorderState === 'recording' || recorderState === 'paused') {
					e.preventDefault();
					pauseResumeRecording();
				}
				break;
		}
	}

	onDestroy(() => {
		stopStreamTracks();
		if (countdownInterval) window.clearInterval(countdownInterval);
		if (durationInterval) window.clearInterval(durationInterval);
	});
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class="min-h-dvh flex flex-col bg-[#09090b] text-zinc-100 selection:bg-zinc-100 selection:text-zinc-900"
>
	<Header
		{activeTab}
		onTabChange={(t) => {
			activeTab = t;
			if (recorderState === 'reviewing' && t !== 'studio') {
				// keep item ready
			}
		}}
		savedCount={savedRecordings.length}
		isRecording={recorderState === 'recording' || recorderState === 'paused'}
	/>

	<main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
		{#if activeTab === 'studio'}
			{#if recorderState === 'reviewing' && currentReviewItem}
				<PreviewStudio
					recordingItem={currentReviewItem}
					onSaveToLibrary={handleSaveToLibrary}
					onDiscard={handleDiscardReview}
				/>
			{:else}
				<StudioControls
					{options}
					{recorderState}
					{countdownSeconds}
					{micAudioLevel}
					{isTestingMic}
					onStartRecording={startRecording}
					onToggleMicTest={toggleMicTest}
					onUpdateOptions={handleUpdateOptions}
				/>
			{/if}
		{:else if activeTab === 'library'}
			<RecordingsLibrary
				recordings={savedRecordings}
				onSelectForReview={(item) => {
					currentReviewItem = item;
					recorderState = 'reviewing';
					activeTab = 'studio';
				}}
				onDelete={handleDeleteFromLibrary}
				onRename={handleRenameInLibrary}
				onClearAll={handleClearAllLibrary}
			/>
		{:else if activeTab === 'portfolio'}
			<PortfolioShowcase />
		{/if}
	</main>

	{#if recorderState === 'recording' || recorderState === 'paused'}
		<ActiveRecordingOverlay
			durationSeconds={recordingDuration}
			isPaused={recorderState === 'paused'}
			onPauseResume={pauseResumeRecording}
			onSnapshot={takeSnapshotDuringRecording}
			onStop={stopRecording}
			{estimatedSizeMB}
			resolution={options.resolution}
		/>
	{/if}

	<!-- Minimalist Footer -->
	<footer class="border-t border-zinc-800/80 bg-[#09090b] py-5 text-center text-xs text-zinc-500">
		<div
			class="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4"
		>
			<p>StudioCast PRO • Client-Side Svelte 5 PWA</p>
			<div class="flex items-center gap-3">
				<span class="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
					<span class="size-1.5 rounded-full bg-emerald-500"></span> 100% Local Privacy
				</span>
				<span class="text-zinc-700">•</span>
				<span class="font-mono text-[11px] text-zinc-400">Svelte 5 Runes</span>
			</div>
		</div>
	</footer>
</div>
