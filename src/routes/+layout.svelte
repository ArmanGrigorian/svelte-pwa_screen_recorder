<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { detectSWUpdate } from '../utils/sw.js';
	let { children } = $props();

	onMount(() => {
		detectSWUpdate();
	});
</script>

<svelte:head>
	<title>StudioCast PRO — Screen & Audio Recorder</title>
</svelte:head>

{@render children()}
