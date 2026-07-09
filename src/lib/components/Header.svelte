<script lang="ts">
	import type { StudioTab } from '../../types/recorder.js';

	interface Props {
		activeTab: StudioTab;
		onTabChange: (tab: StudioTab) => void;
		savedCount?: number;
		isRecording?: boolean;
	}

	let { activeTab, onTabChange, savedCount = 0, isRecording = false }: Props = $props();
	let showShortcutsModal = $state(false);
</script>

<header
	class="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md"
>
	<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
		<!-- Brand / Logo -->
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-2">
				<span class="relative flex size-2.5 items-center justify-center">
					<span
						class="absolute size-full rounded-full bg-red-500 animate-ping opacity-75"
						class:hidden={!isRecording}
					></span>
					<span class="relative size-2.5 rounded-full bg-red-500"></span>
				</span>
				<span class="text-sm font-semibold tracking-tight text-zinc-100 sm:text-base">
					StudioCast
				</span>
				<span
					class="rounded border border-zinc-800 bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-400"
				>
					PRO
				</span>
			</div>
		</div>

		<!-- Tab Navigation -->
		<nav class="flex items-center gap-1 rounded-lg border border-zinc-800/80 bg-zinc-900/50 p-1">
			<button
				type="button"
				onclick={() => onTabChange('studio')}
				class="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all hover:cursor-pointer {activeTab ===
				'studio'
					? 'bg-zinc-800 text-zinc-100 shadow-xs'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				<span>Studio</span>
			</button>

			<button
				type="button"
				onclick={() => onTabChange('library')}
				class="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all hover:cursor-pointer {activeTab ===
				'library'
					? 'bg-zinc-800 text-zinc-100 shadow-xs'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				<span>Library</span>
				{#if savedCount > 0}
					<span
						class="flex size-4 items-center justify-center rounded-full bg-zinc-700 font-mono text-[10px] text-zinc-200"
					>
						{savedCount}
					</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => onTabChange('portfolio')}
				class="flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all hover:cursor-pointer {activeTab ===
				'portfolio'
					? 'bg-zinc-800 text-zinc-100 shadow-xs'
					: 'text-zinc-400 hover:text-zinc-200'}"
			>
				<span>Specs</span>
			</button>
		</nav>

		<!-- Right Actions -->
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => (showShortcutsModal = true)}
				class="hidden items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 font-mono text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200 sm:flex hover:cursor-pointer"
				title="Keyboard shortcuts"
			>
				<span>⌘ Shortcuts</span>
			</button>

			<div class="flex items-center gap-1.5 text-xs text-zinc-400" title="Offline PWA Ready">
				<span class="size-1.5 rounded-full bg-emerald-500"></span>
				<span class="hidden text-[11px] font-medium sm:inline">Offline</span>
			</div>
		</div>
	</div>

	<!-- Shortcuts Modal -->
	{#if showShortcutsModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
		>
			<div class="w-full max-w-sm rounded-xl border border-zinc-800 bg-[#0c0c0e] p-5 shadow-2xl">
				<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
					<h3 class="text-sm font-semibold text-zinc-100">Keyboard Shortcuts</h3>
					<button
						type="button"
						onclick={() => (showShortcutsModal = false)}
						aria-label="Close shortcuts modal"
						class="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors hover:cursor-pointer"
					>
						<svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div class="mt-4 space-y-2.5">
					<div
						class="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2"
					>
						<span class="text-xs text-zinc-300">Start Recording</span>
						<kbd
							class="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-200"
							>Shift + R</kbd
						>
					</div>
					<div
						class="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2"
					>
						<span class="text-xs text-zinc-300">Stop Recording</span>
						<kbd
							class="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-200"
							>Shift + S</kbd
						>
					</div>
					<div
						class="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2"
					>
						<span class="text-xs text-zinc-300">Pause / Resume</span>
						<kbd
							class="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-200"
							>Space</kbd
						>
					</div>
				</div>

				<div class="mt-5 flex justify-end">
					<button
						type="button"
						onclick={() => (showShortcutsModal = false)}
						class="rounded-lg bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 transition-all hover:bg-white hover:cursor-pointer"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	{/if}
</header>
