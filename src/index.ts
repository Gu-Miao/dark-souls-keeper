import { createApp } from 'vue'
import App from './Wrapper.vue'

createApp(App).mount('#app')

// Disable default behavior when right clicking
window.addEventListener('contextmenu', e => {
  e.preventDefault()
})
