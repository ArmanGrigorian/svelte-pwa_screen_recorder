<script lang="ts">
	let selectedSnippet = $state('runes');
</script>

<div class="mx-auto max-w-4xl space-y-8 py-6 sm:py-10 animate-fade-in">
	<!-- Header -->
	<div class="border-b border-zinc-800/80 pb-5">
		<h2 class="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">
			Technical Architecture
		</h2>
		<p class="mt-1 text-sm text-zinc-400">
			An overview of the front-end architecture, reactivity model, and browser APIs powering
			StudioCast.
		</p>
	</div>

	<!-- Specifications Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Card 1 -->
		<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-2">
			<h3 class="text-sm font-semibold text-zinc-100">Svelte 5 Runes Reactivity</h3>
			<p class="text-xs text-zinc-400 leading-relaxed">
				Engineered using fine-grained Runes (`$state`, `$derived`, `$effect`). Eliminates virtual
				DOM diffing overhead and ensures deterministic, zero-lag UI updates during high-fps capture
				streams.
			</p>
		</div>

		<!-- Card 2 -->
		<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-2">
			<h3 class="text-sm font-semibold text-zinc-100">Zero-Server Media Pipeline</h3>
			<p class="text-xs text-zinc-400 leading-relaxed">
				Combines `getDisplayMedia` with Web Audio API `AudioContext` frequency equalization. Audio
				mixing and decibel analysis (`AnalyserNode`) happen entirely in memory without latency or
				external servers.
			</p>
		</div>

		<!-- Card 3 -->
		<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-2">
			<h3 class="text-sm font-semibold text-zinc-100">Offline-First PWA & Cache API</h3>
			<p class="text-xs text-zinc-400 leading-relaxed">
				Configured with custom Service Worker strategies to cache all application bundles,
				typography, and static icons locally for seamless desktop/mobile installation and offline
				execution.
			</p>
		</div>

		<!-- Card 4 -->
		<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 space-y-2">
			<h3 class="text-sm font-semibold text-zinc-100">IndexedDB Blob Storage</h3>
			<p class="text-xs text-zinc-400 leading-relaxed">
				Bypasses browser memory limitations by streaming recorded chunks into asynchronous
				`IndexedDB` object stores (`IDBObjectStore`), protecting multi-gigabyte video files from
				accidental tab closures.
			</p>
		</div>
	</div>

	<!-- Code Pattern Spotlight -->
	<div class="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5 sm:p-6 space-y-4">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
			<span class="text-xs font-semibold text-zinc-200">Core Code Patterns</span>

			<!-- Tabs -->
			<div class="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
				<button
					type="button"
					onclick={() => (selectedSnippet = 'runes')}
					class="rounded px-2.5 py-1 text-[11px] font-medium transition-colors hover:cursor-pointer {selectedSnippet ===
					'runes'
						? 'bg-zinc-800 text-zinc-100'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Runes State
				</button>
				<button
					type="button"
					onclick={() => (selectedSnippet = 'audio')}
					class="rounded px-2.5 py-1 text-[11px] font-medium transition-colors hover:cursor-pointer {selectedSnippet ===
					'audio'
						? 'bg-zinc-800 text-zinc-100'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					Audio Equalizer
				</button>
				<button
					type="button"
					onclick={() => (selectedSnippet = 'idb')}
					class="rounded px-2.5 py-1 text-[11px] font-medium transition-colors hover:cursor-pointer {selectedSnippet ===
					'idb'
						? 'bg-zinc-800 text-zinc-100'
						: 'text-zinc-400 hover:text-zinc-200'}"
				>
					IndexedDB Storage
				</button>
			</div>
		</div>

		<!-- Code Block -->
		<div
			class="rounded-lg border border-zinc-800/80 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 overflow-x-auto"
		>
			{#if selectedSnippet === 'runes'}
				<pre><code>// Central Svelte 5 Runes State inside VideoRecorder.svelte</code>
<code class="text-purple-400">let</code> recorderState: RecorderType = <code class="text-indigo-400"
						>$state</code
					>(<code class="text-emerald-300">'ready'</code>);
<code class="text-purple-400">let</code> recordingDuration = <code class="text-indigo-400"
						>$state</code
					>(<code class="text-amber-400">0</code>);
<code class="text-purple-400">let</code> chunks: Blob[] = <code class="text-indigo-400">$state</code
					>([]);

<code class="text-zinc-500"
						>// Derived calculations update instantly whenever dependencies change</code
					>
<code class="text-purple-400">let</code> estimatedSizeBytes = <code class="text-indigo-400"
						>$derived</code
					>(
  chunks.reduce((acc, chunk) => acc + chunk.size, <code class="text-amber-400">0</code>)
);</pre>
			{:else if selectedSnippet === 'audio'}
				<pre><code>// Real-time Fast Fourier Transform (FFT) Decibel Equalizer</code>
<code class="text-purple-400">const</code> audioCtx = <code class="text-purple-400">new</code
					> window.AudioContext();
<code class="text-purple-400">const</code> analyser = audioCtx.createAnalyser();
analyser.fftSize = <code class="text-amber-400">256</code>;

<code class="text-purple-400">const</code> source = audioCtx.createMediaStreamSource(stream);
source.connect(analyser);

<code class="text-purple-400">const</code> updateMeter = () => &#123;
  analyser.getByteFrequencyData(dataArray);
  <code class="text-purple-400">let</code> sum = <code class="text-amber-400">0</code>;
  <code class="text-purple-400">for</code> (<code class="text-purple-400">let</code> i = <code
						class="text-amber-400">0</code
					>; i &lt; dataArray.length; i++) sum += dataArray[i];
  <code class="text-purple-400">const</code> percentage = Math.min(<code class="text-amber-400"
						>100</code
					>, Math.round((sum / dataArray.length / <code class="text-amber-400">128</code>) * <code
						class="text-amber-400">100</code
					>));
  onLevelUpdate(percentage);
&#125;;</pre>
			{:else}
				<pre><code>// Asynchronous IndexedDB Storage of Multi-Megabyte Video Blobs</code>
<code class="text-purple-400">export async function</code> <code class="text-indigo-400"
						>saveRecordingToDB</code
					>(item: RecordingHistoryItem): Promise&lt;<code class="text-purple-400">void</code
					>&gt; &#123;
  <code class="text-purple-400">const</code> db = <code class="text-purple-400">await</code
					> getDB();
  <code class="text-purple-400">return new</code> Promise((resolve, reject) => &#123;
    <code class="text-purple-400">const</code> tx = db.transaction(<code class="text-emerald-300"
						>'recordings'</code
					>, <code class="text-emerald-300">'readwrite'</code>);
    <code class="text-purple-400">const</code> store = tx.objectStore(<code class="text-emerald-300"
						>'recordings'</code
					>);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  &#125;);
&#125;</pre>
			{/if}
		</div>
	</div>
</div>
