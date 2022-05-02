<script>
	import SignIn from "./SignIn.svelte";
	import Chat from "./Chat.svelte";
	import SignOut from "./SignOut.svelte";
	import db from './db.js';
	import { supabase, loadChannels } from "./db.js";

	
	let user = db.user


</script>

<main>
	{#if $user}
		<Chat />
		<!-- <SignOut /> -->
	{:else}
		<SignIn />
	{/if}
</main>

<style>
	main {
		height: 100%;
		width: 100%;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>