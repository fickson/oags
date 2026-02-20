# Sekuire Configuration File Schema

**Version:** 0.1.1
**Status:** Draft
**Date:** 2026-02-16
**License:** Apache 2.0

This document defines the canonical schema for `sekuire.yml` (or `sekuire.yaml` / `sekuire.json`). It is the single source of truth for what goes in the file.

A `sekuire.yml` file is a unified configuration file containing agent manifest, policy, and SDK runtime settings. The file is divided into three zones with clear boundaries. Implementations MUST ignore unknown top-level keys.

---

## File Resolution Order

Tooling MUST check for configuration files in this priority order:

1. `sekuire.yml` (preferred)
2. `sekuire.yaml`
3. `sekuire.json`

The first file found is used. YAML and JSON formats are both valid. The schema is identical regardless of format.

---

## Zone 1: OAGS-Normative Manifest

These fields are defined by OAGS v0.1 Section 3 (Agent Manifest). They describe the agent's identity, capabilities, and deployment metadata.

### `spec_version` (REQUIRED)

```yaml
spec_version: "0.1"
```

The OAGS specification version this file conforms to. This is distinct from `project.version`, which tracks the agent's own release version.

### `project` (REQUIRED)

```yaml
project:
  name: string               # Agent/project name
  version: string             # Semantic version (e.g. "1.0.0")
  description?: string        # Human-readable description
  authors?: string[]          # Author identifiers
  license?: string            # SPDX license identifier
```

### `identity` (REQUIRED)

```yaml
identity:
  model: string               # Model identifier (e.g. "gpt-4o")
  system_prompt_path: string   # Relative path to system prompt file
  tools_path: string           # Relative path to tools definition file
  system_prompt_hash?: string  # Computed by tooling (BLAKE3, 64-char hex)
  tools_hash?: string          # Computed by tooling (BLAKE3, 64-char hex)
```

The `system_prompt_hash` and `tools_hash` fields are computed during the publish flow. They SHOULD NOT be set manually.

### `capabilities` (OPTIONAL)

```yaml
capabilities:
  provides?: string[]          # Capabilities this agent offers
  requires?: string[]          # Capabilities this agent needs from others
  delegates_to?:
    - agent_type: string       # Type of agent to delegate to
      capabilities: string[]   # Capabilities needed from the delegate
```

Capability names SHOULD use `namespace:resource:action` format (e.g. `google:calendar:manage`).

### `discovery` (OPTIONAL)

```yaml
discovery:
  tags?: string[]              # Freeform tags
  categories?: string[]        # Category identifiers
  search_keywords?: string[]   # Keywords for search indexing
```

### `a2a` (OPTIONAL)

```yaml
a2a:
  upstream_url: string         # A2A task endpoint
  public_base_url?: string     # Public URL for direct calls
```

### `deployment` (OPTIONAL)

```yaml
deployment:
  env?:
    - name: string
      required: boolean
      secret: boolean
      description?: string
      example?: string
      default_value?: string
  docker_image?: string        # Container image reference
  notes?: string               # Installation/deployment notes
```

---

## Zone 2: OAGS-Normative Policy

These fields are defined by OAGS v0.1 Section 4 (Policy Declaration). They declare governance constraints the agent MUST operate within. All policy fields are optional - an agent with no policy fields is valid but ungoverned.

### `permissions` (OPTIONAL)

```yaml
permissions:
  network?:
    enabled?: boolean
    require_tls?: boolean
    allowed_domains?: string[]
    blocked_domains?: string[]
  filesystem?:
    enabled?: boolean
    allowed_paths?: string[]
    blocked_paths?: string[]
    allowed_extensions?: string[]
  api?:
    enabled?: boolean
    allowed_services?:
      - service_name: string
        endpoints?: string[]
```

See OAGS v0.1 Sections 4.3-4.5 for matching semantics (domain wildcards, path patterns).

### `tools` (OPTIONAL)

```yaml
tools:
  allowed_tools?:
    - name: string
      description?: string
  blocked_tools?: string[]
```

This is the policy-level `tools` section controlling which tools the agent may invoke at runtime. It is separate from `identity.tools_path`, which points to the tool definitions file used for identity hashing.

See OAGS v0.1 Section 5.7 for tool pattern matching semantics.

### `models` (OPTIONAL)

```yaml
models:
  allowed_models?: string[]
  blocked_models?: string[]
```

Controls which LLM models the agent may use at runtime.

> **Migration note:** Prior versions of OAGS nested this under `agent.models`. The `agent` key is no longer used for policy. Use root-level `models` instead.

### `rate_limits` (OPTIONAL)

```yaml
rate_limits:
  per_agent?:
    requests_per_minute?: number
    requests_per_hour?: number
    tokens_per_minute?: number
```

### `custom_rules` (OPTIONAL)

```yaml
custom_rules:
  - id: string                 # Machine-readable identifier
    name: string               # Human-readable name
    description?: string
    enabled: boolean
    priority?: number
    scope:
      capabilities: string[]   # Which capabilities this rule applies to
      agents?: string[]        # Optional: restrict to specific agents
    conditions:
      - field: string
        operator: string       # contains, equals, greater_than, etc.
        value: unknown
        case_sensitive?: boolean
    logic: "any" | "all"       # How conditions are combined
    action: "deny" | "warn"    # What happens on match
    message: string            # Human-readable violation message
```

