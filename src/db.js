import { createClient } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

const supabaseUrl = __api.env.SVELTE_APP_SUPABASE_URL
const supabaseAnonKey = __api.env.SVELTE_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const userStore = writable(supabase.auth.currentUser)

export const user = writable(false);

export const channels = writable([])

export const loadChannels = async (userId) => {
  if(userId == undefined){
    return 
  }
  console.log(userId)
  const { data, error } = await supabase.from('channels').select('*').contains('allowed_users', [userId])

  if(error){
    return console.error(error);
  }

  channels.set(data)
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