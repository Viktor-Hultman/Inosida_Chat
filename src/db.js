import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

const supabaseUrl = __api.env.SVELTE_APP_SUPABASE_URL
const supabaseAnonKey = __api.env.SVELTE_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const userStore = writable(supabase.auth.currentUser)

export const thisDBUser = writable(null);
export const channels = writable(null)
export const allUsers = writable([])
export const currentChannel = writable(false)
export const channelMessages = writable([])
export const scrollTheChat = writable(false)


export let currentChannelMessages
channelMessages.subscribe((messages) => {
  currentChannelMessages = messages
  if(currentChannelMessages.length > 0){
    currentChannelMessages.sort(function (a, b) {
      return a.id - b.id;
    });
  }
})

export let localChannels
channels.subscribe((channels) => {
  localChannels = channels
  if(localChannels != null){
    localChannels.sort(function (a, b) {
      return a.id - b.id;
    });
  }
})

export let localCurrentChannel
currentChannel.subscribe((channel) => {
  localCurrentChannel = channel
})

export let localUser
thisDBUser.subscribe((user) => {
  localUser = user
})


//Subscribtion to always update the chanelMessages with new values
const userMessages = supabase.from('messages')
//Updating the channelMessages with the new message
.on('INSERT', async payload => {
  if(localCurrentChannel.id == payload.new.channel_id){
    scrollTheChat.set(true)
    let { data, error } = await supabase.from('messages').select(`*, user_id (userdata, id)`).match({id: payload.new.id}).single()
    channelMessages.update(messages => [...messages, data])
  }
})
.on('UPDATE', async payload => {
  if(localCurrentChannel.id == payload.new.channel_id){
    scrollTheChat.set(false)
    let { data, error } = await supabase.from('messages').select(`*, user_id (userdata, id)`).match({id: payload.new.id}).single()
    channelMessages.update((messages) => messages.filter((message) => message.id !== payload.old.id))
    channelMessages.update(messages => [...messages, data])
  }
})
.on('DELETE', payload => {
  scrollTheChat.set(false)
  channelMessages.update((messages) => messages.filter((message) => message.id !== payload.old.id))
})
.subscribe()

const userChannels = supabase.from('channels')
.on('UPDATE', async payload => {
  localChannels.every( async channel => {
    if (channel.id == payload.old.id && (channel.created_by == supabase.auth.currentUser.id || channel.allowed_users.includes(supabase.auth.currentUser.id))) {
      let { data, error } = await supabase.from('channels').select('*').match({id: payload.new.id}).single()
      channels.update((channels) => channels.filter((channel) => channel.id !== payload.old.id))
      channels.update(channels => [...channels, data])
      return false;
    }
    return true;
  })
  console.log(payload);
})
.on('DELETE', payload => channels.update((channels) => channels.filter((channel) => channel.id !== payload.old.id)))
.subscribe()

const theUser = supabase.from('users')
.on('UPDATE', async payload => {
  let channelArr = []
  channels.update((channels) => channels.filter((channel) => {
    if(!payload.new.hidden_channels.includes(channel.id)){
      channelArr.push(channel)
    }
  }))
  channels.update(channels => [...channelArr])
  console.log(payload)
})
.subscribe()


export const addMessage = async (message, channel_id, user_id) => {
  const { data, error } = await supabase.from('messages').insert([{ message: message, channel_id: channel_id, user_id: user_id},
  ])

  if(error){
    return console.error(error);
  }
}

export const deleteMessage = async (message_id, message_user_id, user_id) => {
  if (message_user_id != user_id){
    return 
  }

  const { data, error } = await supabase.from('messages').delete().match({id: message_id})
  
  if(error){
    return console.error(error);
  }
}

export const updateMessage = async (message, message_id, message_user_id, user_id) => {
  if (message_user_id != user_id){
    return 
  }

  const { data, error } = await supabase.from('messages').update([{ message: message, edited: true }]).match({id: message_id})

  if(error){
    return console.error(error);
  }
}

export const updateChannelName = async (channel_name, channel_id, channel_user_id, user_id) => {
  if (channel_user_id != user_id){
    return 
  }

  const { data, error } = await supabase.from('channels').update({ channel_name: channel_name}).match({id: channel_id})

  if(error){
    return console.error(error);
  }
}

export const deleteChannel = async (channel_id, channel_user_id, user_id) => {
  if (channel_user_id != user_id){
    return 
  }

  const { data, error } = await supabase.from('channels').delete().match({ id: channel_id })
  
  if(error){
    return console.error(error);
  }
  //Updating the 'channels' store using filter method
  // channels.update((channels) => channels.filter((channel) => channel.id !== channel_id));
}

