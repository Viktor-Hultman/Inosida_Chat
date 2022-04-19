<script>
    import db from './db.js';
	import { supabase, loadChannels, channels } from "./db.js";

    let currentUser
    let user = db.user
    currentUser = supabase.auth.user()

    loadChannels(currentUser.id)

	console.log(currentUser)


</script>


<div>
    <h1>Hello {currentUser.user_metadata.full_name}!</h1>
    {#each $channels as channel (channel.id)}
        <h1>{channel.channel_name}</h1>
        <p>{channel.allowed_users}</p>
    {/each}
</div>