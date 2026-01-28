<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useSpecDocs } from '@/composables/useSpecDocs'
import { useAgents } from '@/composables/useAgents'
import type { SpecDocument } from '@/types'

const confirm = useConfirm()
const toast = useToast()

const { agents } = useAgents()
const {
  modalOpen,
  loading,
  specTree,
  selectedSpecId,
  specDocTitle,
  specDocContent,
  specDocLinkedAgent,
  specDocModified,
  specDocSaved,
  loadSpecTree,
  loadSpecDocument,
  saveSpecDocument,
  createSpecDocument,
  deleteSpecDocument,
  loadRenderedSpec,
  closeModal,
  markModified,
  renderedContent,
} = useSpecDocs()

const previewMode = ref(false)
const selectedKeys = ref<Record<string, boolean>>({})

// Transform spec tree to PrimeVue Tree format
function transformToTreeNodes(docs: SpecDocument[] | undefined | null): any[] {
  if (!docs || !Array.isArray(docs)) return []
  return docs.map(doc => ({
    key: doc.id,
    label: doc.title,
    data: doc,
    icon: doc.linked_agent ? 'pi pi-link' : (doc.has_content ? 'pi pi-file' : 'pi pi-file-o'),
    children: doc.children ? transformToTreeNodes(doc.children) : []
  }))
}

const treeNodes = computed(() => transformToTreeNodes(specTree.value))

const agentOptions = computed(() => [
  { label: 'None', value: '' },
  ...agents.value.map(a => ({ label: a.name, value: a.id }))
])

watch(selectedKeys, (keys) => {
  const selectedId = Object.keys(keys)[0]
  if (selectedId && selectedId !== selectedSpecId.value) {
    loadSpecDocument(selectedId)
  }
})

async function handleAddRoot() {
  const title = prompt('Enter document title:')
  if (!title) return
  const doc = await createSpecDocument(title)
  await loadSpecDocument(doc.id)
  selectedKeys.value = { [doc.id]: true }
}

async function handleAddChild() {
  if (!selectedSpecId.value) return
  const title = prompt('Enter document title:')
  if (!title) return
  const doc = await createSpecDocument(title, selectedSpecId.value)
  await loadSpecDocument(doc.id)
  selectedKeys.value = { [doc.id]: true }
}

function handleDelete() {
  if (!selectedSpecId.value) return

  confirm.require({
    message: 'Are you sure you want to delete this document?',
    header: 'Delete Document',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deleteSpecDocument(selectedSpecId.value!)
      selectedKeys.value = {}
      toast.add({ severity: 'success', summary: 'Deleted', detail: 'Document deleted', life: 2000 })
    }
  })
}

async function handleSave() {
  try {
    await saveSpecDocument()
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Document saved', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

function onShow() {
  loadSpecTree()
  if (selectedSpecId.value) {
    selectedKeys.value = { [selectedSpecId.value]: true }
  }
}
</script>

<template>
  <Dialog
    v-model:visible="modalOpen"
    modal
    :style="{ width: '90vw', maxWidth: '1100px' }"
    :contentStyle="{ padding: 0, height: '600px' }"
    @show="onShow"
  >
    <template #header>
      <div class="flex align-items-center gap-2">
        <i class="pi pi-folder text-xl"></i>
        <div>
          <span class="font-semibold text-lg">Spec Documents</span>
          <p class="text-sm text-color-secondary mt-1 mb-0">Manage hierarchical specification documents</p>
        </div>
      </div>
    </template>

    <div class="spec-docs-layout">
      <!-- Tree Panel -->
      <div class="tree-panel">
        <div class="tree-header">
          <span class="font-semibold">Documents</span>
          <div class="flex gap-1">
            <Button icon="pi pi-plus" text size="small" @click="handleAddRoot" v-tooltip="'Add root document'" />
            <Button icon="pi pi-plus-circle" text size="small" @click="handleAddChild" :disabled="!selectedSpecId" v-tooltip="'Add child'" />
          </div>
        </div>
        <div class="tree-content">
          <div v-if="loading" class="flex justify-content-center p-4">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
          </div>
          <div v-else-if="treeNodes.length === 0" class="p-4 text-center text-color-secondary">
            No documents yet. Click + to create one.
          </div>
          <Tree
            v-else
            v-model:selectionKeys="selectedKeys"
            :value="treeNodes"
            selectionMode="single"
            class="border-none"
          />
        </div>
      </div>

      <!-- Editor Panel -->
      <div class="editor-panel">
        <template v-if="selectedSpecId">
          <div class="editor-header">
            <InputText
              v-model="specDocTitle"
              @input="markModified"
              placeholder="Document title"
              class="flex-1 font-semibold"
            />
            <div class="flex gap-1">
              <Button
                :icon="previewMode ? 'pi pi-pencil' : 'pi pi-eye'"
                text
                size="small"
                @click="previewMode = !previewMode"
                v-tooltip="previewMode ? 'Edit' : 'Preview'"
              />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                size="small"
                @click="handleDelete"
                v-tooltip="'Delete'"
              />
            </div>
          </div>

          <div class="editor-meta">
            <label class="text-sm">Link to Agent:</label>
            <Dropdown
              v-model="specDocLinkedAgent"
              :options="agentOptions"
              optionLabel="label"
              optionValue="value"
              @change="markModified"
              class="w-12rem"
              size="small"
            />
          </div>

          <div class="editor-content">
            <textarea
              v-if="!previewMode"
              v-model="specDocContent"
              @input="markModified"
              class="editor-textarea"
              placeholder="Write your specification..."
            ></textarea>
            <div v-else class="editor-preview" v-html="renderedContent()"></div>
          </div>
        </template>

        <div v-else class="empty-state">
          <i class="pi pi-file-edit text-4xl mb-3 text-color-secondary"></i>
          <h3 class="mt-0 mb-2">Select a document</h3>
          <p class="text-color-secondary m-0">Choose a document from the tree to edit</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-between align-items-center w-full">
        <div class="flex align-items-center gap-2">
          <i class="pi" :class="{
            'pi-circle-fill text-orange-500': specDocModified,
            'pi-check-circle text-green-500': specDocSaved && !specDocModified
          }"></i>
          <span v-if="specDocModified" class="text-sm">Unsaved changes</span>
          <span v-else-if="specDocSaved" class="text-sm text-green-500">Saved</span>
        </div>
        <div class="flex gap-2">
          <Button label="View All" icon="pi pi-eye" text @click="loadRenderedSpec" />
          <Button
            label="Save"
            icon="pi pi-save"
            :disabled="!specDocModified || !selectedSpecId"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.spec-docs-layout {
  display: flex;
  height: 100%;
}

.tree-panel {
  width: 300px;
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
}

.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.editor-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: var(--surface-ground);
  border-bottom: 1px solid var(--surface-border);
}

.editor-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-textarea {
  flex: 1;
  padding: 1rem;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.6;
  background: var(--surface-card);
}

.editor-preview {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  font-size: 0.875rem;
  line-height: 1.6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}
</style>

