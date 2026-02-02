<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  updateSystem,
  publishSystem,
  addMember,
  removeMember,
  updateMember,
  closeModal,
  toggleExpanded,
} = useSystems()

// Create form state
const newSystemName = ref('')
const newSystemSlug = ref('')
const newSystemEntryAgent = ref('')

// Edit form state
const editingSystemId = ref<string | null>(null)
const editName = ref('')
const editDescription = ref('')
const editEntryAgent = ref('')

// Add member state
const addingMemberToSystem = ref<string | null>(null)
const selectedAgentToAdd = ref('')

// Member role options
const roleOptions = [
  { label: 'Specialist', value: 'specialist' },
  { label: 'Utility', value: 'utility' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Entry Point', value: 'entry_point' },
]

const agentOptions = computed(() => [
  { label: 'Select entry agent...', value: '' },
  ...agents.value.map(a => ({ label: `${a.icon || '🤖'} ${a.name}`, value: a.id }))
])

// Get agents not already in the system for the add member dropdown
function getAvailableAgents(system: any) {
  const memberIds = new Set((system.members || []).map((m: any) => m.agent?.id))
  return agents.value.filter(a => !memberIds.has(a.id))
}

function getAvailableAgentOptions(system: any) {
  return [
    { label: 'Select agent to add...', value: '' },
    ...getAvailableAgents(system).map(a => ({ label: `${a.icon || '🤖'} ${a.name}`, value: a.id }))
  ]
}

// Get the expanded system object
const expandedSystem = computed(() => {
  if (!expandedSystemId.value) return null
  return systems.value.find(s => s.id === expandedSystemId.value)
})

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
    message: `Are you sure you want to delete "${systemName}"? The agents will NOT be deleted.`,
    header: 'Delete System',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await deleteSystem(systemId)
      toast.add({ severity: 'success', summary: 'Deleted', detail: 'System deleted', life: 2000 })
    }
  })
}

function startEditing(system: any) {
  editingSystemId.value = system.id
  editName.value = system.name
  editDescription.value = system.description || ''
  editEntryAgent.value = system.entry_agent?.id || ''
}

function cancelEditing() {
  editingSystemId.value = null
  editName.value = ''
  editDescription.value = ''
  editEntryAgent.value = ''
}

