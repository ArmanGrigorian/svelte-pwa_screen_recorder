<script lang="ts">
	import type {
		RecorderType,
		RecordingOptions,
		RecordingResolution,
		RecordingSourceMode
	} from '../../types/recorder.js';

	interface Props {
		options: RecordingOptions;
		recorderState: RecorderType;
		countdownSeconds: number;
		micAudioLevel: number;
		isTestingMic: boolean;
		onStartRecording: () => void;
		onToggleMicTest: () => void;
		onUpdateOptions: (newOptions: Partial<RecordingOptions>) => void;
	}

	let {
		options,
		recorderState,
		countdownSeconds,
		micAudioLevel,
		isTestingMic,
		onStartRecording,
		onToggleMicTest,
		onUpdateOptions
	}: Props = $props();

	function handleSourceModeChange(mode: RecordingSourceMode) {
		onUpdateOptions({
			sourceMode: mode,
			audio: mode !== 'screen_only',
			includeMic: mode === 'screen_mic' || options.includeMic
		});
	}

	function handleResolutionChange(res: RecordingResolution) {
		let videoBitsPerSecond = 4_000_000;
		if (res === '4k') videoBitsPerSecond = 12_000_000;
		if (res === '1080p') videoBitsPerSecond = 6_000_000;
		if (res === '720p') videoBitsPerSecond = 2_500_000;

		onUpdateOptions({
			resolution: res,
			videoBitsPerSecond
		});
	}

	function handleFrameRateChange(fps: number) {
		onUpdateOptions({ frameRate: fps });
	}

	function handleCodecChange(mime: string) {
		onUpdateOptions({ mimeType: mime });
	}
</script>

