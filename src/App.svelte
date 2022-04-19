<script>
	import SignIn from "./SignIn.svelte";
	import Chat from "./Chat.svelte";
	import SignOut from "./SignOut.svelte";
	import db from './db.js';
	import { supabase, loadChannels } from "./db.js";

	
	let user = db.user

	// user.set(supabase.auth.user())
    // 	supabase.auth.onAuthStateChange(( _, session) => {
    //     	user.set(session?.user);
    // 	});

	console.log(user)

	

</script>

<main>
	{#if $user}
		<Chat />
		<SignOut />
	{:else}
		<SignIn />
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>