async function saveEditing(systemId: string) {
  try {
    await updateSystem(systemId, {
      name: editName.value,
      description: editDescription.value,
      entry_agent: editEntryAgent.value || undefined,
    })
    toast.add({ severity: 'success', summary: 'Updated', detail: 'System updated', life: 2000 })
    cancelEditing()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

function startAddingMember(systemId: string) {
  addingMemberToSystem.value = systemId
  selectedAgentToAdd.value = ''
}

function cancelAddingMember() {
  addingMemberToSystem.value = null
  selectedAgentToAdd.value = ''
}

async function handleAddMember(systemId: string) {
  if (!selectedAgentToAdd.value) return
  try {
    await addMember(systemId, selectedAgentToAdd.value)
    toast.add({ severity: 'success', summary: 'Added', detail: 'Member added', life: 2000 })
    cancelAddingMember()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

async function handleRemoveMember(systemId: string, memberId: string, memberName: string) {
  confirm.require({
    message: `Remove "${memberName}" from this system?`,
    header: 'Remove Member',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await removeMember(systemId, memberId)
        toast.add({ severity: 'success', summary: 'Removed', detail: 'Member removed', life: 2000 })
      } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
      }
    }
  })
}

async function handleRoleChange(systemId: string, memberId: string, newRole: string) {
  try {
    await updateMember(systemId, memberId, { role: newRole })
    toast.add({ severity: 'success', summary: 'Updated', detail: 'Role updated', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

async function handlePublish(systemId: string) {
  const version = prompt('Enter version (e.g., 1.0.0):')
  if (!version) return
  try {
    await publishSystem(systemId, version)
    toast.add({ severity: 'success', summary: 'Published', detail: `Version ${version} published`, life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 })
  }
}

function generateSlug() {
  newSystemSlug.value = newSystemName.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

// Reset edit state when modal closes
watch(modalOpen, (open) => {
  if (!open) {
    cancelEditing()
    cancelAddingMember()
  }
})
</script>

<template>
  <Dialog
    v-model:visible="modalOpen"
    modal
    :style="{ width: '90vw', maxWidth: '850px' }"
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
        <div class="text-sm font-semibold mb-2 text-color-secondary">Create New System</div>
        <div class="flex gap-2 flex-wrap align-items-end">
          <div class="flex flex-column gap-1 flex-1">
            <label class="text-xs text-color-secondary">Name</label>
            <InputText
              v-model="newSystemName"
              @input="generateSlug"
              placeholder="My Agent System"
              class="w-full"
            />
          </div>
          <div class="flex flex-column gap-1 flex-1">
            <label class="text-xs text-color-secondary">Slug</label>
            <InputText
              v-model="newSystemSlug"
              placeholder="my-agent-system"
              class="w-full font-mono"
            />
          </div>
          <div class="flex flex-column gap-1" style="min-width: 180px;">
            <label class="text-xs text-color-secondary">Entry Agent</label>
            <Dropdown
              v-model="newSystemEntryAgent"
              :options="agentOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
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
          <!-- System Header -->
          <div class="system-header flex align-items-center justify-content-between p-3 cursor-pointer" @click="toggleExpanded(system.id)">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-sitemap text-primary"></i>
              <div>
                <div class="font-semibold">{{ system.name }}</div>
                <div class="text-sm text-color-secondary font-mono">{{ system.slug }}</div>
              </div>
            </div>
            <div class="flex align-items-center gap-2">
              <Tag v-if="system.entry_agent" severity="info" class="entry-tag">
                <i class="pi pi-arrow-right mr-1"></i>
                {{ system.entry_agent.name || 'Entry Set' }}
              </Tag>
              <Tag v-if="system.members" severity="secondary">
                {{ system.members.length }} agent{{ system.members.length !== 1 ? 's' : '' }}
              </Tag>
              <Button
                icon="pi pi-upload"
                v-tooltip.top="'Publish version'"
                text
                size="small"
                @click.stop="handlePublish(system.id)"
              />
              <Button
                icon="pi pi-trash"
                text
                severity="danger"
                size="small"
                v-tooltip.top="'Delete system'"
                @click.stop="handleDelete(system.id, system.name)"
              />
              <i :class="expandedSystemId === system.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-color-secondary ml-2"></i>
            </div>
          </div>

          <!-- Expanded System Details -->
          <div v-if="expandedSystemId === system.id" class="system-details surface-ground border-top-1 surface-border">
            <!-- Edit System Section -->
            <div class="p-3 border-bottom-1 surface-border">
              <div class="flex align-items-center justify-content-between mb-2">
                <span class="font-semibold text-sm">System Settings</span>
                <Button
                  v-if="editingSystemId !== system.id"
                  icon="pi pi-pencil"
                  label="Edit"
                  text
                  size="small"
                  @click="startEditing(system)"
                />
              </div>

              <!-- View Mode -->
              <div v-if="editingSystemId !== system.id" class="grid">
                <div class="col-12 md:col-6">
                  <div class="text-xs text-color-secondary mb-1">Description</div>
                  <div class="text-sm">{{ system.description || '(No description)' }}</div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="text-xs text-color-secondary mb-1">Entry Agent</div>
                  <div class="text-sm">
                    <span v-if="system.entry_agent">{{ system.entry_agent.name }}</span>
                    <span v-else class="text-color-secondary">(Not set)</span>
                  </div>
                </div>
              </div>

              <!-- Edit Mode -->
              <div v-else class="flex flex-column gap-3">
                <div class="grid">
                  <div class="col-12 md:col-6">
                    <label class="text-xs text-color-secondary block mb-1">Name</label>
                    <InputText v-model="editName" class="w-full" />
                  </div>
                  <div class="col-12 md:col-6">
                    <label class="text-xs text-color-secondary block mb-1">Entry Agent</label>
                    <Dropdown
                      v-model="editEntryAgent"
                      :options="agentOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-xs text-color-secondary block mb-1">Description</label>
                  <Textarea v-model="editDescription" rows="2" class="w-full" />
                </div>
                <div class="flex gap-2 justify-content-end">
                  <Button label="Cancel" text size="small" @click="cancelEditing" />
                  <Button label="Save" size="small" @click="saveEditing(system.id)" />
                </div>
              </div>
            </div>

            <!-- Members Section -->
            <div class="p-3">
              <div class="flex align-items-center justify-content-between mb-2">
                <span class="font-semibold text-sm">Members</span>
                <Button
                  v-if="addingMemberToSystem !== system.id"
                  icon="pi pi-plus"
                  label="Add Agent"
                  text
                  size="small"
                  @click="startAddingMember(system.id)"
                />
              </div>

              <!-- Add Member Form -->
              <div v-if="addingMemberToSystem === system.id" class="flex gap-2 mb-3 p-2 surface-card border-round">
                <Dropdown
                  v-model="selectedAgentToAdd"
                  :options="getAvailableAgentOptions(system)"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select agent..."
                  class="flex-1"
                />
                <Button
                  icon="pi pi-check"
                  :disabled="!selectedAgentToAdd"
                  @click="handleAddMember(system.id)"
                />
                <Button
                  icon="pi pi-times"
                  text
                  severity="secondary"
                  @click="cancelAddingMember"
                />
              </div>

              <!-- Members List -->
              <div v-if="!system.members || system.members.length === 0" class="text-color-secondary text-sm p-2">
                No members yet. Add agents to this system.
              </div>
              <div v-else class="flex flex-column gap-2">
                <div
                  v-for="member in system.members"
                  :key="member.id"
                  class="member-row flex align-items-center justify-content-between p-2 surface-card border-round"
                >
                  <div class="flex align-items-center gap-2 flex-1">
                    <span class="text-lg">{{ member.agent?.icon || '🤖' }}</span>
                    <div>
                      <div class="font-medium">{{ member.agent?.name || 'Unknown Agent' }}</div>
                      <div class="text-xs text-color-secondary font-mono">{{ member.agent?.slug }}</div>
                    </div>
                  </div>
                  <div class="flex align-items-center gap-2">
                    <Dropdown
                      :modelValue="member.role || 'specialist'"
                      :options="roleOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="role-dropdown"
                      @update:modelValue="(val) => handleRoleChange(system.id, member.id, val)"
                    />
                    <Button
                      icon="pi pi-times"
                      text
                      severity="danger"
                      size="small"
                      v-tooltip.top="'Remove from system'"
                      @click="handleRemoveMember(system.id, member.id, member.agent?.name || 'this agent')"
                    />
                  </div>
                </div>
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
  max-height: 500px;
  overflow-y: auto;
}

.system-header:hover {
  background: var(--surface-hover);
}

.system-card {
  transition: box-shadow 0.15s ease;
}

.system-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.entry-tag {
  font-size: 0.75rem;
}

.member-row {
  transition: background 0.15s ease;
}

.member-row:hover {
  background: var(--surface-hover);
}

.role-dropdown {
  width: 130px;
}

:deep(.role-dropdown .p-dropdown-label) {
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
}

/* Grid utilities for PrimeVue */
.grid {
  display: flex;
  flex-wrap: wrap;
  margin: -0.5rem;
}

.col-12 {
  flex: 0 0 100%;
  padding: 0.5rem;
}

@media (min-width: 768px) {
  .md\:col-6 {
    flex: 0 0 50%;
  }
}
</style>

