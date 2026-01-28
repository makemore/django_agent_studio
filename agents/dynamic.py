"""
DynamicAgentRuntime - An agent that loads its configuration from the database.

This allows agents to be defined and modified via the AgentDefinition model
without requiring code changes.

Supports:
- RAG (Retrieval Augmented Generation) for knowledge sources with inclusion_mode='rag'
- Conversation-scoped memory via the 'remember' tool
"""

import json
import logging
from typing import Any, Optional
from uuid import UUID

from agent_runtime_core.registry import AgentRuntime
from agent_runtime_core.interfaces import RunContext, RunResult, EventType
from agent_runtime_core.agentic_loop import run_agentic_loop
from django_agent_runtime.runtime.llm import get_llm_client_for_model, DEFAULT_MODEL
from django_agent_runtime.models import AgentDefinition
from django_agent_runtime.dynamic_tools.executor import DynamicToolExecutor

logger = logging.getLogger(__name__)


# =============================================================================
# Memory Tool Definition
# =============================================================================

MEMORY_TOOL_SCHEMA = {
    "type": "function",
    "function": {
        "name": "remember",
        "description": (
            "Store information to remember for this conversation. Use this to remember "
            "important facts about the user, their preferences, project details, or anything "
            "that would be useful to recall in future messages within this conversation. "
            "Examples: user's name, their goals, preferences, important context."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "key": {
                    "type": "string",
                    "description": (
                        "A short, descriptive key for what you're remembering "
                        "(e.g., 'user_name', 'project_goal', 'preferred_language')"
                    ),
                },
                "value": {
                    "type": "string",
                    "description": "The information to remember",
                },
            },
            "required": ["key", "value"],
        },
    },
}


