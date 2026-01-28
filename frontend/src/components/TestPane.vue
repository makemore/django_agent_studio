<script setup lang="ts">
import { computed } from 'vue'
import { useChatWidgets } from '@/composables/useChatWidgets'

const { testAuthMode, setAuthMode, refreshTestChat } = useChatWidgets()

const authOptions = [
  { label: 'Auth', value: 'authenticated', icon: 'pi pi-user' },
  { label: 'Anon', value: 'anonymous', icon: 'pi pi-eye-slash' }
]

const selectedAuth = computed({
  get: () => testAuthMode.value,
  set: (val) => setAuthMode(val)
})
</script>

<template>
  <div class="pane">
    <div class="pane-header">
      <div class="pane-title">
        <i class="pi pi-play"></i>
        <span>Test Agent</span>
      </div>
      <div class="pane-actions">
        <SelectButton
          v-model="selectedAuth"
          :options="authOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          size="small"
        />
        <Button
          icon="pi pi-refresh"
          text
          size="small"
          @click="refreshTestChat"
          v-tooltip.bottom="'Refresh'"
        />
      </div>
    </div>
    <div class="pane-body">
      <div id="test-chat-container" class="chat-container"></div>
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
  background: linear-gradient(to right, rgba(16, 185, 129, 0.08), transparent);
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
  color: var(--studio-test-color);
  font-size: 1rem;
}

.pane-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pane-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.chat-container {
  position: absolute;
  inset: 0;
}
</style>

