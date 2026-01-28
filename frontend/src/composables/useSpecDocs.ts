import { ref } from 'vue'
import type { SpecDocument, SpecDocumentVersion } from '@/types'
import { apiGet, apiPost, apiPatch, apiDelete } from './useApi'
import { marked } from 'marked'

const modalOpen = ref(false)
const loading = ref(false)
const specTree = ref<SpecDocument[]>([])
const selectedSpecId = ref<string | null>(null)

// Current document state
const specDocTitle = ref('')
const specDocContent = ref('')
const specDocVersion = ref(1)
const specDocPath = ref('')
const specDocLinkedAgent = ref('')
const specDocModified = ref(false)
const specDocSaved = ref(false)
const previewMode = ref(false)

// History
const historyOpen = ref(false)
const specHistory = ref<SpecDocumentVersion[]>([])

// Rendered spec modal
const renderedSpecModalOpen = ref(false)
const fullRenderedSpec = ref('')

export function useSpecDocs() {
  const renderedContent = () => {
    if (!specDocContent.value) return ''
    try {
      return marked.parse(specDocContent.value) as string
    } catch {
      return specDocContent.value.replace(/\n/g, '<br>')
    }
  }

  async function loadSpecTree() {
    loading.value = true
    try {
      const data = await apiGet<SpecDocument[] | { results: SpecDocument[] }>('/studio/api/spec-documents/tree/')
      // Handle both array and paginated response
      specTree.value = Array.isArray(data) ? data : (data.results || [])
    } catch (error) {
      console.error('Error loading spec tree:', error)
      specTree.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadSpecDocument(id: string) {
    try {
      const doc = await apiGet<SpecDocument>(`/studio/api/spec-documents/${id}/`)
      selectedSpecId.value = id
      specDocTitle.value = doc.title
      specDocContent.value = doc.content || ''
      specDocVersion.value = doc.version
      specDocPath.value = doc.path || ''
      specDocLinkedAgent.value = doc.linked_agent?.id || ''
      specDocModified.value = false
      specDocSaved.value = false
    } catch (error) {
      console.error('Error loading spec document:', error)
    }
  }

  async function saveSpecDocument() {
    if (!selectedSpecId.value) return

    try {
      await apiPatch(`/studio/api/spec-documents/${selectedSpecId.value}/`, {
        title: specDocTitle.value,
        content: specDocContent.value,
        linked_agent: specDocLinkedAgent.value || null,
      })
      specDocModified.value = false
      specDocSaved.value = true
      await loadSpecTree()
      
      setTimeout(() => {
        specDocSaved.value = false
      }, 2000)
    } catch (error) {
      console.error('Error saving spec document:', error)
      throw error
    }
  }

  async function createSpecDocument(title: string, parentId?: string) {
    const payload: any = { title }
    if (parentId) {
      payload.parent = parentId
    }
    const doc = await apiPost<SpecDocument>('/studio/api/spec-documents/', payload)
    await loadSpecTree()
    return doc
  }

  async function deleteSpecDocument(id: string) {
    await apiDelete(`/studio/api/spec-documents/${id}/`)
    if (selectedSpecId.value === id) {
      selectedSpecId.value = null
      specDocTitle.value = ''
      specDocContent.value = ''
    }
    await loadSpecTree()
  }

  async function loadHistory() {
    if (!selectedSpecId.value) return
    try {
      const data = await apiGet<SpecDocumentVersion[]>(
        `/studio/api/spec-documents/${selectedSpecId.value}/history/`
      )
      specHistory.value = data
      historyOpen.value = true
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  async function loadRenderedSpec() {
    try {
      const data = await apiGet<{ content: string }>('/studio/api/spec-documents/render/')
      fullRenderedSpec.value = data.content
      renderedSpecModalOpen.value = true
    } catch (error) {
      console.error('Error loading rendered spec:', error)
    }
  }

  function openModal() {
    modalOpen.value = true
    loadSpecTree()
  }

  function closeModal() {
    modalOpen.value = false
    selectedSpecId.value = null
  }

  function markModified() {
    specDocModified.value = true
    specDocSaved.value = false
  }

  return {
    // State
    modalOpen,
    loading,
    specTree,
    selectedSpecId,
    specDocTitle,
    specDocContent,
    specDocVersion,
    specDocPath,
    specDocLinkedAgent,
    specDocModified,
    specDocSaved,
    previewMode,
    historyOpen,
    specHistory,
    renderedSpecModalOpen,
    fullRenderedSpec,
    // Methods
    renderedContent,
    loadSpecTree,
    loadSpecDocument,
    saveSpecDocument,
    createSpecDocument,
    deleteSpecDocument,
    loadHistory,
    loadRenderedSpec,
    openModal,
    closeModal,
    markModified,
  }
}

