<script>
    import db from './db.js';
	import { 
        supabase, 
        loadChannels, 
        getAllUsers, 
        channels, 
        allUsers, 
        createChannel, 
        getChannelToAddUser,
        currentChannel,
        openChannel,
        channelMessages,
    } from "./db.js";

    let currentUser

    // let user = db.user
    currentUser = supabase.auth.user()

    loadChannels()
    getAllUsers()

	console.log(currentUser)


    const slugify = (text) => {
        return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
    }

  const createNewChannel = async () => {
    const name = prompt('Please enter the channel name')
    if (name) {
      createChannel(slugify(name), currentUser.id)
    }
  }

  const addAUserToChannel = async (channel_id) => {
    const user_id = prompt('Please enter the id')
    if (user_id) {
        getChannelToAddUser(channel_id, user_id)
    }
  }

</script>


<div>
    {#each $currentChannel as current}
        <h1>{current.channel_name}</h1>
    {/each}

    <img src="{currentUser.user_metadata.avatar_url}" alt="profile" width="40px">
    <h2>Hello {currentUser.user_metadata.full_name}!</h2>
    <h2>All you channels</h2>
    {#each $channels as channel (channel.id)}
        <div class="channel" on:click={() => openChannel(channel.id)}>
            <h3>{channel.channel_name}</h3>
            <h3>Users in this chat:</h3>
            <p>{channel.allowed_users}</p>
            <button on:click={() => addAUserToChannel(channel.id)}>
                Add User
            </button>
        </div>
        {:else}
        <p>You currently are not apart of any channels</p>
    {/each}

    <h2>All users</h2>
    {#each $allUsers as user}
        <img src="{user.userdata.avatar_url}" alt="profile" width="40px">
        <h3>{user.userdata.email}</h3>
    {/each}

    <button on:click={createNewChannel}>
        New Channel
    </button>

    <h3>Messages:</h3>
    {#each $channelMessages as message}
        <p>{message.message}</p>
        <p>{message.user_id}</p>
    {/each}

</div>


<style>

    .channel {
        border: solid black 2px;
        margin-bottom: 10px;
    }

    .channel:hover {
        cursor: pointer;
    }
    
</style>