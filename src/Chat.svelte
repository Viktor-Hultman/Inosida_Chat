<script>
import { afterUpdate } from 'svelte';

    import db from './db.js';
	import { 
        supabase, 
        thisDBUser,
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
        getCurrentDBUser,
        hideChannel,
    } from "./db.js";

    let currentUser

    // let user = db.user
    currentUser = supabase.auth.user()

    loadChannels()
    getAllUsers()


    const trimChannelName = (text) => {
        let result = text
        .toString()
        .trim()
        // .toLowerCase()
        // .replace(/\s+/g, '-') // Replace spaces with -
        // .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
        // .replace(/^-+/, '') // Trim - from start of text
        // .replace(/-+$/, '') // Trim - from end of text

        console.log(result)
        return result
    }

    const createNewChannel = async () => {
        const name = prompt('Skriv in namnet för ditt nya chattrum')
        if (name && name != "") {
            createChannel(trimChannelName(name), currentUser.id)
        }
    }

    const addAUserToChannel = async (channel_id, user_id) => {
        getChannelToAddUser(channel_id, user_id)
    }

    const removeAUserfromChannel = async (channel_id, user_id) => {
            getChannelToRemoveUser(channel_id, user_id )
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
            updateChannelName(trimChannelName(newName), channel_id, channel_user_id, user_id)
        }
    }

    const openAChannel = async (event, channel_id) => {
        if(channel_id == $currentChannel.id){
            return console.log("Channel already open");
        }
        if(event.target.nodeName != "DIV" && event.target.nodeName != "P"){
            return console.log("You clicked something else than the channel div");
        }
        //Setting the id of the opened channel to local storage
        localStorage.setItem('lastOpenedChannel', channel_id)
        chatSettinsDropdown.style.display = "none"
        allChatUsersDropdown.style.display = "none"
        openChannel(channel_id)
    }

    const hideAChannel = async (channel_id, channel_user_id, user_id, user_hidden_channels) => {
        const data = hideChannel(channel_id, channel_user_id, user_id, user_hidden_channels) 
        if (data) {
            loadChannels()
        }
    }

    const autoResize = (e) => {
        // Måste fixa outo resize så att den ändrar höjden på inputfältet samt hela input containern
        // Ska bara höjas uppåt och inte flyttas nedåt.
        // e.target.style.height = 'auto';
        // e.target.style.height = e.target.scrollHeight + 'px';
    }

    let sendButton

    const checkInputVal = (e) => {
        if(e.target.value != ""){
            sendButton.classList.add("send-button-active")
        } 

        if(e.target.value == ""){
            sendButton.classList.remove("send-button-active")
        }
    }
    

    let messageInputVal = "";
    const regex = /[^\n]/;

    const submitOnEnter = (event, message, channel_id) => {
        // Trim whitespace from end of message
        if(event.shiftKey && event.keyCode === 13){
            return console.log("Shift and enter is pressed")
        } else if (event.keyCode === 13 && regex.test(message)) {
            addMessage(message, channel_id, currentUser.id)
            messageInputVal = "";
            sendButton.classList.remove("send-button-active")
            event.preventDefault();
            return
        } else if (event.keyCode === 13){
            event.preventDefault();
            return
        }
    }

    const submitOnButton = (event, message, channel_id) => {
        if(messageInputVal == "") {
            event.preventDefault();
            return
        }
        console.log(message.length, messageInputVal.length);
        addMessage(message, channel_id, currentUser.id)
        messageInputVal = ""; 
        sendButton.classList.remove("send-button-active")
    }

    

    let messageContainer
    $: if($channelMessages) { //Checks for updates, and if channelMessages has changed then run the code
        // console.log($channelMessages);
            if($scrollTheChat) { // Checks if the scrollTheChat writable var is true
            setTimeout(() => { //Timeout to allow the message to be added before scrolling
                console.log("Now the chat should scroll");
                //Scrolling the "message container to the bottom smoothly"
                messageContainer && messageContainer.scrollTo({top: messageContainer.scrollHeight, left: 0, behavior: 'smooth'})
            }, 100)

        }
    }


    $:if ($channels != null && localStorage.getItem('lastOpenedChannel') != null) {
        // If the user is part of any channel and has selected a 
        // chat previous that is still logged in local storage
        // open that previous channel when page loads
        openLastOpenedChannel()

    } else if ($channels != null && localStorage.getItem('lastOpenedChannel') == null) {
        // Else if there is no previous opened channel logged,
        // open the "first" channel
        openChannel($channels[0].id)
        console.log("I run now");
        console.log($channels)
    }

    const openLastOpenedChannel = () => {
        for (let i = 0; i < $channels.length; i++){
            if($channels[i].id == localStorage.getItem('lastOpenedChannel')){
                openChannel(localStorage.getItem('lastOpenedChannel'))
                console.log("I run now");
                return
            }
        }
        openChannel($channels[0].id)
        console.log("I run now");
    }

    let dbUser = null

    $: console.log($currentChannel);

    $: if($thisDBUser) {
        dbUser = $thisDBUser[0]
    }

    const getDate = (db_date) => {
        let msgDate = db_date.slice(0, 10)
        return msgDate
    }

    const truncateString = (str, num) => {
        if (str.length > num) {
            return str.slice(0, num) + "...";
        } else {
            return str;
        }
    }

    const removeFocus = (event) => {
	    event.target.blur();
    }

    let currentHighestZindex = 0

    let allChatUsersDropdown
    let allChatUsersDropdownWidth
    let allChatUsersOpen = false
    let allChatUsersButton
    
    let chatSettinsDropdown
    let chatSettinsDropdownWidth
    let chatSettinsOpen = false
    let chatSettinsIcon

    let userSettingsPopup
    let userSettingsPopupWidth
    let userSettingsOpen = false
    let userSettingsIcon

    const calcCenter = (target, elem, size, upOrDown) => {
        // console.log(elem, target, size)
        if(upOrDown == "down") {
            let leftPX = ((target.offsetWidth / 2) - (size / 2) + target.offsetLeft)
            let topPX = target.offsetTop + target.offsetHeight + 5

            elem.style.left = leftPX + "px"
            elem.style.top = topPX + "px"
        }
        if(upOrDown == "up") {
            console.log("should popup");
            let leftPX = ((target.offsetWidth / 2) - (size / 2) + target.offsetLeft)
            let topPX = target.offsetTop + target.offsetHeight - 75 
            // topPx för popups måste göras om, ska inte vara ett fast nummer
            // måste uträkna höjden på popupen som ska beräknas minus på topPX
            // ex. let topPX = target.offsetTop - target.offsetHeight - popup.height - 5px

            elem.style.left = leftPX + "px"
            elem.style.top = topPX + "px"
        }

    }

    const openUsersDropdown = () => {
        if(allChatUsersOpen == true) {
            allChatUsersDropdown.style.display = "none";
            allChatUsersOpen = false
            return
        }

        allChatUsersDropdown.style.display = "block";
        allChatUsersDropdown.style.zIndex = currentHighestZindex + 1
        currentHighestZindex = Number(allChatUsersDropdown.style.zIndex)

        if(allChatUsersDropdownWidth == 0) {
            setTimeout(() => { 
                calcCenter(allChatUsersButton, allChatUsersDropdown, allChatUsersDropdownWidth, "down")
            }, 100)
        } else {
            calcCenter(allChatUsersButton, allChatUsersDropdown, allChatUsersDropdownWidth, "down")
        }
        allChatUsersOpen = true
    }

    const openChatSettingsDropdown = () => {
        if(chatSettinsOpen == true) {
            chatSettinsDropdown.style.display = "none";
            chatSettinsOpen = false
            return
        }

        chatSettinsDropdown.style.display = "block";
        chatSettinsDropdown.style.zIndex = currentHighestZindex + 1
        currentHighestZindex = Number(chatSettinsDropdown.style.zIndex)

        if(chatSettinsDropdownWidth == 0) {
            setTimeout(() => { 
                calcCenter(chatSettinsIcon, chatSettinsDropdown, chatSettinsDropdownWidth, "down")
            }, 100)
        } else {
            calcCenter(chatSettinsIcon, chatSettinsDropdown, chatSettinsDropdownWidth, "down")
        }
        chatSettinsOpen = true
    }

    const openUserSettingsPopup = () => {
        if(userSettingsOpen == true) {
            userSettingsPopup.style.display = "none";
            userSettingsOpen = false
            return
        }

        userSettingsPopup.style.display = "block";
        userSettingsPopup.style.zIndex = currentHighestZindex + 1
        currentHighestZindex = Number(userSettingsPopup.style.zIndex)

        if(userSettingsPopupWidth == 0) {
            setTimeout(() => { 
                calcCenter(userSettingsIcon, userSettingsPopup, userSettingsPopupWidth, "up")
            }, 100)
        } else {
            calcCenter(userSettingsIcon, userSettingsPopup, userSettingsPopupWidth, "up")
        }
        userSettingsOpen = true
    }

    getCurrentDBUser(currentUser.id)

    const signOut = async () => {
		await db.signOut();
	}


    const clientResize = () => {
        if(allChatUsersOpen == true) {
            calcCenter(allChatUsersButton, allChatUsersDropdown, allChatUsersDropdownWidth, "down")
        }
        if(chatSettinsOpen == true) {
            calcCenter(chatSettinsIcon, chatSettinsDropdown, chatSettinsDropdownWidth, "down")
        }
        if(userSettingsOpen == true) {
            calcCenter(userSettingsIcon, userSettingsPopup, userSettingsPopupWidth, "up")
        }
        // console.log("no resize")
    }
    window.onresize = clientResize

    let addUserModal

    const openAddUserModal = () => {
        addUserModal.style.display = "block"
    }
    const closeAddUserModal = (e) => {
        console.log(e.target.nodeName)
        if((e.target.nodeName != "path" && e.target.nodeName != "svg") && e.target.className.includes("modal-background")){
            addUserModal.style.display = "none"
        }
    }

    let removeUserModal

    const openRemoveUserModal = () => {
        removeUserModal.style.display = "block"
    }
    const closeRemoveUserModal = (e) => {
        if((e.target.nodeName != "path" && e.target.nodeName != "svg") && e.target.className.includes("modal-background")){
            removeUserModal.style.display = "none"
        }
    }

    let areYouSurePrompt
    let areYouSureText

    const openAreYouSurePrompt = (text) => {
        areYouSureText = text
        areYouSurePrompt.style.display = "block"
    }
    const closeAreYouSurePrompt = (e) => {
        if (e.target.className.includes("modal-background")){
            areYouSurePrompt.style.display = "none"
        }
    }
    const yesDeleteChannel = () => {
        deleteChannel($currentChannel.id, $currentChannel.created_by, currentUser.id)
        areYouSurePrompt.style.display = "none"
        chatSettinsDropdown.style.display = "none"
        $currentChannel = false
    }

    const showMessageSettings = (e) => {
        e.target.children[1].style.display = "flex"
    }

    const hideMessageSettings = (e) => {
        e.target.children[1].style.display = "none"
    }




