<script>
	import db from './db.js';

    let loading = false

	async function signOut() {
		await db.signOut();
	}	

</script>

<button on:click={signOut}>Sign Out</button>