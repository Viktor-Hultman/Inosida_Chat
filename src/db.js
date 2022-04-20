import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

const supabaseUrl = __api.env.SVELTE_APP_SUPABASE_URL
const supabaseAnonKey = __api.env.SVELTE_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const userStore = writable(supabase.auth.currentUser)

export const user = writable(false);
export const channels = writable([])
export const allUsers = writable([])
export const currentChannel = writable([])
export const channelMessages = writable([])

export const loadChannels = async () => {
  const { data, error } = await supabase.from('channels').select('*')

  if(error){
    return console.error(error);
  }

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
  ])

  if(error){
    return console.error(error);
  }

  currentChannel.set(data)
  loadChannels()
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
  currentChannel.set(data)
  loadChannels()
}

export const openChannel = async (channel_id) => {
  const { data, error } = await supabase.from('channels').select('*').match({id: channel_id})

  if(error){
    return console.error(error);
  }
  currentChannel.set(data)
  getMessagesOfChannel(channel_id)
}

export const getMessagesOfChannel = async (channel_id) => {
  const { data, error } = await supabase.from('messages').select('*').match({channel_id: channel_id})

  if(error){
    return console.error(error);
  }
  channelMessages.set(data)
}


loadChannels();

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