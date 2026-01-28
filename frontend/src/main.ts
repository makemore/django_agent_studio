import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'

// PrimeVue components
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tree from 'primevue/tree'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import Tag from 'primevue/tag'
import ToggleButton from 'primevue/togglebutton'
import SelectButton from 'primevue/selectbutton'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

// Styles
import 'primevue/resources/themes/lara-light-indigo/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import './styles/main.css'

// Extend Window interface for global config and widgets
declare global {
  interface Window {
    STUDIO_CONFIG?: {
      agentId?: string
      csrfToken?: string
      builderAgentKey?: string
    }
    ChatWidget?: {
      createInstance: (config: any) => any
    }
    testChatWidget?: any
    builderChatWidget?: any
  }
}

// Wait for DOM to be ready
function init() {
  const app = createApp(App)

  // Configure PrimeVue
  app.use(PrimeVue, { ripple: true })
  app.use(ConfirmationService)
  app.use(ToastService)

  // Register components globally
  app.component('Button', Button)
  app.component('Dropdown', Dropdown)
  app.component('Dialog', Dialog)
  app.component('TabView', TabView)
  app.component('TabPanel', TabPanel)
  app.component('Tree', Tree)
  app.component('InputText', InputText)
  app.component('Textarea', Textarea)
  app.component('ConfirmDialog', ConfirmDialog)
  app.component('Toast', Toast)
  app.component('Tag', Tag)
  app.component('ToggleButton', ToggleButton)
  app.component('SelectButton', SelectButton)
  app.component('Splitter', Splitter)
  app.component('SplitterPanel', SplitterPanel)

  // Register directives
  app.directive('tooltip', Tooltip)

  app.mount('#studio-app')
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

