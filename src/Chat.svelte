<script>
import { afterUpdate } from 'svelte';

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
        addMessage,
        deleteMessage,
        deleteChannel,
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

//   addMessage("Hello again", "12", "b41cd2eb-1894-48c9-abca-fcd7746d030e", "Viktor Hultman", "https://lh3.googleusercontent.com/a-/AOh14GjCZtxbARCjhP1GSgqPv8ZiufZygj-s1c5BrYgb4w=s96-c")
    let messageInputVal = '';

    const submitOnEnter = (event, message, channel_id) => {
        if(!message == ''){
            // Watch for enter key
            if (event.keyCode === 13) {
                addMessage(message, channel_id, currentUser.id)
                messageInputVal = '';
            }
        }
    }

    let messageContainer

    $:console.log($channelMessages);
    $:console.log($currentChannel);

    afterUpdate(() => {messageContainer && messageContainer.scrollTo({top: messageContainer.scrollHeight, left: 0, behavior: 'smooth'})});


</script>


<div>
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
            {#if channel.created_by == currentUser.id}
                <button on:click={() => deleteChannel(channel.id, channel.created_by, currentUser.id)}>Delete</button>
            {/if}
        </div>
        {:else}
        <p>You currently are not apart of any channels</p>
    {/each}
    <button on:click={createNewChannel}>
        New Channel
    </button>

    <h2>All users</h2>
    {#each $allUsers as user}
        <img src="{user.userdata.avatar_url}" alt="profile" width="40px">
        <p>{user.id}</p>
        <p>{user.userdata.name}</p>
    {/each}

    {#if $currentChannel}
        <h1>{$currentChannel.channel_name}</h1>
    
        <h3>Messages:</h3>
        <div class="message-container" bind:this={messageContainer}>
            {#each $channelMessages as message (message.id)}
                <span><span><img src="{message.user_id.userdata.avatar_url}" alt="profile" width="40px"></span> <span>{message.user_id.userdata.name}</span></span>
                <br>
                <span>{message.message}</span>
                {#if message.user_id.id == currentUser.id}
                    <button on:click={() => deleteMessage(message.id, message.user_id.id, currentUser.id)}>Delete</button>
                {/if}
                <br>
            {/each}
        </div>
        <br>
        <input 
            type="text"
            name="message"
            placeholder="Send a message"
            bind:value={messageInputVal}
            on:keydown={(e) => submitOnEnter(e, messageInputVal, $currentChannel.id)}
        />
    {/if}

</div>


<style>

    .channel {
        border: solid black 2px;
        margin-bottom: 10px;
    }

    .channel:hover {
        cursor: pointer;
    }

    .message-container {
        max-height: 400px;
        overflow-y: scroll;
    }
    
</style>