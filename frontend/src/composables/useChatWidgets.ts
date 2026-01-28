import { ref } from 'vue'
import type { AuthMode } from '@/types'
import { useAgents } from './useAgents'
import { useSpec } from './useSpec'

const testAuthMode = ref<AuthMode>('authenticated')
const anonymousToken = ref<string | null>(null)

// Store callback for UI control events
let uiControlCallback: ((payload: any) => void) | null = null

export function useChatWidgets() {
  const { selectedAgentId, selectedAgent, loadAgents, loadVersions, selectAgent, agents } = useAgents()
  const { loadSpec } = useSpec()

  function initTestChat() {
    const container = document.getElementById('test-chat-container')
    if (!container) return

    const slug = selectedAgent.value?.slug
    if (!slug) {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-color-secondary);text-align:center;padding:2rem;">
          <i class="pi pi-play" style="font-size:2.5rem;opacity:0.4;color:var(--studio-test-color);margin-bottom:1rem;"></i>
          <h3 style="margin:0 0 0.25rem;font-size:0.9375rem;font-weight:600;color:var(--text-color);">No Agent Selected</h3>
          <p style="margin:0;font-size:0.8125rem;">Select an agent to test it</p>
        </div>
      `
      return
    }

    // Destroy existing widget
    if (window.testChatWidget) {
      window.testChatWidget.destroy()
    }

    const authConfig = testAuthMode.value === 'anonymous'
      ? {
          authStrategy: 'anonymous',
          authToken: anonymousToken.value,
          anonymousSessionEndpoint: '/api/accounts/anonymous-session/',
        }
      : { authStrategy: 'session' }

    window.testChatWidget = window.ChatWidget.createInstance({
      containerId: 'test-chat-container',
      backendUrl: window.location.origin,
      agentKey: slug,
      title: testAuthMode.value === 'anonymous' ? 'Test Agent (Anonymous)' : 'Test Agent',
      primaryColor: testAuthMode.value === 'anonymous' ? '#f97316' : '#10b981',
      showClearButton: true,
      showDebugButton: true,
      showExpandButton: false,
      showModelSelector: true,
      embedded: true,
      ...authConfig,
      apiPaths: {
        runs: '/api/agent-runtime/runs/',
        runEvents: '/api/agent-runtime/runs/{runId}/events/',
        models: '/api/agent-runtime/models/',
      },
    })
  }

  function initBuilderChat() {
    const container = document.getElementById('builder-chat-container')
    if (!container) return

    if (window.builderChatWidget) {
      window.builderChatWidget.destroy()
    }

    const config = window.STUDIO_CONFIG
    const agentId = selectedAgentId.value || config?.agentId

    window.builderChatWidget = window.ChatWidget.createInstance({
      containerId: 'builder-chat-container',
      backendUrl: window.location.origin,
      agentKey: config?.builderAgentKey || 'agent-builder',
      title: 'Agent Builder',
      primaryColor: '#3b82f6',
      showClearButton: true,
      showDebugButton: true,
      showExpandButton: false,
      showModelSelector: true,
      embedded: true,
      authStrategy: 'session',
      apiPaths: {
        runs: '/api/agent-runtime/runs/',
        runEvents: '/api/agent-runtime/runs/{runId}/events/',
        models: '/api/agent-runtime/models/',
      },
      metadata: {
        agent_id: agentId,
      },
      onUIControl: handleUIControl,
    })
  }

  // Handle UI control events from the builder agent
  async function handleUIControl(payload: any) {
    console.log('[Builder] UI Control event:', payload)

    if (!payload.action) return

    switch (payload.action) {
      case 'switch_agent':
        if (payload.agent_id) {
          // Check if agent is in our list, if not reload agents
          const existingAgent = agents.value.find(a => a.id === payload.agent_id)
          if (!existingAgent) {
            await loadAgents()
          }

          // Use selectAgent to update selectedAgentId and URL
          selectAgent(payload.agent_id)

          // Load versions and spec for the new agent
          await loadVersions()
          await loadSpec()

          // Refresh test chat to show new agent
          initTestChat()

          // Update builder's metadata without destroying the chat
          // This preserves the builder conversation!
          if (window.builderChatWidget?.updateMetadata) {
            window.builderChatWidget.updateMetadata({ agent_id: payload.agent_id })
          }
        }
        break

      case 'switch_system':
        // When system changes, we DO want to refresh the builder
        if (payload.system_id && uiControlCallback) {
          uiControlCallback(payload)
        }
        break

      case 'refresh_spec':
        // Builder updated the spec, reload it
        await loadSpec()
        break

      case 'refresh_test':
        // Builder wants to refresh the test chat
        initTestChat()
        break
    }
  }

  function setAuthMode(mode: AuthMode) {
    testAuthMode.value = mode
    initTestChat()
  }

  function refreshTestChat() {
    initTestChat()
  }

  function refreshBuilderChat() {
    initBuilderChat()
  }

  // Register external callback for system changes
  function onUIControl(callback: (payload: any) => void) {
    uiControlCallback = callback
  }

  // Note: We don't watch selectedAgentId here anymore.
  // Agent changes are handled by:
  // 1. TopBar.onAgentChange() - for dropdown selection
  // 2. handleUIControl() - for builder agent's switch_agent events
  // Both call the appropriate refresh functions directly.

  return {
    testAuthMode,
    anonymousToken,
    initTestChat,
    initBuilderChat,
    setAuthMode,
    refreshTestChat,
    refreshBuilderChat,
    onUIControl,
  }
}