<div class="mx-auto max-w-3xl space-y-6 py-6 sm:py-10">
	<!-- Concise Header -->
	<div>
		<h2 class="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">New Recording</h2>
		<p class="mt-1 text-sm text-zinc-400">
			Configure your display capture, audio tracks, and output quality.
		</p>
	</div>

	{#if recorderState === 'ready.countdown'}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/30 py-16 text-center animate-fade-in"
		>
			<div
				class="flex size-24 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-5xl font-mono font-bold text-zinc-100 shadow-xl"
			>
				{countdownSeconds}
			</div>
			<p class="mt-4 text-sm font-medium text-zinc-300">Starting display capture...</p>
			<p class="text-xs text-zinc-500 mt-1">Select your screen or window when prompted</p>
		</div>
	{:else}
		<!-- Main Configuration Panel -->
		<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-6">
			<!-- Section 1: Capture Target -->
			<div class="space-y-3">
				<h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Capture Source</h4>
				<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
					<button
						type="button"
						onclick={() => handleSourceModeChange('screen_audio')}
						class="flex flex-col items-start rounded-lg border p-3.5 text-left transition-all hover:cursor-pointer {options.sourceMode ===
						'screen_audio'
							? 'border-zinc-100 bg-zinc-800/80 text-zinc-100'
							: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
					>
						<span class="text-xs font-semibold">Screen + System Audio</span>
						<span class="mt-0.5 text-[11px] text-zinc-500">Includes internal device sound</span>
					</button>

					<button
						type="button"
						onclick={() => handleSourceModeChange('screen_mic')}
						class="flex flex-col items-start rounded-lg border p-3.5 text-left transition-all hover:cursor-pointer {options.sourceMode ===
						'screen_mic'
							? 'border-zinc-100 bg-zinc-800/80 text-zinc-100'
							: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
					>
						<span class="text-xs font-semibold">Screen + Microphone</span>
						<span class="mt-0.5 text-[11px] text-zinc-500">Mixes mic with display capture</span>
					</button>

					<button
						type="button"
						onclick={() => handleSourceModeChange('screen_only')}
						class="flex flex-col items-start rounded-lg border p-3.5 text-left transition-all hover:cursor-pointer {options.sourceMode ===
						'screen_only'
							? 'border-zinc-100 bg-zinc-800/80 text-zinc-100'
							: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
					>
						<span class="text-xs font-semibold">Silent Video</span>
						<span class="mt-0.5 text-[11px] text-zinc-500">Display stream without audio</span>
					</button>
				</div>
			</div>

			<!-- Section 2: Audio Level Check -->
			<div class="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-4">
				<div class="flex items-center justify-between gap-4">
					<div class="flex items-center gap-2">
						<span class="text-xs font-medium text-zinc-300">Microphone Input Level</span>
						{#if isTestingMic}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
							>
								<span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
							</span>
						{/if}
					</div>
					<button
						type="button"
						onclick={onToggleMicTest}
						class="rounded border px-2.5 py-1 text-xs font-medium transition-colors hover:cursor-pointer {isTestingMic
							? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
							: 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
					>
						{isTestingMic ? 'Stop Check' : 'Test Input'}
					</button>
				</div>

				<!-- Equalizer Bars -->
				<div
					class="mt-3 flex h-5 w-full items-center gap-1 rounded bg-zinc-950 p-1 border border-zinc-800/60"
				>
					{#each Array(24) as _, i}
						{@const threshold = (i + 1) * 4.1}
						{@const isActive = micAudioLevel >= threshold}
						<div
							class="h-full flex-1 rounded-2xs transition-all duration-75 {isActive
								? i > 19
									? 'bg-red-500'
									: i > 15
										? 'bg-amber-400'
										: 'bg-zinc-200'
								: 'bg-zinc-800/60'}"
						></div>
					{/each}
				</div>
			</div>

			<!-- Section 3: Quality & Container Settings -->
			<div class="space-y-4 pt-2 border-t border-zinc-800/80">
				<!-- Resolution -->
				<div class="space-y-2">
					<h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Resolution</h4>
					<div class="grid grid-cols-3 gap-2.5">
						<button
							type="button"
							onclick={() => handleResolutionChange('1080p')}
							class="rounded-lg border py-2 px-3 text-center transition-all hover:cursor-pointer {options.resolution ===
							'1080p'
								? 'border-zinc-100 bg-zinc-800/80 text-zinc-100 font-medium'
								: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
						>
							<span class="block text-xs">1080p Full HD</span>
						</button>

						<button
							type="button"
							onclick={() => handleResolutionChange('4k')}
							class="rounded-lg border py-2 px-3 text-center transition-all hover:cursor-pointer {options.resolution ===
							'4k'
								? 'border-zinc-100 bg-zinc-800/80 text-zinc-100 font-medium'
								: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
						>
							<span class="block text-xs">4K Ultra HD</span>
						</button>

						<button
							type="button"
							onclick={() => handleResolutionChange('720p')}
							class="rounded-lg border py-2 px-3 text-center transition-all hover:cursor-pointer {options.resolution ===
							'720p'
								? 'border-zinc-100 bg-zinc-800/80 text-zinc-100 font-medium'
								: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
						>
							<span class="block text-xs">720p HD</span>
						</button>
					</div>
				</div>

				<!-- Frame Rate & Format -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
					<div class="space-y-2">
						<h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Frame Rate</h4>
						<div class="grid grid-cols-2 gap-2.5">
							<button
								type="button"
								onclick={() => handleFrameRateChange(60)}
								class="rounded-lg border py-2 px-3 text-xs transition-all hover:cursor-pointer {options.frameRate ===
								60
									? 'border-zinc-100 bg-zinc-800/80 text-zinc-100 font-medium'
									: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
							>
								60 FPS (Pro)
							</button>
							<button
								type="button"
								onclick={() => handleFrameRateChange(30)}
								class="rounded-lg border py-2 px-3 text-xs transition-all hover:cursor-pointer {options.frameRate ===
								30
									? 'border-zinc-100 bg-zinc-800/80 text-zinc-100 font-medium'
									: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
							>
								30 FPS (Eco)
							</button>
						</div>
					</div>

					<div class="space-y-2">
						<h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
							Format Container
						</h4>
						<div class="grid grid-cols-2 gap-2.5">
							<button
								type="button"
								onclick={() => handleCodecChange('video/mp4;codecs=avc1.42E01E,mp4a.40.2')}
								class="rounded-lg border py-2 px-3 text-xs transition-all hover:cursor-pointer {options.mimeType.includes(
									'mp4'
								)
									? 'border-zinc-100 bg-zinc-800/80 text-zinc-100 font-medium'
									: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
							>
								MP4 (avc1)
							</button>
							<button
								type="button"
								onclick={() => handleCodecChange('video/webm;codecs=vp9,opus')}
								class="rounded-lg border py-2 px-3 text-xs transition-all hover:cursor-pointer {options.mimeType.includes(
									'webm'
								)
									? 'border-zinc-100 bg-zinc-800/80 text-zinc-100 font-medium'
									: 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'}"
							>
								WebM (VP9)
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Bar -->
		<div class="flex items-center justify-between pt-2">
			<div class="text-xs text-zinc-400 font-mono">
				Shortcut: <kbd
					class="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-300"
					>Shift + R</kbd
				>
			</div>

			<button
				type="button"
				onclick={onStartRecording}
				class="flex items-center gap-2 rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-white active:scale-98 hover:cursor-pointer shadow-sm"
			>
				<span class="size-2 rounded-full bg-red-500 animate-pulse"></span>
				<span>Start Recording</span>
			</button>
		</div>
	{/if}
</div>
