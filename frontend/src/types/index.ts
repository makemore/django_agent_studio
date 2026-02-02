export interface Agent {
  id: string
  name: string
  slug: string
  icon?: string
  // Note: spec is now stored in SpecDocument model, not directly on agent
  // Use the spec_documents relationship to get the linked spec
  created_at?: string
  updated_at?: string
}

export interface AgentVersion {
  id: string
  version: string
  is_active: boolean
  is_draft: boolean
  created_at?: string
}

export interface AgentSystem {
  id: string
  name: string
  slug: string
  description?: string
  entry_agent?: { id: string; name: string; icon?: string } | string
  members?: SystemMember[]
}

export interface SystemMember {
  id: string
  agent: Agent
  role?: string
}

export interface SpecDocument {
  id: string
  title: string
  content: string
  path: string
  version: number
  parent?: string | null
  linked_agent?: Agent | null
  children?: SpecDocument[]
  has_content?: boolean
  created_at?: string
  updated_at?: string
}

export interface SpecDocumentVersion {
  id: string
  version: number
  content: string
  created_at: string
  created_by?: string
}

export interface FullSchema {
  agent: Agent
  version: AgentVersion
  tools: any[]
  dynamic_tools: any[]
  sub_agent_tools: any[]
  knowledge: any[]
  rag_config: any
  functions: any[]
}

export type AuthMode = 'authenticated' | 'anonymous'

export type SchemaTab = 'full' | 'version' | 'tools' | 'dynamic_tools' | 'sub_agents' | 'knowledge' | 'rag' | 'functions'

export type SpecTab = 'edit' | 'preview'

// Extend Window for global services
declare global {
  interface Window {
    $confirm?: any
    $toast?: any
  }
}

