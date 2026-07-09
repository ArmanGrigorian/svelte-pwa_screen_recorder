<script lang="ts">
	import type { RecordingHistoryItem } from '../../types/recorder.js';

	interface Props {
		recordings: RecordingHistoryItem[];
		onSelectForReview: (item: RecordingHistoryItem) => void;
		onDelete: (id: string) => Promise<void>;
		onRename: (id: string, newTitle: string) => Promise<void>;
		onClearAll: () => Promise<void>;
	}

	let { recordings, onSelectForReview, onDelete, onRename, onClearAll }: Props = $props();

	let editingId: string | null = $state(null);
	let editTitle = $state('');

	function startEdit(item: RecordingHistoryItem) {
		editingId = item.id;
		editTitle = item.title;
	}

	async function saveEdit(id: string) {
		if (editTitle.trim()) {
			await onRename(id, editTitle.trim());
		}
		editingId = null;
	}

	function formatDuration(sec: number): string {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}m ${s}s`;
	}

	function formatSize(bytes: number): string {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}

	function downloadItem(item: RecordingHistoryItem) {
		const url = URL.createObjectURL(item.blob);
		const a = document.createElement('a');
		a.href = url;
		const extension = item.mimeType.includes('webm') ? 'webm' : 'mp4';
		a.download = `${item.title || 'recording'}.${extension}`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="mx-auto max-w-5xl space-y-6 py-6 sm:py-10 animate-fade-in">
	<!-- Library Header -->
	<div class="flex items-center justify-between border-b border-zinc-800/80 pb-5">
		<div>
			<h2 class="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
				Recordings Library
			</h2>
			<p class="mt-1 text-sm text-zinc-400">
				Saved videos persist offline inside your browser's local database.
			</p>
		</div>

		{#if recordings.length > 0}
			<button
				type="button"
				onclick={async () => {
					if (confirm('Permanently clear all saved recordings?')) {
						await onClearAll();
					}
				}}
				class="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:cursor-pointer"
			>
				Clear All
			</button>
		{/if}
	</div>

	<!-- Content Grid / Empty state -->
	{#if recordings.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/20 py-20 text-center"
		>
			<div
				class="flex size-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-500 mb-3"
			>
				<svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<h3 class="text-sm font-semibold text-zinc-200">No saved recordings</h3>
			<p class="mt-1 max-w-sm text-xs text-zinc-400">
				Recordings you save after capturing in the Studio tab will appear here.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each recordings as item (item.id)}
				<div
					class="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4 transition-all hover:border-zinc-700"
				>
					<div>
						<!-- Thumbnail / Aspect Box -->
						<div
							class="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-zinc-950 border border-zinc-800/60"
						>
							{#if item.snapshotBlob}
								<img
									src={URL.createObjectURL(item.snapshotBlob)}
									alt={item.title}
									class="size-full object-cover opacity-85"
								/>
							{:else}
								<div class="flex flex-col items-center justify-center text-zinc-600">
									<span class="font-mono text-xs font-semibold tracking-wider text-zinc-500"
										>{item.resolution.toUpperCase()}</span
									>
								</div>
							{/if}

							<!-- Overlay badges -->
							<div class="absolute top-2 left-2 flex gap-1">
								<span
									class="rounded bg-black/70 backdrop-blur-xs px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-300"
								>
									{item.resolution.toUpperCase()}
								</span>
							</div>

							<div
								class="absolute bottom-2 right-2 rounded bg-black/70 backdrop-blur-xs px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-300"
							>
								{formatDuration(item.duration)}
							</div>
						</div>

						<!-- Title & Date -->
						<div class="mt-3">
							{#if editingId === item.id}
								<div class="flex items-center gap-1.5">
									<input
										type="text"
										bind:value={editTitle}
										class="w-full rounded border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-100 focus:outline-none"
										onkeydown={(e) => e.key === 'Enter' && saveEdit(item.id)}
									/>
									<button
										type="button"
										onclick={() => saveEdit(item.id)}
										class="rounded bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-950 hover:cursor-pointer"
									>
										Save
									</button>
								</div>
							{:else}
								<div class="flex items-center justify-between gap-1.5">
									<h4 class="font-medium text-zinc-100 truncate text-sm" title={item.title}>
										{item.title}
									</h4>
									<button
										type="button"
										onclick={() => startEdit(item)}
										class="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors hover:cursor-pointer"
										title="Rename"
									>
										<svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
											/>
										</svg>
									</button>
								</div>
							{/if}
							<div class="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
								<span>{new Date(item.timestamp).toLocaleDateString()}</span>
								<span class="font-mono">{formatSize(item.size)}</span>
							</div>
						</div>
					</div>

					<!-- Card Action Bar -->
					<div class="mt-4 grid grid-cols-3 gap-1.5 pt-3 border-t border-zinc-800/60">
						<button
							type="button"
							onclick={() => onSelectForReview(item)}
							class="rounded-md bg-zinc-800/80 px-2.5 py-1.5 text-center text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white hover:cursor-pointer"
						>
							Review
						</button>

						<button
							type="button"
							onclick={() => downloadItem(item)}
							class="rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-center text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 hover:cursor-pointer"
						>
							Download
						</button>

						<button
							type="button"
							onclick={async () => {
								if (confirm(`Delete "${item.title}"?`)) {
									await onDelete(item.id);
								}
							}}
							class="rounded-md border border-transparent px-2.5 py-1.5 text-center text-xs font-medium text-zinc-500 transition-colors hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 hover:cursor-pointer"
						>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
