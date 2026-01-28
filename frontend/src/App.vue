<script setup lang="ts">
import { onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import TopBar from '@/components/TopBar.vue'
import SpecPane from '@/components/SpecPane.vue'
import BuilderPane from '@/components/BuilderPane.vue'
import TestPane from '@/components/TestPane.vue'
import SchemaModal from '@/components/SchemaModal.vue'
import SpecDocsModal from '@/components/SpecDocsModal.vue'
import SystemsModal from '@/components/SystemsModal.vue'
import { useAgents } from '@/composables/useAgents'
import { useSpec } from '@/composables/useSpec'
import { useSystems } from '@/composables/useSystems'
import { useChatWidgets } from '@/composables/useChatWidgets'

const confirm = useConfirm()
const toast = useToast()

const { loadAgents, selectedAgentId } = useAgents()
const { loadSpec } = useSpec()
const { loadSystems } = useSystems()
const { initTestChat, initBuilderChat } = useChatWidgets()

// Expose confirm and toast globally for composables
window.$confirm = confirm
window.$toast = toast

onMounted(async () => {
  // Initialize from config
  const config = window.STUDIO_CONFIG
  if (config?.agentId) {
    selectedAgentId.value = config.agentId
  }

  // Load initial data
  await Promise.all([
    loadAgents(),
    loadSystems(),
  ])

  // Load spec if agent selected
  if (selectedAgentId.value) {
    await loadSpec()
  }

  // Initialize chat widgets after a short delay to ensure DOM is ready
  setTimeout(() => {
    initTestChat()
    initBuilderChat()
  }, 100)
})
</script>

<template>
  <div class="studio-layout">
    <Toast position="top-right" />
    <ConfirmDialog />

    <TopBar />

    <Splitter class="studio-panes" :gutterSize="4">
      <SplitterPanel :size="30" :minSize="20">
        <SpecPane />
      </SplitterPanel>
      <SplitterPanel :size="35" :minSize="25">
        <BuilderPane />
      </SplitterPanel>
      <SplitterPanel :size="35" :minSize="25">
        <TestPane />
      </SplitterPanel>
    </Splitter>

    <!-- Modals -->
    <SchemaModal />
    <SpecDocsModal />
    <SystemsModal />
  </div>
</template>

<style>
.studio-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-100);
}

.studio-panes {
  flex: 1;
  overflow: hidden;
  border: none !important;
  background: var(--surface-100) !important;
}

.studio-panes > .p-splitter-panel {
  overflow: hidden;
}

.studio-panes .p-splitter-gutter {
  background: var(--surface-200) !important;
  transition: background 0.15s ease;
}

.studio-panes .p-splitter-gutter:hover {
  background: var(--primary-400) !important;
}
</style>

