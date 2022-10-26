import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

// Disable default behavior when right clicking
window.addEventListener('contextmenu', e => {
  e.preventDefault()
})
