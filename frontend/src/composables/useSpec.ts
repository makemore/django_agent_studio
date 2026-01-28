import { ref, computed, watch } from 'vue'
import type { SpecTab } from '@/types'
import { apiGet, apiPut } from './useApi'
import { useAgents } from './useAgents'
import { marked } from 'marked'

const specContent = ref('')
const specTab = ref<SpecTab>('preview')
const specModified = ref(false)
const specSaved = ref(false)
const specSaving = ref(false)
const originalSpec = ref('')
const specDocumentId = ref<string | null>(null)

// Response type for the agent spec endpoint
interface AgentSpecResponse {
  id: string | null
  title: string | null
  content: string
  current_version: number
  has_spec: boolean
}

export function useSpec() {
  const { selectedAgentId, selectedAgent } = useAgents()

  const renderedSpec = computed(() => {
    if (!specContent.value) return ''
    try {
      return marked.parse(specContent.value) as string
    } catch {
      return specContent.value.replace(/\n/g, '<br>')
    }
  })

  async function loadSpec() {
    if (!selectedAgentId.value) {
      specContent.value = ''
      originalSpec.value = ''
      specModified.value = false
      specDocumentId.value = null
      return
    }

    try {
      // Load from the agent's linked SpecDocument
      const data = await apiGet<AgentSpecResponse>(
        `/studio/api/agents/${selectedAgentId.value}/spec/`
      )
      specContent.value = data.content || ''
      originalSpec.value = data.content || ''
      specDocumentId.value = data.id
      specModified.value = false
      specSaved.value = false
    } catch (error) {
      console.error('Error loading spec:', error)
      specContent.value = ''
      originalSpec.value = ''
      specDocumentId.value = null
    }
  }

  async function saveSpec() {
    if (!selectedAgentId.value || specSaving.value) return

    specSaving.value = true
    try {
      // Save to the agent's linked SpecDocument (creates if doesn't exist)
      const data = await apiPut<AgentSpecResponse>(
        `/studio/api/agents/${selectedAgentId.value}/spec/`,
        { content: specContent.value }
      )
      originalSpec.value = specContent.value
      specDocumentId.value = data.id
      specModified.value = false
      specSaved.value = true

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        specSaved.value = false
      }, 2000)
    } catch (error) {
      console.error('Error saving spec:', error)
      throw error
    } finally {
      specSaving.value = false
    }
  }

  function updateSpec(content: string) {
    specContent.value = content
    specModified.value = content !== originalSpec.value
    specSaved.value = false
  }

  // Watch for agent changes
  watch(selectedAgentId, () => {
    loadSpec()
  })

  return {
    // State
    specContent,
    specTab,
    specModified,
    specSaved,
    specSaving,
    specDocumentId,
    // Computed
    renderedSpec,
    // Methods
    loadSpec,
    saveSpec,
    updateSpec,
  }
}

