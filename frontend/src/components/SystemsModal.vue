<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useSystems } from '@/composables/useSystems'
import { useAgents } from '@/composables/useAgents'

const confirm = useConfirm()
const toast = useToast()

const { agents } = useAgents()
const {
  systems,
  modalOpen,
  loading,
  expandedSystemId,
  loadSystems,
  createSystem,
  deleteSystem,
  publishSystem,
  addMember,
  removeMember,
  closeModal,
  toggleExpanded,
} = useSystems()

const newSystemName = ref('')
const newSystemSlug = ref('')
const newSystemEntryAgent = ref('')

const agentOptions = computed(() => [
  { label: 'Entry agent (optional)', value: '' },
  ...agents.value.map(a => ({ label: a.name, value: a.id }))
])

async function handleCreate() {
  if (!newSystemName.value || !newSystemSlug.value) return
  try {
    await createSystem(newSystemName.value, newSystemSlug.value, newSystemEntryAgent.value || undefined)
    toast.add({ severity: 'success', summary: 'Created', detail: 'System created successfully', life: 2000 })
    newSystemName.value = ''
    newSystemSlug.value = ''
    newSystemEntryAgent.value = ''
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

function handleDelete(systemId: string, systemName: string) {
  confirm.require({
    message: `Are you sure you want to delete "${systemName}"?`,
    header: 'Delete System',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deleteSystem(systemId)
      toast.add({ severity: 'success', summary: 'Deleted', detail: 'System deleted', life: 2000 })
    }
  })
}

async function handleAddMember(systemId: string) {
  const agentId = prompt('Enter agent ID to add:')
  if (!agentId) return
  try {
    await addMember(systemId, agentId)
    toast.add({ severity: 'success', summary: 'Added', detail: 'Member added', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

async function handleRemoveMember(systemId: string, memberId: string) {
  try {
    await removeMember(systemId, memberId)
    toast.add({ severity: 'success', summary: 'Removed', detail: 'Member removed', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

async function handlePublish(systemId: string) {
  try {
    await publishSystem(systemId)
    toast.add({ severity: 'success', summary: 'Published', detail: 'System published', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

function generateSlug() {
  newSystemSlug.value = newSystemName.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
</script>

<template>
  <Dialog
    v-model:visible="modalOpen"
    modal
    :style="{ width: '90vw', maxWidth: '750px' }"
    @show="loadSystems"
  >
    <template #header>
      <div class="flex align-items-center gap-2">
        <i class="pi pi-sitemap text-xl"></i>
        <div>
          <span class="font-semibold text-lg">Multi-Agent Systems</span>
          <p class="text-sm text-color-secondary mt-1 mb-0">Manage agent systems and their members</p>
        </div>
      </div>
    </template>

    <div class="systems-content">
      <!-- Create New System -->
      <div class="create-form surface-ground border-round p-3 mb-3">
        <div class="flex gap-2 flex-wrap">
          <InputText
            v-model="newSystemName"
            @input="generateSlug"
            placeholder="System name"
            class="flex-1"
          />
          <InputText
            v-model="newSystemSlug"
            placeholder="system-slug"
            class="flex-1"
          />
          <Dropdown
            v-model="newSystemEntryAgent"
            :options="agentOptions"
            optionLabel="label"
            optionValue="value"
            class="w-12rem"
          />
          <Button
            icon="pi pi-plus"
            label="Create"
            :disabled="!newSystemName || !newSystemSlug"
            @click="handleCreate"
          />
        </div>
      </div>

      <!-- Systems List -->
      <div class="systems-list">
        <div v-if="loading" class="flex justify-content-center p-4">
          <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>
        <div v-else-if="systems.length === 0" class="p-4 text-center text-color-secondary">
          No systems yet. Create one above.
        </div>
        <div v-else v-for="system in systems" :key="system.id" class="system-card surface-border border-1 border-round mb-2">
          <div class="system-header flex align-items-center justify-content-between p-3 cursor-pointer" @click="toggleExpanded(system.id)">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-sitemap text-primary"></i>
              <div>
                <div class="font-semibold">{{ system.name }}</div>
                <div class="text-sm text-color-secondary font-mono">{{ system.slug }}</div>
              </div>
            </div>
            <div class="flex align-items-center gap-2">
              <Tag v-if="system.entry_agent" :value="'Entry: ' + (system.entry_agent.name || 'Set')" severity="info" />
              <Button
                label="Publish"
                text
                size="small"
                @click.stop="handlePublish(system.id)"
              />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                size="small"
                @click.stop="handleDelete(system.id, system.name)"
              />
              <i :class="expandedSystemId === system.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-color-secondary"></i>
            </div>
          </div>

          <div v-if="expandedSystemId === system.id" class="system-details p-3 surface-ground border-top-1 surface-border">
            <div class="flex align-items-center justify-content-between mb-2">
              <span class="font-semibold">Members</span>
              <Button
                icon="pi pi-plus"
                label="Add"
                text
                size="small"
                @click="handleAddMember(system.id)"
              />
            </div>
            <div v-if="!system.members || system.members.length === 0" class="text-color-secondary text-sm">
              No members yet
            </div>
            <div v-else class="flex flex-column gap-1">
              <div v-for="member in system.members" :key="member.id" class="flex align-items-center justify-content-between p-2 surface-card border-round">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-user"></i>
                  <span>{{ member.agent?.name || member.id }}</span>
                </div>
                <Button
                  icon="pi pi-times"
                  text
                  severity="secondary"
                  size="small"
                  @click="handleRemoveMember(system.id, member.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.systems-content {
  min-height: 300px;
}

.systems-list {
  max-height: 400px;
  overflow-y: auto;
}

.system-header:hover {
  background: var(--surface-hover);
}
</style>

