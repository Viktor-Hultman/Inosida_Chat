<script>
  import db from './db.js';

    let loading = false

    async function login() {
      try {
        loading = true
        const { error } = await db.signIn()
        if (error) throw error
        console.log('Loading')
      } catch (error) {
        alert(error.error_description || error.message)
      } finally {
        loading = false
      }
  	}
  
</script>

<button on:click={login}>Log in</button>