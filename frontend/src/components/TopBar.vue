<script setup lang="ts">
import { computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useAgents } from '@/composables/useAgents'
import { useSystems } from '@/composables/useSystems'
import { useSchema } from '@/composables/useSchema'
import { useSpec } from '@/composables/useSpec'
import { useChatWidgets } from '@/composables/useChatWidgets'
import { useSpecDocs } from '@/composables/useSpecDocs'

const confirm = useConfirm()

const {
  agents,
  versions,
  selectedAgentId,
  selectedVersionId,
  selectedAgent,
  isActiveVersion,
  loadAgents,
  loadVersions,
  createAgent,
  deleteAgent: doDeleteAgent,
  activateVersion,
  selectAgent,
} = useAgents()

const { systems, selectedSystemId, openModal: openSystemsModal } = useSystems()
const { openSchema } = useSchema()
const { loadSpec } = useSpec()
const { refreshTestChat, refreshBuilderChat } = useChatWidgets()
const { openModal: openSpecDocs } = useSpecDocs()

// Transform agents for Dropdown
const agentOptions = computed(() =>
  agents.value.map(a => ({
    label: `${a.icon || '🤖'} ${a.name}`,
    value: a.id
  }))
)

const versionOptions = computed(() =>
  versions.value.map(v => ({
    label: `v${v.version}${v.is_active ? ' ●' : ''}`,
    value: v.id
  }))
)

const systemOptions = computed(() => [
  { label: 'No system', value: '' },
  ...systems.value.map(s => ({ label: `🔗 ${s.name}`, value: s.id }))
])

async function onAgentChange() {
  selectAgent(selectedAgentId.value)
  await loadVersions()
  await loadSpec()
  refreshTestChat()
  // Don't refresh builder chat - just update its metadata
  // This preserves the builder conversation when switching agents
  if (window.builderChatWidget?.updateMetadata) {
    window.builderChatWidget.updateMetadata({ agent_id: selectedAgentId.value })
  }
}

async function onVersionChange() {
  refreshTestChat()
}

async function handleCreateAgent() {
  const name = prompt('Enter agent name:')
  if (!name) return
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const agent = await createAgent(name, slug)
  selectedAgentId.value = agent.id
  await onAgentChange()
}

function handleDeleteAgent() {
  const agent = selectedAgent.value
  if (!agent) return

  confirm.require({
    message: `Are you sure you want to delete "${agent.name}"? This action cannot be undone.`,
    header: 'Delete Agent',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await doDeleteAgent(agent.id)
      refreshTestChat()
      refreshBuilderChat()
    }
  })
}
</script>

<template>
  <div class="studio-topbar">
    <div class="topbar-left">
      <!-- Agent Selector -->
      <div class="topbar-group">
        <Dropdown
          v-model="selectedAgentId"
          :options="agentOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select an agent..."
          @change="onAgentChange"
          class="w-15rem"
        />
        <Button
          icon="pi pi-plus"
          label="New"
          severity="success"
          size="small"
          @click="handleCreateAgent"
          v-tooltip.bottom="'Create new agent'"
        />
        <Button
          v-if="selectedAgentId"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          text
          @click="handleDeleteAgent"
          v-tooltip.bottom="'Delete agent'"
        />
      </div>

      <!-- Version Selector -->
      <template v-if="selectedAgentId && versions.length > 0">
        <div class="topbar-divider"></div>
        <div class="topbar-group">
          <Dropdown
            v-model="selectedVersionId"
            :options="versionOptions"
            optionLabel="label"
            optionValue="value"
            @change="onVersionChange"
            class="w-8rem"
          />
          <Button
            v-if="selectedVersionId && !isActiveVersion"
            label="Activate"
            size="small"
            text
            @click="activateVersion"
          />
        </div>
      </template>

      <!-- Systems Selector -->
      <div class="topbar-divider"></div>
      <div class="topbar-group">
        <Dropdown
          v-model="selectedSystemId"
          :options="systemOptions"
          optionLabel="label"
          optionValue="value"
          class="w-10rem"
        />
        <Button
          icon="pi pi-cog"
          text
          size="small"
          @click="openSystemsModal"
          v-tooltip.bottom="'Manage systems'"
        />
      </div>
    </div>

    <div class="topbar-right">
      <Tag v-if="selectedAgent" :value="selectedAgent.slug" severity="info" />
      <Button
        icon="pi pi-folder"
        label="Specs"
        text
        size="small"
        @click="openSpecDocs"
        v-tooltip.bottom="'Spec Documents'"
      />
      <Button
        icon="pi pi-code"
        label="Schema"
        text
        size="small"
        :disabled="!selectedAgentId"
        @click="openSchema"
        v-tooltip.bottom="'Edit Schema'"
      />
      <Button
        icon="pi pi-refresh"
        text
        size="small"
        @click="loadAgents"
        v-tooltip.bottom="'Refresh'"
      />
    </div>
  </div>
</template>

<style scoped>
.studio-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--surface-0);
  border-bottom: 1px solid var(--surface-200);
  gap: 1rem;
  min-height: 52px;
}

.topbar-left, .topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.topbar-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--surface-200);
  margin: 0 0.375rem;
}

/* Make dropdowns more compact */
:deep(.p-dropdown) {
  border-color: var(--surface-200);
}

:deep(.p-dropdown:hover) {
  border-color: var(--surface-300);
}

:deep(.p-dropdown .p-dropdown-label) {
  padding: 0.4rem 0.625rem;
}
</style>