export const hideChannel = async (channel_id, channel_user_id, user_id, user_hidden_channels) => {
  if (channel_user_id == user_id){
    return 
  }
  if (user_hidden_channels.includes(channel_id)){
    return
  }

  let updatedList = [...user_hidden_channels, channel_id]

  const { data, error } = await supabase.from('users').update({hidden_channels: updatedList}).match({id: user_id})
  addMessage('This user has left this channel and will not be able to see any messages from this chat until they choose to "enter" this channel again!', channel_id, user_id)
  currentChannel.set(false)
  if(error){
    return console.error(error);
  }
  return data
}


export const loadChannels = async () => {
  const { data, error } = await supabase.from('channels').select('*')

  if(error){
    return console.error(error);
  }
  console.log("loading channels")
  channels.set(data)
}

export const getAllUsers = async () => {
  const { data, error } = await supabase.from('users').select('*')

  if(error){
    return console.error(error);
  }
  allUsers.set(data)
}

export const createChannel = async (name, user_id) => {
  const { data, error } = await supabase.from('channels').insert([{ channel_name: name, created_by: user_id },
  ]).single()

  if(error){
    return console.error(error);
  }


  localStorage.setItem('lastOpenedChannel', data.id)
  currentChannel.set(data)
  getMessagesOfChannel(data.id)
  // loadChannels()
}

export const getChannelToAddUser = async (channel_id, user_id) => {
  const { data, error } = await supabase.from('channels').select('allowed_users').match({id: channel_id})

  if(error){
    return console.error(error);
  }
  let allowedUsers = data[0].allowed_users ? data[0].allowed_users : []
  addUserToChannel(channel_id, user_id, allowedUsers)
}

export const addUserToChannel = async (channel_id, user_id, allowedUsers) => {

  if (!allowedUsers.includes(user_id)) {
    allowedUsers.push(user_id);
  } else {
    return console.log("That user is already in this chat");
  }

  const { data, error } = await supabase.from('channels').update({allowed_users: allowedUsers}).match({id: channel_id})
  
  if(error){
    return console.error(error);
  }
  // loadChannels()
}

export const getChannelToRemoveUser = async (channel_id, user_id) => {
  const { data, error } = await supabase.from('channels').select('allowed_users').match({id: channel_id})

  if(error){
    return console.error(error);
  }
  let allowedUsers = data[0].allowed_users ? data[0].allowed_users : []
  removeUserFromChannel(channel_id, user_id, allowedUsers)
}

export const removeUserFromChannel = async (channel_id, user_id, allowedUsers) => {
  let filteredUsers = []
  if (allowedUsers.includes(user_id)) {
    for (let i = 0; i < allowedUsers.length; i++) {
      if(allowedUsers[i] != user_id){
        filteredUsers.push(allowedUsers[i])
      }
    }
  } else {
    return console.log("That user is not currently in this chat");
  }
  const { data, error } = await supabase.from('channels').update({allowed_users: filteredUsers}).match({id: channel_id})
  
  if(error){
    return console.error(error);
  }
  // loadChannels()
}

export const openChannel = async (channel_id) => {
  const { data, error } = await supabase.from('channels').select('*').match({id: channel_id}).single()

  if(error){
    return console.error(error);
  }
  currentChannel.set(data)
  getMessagesOfChannel(channel_id)
  scrollTheChat.set(true)
}

export const getMessagesOfChannel = async (channel_id) => {
  const { data, error } = await supabase.from('messages').select(`*, user_id (userdata, id)`).match({channel_id: channel_id})

  if(error){
    return console.error(error);
  }
  channelMessages.set(data)
}

export const getCurrentDBUser = async (user_id) => {
  const { data, error } = await supabase.from('users').select('*').match({id: user_id})
  // const { data, error } = await supabase.from('messages').select(`*, user_id (userdata, id)`).match({channel_id: channel_id})

  if(error){
    return console.error(error);
  }
  thisDBUser.set(data)
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event == 'SIGNED_IN') {
      userStore.set(session.user)
    } else if (event == 'SIGNED_OUT') {
      userStore.set(null)
    }
})

export default {
    get user() {
      return userStore
    },
    signIn() {
      return supabase.auth.signIn({provider: 'google'})
    },
    signOut() {
      return supabase.auth.signOut()
    }
}