</script>


<div class="chat-page">
    <div class="all-chat-users-dropdown" bind:offsetWidth={allChatUsersDropdownWidth} bind:this={allChatUsersDropdown}>
        <h4>Chattrummets användare</h4>
        {#each $allUsers as user (user.id)}
        {#if $currentChannel != false && $currentChannel.allowed_users != null && ($currentChannel.allowed_users.includes(user.id) || $currentChannel.created_by == user.id)}
            <div class="chat-user">
                <img class="chat-avatar" src="{user.userdata.avatar_url}" alt="channel user avatar">
                <p>{truncateString(user.userdata.full_name, 20)}</p>
            </div>
        {/if}
        {/each}
    </div>
    <div class="chat-settings-dropdown" bind:offsetWidth={chatSettinsDropdownWidth} bind:this={chatSettinsDropdown}>
        <h4>Inställningar</h4>
        <div class="line"></div>
        <p class="setting-text" on:click={() => updateAChannelName($currentChannel.channel_name, $currentChannel.id, $currentChannel.created_by, currentUser.id)}>Ändra namn</p>
        <div class="line"></div>
        <p class="setting-text" on:click={() => openAddUserModal()}>Lägg till användare</p>
        <div class="line"></div>
        <p class="setting-text" on:click={() => openRemoveUserModal()}>Ta bort användare</p>
        <div class="line"></div>
        <p class="setting-text warning" on:click={() => openAreYouSurePrompt(`radera chattrummet: ${$currentChannel.channel_name}`)}>Radera detta chattrum</p>
    </div>
    <div class="user-settings-popup" bind:offsetWidth={userSettingsPopupWidth} bind:this={userSettingsPopup}>
        <p class="setting-text" on:click={() => signOut()}>Logga ut</p>
    </div>
    <div class="modal-background" bind:this={addUserModal} on:click={(e) => closeAddUserModal(e)}>
        <div class="users-modal-content">
            <div class="text-close">
                <h3>Klicka på ett plus för att lägga till en användare.</h3>
                <div class="close-icon" on:click={() => addUserModal.style.display = "none"}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/></svg>
                </div>
            </div>
            <div class="users-list">
                {#each $allUsers as user (user.id)}
                {#if $currentChannel.allowed_users == null || !$currentChannel.allowed_users.includes(user.id)}
                {#if $currentChannel.created_by != user.id}
                <div class="chat-user">
                    <img class="chat-avatar" src="{user.userdata.avatar_url}" alt="channel user avatar">
                    <p>{truncateString(user.userdata.full_name, 20)}</p>
                    <div class="plus-icon" on:click={(e) => addAUserToChannel($currentChannel.id, user.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1600 736v192q0 40-28 68t-68 28h-416v416q0 40-28 68t-68 28h-192q-40 0-68-28t-28-68v-416h-416q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h416v-416q0-40 28-68t68-28h192q40 0 68 28t28 68v416h416q40 0 68 28t28 68z"/></svg>
                    </div>
                </div>
                {/if}
                {/if}
                {/each}
            </div>
        </div>
    </div>
    <div class="modal-background" bind:this={removeUserModal} on:click={(e) => closeRemoveUserModal(e)}>
        <div class="users-modal-content">
            <div class="text-close">
                <h3>Klicka på ett minus för att ta bort en användare.</h3>
                <div class="close-icon" on:click={() => removeUserModal.style.display = "none"}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1490 1322q0 40-28 68l-136 136q-28 28-68 28t-68-28l-294-294-294 294q-28 28-68 28t-68-28l-136-136q-28-28-28-68t28-68l294-294-294-294q-28-28-28-68t28-68l136-136q28-28 68-28t68 28l294 294 294-294q28-28 68-28t68 28l136 136q28 28 28 68t-28 68l-294 294 294 294q28 28 28 68z"/></svg>
                </div>
            </div>
            <div class="users-list">
                {#if $currentChannel.allowed_users != null}
                {#each $allUsers as user (user.id)}
                {#if $currentChannel.allowed_users.includes(user.id)}
                {#if $currentChannel.created_by != user.id}
                <div class="chat-user">
                    <img class="chat-avatar" src="{user.userdata.avatar_url}" alt="channel user avatar">
                    <p>{truncateString(user.userdata.full_name, 20)}</p>
                    <div class="plus-icon" on:click={(e) => removeAUserfromChannel($currentChannel.id, user.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1600 736v192q0 40-28 68t-68 28h-1216q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h1216q40 0 68 28t28 68z"/></svg>
                    </div>
                </div>
                {/if}
                {/if}
                {/each}
                {/if}
            </div>
        </div>
    </div>
    <div class="modal-background" bind:this={areYouSurePrompt} on:click={(e) => closeAreYouSurePrompt(e)}>
        <div class="prompt-modal-content">
            <h3>Är du säker på att du vill {areYouSureText} ?</h3>
            <div class="buttons">
                <button class="yes-button button" on:click={() => yesDeleteChannel()}>JA</button>
                <button class="no-button button" on:click={() => areYouSurePrompt.style.display = "none"}>NEJ</button>
            </div>
        </div>
    </div>
    <nav class="navbar">
        <svg xmlns="http://www.w3.org/2000/svg" width="112" height="30" viewBox="0 0 112 30" fill="none">
            <rect x="0.5" y="27.3667" width="46.9508" height="2.51522" fill="white"/>
            <g clip-path="url(#clip0_3504_6634)">
            <path d="M3.50966 6.24644C4.26753 6.24644 4.90482 6.02934 5.42154 5.59513C5.93826 5.16093 6.19662 4.61552 6.19662 3.95891C6.19662 3.30231 5.93826 2.7569 5.42154 2.3227C4.90482 1.88849 4.26753 1.67139 3.50966 1.67139C2.7518 1.67139 2.126 1.89908 1.63224 2.35447C1.13848 2.80986 0.891602 3.34467 0.891602 3.95891C0.891602 4.57316 1.13848 5.10797 1.63224 5.56336C2.126 6.01875 2.7518 6.24644 3.50966 6.24644ZM5.611 24.3878V9.13762H1.47722V24.3878H5.611ZM14.4986 24.3878V16.0637C14.4986 15.5554 14.5675 15.0682 14.7053 14.6023C14.8431 14.1363 15.067 13.7233 15.3771 13.3632C15.6871 13.0031 16.0775 12.7172 16.5483 12.5054C17.0191 12.2936 17.599 12.1877 18.2879 12.1877C18.9999 12.1877 19.5625 12.3412 19.9759 12.6483C20.3893 12.9555 20.6936 13.3367 20.8888 13.7921C21.084 14.2475 21.2046 14.7347 21.2505 15.2536C21.2964 15.7725 21.3194 16.2438 21.3194 16.6674V24.3878H25.4532V14.7611C25.4532 13.9774 25.3498 13.2255 25.1431 12.5054C24.9364 11.7852 24.592 11.1498 24.1097 10.5991C23.6274 10.0484 23.0016 9.6036 22.2323 9.26471C21.4629 8.92581 20.5271 8.75637 19.4247 8.75637C18.0468 8.75637 16.9559 9.03701 16.1522 9.59831C15.3484 10.1596 14.7513 10.8215 14.3608 11.584H14.292V9.13762H10.3649V24.3878H14.4986ZM38.3023 24.7691C39.5425 24.7691 40.7137 24.5784 41.8161 24.1972C42.9184 23.8159 43.8715 23.2758 44.6753 22.5768C45.4791 21.8779 46.1163 21.0359 46.5871 20.051C47.0579 19.0661 47.2933 17.97 47.2933 16.7627C47.2933 15.5554 47.0579 14.4593 46.5871 13.4744C46.1163 12.4895 45.4791 11.6475 44.6753 10.9486C43.8715 10.2496 42.9184 9.70951 41.8161 9.32825C40.7137 8.947 39.5425 8.75637 38.3023 8.75637C37.0622 8.75637 35.891 8.947 34.7886 9.32825C33.6863 9.70951 32.7332 10.2496 31.9294 10.9486C31.1256 11.6475 30.4883 12.4895 30.0176 13.4744C29.5468 14.4593 29.3114 15.5554 29.3114 16.7627C29.3114 17.97 29.5468 19.0661 30.0176 20.051C30.4883 21.0359 31.1256 21.8779 31.9294 22.5768C32.7332 23.2758 33.6863 23.8159 34.7886 24.1972C35.891 24.5784 37.0622 24.7691 38.3023 24.7691ZM38.3023 21.3378C37.5445 21.3378 36.867 21.2107 36.2699 20.9565C35.6728 20.7023 35.1618 20.3635 34.737 19.9398C34.3121 19.5162 33.9906 19.0291 33.7724 18.4784C33.5542 17.9277 33.4451 17.3558 33.4451 16.7627C33.4451 16.1697 33.5542 15.5978 33.7724 15.0471C33.9906 14.4964 34.3121 14.0092 34.737 13.5856C35.1618 13.162 35.6728 12.8231 36.2699 12.5689C36.867 12.3147 37.5445 12.1877 38.3023 12.1877C39.0602 12.1877 39.7377 12.3147 40.3348 12.5689C40.9319 12.8231 41.4429 13.162 41.8677 13.5856C42.2926 14.0092 42.6141 14.4964 42.8323 15.0471C43.0505 15.5978 43.1595 16.1697 43.1595 16.7627C43.1595 17.3558 43.0505 17.9277 42.8323 18.4784C42.6141 19.0291 42.2926 19.5162 41.8677 19.9398C41.4429 20.3635 40.9319 20.7023 40.3348 20.9565C39.7377 21.2107 39.0602 21.3378 38.3023 21.3378Z" fill="white"/>
            <path d="M56.1117 24.7689C56.9615 24.7689 57.8112 24.6842 58.6609 24.5148C59.5106 24.3453 60.2742 24.07 60.9517 23.6887C61.6292 23.3075 62.1804 22.8044 62.6052 22.1796C63.0301 21.5548 63.2425 20.787 63.2425 19.8762C63.2425 18.8807 63.0243 18.097 62.588 17.5251C62.1516 16.9532 61.6005 16.5031 60.9345 16.1748C60.2685 15.8465 59.5508 15.603 58.7815 15.4441C58.0121 15.2852 57.2945 15.1317 56.6285 14.9834C55.9625 14.8351 55.4113 14.6551 54.9749 14.4433C54.5386 14.2315 54.3204 13.8926 54.3204 13.4266C54.3204 12.8547 54.5845 12.4417 55.1127 12.1875C55.6409 11.9334 56.1806 11.8063 56.7318 11.8063C58.0868 11.8063 59.1661 12.3252 59.9699 13.3631L62.7258 11.0756C62.0598 10.2283 61.1871 9.62996 60.1077 9.28048C59.0283 8.93099 57.9375 8.75625 56.8351 8.75625C56.0084 8.75625 55.1931 8.85157 54.3893 9.04219C53.5855 9.23282 52.8736 9.52935 52.2535 9.93179C51.6335 10.3342 51.134 10.8479 50.755 11.4727C50.3761 12.0975 50.1866 12.8336 50.1866 13.6808C50.1866 14.6551 50.4048 15.4176 50.8412 15.9683C51.2775 16.519 51.8287 16.9479 52.4947 17.2551C53.1607 17.5622 53.8783 17.7846 54.6477 17.9222C55.417 18.0599 56.1347 18.2082 56.8007 18.367C57.4667 18.5259 58.0179 18.7324 58.4542 18.9866C58.8906 19.2408 59.1087 19.6326 59.1087 20.1621C59.1087 20.4587 59.0226 20.7181 58.8504 20.9405C58.6781 21.1629 58.4542 21.3482 58.1786 21.4965C57.903 21.6448 57.6045 21.7507 57.283 21.8142C56.9615 21.8778 56.6514 21.9095 56.3529 21.9095C55.4802 21.9095 54.7395 21.7348 54.131 21.3853C53.5224 21.0358 52.954 20.5857 52.4258 20.035L49.6699 22.4179C50.5196 23.3075 51.4842 23.9217 52.5636 24.2606C53.6429 24.5995 54.8257 24.7689 56.1117 24.7689ZM68.5475 6.24633C69.3054 6.24633 69.9427 6.02922 70.4594 5.59502C70.9761 5.16081 71.2345 4.61541 71.2345 3.9588C71.2345 3.30219 70.9761 2.75679 70.4594 2.32258C69.9427 1.88838 69.3054 1.67127 68.5475 1.67127C67.7897 1.67127 67.1639 1.89897 66.6701 2.35435C66.1763 2.80974 65.9295 3.34456 65.9295 3.9588C65.9295 4.57304 66.1763 5.10786 66.6701 5.56325C67.1639 6.01863 67.7897 6.24633 68.5475 6.24633ZM70.6489 24.3877V9.13751H66.5151V24.3877H70.6489ZM82.7402 24.7689C83.9114 24.7689 85.0023 24.5571 86.0128 24.1335C87.0232 23.7099 87.827 23.0321 88.4241 22.1002H88.493V24.3877H92.4201V0.368652H88.2863V11.0756H88.183C87.9763 10.8214 87.7122 10.5619 87.3907 10.2972C87.0692 10.0324 86.6788 9.78352 86.2194 9.55054C85.7601 9.31755 85.2319 9.12692 84.6348 8.97865C84.0377 8.83039 83.3488 8.75625 82.5679 8.75625C81.3967 8.75625 80.3173 8.96277 79.3298 9.37579C78.3423 9.78882 77.4983 10.3554 76.7979 11.0756C76.0974 11.7957 75.552 12.6429 75.1616 13.6173C74.7712 14.5916 74.576 15.64 74.576 16.7626C74.576 17.8852 74.7597 18.9336 75.1271 19.908C75.4946 20.8823 76.0343 21.7295 76.7462 22.4496C77.4581 23.1698 78.3136 23.7364 79.3126 24.1494C80.3116 24.5624 81.4541 24.7689 82.7402 24.7689ZM83.5669 21.3377C82.8091 21.3377 82.1316 21.2106 81.5345 20.9564C80.9374 20.7022 80.4264 20.3633 80.0016 19.9397C79.5767 19.5161 79.2552 19.0289 79.037 18.4782C78.8188 17.9275 78.7097 17.3557 78.7097 16.7626C78.7097 16.1695 78.8188 15.5977 79.037 15.047C79.2552 14.4963 79.5767 14.0091 80.0016 13.5855C80.4264 13.1619 80.9374 12.823 81.5345 12.5688C82.1316 12.3146 82.8091 12.1875 83.5669 12.1875C84.3248 12.1875 85.0023 12.3146 85.5994 12.5688C86.1965 12.823 86.7075 13.1619 87.1323 13.5855C87.5572 14.0091 87.8787 14.4963 88.0969 15.047C88.3151 15.5977 88.4241 16.1695 88.4241 16.7626C88.4241 17.3557 88.3151 17.9275 88.0969 18.4782C87.8787 19.0289 87.5572 19.5161 87.1323 19.9397C86.7075 20.3633 86.1965 20.7022 85.5994 20.9564C85.0023 21.2106 84.3248 21.3377 83.5669 21.3377ZM102.031 24.7689C103.134 24.7689 104.144 24.573 105.063 24.1812C105.981 23.7893 106.739 23.1592 107.336 22.2908H107.44V24.3877H111.16V15.6188C111.16 15.2588 111.148 14.8404 111.125 14.3639C111.103 13.8873 111.028 13.3949 110.902 12.8865C110.775 12.3782 110.569 11.8751 110.282 11.3774C109.994 10.8796 109.587 10.4401 109.059 10.0589C108.53 9.67762 107.864 9.3652 107.061 9.12162C106.257 8.87804 105.269 8.75625 104.098 8.75625C102.789 8.75625 101.52 8.94688 100.292 9.32814C99.0629 9.70939 97.9893 10.3342 97.0706 11.2026L99.2409 13.2042C99.792 12.7171 100.447 12.3305 101.204 12.0446C101.962 11.7586 102.778 11.6157 103.65 11.6157C104.753 11.6157 105.66 11.8539 106.372 12.3305C107.084 12.8071 107.44 13.5219 107.44 14.4751V14.8881H106.406C105.717 14.8881 104.982 14.904 104.201 14.9358C103.421 14.9675 102.645 15.0417 101.876 15.1582C101.107 15.2746 100.366 15.4494 99.6542 15.6824C98.9423 15.9154 98.3165 16.2278 97.7768 16.6196C97.2371 17.0115 96.8065 17.4986 96.485 18.0811C96.1635 18.6636 96.0027 19.3678 96.0027 20.1939C96.0027 20.9564 96.175 21.6236 96.5195 22.1955C96.8639 22.7674 97.3175 23.2439 97.8802 23.6252C98.4428 24.0064 99.0859 24.2924 99.8093 24.483C100.533 24.6736 101.273 24.7689 102.031 24.7689ZM103.03 21.9095C102.686 21.9095 102.341 21.8725 101.997 21.7983C101.652 21.7242 101.342 21.6024 101.067 21.433C100.791 21.2635 100.567 21.057 100.395 20.8134C100.223 20.5699 100.137 20.268 100.137 19.908C100.137 19.3573 100.355 18.9283 100.791 18.6212C101.227 18.3141 101.761 18.0811 102.393 17.9222C103.024 17.7634 103.696 17.6628 104.408 17.6204C105.12 17.5781 105.763 17.5569 106.337 17.5569H107.198V18.4147C107.198 19.4949 106.86 20.3475 106.182 20.9723C105.505 21.5971 104.454 21.9095 103.03 21.9095Z" fill="white"/>
            </g>
            <defs>
            <clipPath id="clip0_3504_6634">
            <rect width="111" height="25.1522" fill="white" transform="translate(0.5 0.118164)"/>
            </clipPath>
            </defs>
        </svg>
    </nav>
    <div class="content">
        <div class="sidebar">
            <div class="add-chat-section">
                <h3>Chattrum</h3>
                <div class="plus-icon" on:click={createNewChannel}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1600 736v192q0 40-28 68t-68 28h-416v416q0 40-28 68t-68 28h-192q-40 0-68-28t-28-68v-416h-416q-40 0-68-28t-28-68v-192q0-40 28-68t68-28h416v-416q0-40 28-68t68-28h192q40 0 68 28t28 68v416h416q40 0 68 28t28 68z"/></svg>
                </div>
            </div>
            <div class="channels-container">
                {#if $channels != null}
                    {#each $channels as channel (channel.id)}
                        {#if dbUser && (dbUser.hidden_channels == null || !dbUser.hidden_channels.includes(channel.id))}
                        {#if channel.id == $currentChannel.id}
                            <div class="channel activeCurrentChannel" on:click={(e) => openAChannel(e, channel.id)}>
                                <div class="channel-info">
                                    <p>{truncateString(channel.channel_name, 29)}</p>
                                </div>
                            </div>
                        {:else}
                            <div class="channel" on:click={(e) => openAChannel(e, channel.id)}>
                                <div class="channel-info">
                                    <p>{truncateString(channel.channel_name, 29)}</p>
                                </div>
                            </div>
                        {/if}
                        {/if}
                    {:else}
                        <p>Du är för tillfället inte med i några chattrum.</p>
                    {/each}
                {:else} 
                    <p>Laddar in chattrum...</p>
                {/if}
            </div>
            <div class="profile-container">
                <div class="profile">
                    <div class="profile-info">
                        <img class="current-user-avatar" src="{currentUser.user_metadata.avatar_url}" alt="current user avatar">
                        <p>{truncateString(currentUser.user_metadata.full_name, 29)}</p>
                    </div>
                    <div class="setting-icon" bind:this={userSettingsIcon} on:click={(e) => openUserSettingsPopup(e)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z"/></svg>
                    </div>
                </div>
            </div>
        </div>
        <div class="curC">
            {#if $currentChannel}
                <div class="curC-nav">
                    <div class="curC-info">
                        <h3 class="curC-name">{$currentChannel.channel_name}</h3>
                        <div class="curC-users"
                        bind:this={allChatUsersButton} 
                            on:click={(e) => openUsersDropdown(e)}
                        >
                            <div class="user-avatars">
                                {#each $allUsers as user (user.id)}
                                    {#if $currentChannel.allowed_users != null && $currentChannel.allowed_users.includes(user.id) || $currentChannel.created_by == user.id}
                                        <img class="chat-avatar" src="{user.userdata.avatar_url}" alt="channel user avatar">
                                    {/if}
                                {/each}
                                
                            </div>
                            {#if $currentChannel.allowed_users != null}
                                <p class="user-nums">{$currentChannel.allowed_users.length + 1}</p>
                            {:else}
                                <p class="user-nums">1</p>
                            {/if}
                        </div>
                        {#if $currentChannel.created_by == currentUser.id}
                        <div class="setting-icon" bind:this={chatSettinsIcon} on:click={(e) => openChatSettingsDropdown(e)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1152 896q0-106-75-181t-181-75-181 75-75 181 75 181 181 75 181-75 75-181zm512-109v222q0 12-8 23t-20 13l-185 28q-19 54-39 91 35 50 107 138 10 12 10 25t-9 23q-27 37-99 108t-94 71q-12 0-26-9l-138-108q-44 23-91 38-16 136-29 186-7 28-36 28h-222q-14 0-24.5-8.5t-11.5-21.5l-28-184q-49-16-90-37l-141 107q-10 9-25 9-14 0-25-11-126-114-165-168-7-10-7-23 0-12 8-23 15-21 51-66.5t54-70.5q-27-50-41-99l-183-27q-13-2-21-12.5t-8-23.5v-222q0-12 8-23t19-13l186-28q14-46 39-92-40-57-107-138-10-12-10-24 0-10 9-23 26-36 98.5-107.5t94.5-71.5q13 0 26 10l138 107q44-23 91-38 16-136 29-186 7-28 36-28h222q14 0 24.5 8.5t11.5 21.5l28 184q49 16 90 37l142-107q9-9 24-9 13 0 25 10 129 119 165 170 7 8 7 22 0 12-8 23-15 21-51 66.5t-54 70.5q26 50 41 98l183 28q13 2 21 12.5t8 23.5z"/></svg>
                        </div>
                        {/if}
                    </div>
                </div>
                <div class="chat" bind:this={messageContainer}>
                    {#each $channelMessages as message (message.id)}
                        {#if message.user_id.id == currentUser.id}
                            <div class="message" on:mouseleave={(e) => hideMessageSettings(e)} on:mouseenter={(e) => showMessageSettings(e)}>
                                <div class="message-container">
                                    <img class="message-avatar" src="{message.user_id.userdata.avatar_url}" alt="message-avatar">
                                    <div class="message-content">
                                        <div class="message-data">
                                            <h4 class="message-name">{message.user_id.userdata.name}</h4>
                                            <p class="message-date">{getDate(message.inserted_at)}</p>
                                            {#if message.edited}
                                                <span class="edited-text">(edited)</span>
                                            {/if}
                                        </div>
                                        <pre class="message-text">{message.message}</pre>
                                    </div>
                                </div>
                                <div class="message-popups">
                                    <div class="popup edit-pen">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M491 1536l91-91-235-235-91 91v107h128v128h107zm523-928q0-22-22-22-10 0-17 7l-542 542q-7 7-7 17 0 22 22 22 10 0 17-7l542-542q7-7 7-17zm-54-192l416 416-832 832h-416v-416zm683 96q0 53-37 90l-166 166-416-416 166-165q36-38 90-38 53 0 91 38l235 234q37 39 37 91z"/></svg>
                                    </div>
                                    <div class="popup trashcan" on:click={() => deleteMessage(message.id, message.user_id.id, currentUser.id)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 1792 1792"><path d="M704 1376v-704q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v704q0 14 9 23t23 9h64q14 0 23-9t9-23zm256 0v-704q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v704q0 14 9 23t23 9h64q14 0 23-9t9-23zm256 0v-704q0-14-9-23t-23-9h-64q-14 0-23 9t-9 23v704q0 14 9 23t23 9h64q14 0 23-9t9-23zm-544-992h448l-48-117q-7-9-17-11h-317q-10 2-17 11zm928 32v64q0 14-9 23t-23 9h-96v948q0 83-47 143.5t-113 60.5h-832q-66 0-113-58.5t-47-141.5v-952h-96q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h309l70-167q15-37 54-63t79-26h320q40 0 79 26t54 63l70 167h309q14 0 23 9t9 23z"/></svg>
                                    </div>
                                </div>
                            </div>
                        {:else}
                            <div class="message">
                                <div class="message-container">
                                    <img class="message-avatar" src="{message.user_id.userdata.avatar_url}" alt="message-avatar">
                                    <div class="message-content">
                                        <div class="message-data">
                                            <h4 class="message-name">{message.user_id.userdata.name}</h4>
                                            <p class="message-date">{getDate(message.inserted_at)}</p>
                                            {#if message.edited}
                                                <span class="edited-text">(edited)</span>
                                            {/if}
                                        </div>
                                        <pre class="message-text">{message.message}</pre>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
                <div class="chat-input-container">
                    <div class="input-formats">
                        <div id="bold-icon" class="format-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 1792 1792"><path d="M747 1521q74 32 140 32 376 0 376-335 0-114-41-180-27-44-61.5-74t-67.5-46.5-80.5-25-84-10.5-94.5-2q-73 0-101 10 0 53-.5 159t-.5 158q0 8-1 67.5t-.5 96.5 4.5 83.5 12 66.5zm-14-746q42 7 109 7 82 0 143-13t110-44.5 74.5-89.5 25.5-142q0-70-29-122.5t-79-82-108-43.5-124-14q-50 0-130 13 0 50 4 151t4 152q0 27-.5 80t-.5 79q0 46 1 69zm-541 889l2-94q15-4 85-16t106-27q7-12 12.5-27t8.5-33.5 5.5-32.5 3-37.5.5-34v-65.5q0-982-22-1025-4-8-22-14.5t-44.5-11-49.5-7-48.5-4.5-30.5-3l-4-83q98-2 340-11.5t373-9.5q23 0 68 .5t68 .5q70 0 136.5 13t128.5 42 108 71 74 104.5 28 137.5q0 52-16.5 95.5t-39 72-64.5 57.5-73 45-84 40q154 35 256.5 134t102.5 248q0 100-35 179.5t-93.5 130.5-138 85.5-163.5 48.5-176 14q-44 0-132-3t-132-3q-106 0-307 11t-231 12z"/></svg>
                        </div>
                        <div id="italic-icon" class="format-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 1792 1792"><path d="M384 1662l17-85q22-7 61.5-16.5t72-19 59.5-23.5q28-35 41-101 1-7 62-289t114-543.5 52-296.5v-25q-24-13-54.5-18.5t-69.5-8-58-5.5l19-103q33 2 120 6.5t149.5 7 120.5 2.5q48 0 98.5-2.5t121-7 98.5-6.5q-5 39-19 89-30 10-101.5 28.5t-108.5 33.5q-8 19-14 42.5t-9 40-7.5 45.5-6.5 42q-27 148-87.5 419.5t-77.5 355.5q-2 9-13 58t-20 90-16 83.5-6 57.5l1 18q17 4 185 31-3 44-16 99-11 0-32.5 1.5t-32.5 1.5q-29 0-87-10t-86-10q-138-2-206-2-51 0-143 9t-121 11z"/></svg>
                        </div>
                        <div id="o-list" class="format-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 1792 1792"><path d="M381 1620q0 80-54.5 126t-135.5 46q-106 0-172-66l57-88q49 45 106 45 29 0 50.5-14.5t21.5-42.5q0-64-105-56l-26-56q8-10 32.5-43.5t42.5-54 37-38.5v-1q-16 0-48.5 1t-48.5 1v53h-106v-152h333v88l-95 115q51 12 81 49t30 88zm2-627v159h-362q-6-36-6-54 0-51 23.5-93t56.5-68 66-47.5 56.5-43.5 23.5-45q0-25-14.5-38.5t-39.5-13.5q-46 0-81 58l-85-59q24-51 71.5-79.5t105.5-28.5q73 0 123 41.5t50 112.5q0 50-34 91.5t-75 64.5-75.5 50.5-35.5 52.5h127v-60h105zm1409 319v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-14 9-23t23-9h1216q13 0 22.5 9.5t9.5 22.5zm-1408-899v99h-335v-99h107q0-41 .5-121.5t.5-121.5v-12h-2q-8 17-50 54l-71-76 136-127h106v404h108zm1408 387v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-14 9-23t23-9h1216q13 0 22.5 9.5t9.5 22.5zm0-512v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5z"/></svg>
                        </div>
                        <div id="u-icon" class="format-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 1792 1792"><path d="M384 1408q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm0-512q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm1408 416v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5zm-1408-928q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm1408 416v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5zm0-512v192q0 13-9.5 22.5t-22.5 9.5h-1216q-13 0-22.5-9.5t-9.5-22.5v-192q0-13 9.5-22.5t22.5-9.5h1216q13 0 22.5 9.5t9.5 22.5z"/></svg>
                        </div>
                        <div id="link-icon" class="format-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 1792 1792"><path d="M1520 1216q0-40-28-68l-208-208q-28-28-68-28-42 0-72 32 3 3 19 18.5t21.5 21.5 15 19 13 25.5 3.5 27.5q0 40-28 68t-68 28q-15 0-27.5-3.5t-25.5-13-19-15-21.5-21.5-18.5-19q-33 31-33 73 0 40 28 68l206 207q27 27 68 27 40 0 68-26l147-146q28-28 28-67zm-703-705q0-40-28-68l-206-207q-28-28-68-28-39 0-68 27l-147 146q-28 28-28 67 0 40 28 68l208 208q27 27 68 27 42 0 72-31-3-3-19-18.5t-21.5-21.5-15-19-13-25.5-3.5-27.5q0-40 28-68t68-28q15 0 27.5 3.5t25.5 13 19 15 21.5 21.5 18.5 19q33-31 33-73zm895 705q0 120-85 203l-147 146q-83 83-203 83-121 0-204-85l-206-207q-83-83-83-203 0-123 88-209l-88-88q-86 88-208 88-120 0-204-84l-208-208q-84-84-84-204t85-203l147-146q83-83 203-83 121 0 204 85l206 207q83 83 83 203 0 123-88 209l88 88q86-88 208-88 120 0 204 84l208 208q84 84 84 204z"/></svg>
                        </div>
                    </div>
                    <div class="input-and-buttons">
                        <textarea class="message-input-field"
                            name="message"
                            placeholder="Send a message"
                            bind:value={messageInputVal}
                            on:keypress={(e) => submitOnEnter(e, messageInputVal, $currentChannel.id)}
                            on:input={(e) => autoResize(e)}
                            on:input={(e) => checkInputVal(e)}
                        />
                        <div class="message-buttons">
                            <button class="send-button disable-text-select"
                            bind:this={sendButton}
                            on:click={(e) => removeFocus(e)}
                            on:click={(e) => submitOnButton(e, messageInputVal, $currentChannel.id)}
                            >
                                Skicka
                            </button>
                            <!-- <button class="time-button"
                            on:click={(e) => removeFocus(e)}
                            >
                                Tillsvidare
                            </button> -->
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
