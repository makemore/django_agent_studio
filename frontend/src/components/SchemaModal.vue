<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useSchema } from '@/composables/useSchema'

const toast = useToast()

const {
  schemaOpen,
  schemaLoading,
  schemaError,
  schemaSaved,
  schemaModified,
  schemaJson,
  versionJson,
  toolsJson,
  dynamicToolsJson,
  subAgentToolsJson,
  knowledgeJson,
  ragConfigJson,
  memoryJson,
  functionsJson,
  loadSchema,
  saveSchema,
  updateCurrentJson,
  closeSchema,
} = useSchema()

const activeTab = ref(0)

const tabs = [
  { key: 'full', label: 'Full Schema', ref: schemaJson },
  { key: 'version', label: 'Version', ref: versionJson },
  { key: 'tools', label: 'Tools', ref: toolsJson },
  { key: 'dynamic_tools', label: 'Dynamic Tools', ref: dynamicToolsJson },
  { key: 'sub_agents', label: 'Sub-Agents', ref: subAgentToolsJson },
  { key: 'knowledge', label: 'Knowledge', ref: knowledgeJson },
  { key: 'rag', label: 'RAG', ref: ragConfigJson },
  { key: 'memory', label: 'Memory', ref: memoryJson },
  { key: 'functions', label: 'Functions', ref: functionsJson, readonly: true },
]

const currentTab = computed(() => tabs[activeTab.value])
const currentJson = computed(() => currentTab.value?.ref.value || '')
const isReadonly = computed(() => currentTab.value?.readonly || false)

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  updateCurrentJson(target.value, currentTab.value.key)
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(currentJson.value)
    toast.add({ severity: 'success', summary: 'Copied', detail: 'Schema copied to clipboard', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to copy', life: 3000 })
  }
}

async function handleSave() {
  try {
    await saveSchema(currentTab.value.key)
    toast.add({ severity: 'success', summary: 'Saved', detail: 'Schema saved successfully', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}
</script>

<template>
  <Dialog
    v-model:visible="schemaOpen"
    modal
    header="Agent Schema Editor"
    :style="{ width: '90vw', maxWidth: '1000px' }"
    :contentStyle="{ padding: 0 }"
    @show="loadSchema"
  >
    <template #header>
      <div class="dialog-header">
        <div>
          <span class="font-semibold text-lg">📋 Agent Schema Editor</span>
          <p class="text-sm text-color-secondary mt-1 mb-0">View and edit the complete agent configuration</p>
        </div>
      </div>
    </template>

    <TabView v-model:activeIndex="activeTab" class="schema-tabs">
      <TabPanel v-for="tab in tabs" :key="tab.key" :header="tab.label">
        <div class="schema-editor-container">
          <textarea
            :value="tab.ref.value"
            @input="onInput"
            class="schema-textarea"
            :readonly="tab.readonly"
            spellcheck="false"
            :placeholder="tab.readonly ? 'Read-only' : 'Enter JSON...'"
          ></textarea>
        </div>
      </TabPanel>
    </TabView>

    <template #footer>
      <div class="dialog-footer">
        <div class="status">
          <i class="pi" :class="{
            'pi-exclamation-circle text-red-500': schemaError,
            'pi-check-circle text-green-500': schemaSaved && !schemaModified,
            'pi-circle-fill text-orange-500': schemaModified,
            'pi-circle text-gray-400': !schemaError && !schemaSaved && !schemaModified
          }"></i>
          <span v-if="schemaError" class="text-red-500">{{ schemaError }}</span>
          <span v-else-if="schemaSaved && !schemaModified" class="text-green-500">Saved</span>
          <span v-else-if="schemaModified" class="text-orange-500">Unsaved changes</span>
          <span v-else class="text-color-secondary">Ready</span>
        </div>
        <div class="actions">
          <Button
            icon="pi pi-refresh"
            label="Reload"
            text
            :loading="schemaLoading"
            @click="loadSchema"
          />
          <Button
            icon="pi pi-copy"
            label="Copy"
            text
            @click="handleCopy"
          />
          <Button
            icon="pi pi-save"
            label="Save"
            :disabled="!schemaModified || !!schemaError || isReadonly"
            :loading="schemaLoading"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.schema-tabs {
  height: 500px;
}

.schema-tabs :deep(.p-tabview-panels) {
  padding: 0;
  height: calc(100% - 40px);
}

.schema-tabs :deep(.p-tabview-panel) {
  height: 100%;
  padding: 0;
}

.schema-editor-container {
  height: 100%;
  display: flex;
}

.schema-textarea {
  flex: 1;
  width: 100%;
  padding: 1rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text-color);
  background: var(--surface-ground);
  border: none;
  resize: none;
  outline: none;
}

.schema-textarea:read-only {
  opacity: 0.7;
  cursor: not-allowed;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}
</style>