See OAGS v0.1 Section 4.9 for the full list of condition operators.

---

## Zone 3: SDK Extensions (Non-Normative)

These fields configure SDK runtime behavior. They are not part of the OAGS specification and are ignored by conformance checks. Implementations MAY define additional extension keys.

### `llm` (OPTIONAL)

```yaml
llm:
  provider: string             # openai, anthropic, google, ollama, custom
  model: string                # Model identifier
  api_key_env: string          # Environment variable name holding the API key
  temperature?: number
  max_tokens?: number
  streaming?: boolean
  base_url?: string            # Override endpoint (for self-hosted/proxy)
```

### `memory` (OPTIONAL)

```yaml
memory:
  type: string                 # buffer, redis, postgres, sqlite, etc.
  max_messages?: number
  config?: object              # Backend-specific configuration
```

### `compliance` (OPTIONAL)

```yaml
compliance:
  framework?: string           # hipaa, soc2, gdpr, pci-dss, none
  audit_logging?: boolean
  sensitive_data_detection?: boolean
  require_approval?: string[]  # Capabilities that need human approval
```

### `logger` (OPTIONAL)

```yaml
logger:
  api_base_url?: string        # Audit log API endpoint
  environment?: string         # e.g. "production", "staging"
  enabled?: boolean
```

### `server` (OPTIONAL)

```yaml
server:
  enabled?: boolean
  framework?: string           # express, fastapi, etc.
  port?: number
  host?: string
  auth?:
    type?: string              # signed | none (signed recommended for /chat + /webhook)
    protected_paths?: string[] # Defaults: ["/chat", "/webhook"]
```

---

## Field Naming Decisions

| Canonical Name | Rationale | Deprecated Alternatives |
|---|---|---|
| `spec_version` | Avoids ambiguity with `project.version` | `version` at root level |
| `project` | Groups agent metadata | `agent.name`, `agent.version` |
| `identity` | Dedicated section for hash inputs | Fields mixed into `agent` |
| `permissions` | Matches OAGS Section 4 and SDK enforcer code | `governance` |
| `require_tls` | Matches OAGS spec and TS SDK policy-enforcer | `tls_required` |
| `allowed_domains` / `blocked_domains` | Explicit past-tense adjective, matches OAGS | `allow` / `block` |
| `allowed_paths` / `blocked_paths` | Consistent with domain naming | `allow_read` / `block_all`, `read_only` |
| `models` at root | Avoids overloaded `agent` key | `agent.models` |
| `tools` at root (policy) | Separate concern from `identity.tools_path` | `governance.tools` |
| `blocked_tools` | Consistent with other `blocked_*` fields | `restricted_tools` |
| `rate_limits.per_agent.tokens_per_minute` | Structured under rate_limits | `safety.max_tokens_per_request` |
| `custom_rules` | Explicit, matches OAGS Section 4.9 | `safety` with ad-hoc fields |
| `llm`, `memory`, `compliance`, `logger`, `server` | Root-level SDK extensions | Nested under `agent` |

---

## Migration Table

This table maps field names from known legacy formats to the canonical schema.

| Legacy Format | Legacy Field | Canonical Field |
|---|---|---|
| CLI template | `version` (root) | `spec_version` |
| CLI template | `agent.name` | `project.name` |
| CLI template | `agent.model` | `identity.model` |
| CLI template | `agent.version` | `project.version` |
| CLI template | `agent.description` | `project.description` |
| Example (customer_support) | `version` (root) | `spec_version` |
| Example (customer_support) | `agent.name` | `project.name` |
| Example (customer_support) | `agent.model` | `identity.model` |
| Example (customer_support) | `governance.network` | `permissions.network` |
| Example (customer_support) | `governance.network.tls_required` | `permissions.network.require_tls` |
| Example (customer_support) | `governance.tools.restricted_tools` | `custom_rules` (with conditions) |
| Example (customer_support) | `governance.filesystem.read_only` | `permissions.filesystem.allowed_paths` |
| Example (customer_support) | `governance.safety.max_tokens_per_request` | `rate_limits.per_agent.tokens_per_minute` |
| Example (customer_support) | `governance.safety.max_tool_calls_per_turn` | `custom_rules` (with tool_calls_this_turn condition) |
| Example (customer_support) | `governance.safety.pii_filter` | `compliance.sensitive_data_detection` |
| OAGS v0.1.0 | `agent.models.allowed_models` | `models.allowed_models` |
| OAGS v0.1.0 | `agent.models.blocked_models` | `models.blocked_models` |
| SDK config loader | `governance` | `permissions` |
| SDK config loader | `agent.models` | `models` |

---

## Conformance

A valid `sekuire.yml` for OAGS Level 1 conformance requires at minimum:

- `spec_version`
- `project` with `name` and `version`
- `identity` with `model`, `system_prompt_path`, and `tools_path`

All other fields are optional. Unknown fields MUST be ignored by conforming implementations.
