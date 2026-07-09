<script lang="ts">
	import type { RecordingHistoryItem } from '../../types/recorder.js';

	interface Props {
		recordingItem: RecordingHistoryItem;
		onSaveToLibrary: (item: RecordingHistoryItem) => Promise<void>;
		onDiscard: () => void;
	}

	let { recordingItem, onSaveToLibrary, onDiscard }: Props = $props();

	let videoElement: HTMLVideoElement | null = $state(null);
	let title = $state('');
	let isSaving = $state(false);
	let isSaved = $state(false);
	let videoUrl = $state('');

	$effect(() => {
		if (recordingItem && recordingItem.blob) {
			title = recordingItem.title;
			const url = URL.createObjectURL(recordingItem.blob);
			videoUrl = url;
			return () => {
				URL.revokeObjectURL(url);
			};
		}
	});

	function formatDuration(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}m ${s}s`;
	}

	function formatSize(bytes: number): string {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}

	async function handleSave() {
		if (isSaved || isSaving) return;
		isSaving = true;
		try {
			recordingItem.title = title;
			await onSaveToLibrary(recordingItem);
			isSaved = true;
		} catch (err) {
			console.error(err);
			alert('Failed to save to local IndexedDB library');
		} finally {
			isSaving = false;
		}
	}

	function downloadVideo() {
		const a = document.createElement('a');
		a.href = videoUrl;
		const extension = recordingItem.mimeType.includes('webm') ? 'webm' : 'mp4';
		a.download = `${title || 'screen-recording'}.${extension}`;
		a.click();
	}

	async function downloadAudioOnly() {
		if (!recordingItem.blob) return;
		try {
			const a = document.createElement('a');
			a.href = videoUrl;
			a.download = `${title || 'audio-track'}.webm`;
			a.click();
		} catch (e) {
			console.error(e);
		}
	}

	function takeVideoSnapshot() {
		if (!videoElement) return;
		const canvas = document.createElement('canvas');
		canvas.width = videoElement.videoWidth || 1920;
		canvas.height = videoElement.videoHeight || 1080;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${title || 'snapshot'}-${Math.floor(videoElement?.currentTime || 0)}s.png`;
			a.click();
			URL.revokeObjectURL(url);
		});
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 py-6 sm:py-8 animate-fade-in">
	<!-- Review Header Bar -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div class="flex-1 max-w-md">
			<label
				for="recording-title-input"
				class="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1"
				>Recording Title</label
			>
			<input
				id="recording-title-input"
				type="text"
				bind:value={title}
				class="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-base font-semibold text-zinc-100 focus:border-zinc-700 focus:outline-none"
				placeholder="Enter title..."
			/>
		</div>

		<!-- Specs badges -->
		<div class="flex items-center gap-3 font-mono text-xs text-zinc-400">
			<span class="rounded border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
				{recordingItem.resolution.toUpperCase()}
			</span>
			<span class="rounded border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
				{formatDuration(recordingItem.duration)}
			</span>
			<span class="rounded border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
				{formatSize(recordingItem.size)}
			</span>
		</div>
	</div>

	<!-- High Definition Video Player -->
	<div class="overflow-hidden rounded-xl border border-zinc-800/80 bg-black shadow-xl">
		{#if videoUrl}
			<video
				bind:this={videoElement}
				src={videoUrl}
				controls
				class="max-h-[65vh] w-full object-contain"
				playsinline
			>
				<track kind="captions" />
			</video>
		{/if}
	</div>

	<!-- Action Deck -->
	<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center pt-2">
		<!-- Left: Discard -->
		<button
			type="button"
			onclick={onDiscard}
			class="rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-800 hover:bg-zinc-900 hover:text-red-400 hover:cursor-pointer self-start"
		>
			Discard & Record New
		</button>

		<!-- Right: Export & Save options -->
		<div class="flex flex-wrap items-center gap-2 self-end">
			<button
				type="button"
				onclick={takeVideoSnapshot}
				class="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-zinc-100 hover:cursor-pointer"
				title="Capture current video frame as PNG image"
			>
				Take Snapshot
			</button>

			<button
				type="button"
				onclick={downloadAudioOnly}
				class="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-zinc-100 hover:cursor-pointer"
				title="Download Audio Track Only"
			>
				Audio Only (.webm)
			</button>

			<button
				type="button"
				onclick={downloadVideo}
				class="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-zinc-100 hover:cursor-pointer"
			>
				Download Video
			</button>

			<!-- Save to DB -->
			<button
				type="button"
				onclick={handleSave}
				disabled={isSaved || isSaving}
				class="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-white active:scale-98 disabled:opacity-60 hover:cursor-pointer shadow-xs"
			>
				{#if isSaving}
					<span class="size-3 animate-spin rounded-full border border-zinc-900 border-t-transparent"
					></span>
					<span>Saving...</span>
				{:else if isSaved}
					<span>Saved to Library ✓</span>
				{:else}
					<span>Save to Library</span>
				{/if}
			</button>
		</div>
	</div>
</div>
