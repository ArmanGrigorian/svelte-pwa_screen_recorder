<script lang="ts">
	interface Props {
		durationSeconds: number;
		isPaused: boolean;
		onPauseResume: () => void;
		onSnapshot: () => void;
		onStop: () => void;
		estimatedSizeMB?: number;
		resolution?: string;
	}

	let {
		durationSeconds,
		isPaused,
		onPauseResume,
		onSnapshot,
		onStop,
		estimatedSizeMB = 0,
		resolution = '1080p'
	}: Props = $props();

	function formatTime(totalSec: number): string {
		const mins = Math.floor(totalSec / 60);
		const secs = totalSec % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<div class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-bounce-in w-full max-w-md px-4">
	<div
		class="flex items-center justify-between gap-4 rounded-full border border-zinc-800/90 bg-[#0e0e11]/95 px-5 py-2.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/5"
	>
		<!-- Left: Pulse Dot & Timer -->
		<div class="flex items-center gap-3">
			<div class="relative flex size-2.5 items-center justify-center">
				{#if !isPaused}
					<span class="absolute size-full rounded-full bg-red-500 animate-ping opacity-75"></span>
					<span class="relative size-2.5 rounded-full bg-red-500"></span>
				{:else}
					<span class="relative size-2.5 rounded-full bg-amber-400"></span>
				{/if}
			</div>
			<div class="flex items-baseline gap-2">
				<span class="font-mono text-base font-semibold tracking-wider text-zinc-100">
					{formatTime(durationSeconds)}
				</span>
				<span class="font-mono text-[10px] text-zinc-400 uppercase">
					{isPaused ? 'PAUSED' : resolution}
				</span>
			</div>
		</div>

		<!-- Right: Action Control Buttons -->
		<div class="flex items-center gap-1.5">
			<!-- Pause / Resume -->
			<button
				type="button"
				onclick={onPauseResume}
				class="rounded-full border px-2.5 py-1 text-xs font-medium transition-all hover:cursor-pointer {isPaused
					? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
					: 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'}"
				title="Pause or resume (Space)"
			>
				{isPaused ? 'Resume' : 'Pause'}
			</button>

			<!-- Snapshot -->
			<button
				type="button"
				onclick={onSnapshot}
				class="rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:text-zinc-100 hover:cursor-pointer"
				title="Take immediate screenshot"
			>
				Snapshot
			</button>

			<!-- Stop Recording -->
			<button
				type="button"
				onclick={onStop}
				class="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-xs transition-all hover:bg-red-600 active:scale-95 hover:cursor-pointer"
				title="Stop recording (Shift + S)"
			>
				<span class="size-2 rounded-2xs bg-white"></span>
				<span>Stop</span>
			</button>
		</div>
	</div>
</div>
