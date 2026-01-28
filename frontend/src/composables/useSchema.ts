import { ref, computed } from 'vue'
import type { SchemaTab, FullSchema } from '@/types'
import { apiGet, apiPut } from './useApi'
import { useAgents } from './useAgents'

const schemaOpen = ref(false)
const schemaTab = ref<SchemaTab>('full')
const schemaLoading = ref(false)
const schemaError = ref<string | null>(null)
const schemaSaved = ref(false)
const schemaModified = ref(false)

// Schema JSON strings for each tab
const schemaJson = ref('')
const versionJson = ref('')
const toolsJson = ref('')
const dynamicToolsJson = ref('')
const subAgentToolsJson = ref('')
const knowledgeJson = ref('')
const ragConfigJson = ref('')
const memoryJson = ref('')
const functionsJson = ref('')

const fullSchema = ref<FullSchema | null>(null)

export function useSchema() {
  const { selectedAgentId } = useAgents()

  const currentJson = computed(() => {
    switch (schemaTab.value) {
      case 'full': return schemaJson.value
      case 'version': return versionJson.value
      case 'tools': return toolsJson.value
      case 'dynamic_tools': return dynamicToolsJson.value
      case 'sub_agents': return subAgentToolsJson.value
      case 'knowledge': return knowledgeJson.value
      case 'rag': return ragConfigJson.value
      case 'memory': return memoryJson.value
      case 'functions': return functionsJson.value
      default: return ''
    }
  })

  async function loadSchema() {
    if (!selectedAgentId.value) return

    schemaLoading.value = true
    schemaError.value = null

    try {
      const data = await apiGet<FullSchema>(
        `/studio/api/agents/${selectedAgentId.value}/full-schema/`
      )
      fullSchema.value = data
      
      schemaJson.value = JSON.stringify(data, null, 2)
      versionJson.value = JSON.stringify(data.version || {}, null, 2)
      toolsJson.value = JSON.stringify(data.tools || [], null, 2)
      dynamicToolsJson.value = JSON.stringify(data.dynamic_tools || [], null, 2)
      subAgentToolsJson.value = JSON.stringify(data.sub_agent_tools || [], null, 2)
      knowledgeJson.value = JSON.stringify(data.knowledge || [], null, 2)
      ragConfigJson.value = JSON.stringify(data.rag_config || {}, null, 2)
      memoryJson.value = JSON.stringify(data.memory_config || {}, null, 2)
      functionsJson.value = JSON.stringify(data.functions || [], null, 2)
      
      schemaModified.value = false
      schemaSaved.value = false
    } catch (error: any) {
      schemaError.value = error.message
    } finally {
      schemaLoading.value = false
    }
  }

  async function saveSchema(tabKey?: string) {
    const tab = tabKey || schemaTab.value
    if (schemaError.value || tab === 'functions') return
    if (!selectedAgentId.value) return

    schemaLoading.value = true
    schemaError.value = null

    try {
      let payload: any = {}

      switch (tab) {
        case 'full':
          payload = JSON.parse(schemaJson.value)
          break
        case 'version':
          payload = { version: JSON.parse(versionJson.value) }
          break
        case 'tools':
          payload = { tools: JSON.parse(toolsJson.value) }
          break
        case 'dynamic_tools':
          payload = { dynamic_tools: JSON.parse(dynamicToolsJson.value) }
          break
        case 'sub_agents':
          payload = { sub_agent_tools: JSON.parse(subAgentToolsJson.value) }
          break
        case 'knowledge':
          payload = { knowledge: JSON.parse(knowledgeJson.value) }
          break
        case 'rag':
          payload = { rag_config: JSON.parse(ragConfigJson.value) }
          break
        case 'memory':
          payload = { memory_config: JSON.parse(memoryJson.value) }
          break
      }

      await apiPut(`/studio/api/agents/${selectedAgentId.value}/full-schema/`, payload)

      schemaSaved.value = true
      schemaModified.value = false

      // Reload after save
      setTimeout(() => loadSchema(), 1000)
    } catch (error: any) {
      schemaError.value = error.message
      throw error
    } finally {
      schemaLoading.value = false
    }
  }

  function validateJson(tabKey?: string) {
    const tab = tabKey || schemaTab.value
    schemaError.value = null
    try {
      switch (tab) {
        case 'full': JSON.parse(schemaJson.value); break
        case 'version': JSON.parse(versionJson.value); break
        case 'tools': JSON.parse(toolsJson.value); break
        case 'dynamic_tools': JSON.parse(dynamicToolsJson.value); break
        case 'sub_agents': JSON.parse(subAgentToolsJson.value); break
        case 'knowledge': JSON.parse(knowledgeJson.value); break
        case 'rag': JSON.parse(ragConfigJson.value); break
        case 'memory': JSON.parse(memoryJson.value); break
      }
    } catch (e: any) {
      schemaError.value = `Invalid JSON: ${e.message}`
    }
  }

  function updateCurrentJson(value: string, tabKey?: string) {
    const tab = tabKey || schemaTab.value
    switch (tab) {
      case 'full': schemaJson.value = value; break
      case 'version': versionJson.value = value; break
      case 'tools': toolsJson.value = value; break
      case 'dynamic_tools': dynamicToolsJson.value = value; break
      case 'sub_agents': subAgentToolsJson.value = value; break
      case 'knowledge': knowledgeJson.value = value; break
      case 'rag': ragConfigJson.value = value; break
      case 'memory': memoryJson.value = value; break
    }
    schemaModified.value = true
    schemaSaved.value = false
    validateJson(tab)
  }

  async function copySchema() {
    try {
      await navigator.clipboard.writeText(currentJson.value)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  function openSchema() {
    schemaOpen.value = true
    loadSchema()
  }

  function closeSchema() {
    schemaOpen.value = false
  }

  return {
    // State
    schemaOpen,
    schemaTab,
    schemaLoading,
    schemaError,
    schemaSaved,
    schemaModified,
    fullSchema,
    // JSON refs
    schemaJson,
    versionJson,
    toolsJson,
    dynamicToolsJson,
    subAgentToolsJson,
    knowledgeJson,
    ragConfigJson,
    memoryJson,
    functionsJson,
    // Computed
    currentJson,
    // Methods
    loadSchema,
    saveSchema,
    validateJson,
    updateCurrentJson,
    copySchema,
    openSchema,
    closeSchema,
  }
}

