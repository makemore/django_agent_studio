import { ref, computed } from 'vue'
import type { Agent, AgentVersion } from '@/types'
import { apiGet, apiPost, apiDelete } from './useApi'

// Shared state
const agents = ref<Agent[]>([])
const versions = ref<AgentVersion[]>([])
const selectedAgentId = ref<string>('')
const selectedVersionId = ref<string>('')
const loading = ref(false)

export function useAgents() {
  const selectedAgent = computed(() => 
    agents.value.find(a => a.id === selectedAgentId.value)
  )

  const isActiveVersion = computed(() => {
    const version = versions.value.find(v => v.id === selectedVersionId.value)
    return version?.is_active ?? false
  })

  async function loadAgents() {
    loading.value = true
    try {
      const data = await apiGet<Agent[] | { results: Agent[] }>('/studio/api/agents/')
      const agentList = Array.isArray(data) ? data : (data.results || [])
      agents.value = agentList.filter(a => a && a.id)
      
      if (selectedAgentId.value) {
        await loadVersions()
      }
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      loading.value = false
    }
  }

  async function loadVersions() {
    if (!selectedAgentId.value) {
      versions.value = []
      return
    }
    try {
      const data = await apiGet<AgentVersion[] | { results: AgentVersion[] }>(
        `/studio/api/agents/${selectedAgentId.value}/versions/`
      )
      versions.value = Array.isArray(data) ? data : (data.results || [])
      
      // Select active version by default
      const activeVersion = versions.value.find(v => v.is_active)
      if (activeVersion) {
        selectedVersionId.value = activeVersion.id
      } else if (versions.value.length > 0) {
        selectedVersionId.value = versions.value[0].id
      }
    } catch (error) {
      console.error('Error loading versions:', error)
    }
  }

  async function createAgent(name: string, slug: string) {
    const data = await apiPost<Agent>('/studio/api/agents/', { name, slug })
    await loadAgents()
    return data
  }

  async function deleteAgent(agentId: string) {
    await apiDelete(`/studio/api/agents/${agentId}/`)
    if (selectedAgentId.value === agentId) {
      selectedAgentId.value = ''
    }
    await loadAgents()
  }

  async function activateVersion() {
    if (!selectedAgentId.value || !selectedVersionId.value) return
    await apiPost(
      `/studio/api/agents/${selectedAgentId.value}/versions/${selectedVersionId.value}/activate/`
    )
    await loadVersions()
  }

  function selectAgent(agentId: string) {
    selectedAgentId.value = agentId
    const agent = agents.value.find(a => a.id === agentId)
    
    // Update URL
    if (agent) {
      window.history.replaceState({}, '', `/studio/agents/${agent.id}/`)
    } else {
      window.history.replaceState({}, '', '/studio/agents/new/')
    }
  }

  return {
    // State
    agents,
    versions,
    selectedAgentId,
    selectedVersionId,
    loading,
    // Computed
    selectedAgent,
    isActiveVersion,
    // Methods
    loadAgents,
    loadVersions,
    createAgent,
    deleteAgent,
    activateVersion,
    selectAgent,
  }
}

