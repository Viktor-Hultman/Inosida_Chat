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
        updateMessage,
        updateChannel,
    } from "./db.js";

    let currentUser

    // let user = db.user
    currentUser = supabase.auth.user()

    loadChannels()
    getAllUsers()


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

    const updateAMessage = async (message, message_id, message_user_id, user_id) => {
        const newMessage = prompt("Update your previous message", message)
        if (newMessage) {
            updateMessage(newMessage, message_id, message_user_id, user_id)
        }
    }

    const updateAChannel = async (channel_name, channel_id, channel_user_id, user_id) => {
        const newName = prompt("Update this channels name", channel_name)
        if (newName) {
            updateChannel(slugify(newName), channel_id, channel_user_id, user_id)
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

    $: if($channelMessages) {
        console.log($channelMessages);
    }

    $:console.log($currentChannel);



    afterUpdate(() => {
        messageContainer && messageContainer.scrollTo({top: messageContainer.scrollHeight, left: 0, behavior: 'smooth'})
    });

    const getDate = (db_date) => {
        let msgDate = db_date.slice(0, 10)
        return msgDate
    }


</script>


<div>
    <img src="{currentUser.user_metadata.avatar_url}" alt="profile" width="40px">
    <h2>Hello {currentUser.user_metadata.full_name}!</h2>
    <h2>All you channels</h2>
    {#each $channels as channel (channel.id)}
        <div class="channel">
            <h3 on:click={() => openChannel(channel.id)}>{channel.channel_name}</h3>
            <h4>Users in this chat:</h4>
            <p>{channel.allowed_users}</p>
            <button on:click={() => addAUserToChannel(channel.id)}>
                Add User
            </button>
            {#if channel.created_by == currentUser.id}
                <button on:click={() => updateAChannel(channel.channel_name, channel.id, channel.created_by, currentUser.id)}>Update</button>
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
                <span><img src="{message.user_id.userdata.avatar_url}" alt="profile" width="40px"></span> <span>{message.user_id.userdata.name}</span><span>{getDate(message.inserted_at)}</span>
                <br>
                <span>{message.message}</span>
                {#if message.edited}
                    <span>(edited)</span>
                {/if}
                {#if message.user_id.id == currentUser.id}
                    <button on:click={() => updateAMessage(message.message, message.id, message.user_id.id, currentUser.id)}>Update</button>
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

    .channel h3:hover {
        cursor: pointer;
    }

    .message-container {
        max-height: 400px;
        overflow-y: scroll;
    }
    
</style>