class DynamicAgentRuntime(AgentRuntime):
    """
    An agent runtime that loads its configuration from an AgentDefinition.
    
    This allows agents to be created and modified via the database/API
    without requiring code changes or deployments.
    """
    
    def __init__(self, agent_definition: AgentDefinition):
        self._definition = agent_definition
        self._config: Optional[dict] = None
    
    @property
    def key(self) -> str:
        """Return the agent's slug as its key."""
        return self._definition.slug
    
    @property
    def config(self) -> dict:
        """Get the effective configuration (cached)."""
        if self._config is None:
            self._config = self._definition.get_effective_config()
        return self._config
    
    def refresh_config(self):
        """Refresh the configuration from the database."""
        self._definition.refresh_from_db()
        self._config = None
    
    async def run(self, ctx: RunContext) -> RunResult:
        """Execute the agent with the dynamic configuration and agentic loop."""
        config = self.config

        # Check if memory is enabled (default: True)
        extra_config = config.get("extra", {})
        memory_enabled = extra_config.get("memory_enabled", True)

        # Build the messages list
        messages = []

        # Add system prompt
        system_prompt = config.get("system_prompt", "")

        # Add knowledge that should always be included
        knowledge_context = self._build_knowledge_context(config)
        if knowledge_context:
            system_prompt = f"{system_prompt}\n\n{knowledge_context}"

        # Add RAG-retrieved knowledge based on user's query
        rag_context = await self._retrieve_rag_knowledge(config, ctx)
        if rag_context:
            system_prompt = f"{system_prompt}\n\n{rag_context}"

        # Add conversation memories (if memory is enabled and we have context)
        memory_store = None
        if memory_enabled:
            memory_store = await self._get_memory_store(ctx)
            if memory_store:
                memory_context = await self._recall_memories(memory_store)
                if memory_context:
                    system_prompt = f"{system_prompt}\n\n{memory_context}"

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        # Add conversation history
        messages.extend(ctx.input_messages)

        # Build tool schemas - include memory tool only if memory is enabled
        tools = self._build_tool_schemas(config)
        if memory_enabled:
            tools.append(MEMORY_TOOL_SCHEMA)

        tool_map = self._build_tool_map(config)  # Maps tool name to execution info

        # Get model: params override > agent config > default
        model = ctx.params.get("model") or config.get("model") or DEFAULT_MODEL
        model_settings = config.get("model_settings", {})

        # Get LLM client for the model (auto-detects provider)
        llm = get_llm_client_for_model(model)

        # Initialize tool executor for dynamic tools
        tool_executor = DynamicToolExecutor()

        # Create tool executor function for the agentic loop
        async def execute_tool(tool_name: str, tool_args: dict) -> str:
            # Handle the built-in remember tool
            if tool_name == "remember":
                return await self._execute_remember_tool(tool_args, memory_store)

            return await self._execute_tool(
                tool_name, tool_args, tool_map, tool_executor, ctx
            )

        try:
            # Use the shared agentic loop
            result = await run_agentic_loop(
                llm=llm,
                messages=messages,
                tools=tools if tools else None,
                execute_tool=execute_tool,
                ctx=ctx,
                model=model,
                max_iterations=15,
                **model_settings,
            )

            # Emit the final assistant message
            if result.final_content:
                await ctx.emit(EventType.ASSISTANT_MESSAGE, {"content": result.final_content})

            return RunResult(
                final_output={"response": result.final_content},
                final_messages=result.messages,
            )

        except Exception as e:
            logger.exception(f"Error in DynamicAgentRuntime for {self.key}")
            await ctx.emit(EventType.RUN_FAILED, {"error": str(e)})
            raise

    async def _get_memory_store(self, ctx: RunContext) -> Optional["ConversationMemoryStore"]:
        """
        Get the memory store for this conversation, if available.

        Returns None if we don't have the required context (user, conversation_id).
        """
        from django_agent_runtime.persistence.stores import ConversationMemoryStore

        # Need both user and conversation_id for memory
        user_id = ctx.metadata.get("user_id")
        conversation_id = ctx.conversation_id

        if not user_id or not conversation_id:
            logger.debug(
                f"Memory not available: user_id={user_id}, conversation_id={conversation_id}"
            )
            return None

        try:
            # Get the user object
            from django.contrib.auth import get_user_model
            from asgiref.sync import sync_to_async

            User = get_user_model()
            user = await sync_to_async(User.objects.get)(id=user_id)

            return ConversationMemoryStore(user=user, conversation_id=conversation_id)
        except Exception as e:
            logger.warning(f"Failed to create memory store: {e}")
            return None

    async def _recall_memories(self, memory_store: "ConversationMemoryStore") -> str:
        """
        Recall all memories for this conversation and format for the prompt.
        """
        try:
            memories = await memory_store.recall_all()
            if memories:
                logger.info(f"Recalled {len(memories)} memories for conversation")
                return memory_store.format_for_prompt(memories)
        except Exception as e:
            logger.warning(f"Failed to recall memories: {e}")
        return ""

    async def _execute_remember_tool(
        self,
        args: dict,
        memory_store: Optional["ConversationMemoryStore"],
    ) -> str:
        """Execute the remember tool to store a memory."""
        if not memory_store:
            return json.dumps({
                "error": "Memory not available for this conversation",
                "hint": "Memory requires a logged-in user and conversation context",
            })

        key = args.get("key", "").strip()
        value = args.get("value", "").strip()

        if not key:
            return json.dumps({"error": "Missing required parameter: key"})
        if not value:
            return json.dumps({"error": "Missing required parameter: value"})

        try:
            await memory_store.remember(key, value, source="agent")
            logger.info(f"Stored memory: {key}")
            return json.dumps({
                "success": True,
                "message": f"Remembered: {key}",
            })
        except Exception as e:
            logger.exception(f"Failed to store memory: {key}")
            return json.dumps({"error": str(e)})
    
    def _build_knowledge_context(self, config: dict) -> str:
        """Build context string from always-included knowledge sources."""
        parts = []
        for knowledge in config.get("knowledge", []):
            if knowledge.get("inclusion_mode") == "always":
                content = knowledge.get("content")
                if content:
                    name = knowledge.get("name", "Knowledge")
                    parts.append(f"## {name}\n{content}")
        return "\n\n".join(parts)

    async def _retrieve_rag_knowledge(self, config: dict, ctx: RunContext) -> str:
        """
        Retrieve relevant knowledge using RAG for knowledge sources with inclusion_mode='rag'.

        Args:
            config: The agent's effective configuration
            ctx: The run context containing user messages

        Returns:
            Formatted string of retrieved knowledge, or empty string if no RAG knowledge
        """
        # Check if there are any RAG knowledge sources
        rag_knowledge = [
            k for k in config.get("knowledge", [])
            if k.get("inclusion_mode") == "rag" and k.get("rag", {}).get("status") == "indexed"
        ]

        if not rag_knowledge:
            return ""

        # Get the user's query from the last user message
        user_query = ""
        for msg in reversed(ctx.input_messages):
            if msg.get("role") == "user":
                user_query = msg.get("content", "")
                break

        if not user_query:
            return ""

        try:
            from django_agent_runtime.rag import KnowledgeRetriever

            retriever = KnowledgeRetriever()
            rag_config = config.get("rag_config", {})

            # Retrieve relevant knowledge
            context = await retriever.retrieve_for_agent(
                agent_id=str(self._definition.id),
                query=user_query,
                rag_config=rag_config,
            )

            return context

        except Exception as e:
            logger.warning(f"Error retrieving RAG knowledge: {e}")
            return ""
    
    def _build_tool_schemas(self, config: dict) -> list:
        """Build OpenAI-format tool schemas from config."""
        schemas = []
        for tool in config.get("tools", []):
            # Skip the _meta field when building schema
            schema = {
                "type": tool.get("type", "function"),
                "function": tool.get("function", {}),
            }
            schemas.append(schema)
        return schemas

    def _build_tool_map(self, config: dict) -> dict:
        """Build a map of tool name to execution info."""
        tool_map = {}
        for tool in config.get("tools", []):
            func_info = tool.get("function", {})
            tool_name = func_info.get("name")
            if tool_name:
                # Get execution metadata from _meta field
                meta = tool.get("_meta", {})
                tool_map[tool_name] = {
                    "function_path": meta.get("function_path"),
                    "tool_id": meta.get("tool_id"),
                    "is_dynamic": meta.get("is_dynamic", False),
                }
        return tool_map

    async def _execute_tool(
        self,
        tool_name: str,
        tool_args: dict,
        tool_map: dict,
        executor: "DynamicToolExecutor",
        ctx: RunContext,
    ) -> str:
        """Execute a tool and return its result."""
        tool_info = tool_map.get(tool_name, {})
        function_path = tool_info.get("function_path")

        if not function_path:
            return json.dumps({"error": f"Tool '{tool_name}' has no function_path configured"})

        try:
            # Get user_id from context metadata if available
            user_id = ctx.metadata.get("user_id")

            # Execute the tool
            result = await executor.execute(
                function_path=function_path,
                arguments=tool_args,
                agent_run_id=ctx.run_id,
                user_id=user_id,
                tool_id=tool_info.get("tool_id"),
            )

            # Convert result to string if needed
            if isinstance(result, str):
                return result
            return json.dumps(result)

        except Exception as e:
            logger.exception(f"Error executing tool {tool_name}")
            return json.dumps({"error": str(e)})

