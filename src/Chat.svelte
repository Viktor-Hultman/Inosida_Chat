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
        getChannelToRemoveUser,
        currentChannel,
        openChannel,
        channelMessages,
        addMessage,
        deleteMessage,
        deleteChannel,
        updateMessage,
        updateChannelName,
        scrollTheChat,
    } from "./db.js";

    let currentUser

    // let user = db.user
    currentUser = supabase.auth.user()

    loadChannels()
    getAllUsers()


    const trimChannelName = (text) => {
        return text
        .toString()
        .trim()
        // .toLowerCase()
        // .replace(/\s+/g, '-') // Replace spaces with -
        // .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        // .replace(/^-+/, '') // Trim - from start of text
        // .replace(/-+$/, '') // Trim - from end of text
    }

    const createNewChannel = async () => {
        const name = prompt('Please enter the channel name')
        if (name) {
        createChannel(trimChannelName(name), currentUser.id)
        }
    }

    const addAUserToChannel = async (channel_id) => {
        const user_id = prompt('Please enter the id of the person you want to add')
        if (user_id) {
            getChannelToAddUser(channel_id, user_id)
        }
    }

    const removeAUserfromChannel = async (channel_id) => {
        const user_id = prompt('Please enter the id of the person you want to remove')
        if (user_id) {
            getChannelToRemoveUser(channel_id, user_id)
        }
    }

    const updateAMessage = async (message, message_id, message_user_id, user_id) => {
        const newMessage = prompt("Update your previous message", message)
        if (newMessage) {
            updateMessage(newMessage, message_id, message_user_id, user_id)
        }
    }

    const updateAChannelName = async (channel_name, channel_id, channel_user_id, user_id) => {
        const newName = prompt("Update this channels name", channel_name)
        if (newName) {
            updateChannelName(slugify(newName), channel_id, channel_user_id, user_id)
        }
    }

    const openAChannel = async (channel_id) => {
        openChannel(channel_id)
    }
    

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

    
    $: if($channelMessages) { //Checks for updates, and if channelMessages has changed then run the code
        console.log($channelMessages);
            if($scrollTheChat) { // Checks if the scrollTheChat writable var is true
            setTimeout(() => { //Timeout to allow the message to be added before scrolling
                console.log("Now the chat should scroll");
                //Scrolling the "message container to the bottom smoothly"
                messageContainer && messageContainer.scrollTo({top: messageContainer.scrollHeight, left: 0, behavior: 'smooth'})
            }, 100)

        }
    }

    $:console.log($currentChannel);


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
            <h3 on:click={() => openAChannel(channel.id)}>{channel.channel_name}</h3>
            <h4>Users in this chat:</h4>
            <p>{channel.allowed_users}</p>
            {#if channel.created_by == currentUser.id}
                <button on:click={() => addAUserToChannel(channel.id)}>Add User</button>
                <button on:click={() => removeAUserfromChannel(channel.id)}>Remove User</button>
                <button on:click={() => updateAChannelName(channel.channel_name, channel.id, channel.created_by, currentUser.id)}>Update</button>
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