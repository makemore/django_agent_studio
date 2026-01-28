/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  STUDIO_CONFIG: {
    agentId: string | null
    agentSlug: string | null
    builderAgentKey: string
    isNew: boolean
    csrfToken: string
  }
  ChatWidget: {
    createInstance: (config: any) => any
  }
  testChatWidget?: any
  builderChatWidget?: any
}

