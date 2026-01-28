# How to Write Prompts for the Agent Builder

This guide teaches you (an AI agent) how to write effective prompts that will instruct our Agent Builder to create the right agent architecture for any given requirement.

## What the Agent Builder Can Create

The Agent Builder is a conversational AI that creates and configures AI agents through natural language. When you give it a prompt, it will:

1. **Create individual agents** with system prompts, tools, and knowledge
2. **Design multi-agent systems** where agents collaborate and delegate
3. **Connect agents to existing code** by discovering functions in the codebase
4. **Configure how agents communicate** (delegation vs handoff, context sharing)

---

## Core Concepts to Include in Your Prompts

### 1. Agent Purpose & Personality

Tell the builder what the agent should do and how it should behave:

```
"Create an agent called 'Support Triage' that greets customers warmly, 
identifies their issue type, and routes them to the right specialist."
```

### 2. Multi-Agent Patterns

When the task is complex, describe the team structure:

| Pattern | When to Use | How to Describe |
|---------|-------------|-----------------|
| **Router/Triage** | One entry point routes to specialists | "Create a triage agent that delegates to specialists" |
| **Specialist Team** | Different experts for different domains | "Create billing, technical, and shipping specialists" |
| **Supervisor** | One agent oversees others | "Create a supervisor that coordinates the team" |
| **Pipeline** | Sequential processing | "First agent gathers info, second agent processes it" |

### 3. Delegation Modes

Specify how agents should hand off work:

- **Delegate**: "The triage agent should get answers from specialists and relay them back"
- **Handoff**: "Transfer the customer completely to the specialist"

### 4. Context Sharing

Specify what information flows between agents:

- **Message only**: "Just pass the specific task to the sub-agent"
- **Summary**: "Give the sub-agent a brief context of the conversation"  
- **Full history**: "The sub-agent needs to see the entire conversation"

---

## Prompt Templates

### Template 1: Single Agent with Tools

```
Create an agent called "[NAME]" that [PURPOSE].

It should:
- [Behavior 1]
- [Behavior 2]

It needs access to:
- [Tool/capability 1]
- [Tool/capability 2]

Personality: [Tone and style]
```

### Template 2: Multi-Agent System

```
Create a [SYSTEM NAME] system with the following agents:

**Entry Point: [TRIAGE AGENT NAME]**
- Purpose: [What it does first]
- Routes to specialists based on: [Criteria]

**Specialist: [SPECIALIST 1 NAME]**
- Handles: [Domain]
- Delegation mode: [delegate/handoff]
- Context needed: [message_only/summary/full]

**Specialist: [SPECIALIST 2 NAME]**
- Handles: [Domain]
- Delegation mode: [delegate/handoff]
- Context needed: [message_only/summary/full]

When a customer [scenario], the flow should be:
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

### Template 3: Agent with Codebase Integration

```
Create an agent that can [PURPOSE].

Scan the codebase for functions that:
- [Capability 1]
- [Capability 2]

Add these as tools so the agent can [what it enables].
```

---

## Example Prompts

### Example 1: Customer Support System

```
Create a Customer Support system with these agents:

**Entry Point: Support Triage**
- Greets customers and identifies their issue
- Routes to the right specialist
- Handles general questions directly

**Specialist: Billing Expert**
- Handles refunds, payments, invoices
- Delegation mode: delegate (triage stays in control)
- Context: message_only (just the billing question)

**Specialist: Technical Support**  
- Handles bugs, how-to questions, troubleshooting
- Delegation mode: handoff (takes over completely)
- Context: full (needs to see what customer already tried)

When a customer asks about a refund, triage should delegate to Billing Expert 
and relay the answer. When a customer has a technical issue, triage should 
hand off completely to Technical Support.
```

### Example 2: Sales Pipeline

```
Create a Sales Pipeline system:

**Entry Point: Lead Qualifier**
- Asks discovery questions
- Scores lead quality
- Routes qualified leads to specialists

**Specialist: Product Expert**
- Deep product knowledge
- Handles technical questions
- Delegation mode: delegate
- Context: summary

**Specialist: Closer**
- Handles pricing, objections, next steps
- Delegation mode: handoff
- Context: full (needs full conversation history)

Flow: Qualifier → Product Expert (for questions) → Closer (when ready)
```

---

## Key Decisions to Specify

When writing your prompt, make sure to address these decisions:

### 1. Entry Point
"Which agent receives the initial request?"

### 2. Routing Logic
"How does the entry agent decide where to route?"

### 3. Delegation vs Handoff
- **Delegate** = Sub-agent answers, control returns to parent
- **Handoff** = Sub-agent takes over completely

### 4. Context Passing
- **message_only** = Clean isolation, sub-agent only sees the task
- **summary** = Brief context, efficient but may lose nuance
- **full** = Complete history, best for complex conversations

### 5. Tools Needed
"What actions should each agent be able to take?"

### 6. Knowledge Sources
"What information should each agent have access to?"

---

## What NOT to Include

The Agent Builder handles these automatically—don't specify:

- Technical implementation details (models, APIs, code structure)
- Database schemas or storage
- Authentication or permissions
- Deployment configuration
- Specific LLM model names (unless you have a preference)

---

## Combining with Functional Specs

When you have a functional specification, transform it into a builder prompt by:

1. **Extract the user journeys** → These become agent flows
2. **Identify distinct responsibilities** → These become separate agents
3. **Map decision points** → These become routing logic
4. **List required actions** → These become tools
5. **Note information needs** → These become knowledge sources

### Transformation Example

**Functional Spec Says:**
> "Users can request refunds. The system should verify the order, check refund eligibility, process the refund, and send confirmation."

**Your Prompt Should Say:**
```
Create a Refund Processing system:

**Entry Point: Refund Handler**
- Receives refund requests
- Verifies order exists
- Checks eligibility rules
- Delegates to processor

**Specialist: Refund Processor**
- Processes the actual refund
- Sends confirmation
- Delegation mode: delegate
- Context: message_only (just needs order ID and amount)

The handler should verify eligibility before delegating. If not eligible,
it should explain why directly without involving the processor.
```

---

## Quick Reference: Magic Phrases

Use these phrases to trigger specific builder behaviors:

| Phrase | What It Does |
|--------|--------------|
| "Create a system with..." | Triggers multi-agent architecture |
| "Entry point agent" | Designates the first agent in a flow |
| "Delegate to" | Creates sub-agent with DELEGATE mode |
| "Hand off to" | Creates sub-agent with HANDOFF mode |
| "Scan the codebase for" | Triggers tool discovery |
| "Add knowledge about" | Adds context/knowledge to agent |
| "When [scenario], the flow should..." | Defines routing logic |

---

## Summary

A good prompt for the Agent Builder:

1. ✅ Names each agent and its purpose
2. ✅ Specifies the entry point
3. ✅ Describes routing/delegation logic
4. ✅ Chooses delegate vs handoff for each sub-agent
5. ✅ Specifies context sharing needs
6. ✅ Lists tools or capabilities needed
7. ✅ Describes the user journey or flow

The builder will handle all technical implementation—your job is to clearly describe **what** the system should do and **how agents should collaborate**.


