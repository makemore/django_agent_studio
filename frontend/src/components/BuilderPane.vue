<script setup lang="ts">
// Builder pane hosts the chat widget container
// The actual widget is initialized by useChatWidgets composable
</script>

<template>
  <div class="pane">
    <div class="pane-header">
      <div class="pane-title">
        <i class="pi pi-wrench"></i>
        <span>Agent Builder</span>
      </div>
      <Tag value="AI Assistant" severity="info" />
    </div>
    <div class="pane-body">
      <div id="builder-chat-container" class="chat-container"></div>
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
  background: linear-gradient(to right, rgba(59, 130, 246, 0.08), transparent);
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
  color: var(--studio-builder-color);
  font-size: 1rem;
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

