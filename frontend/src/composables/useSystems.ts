import { ref } from 'vue'
import type { AgentSystem, SystemMember } from '@/types'
import { apiGet, apiPost, apiPatch, apiDelete } from './useApi'

const systems = ref<AgentSystem[]>([])
const selectedSystemId = ref('')
const loading = ref(false)
const modalOpen = ref(false)
const expandedSystemId = ref<string | null>(null)

export function useSystems() {
  async function loadSystems() {
    loading.value = true
    try {
      const data = await apiGet<AgentSystem[] | { results: AgentSystem[] }>('/studio/api/systems/')
      systems.value = Array.isArray(data) ? data : (data.results || [])
    } catch (error) {
      console.error('Error loading systems:', error)
    } finally {
      loading.value = false
    }
  }

  async function createSystem(name: string, slug: string, entryAgent?: string) {
    const payload: any = { name, slug }
    if (entryAgent) {
      payload.entry_agent = entryAgent
    }
    await apiPost('/studio/api/systems/', payload)
    await loadSystems()
  }

  async function updateSystem(systemId: string, data: { name?: string; description?: string; entry_agent?: string }) {
    await apiPatch(`/studio/api/systems/${systemId}/`, data)
    await loadSystems()
  }

  async function deleteSystem(systemId: string) {
    await apiDelete(`/studio/api/systems/${systemId}/`)
    if (selectedSystemId.value === systemId) {
      selectedSystemId.value = ''
    }
    await loadSystems()
  }

  async function loadSystemMembers(systemId: string) {
    try {
      const data = await apiGet<SystemMember[] | { results: SystemMember[] }>(
        `/studio/api/systems/${systemId}/members/`
      )
      const members = Array.isArray(data) ? data : (data.results || [])

      const idx = systems.value.findIndex(s => s.id === systemId)
      if (idx !== -1) {
        systems.value[idx] = { ...systems.value[idx], members }
      }
    } catch (error) {
      console.error('Error loading system members:', error)
    }
  }

  async function addMember(systemId: string, agentId: string) {
    await apiPost(`/studio/api/systems/${systemId}/members/`, { agent: agentId })
    await loadSystemMembers(systemId)
  }

  async function removeMember(systemId: string, memberId: string) {
    await apiDelete(`/studio/api/systems/${systemId}/members/${memberId}/`)
    await loadSystemMembers(systemId)
  }

  async function updateMember(systemId: string, memberId: string, data: { role?: string }) {
    await apiPatch(`/studio/api/systems/${systemId}/members/${memberId}/`, data)
    await loadSystemMembers(systemId)
  }

  async function publishSystem(systemId: string, version?: string) {
    const payload = version ? { version } : {}
    await apiPost(`/studio/api/systems/${systemId}/publish/`, payload)
    await loadSystems()
  }

  function openModal() {
    modalOpen.value = true
    loadSystems()
  }

  function closeModal() {
    modalOpen.value = false
    expandedSystemId.value = null
  }

  function toggleExpanded(systemId: string) {
    if (expandedSystemId.value === systemId) {
      expandedSystemId.value = null
    } else {
      expandedSystemId.value = systemId
      loadSystemMembers(systemId)
    }
  }

  return {
    // State
    systems,
    selectedSystemId,
    loading,
    modalOpen,
    expandedSystemId,
    // Methods
    loadSystems,
    createSystem,
    updateSystem,
    deleteSystem,
    loadSystemMembers,
    addMember,
    removeMember,
    updateMember,
    publishSystem,
    openModal,
    closeModal,
    toggleExpanded,
  }
}

