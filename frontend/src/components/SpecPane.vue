<script setup lang="ts">
import { ref } from 'vue'
import { useAgents } from '@/composables/useAgents'
import { useSpec } from '@/composables/useSpec'

const { selectedAgentId, selectedAgent } = useAgents()
const {
  specContent,
  specModified,
  specSaved,
  specSaving,
  renderedSpec,
  saveSpec,
  updateSpec,
} = useSpec()

const previewMode = ref(false)
const tabOptions = [
  { label: 'Edit', value: false },
  { label: 'Preview', value: true }
]

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  updateSpec(target.value)
}
</script>

<template>
  <div class="pane">
    <div class="pane-header">
      <div class="pane-title">
        <i class="pi pi-file-edit"></i>
        <span>Spec</span>
        <Tag v-if="selectedAgent" :value="selectedAgent.name" size="small" />
      </div>
      <div class="pane-actions">
        <SelectButton
          v-model="previewMode"
          :options="tabOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          size="small"
        />
      </div>
    </div>

    <div class="pane-body">
      <!-- Empty State -->
      <div v-if="!selectedAgentId" class="empty-state">
        <i class="pi pi-file-edit empty-icon"></i>
        <h3>No Agent Selected</h3>
        <p>Select an agent to edit its spec</p>
      </div>

      <!-- Spec Editor -->
      <div v-else class="spec-editor">
        <textarea
          v-if="!previewMode"
          :value="specContent"
          @input="onInput"
          class="spec-textarea"
          placeholder="Write your agent specification here...

# Agent Purpose
Describe what this agent does...

# Capabilities
- Capability 1
- Capability 2

# Behavior Guidelines
How should the agent behave?"
        ></textarea>
        <div v-else class="spec-preview" v-html="renderedSpec"></div>
      </div>
    </div>

    <div class="pane-footer">
      <div class="status">
        <i class="pi" :class="{
          'pi-circle-fill text-orange-500': specModified,
          'pi-check-circle text-green-500': specSaved && !specModified,
          'pi-circle text-gray-400': !specModified && !specSaved
        }"></i>
        <span v-if="specModified">Unsaved changes</span>
        <span v-else-if="specSaved">Saved</span>
        <span v-else>Ready</span>
      </div>
      <div class="footer-actions">
        <span class="text-sm text-color-secondary">{{ specContent.length }} chars</span>
        <Button
          icon="pi pi-save"
          label="Save"
          size="small"
          :disabled="!specModified || specSaving"
          :loading="specSaving"
          @click="saveSpec"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-card);
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: var(--studio-pane-header-height);
  min-height: var(--studio-pane-header-height);
  background: linear-gradient(to right, rgba(139, 92, 246, 0.08), transparent);
  border-bottom: 1px solid var(--surface-border);
}

.pane-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--surface-700);
}

.pane-title i {
  color: var(--studio-spec-color);
  font-size: 1rem;
}

.pane-actions {
  display: flex;
  gap: 0.5rem;
}

.pane-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pane-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-top: 1px solid var(--surface-border);
  background: var(--surface-50);
}

.status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.4;
  color: var(--studio-spec-color);
}

.empty-state h3 {
  margin: 0 0 0.25rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-color);
}

.empty-state p {
  margin: 0;
  font-size: 0.8125rem;
}

.spec-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.spec-textarea {
  flex: 1;
  width: 100%;
  padding: 1rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text-color);
  background: var(--surface-card);
  border: none;
  resize: none;
  outline: none;
}

.spec-textarea::placeholder {
  color: var(--text-color-secondary);
  opacity: 0.5;
}

.spec-preview {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.7;
}
</style>

