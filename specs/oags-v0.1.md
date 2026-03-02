# Open Agent Governance Specification

**Version:** 0.1.1
**Status:** Draft
**Date:** 2026-02-16
**License:** Apache 2.0
**Author:** Claude (Opus 4.6)

---

## 1. Preamble

### 1.1 Purpose

This document defines the Open Agent Governance (OAG) specification: a set of local-first primitives for identity, policy, enforcement, audit, and verification of autonomous AI agents. Any conforming implementation - regardless of language or runtime - can produce interoperable governance artifacts.

### 1.2 Design Principles

- **Deterministic**: Same agent configuration produces the same identity, every time.
- **Runtime Enforceable**: Policies are enforced during execution, not just declared.
- **Cryptographically Verifiable**: All claims are backed by digital signatures.
- **Implementation Agnostic**: Works across programming languages and runtimes.
- **Offline Capable**: Core primitives work without network connectivity.
- **Minimal Overhead**: Low latency impact on agent operations.

### 1.3 Scope

This specification defines local-first governance primitives: identity, system prompt format, tool definition schema, policy, enforcement, audit, verification, trust headers, mutual authentication, and agent-to-agent communication types. These primitives work standalone in any runtime environment.

### 1.4 Notation

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

Unless explicitly labeled "Informative", all sections in this document are normative.

### 1.5 Terminology

- **Agent**: An autonomous AI runtime unit that processes inputs and can invoke tools.
- **SekuireID**: Content-addressable identifier derived from an agent's configuration.
- **Manifest**: Agent metadata and identity source declaration.
- **Policy**: Declarative constraints on agent runtime behavior.
- **Enforcer**: Runtime component that evaluates actions against policy.
- **Enforcement Point**: Runtime check that returns allow/deny/warn.
- **Audit Event**: Immutable record of a governed action and its policy decision.
- **Verifier**: Actor or service that validates identity, policy integrity, and audit evidence.

### 1.6 Cryptographic Primitives Summary

| Primitive | Algorithm | Output Size | Format |
|-----------|-----------|-------------|--------|
| Identity hash | BLAKE3 | 32 bytes | 64-char lowercase hex |
| Prompt hash | BLAKE3 | 32 bytes | 64-char lowercase hex |
| Tools hash | BLAKE3 | 32 bytes | 64-char lowercase hex |
| Signing key pair | Ed25519 | pub: 32 bytes, priv: 64 bytes | Lowercase hex |
| Signature | Ed25519 | 64 bytes | 128-char lowercase hex |
| Nonce | CSPRNG | 32 bytes | 64-char lowercase hex |

---

## 2. Agent Identity

### 2.1 Overview

Every agent has a deterministic, content-addressable identity called a **SekuireID**. The SekuireID is derived from the agent's model identifier, system prompt, and tool definitions. Changing any of these inputs produces a different SekuireID.

Properties:
- **Deterministic**: Same configuration always yields the same ID.
- **Content-Addressable**: ID is derived from the agent's code and prompt.
- **Verifiable**: Any third party can reproduce the ID from the same inputs.
- **Immutable**: Changing any input changes the ID.

### 2.2 SekuireID Computation Algorithm

Implementations MUST follow these steps exactly to produce a canonical SekuireID.

**Step 1: Hash the system prompt**

1. Read the system prompt file contents as UTF-8 text.
2. Trim leading and trailing whitespace from the content.
3. Compute the BLAKE3 hash of the trimmed bytes.
4. Encode as a 64-character lowercase hexadecimal string.

```
prompt_hash = hex(BLAKE3(trim(system_prompt_content)))
```

**Step 2: Hash the tools definition**

1. Read the tools file contents as UTF-8 text.
2. Parse the content as JSON.
3. Re-serialize the parsed JSON in canonical form (compact, no extra whitespace, keys in parse order).
4. Compute the BLAKE3 hash of the canonical JSON bytes.
5. Encode as a 64-character lowercase hexadecimal string.

```
tools_json = parse_json(tools_file_content)
canonical_tools = serialize_json_compact(tools_json)
tools_hash = hex(BLAKE3(canonical_tools))
```

**Step 3: Compute the SekuireID**

1. Construct the fingerprint string using the exact format:
   ```
   model:{model_identifier}|prompt:{prompt_hash}|tools:{tools_hash}
   ```
2. Compute the BLAKE3 hash of the fingerprint string bytes (UTF-8).
3. Encode as a 64-character lowercase hexadecimal string.

```
fingerprint = "model:" + model + "|prompt:" + prompt_hash + "|tools:" + tools_hash
sekuire_id = hex(BLAKE3(fingerprint))
```

**Source:** `packages/cli/src/services/auth.rs:188-253`

### 2.3 Input Canonicalization Rules

- **System prompt:** Content MUST be trimmed of leading and trailing whitespace before hashing. Interior whitespace is preserved as-is.
- **Tools definition:** Content MUST be parsed as JSON and re-serialized in compact canonical form before hashing. This ensures equivalent tool definitions produce the same hash regardless of formatting differences in the source file.
- **Model identifier:** Used as-is. No normalization is applied.

### 2.4 Output Format

A SekuireID is a 64-character lowercase hexadecimal string representing a 32-byte BLAKE3 hash.

```
Example: 8573fa8aa6712ef844b45e6a43078b12ed4ce9de26db9947db2aba595732fced
```

Implementations MUST validate that a SekuireID:
- Is exactly 64 characters long
- Contains only characters in the set `[0-9a-f]`

### 2.5 Ed25519 Key Management

Agents use Ed25519 key pairs for cryptographic signing and verification.

**Key generation:**

Implementations MUST generate Ed25519 key pairs using a cryptographically secure random number generator.

```typescript
interface KeyPair {
  publicKey: string;   // 64-char hex (32 bytes)
  privateKey: string;  // 128-char hex (64 bytes)
}
```

**Signing:**

```
signature = Ed25519_Sign(message_bytes, private_key)
```

- Input message: UTF-8 encoded bytes
- Output: 64-byte signature, encoded as 128-character lowercase hex

**Verification:**

```
valid = Ed25519_Verify(message_bytes, signature, public_key)
```

- Returns boolean

**Key format validation:**

| Key Type | Byte Length | Hex Length |
|----------|------------|-----------|
| Public key | 32 | 64 |
| Private key | 64 | 128 |
| Signature | 64 | 128 |
| Nonce | 32 | 64 |

Hex strings MAY optionally include a `0x` prefix. Implementations MUST strip the prefix before processing. Hex strings MUST have even length and contain only characters in `[0-9a-fA-F]`.

**Source:** `packages/sdks/typescript/src/crypto.ts`

### 2.6 Nonce Generation

Nonces are used in the handshake protocol (Section 11). A nonce MUST be 32 cryptographically secure random bytes, encoded as a 64-character lowercase hexadecimal string.

---

## 3. Agent Manifest

### 3.1 Overview

The agent manifest is a declarative configuration file that describes an agent's identity, capabilities, and deployment metadata. It is the input to the identity hash computation and the unit of publication to a registry.

### 3.2 File Format

The manifest MUST be stored in one of the following files, checked in this priority order:

1. `sekuire.yml` (preferred)
2. `sekuire.yaml`
3. `sekuire.json`

YAML and JSON formats are both supported. The schema is identical regardless of format.

Manifests SHOULD include a `spec_version` field to indicate which version of this specification they conform to.

### 3.3 Schema Definition

```typescript
interface Manifest {
  spec_version?: string;       // OAG spec version (e.g. "0.1")
  project: ProjectMetadata;
  identity: IdentityConfig;
  capabilities?: AgentCapabilities;
  discovery?: DiscoveryMetadata;
  a2a?: A2AConfig;
  deployment?: DeploymentConfig;
}
```

**`project` (REQUIRED)**

```typescript
interface ProjectMetadata {
  name: string;          // Agent/project name
  version: string;       // Semantic version (e.g. "1.0.0")
  description?: string;  // Human-readable description
  authors?: string[];    // List of author identifiers
  license?: string;      // SPDX license identifier
}
```

**`identity` (REQUIRED)**

```typescript
interface IdentityConfig {
  model: string;               // Model identifier (e.g. "gpt-4o")
  system_prompt_path: string;  // Relative path to system prompt file
  tools_path: string;          // Relative path to tools definition file
  system_prompt_hash?: string; // Computed BLAKE3 hash (filled by tooling)
  tools_hash?: string;         // Computed BLAKE3 hash (filled by tooling)
}
```

The `system_prompt_hash` and `tools_hash` fields are computed by tooling during the publish flow. They SHOULD NOT be set manually.

**`capabilities` (OPTIONAL)**

```typescript
interface AgentCapabilities {
  provides: string[];           // Capabilities this agent offers (e.g. "jira:tickets:create")
  requires: string[];           // Capabilities this agent needs from others
  delegates_to: DelegationTarget[];
}

interface DelegationTarget {
  agent_type: string;           // Type of agent to delegate to
  capabilities: string[];       // Capabilities needed from the delegate
}
```

**`discovery` (OPTIONAL)**

```typescript
interface DiscoveryMetadata {
  tags: string[];               // Freeform tags
  categories: string[];         // Category identifiers
  search_keywords: string[];    // Keywords for search indexing
}
```

**`a2a` (OPTIONAL)**

```typescript
interface A2AConfig {
  upstream_url: string;         // A2A task endpoint (e.g. "http://localhost:8001/a2a/tasks")
  public_base_url?: string;     // Public URL for direct calls
}
```

**`deployment` (OPTIONAL)**

```typescript
interface DeploymentConfig {
  env: EnvVarSpec[];            // Environment variables
  docker_image?: string;        // Container image reference
  notes?: string;               // Installation notes
}

interface EnvVarSpec {
  name: string;
  required: boolean;
  secret: boolean;
  description?: string;
  example?: string;
  default_value?: string;
}
```

**Source:** `packages/protocol/src/lib.rs:1-122`

### 3.4 Example Manifest

```yaml
spec_version: "0.1"

project:
  name: google-workspace-agent
  version: "1.2.0"
  description: "Manages Google Workspace resources"
  authors:
    - "engineering@example.com"
  license: MIT

identity:
  model: gpt-4o
  system_prompt_path: ./system_prompt.md
  tools_path: ./tools.json

capabilities:
  provides:
    - "google:calendar:manage"
    - "google:drive:read"
  requires: []
  delegates_to:
    - agent_type: slack-notifier
      capabilities:
        - "slack:messages:send"

discovery:
  tags:
    - productivity
    - google-workspace
  categories:
    - integrations

a2a:
  upstream_url: http://localhost:8001/a2a/tasks
  public_base_url: https://agent.example.com

deployment:
  env:
    - name: GOOGLE_SERVICE_ACCOUNT_KEY
      required: true
      secret: true
      description: "Google service account credentials JSON"
    - name: LOG_LEVEL
      required: false
      secret: false
      default_value: "info"
  docker_image: ghcr.io/example/google-workspace-agent:1.2.0
```

---

## 4. System Prompt Format

### 4.1 Overview

The system prompt is a natural language document that defines an agent's persona, behavioral instructions, capabilities, constraints, and interaction patterns. It is one of the three identity inputs used to compute the SekuireID (Section 2). Any change to the system prompt changes the agent's identity.

### 4.2 File Format

The system prompt MUST be stored as a plain text file, referenced by the `identity.system_prompt_path` field in the agent manifest (Section 3). The RECOMMENDED format is Markdown (`.md`).

Implementations MUST support the following file extensions:
- `.md` (Markdown — preferred)
- `.txt` (plain text)

The file MUST be encoded as UTF-8 without BOM.

### 4.3 Content Structure

While the internal structure of a system prompt is not strictly enforced, conforming implementations SHOULD organize the prompt using the following sections. Each section is OPTIONAL, but the overall document MUST provide sufficient context for the agent's intended behavior.

```markdown
# {Agent Name}

{Brief description of what the agent is and does.}

## Role

{The agent's persona, expertise domain, and behavioral identity.}

## Capabilities

{Enumerated list of operations the agent can perform, aligned with
the tools defined in Section 5.}

## Behavior Guidelines

{Constraints on how the agent should act: tone, confirmation requirements,
safety guardrails, escalation rules, refusal conditions.}

## Response Format

{Expected output structure: formatting conventions, length limits,
structured data expectations.}

## Security

{Security-relevant instructions: data handling, access boundaries,
input validation, rate limiting, PII handling.}

## Delegation

{If the agent participates in A2A workflows: how it receives and
returns delegated tasks, what protocols it follows.}
```

### 4.4 Normative Requirements

1. **Encoding**: The file MUST be valid UTF-8.
2. **Whitespace**: Leading and trailing whitespace MUST be trimmed before hashing (see Section 2.2, Step 1). Interior whitespace (including newlines) is preserved as-is.
3. **No Executable Content**: The system prompt MUST NOT contain executable code, template directives, or variable interpolation syntax. It is a static document.
4. **No Secrets**: The system prompt MUST NOT contain API keys, tokens, passwords, or other secret material. Secrets belong in deployment environment variables (Section 3.3, `DeploymentConfig.env`).
5. **Determinism**: The same prompt file content MUST always produce the same `system_prompt_hash`.

### 4.5 Versioning

System prompt changes produce a new SekuireID. Implementations SHOULD treat system prompt modifications as a version change and SHOULD update the `project.version` field in the manifest accordingly.

When evolving a system prompt:
- **Behavioral changes** (new capabilities, changed constraints): bump minor or major version.
- **Editorial changes** (typos, formatting): note that even editorial changes alter the SekuireID.

### 4.6 Size Limits

Implementations SHOULD support system prompts up to 100,000 bytes (after UTF-8 encoding). Implementations MAY reject prompts exceeding this limit.

### 4.7 Example

```markdown
# Google Workspace Agent

You are a specialized AI agent for managing Google Workspace documents,
specifically Google Docs. You help users create, read, update, and
organize their documents.

## Capabilities

1. **Create Documents**: Create new Google Docs with titles and content
2. **Read Documents**: Retrieve and display document content
3. **Update Documents**: Replace or modify document content
4. **List Documents**: Show documents matching search criteria

## Behavior Guidelines

- Always confirm document operations before making changes
- Handle errors gracefully and explain what went wrong
- Respect user privacy — never share document contents with unauthorized parties

## Security

- Only access documents the authenticated user has permission to access
- Never store or log sensitive document content
- Validate all input parameters before executing operations
```

---

## 5. Tool Definition Schema

### 5.1 Overview

Tools are the executable capabilities an agent exposes. The tool definition file is one of the three identity inputs used to compute the SekuireID (Section 2). It declares each tool's name, description, and input parameter schema. The file is the single source of truth for what operations an agent can perform.

### 5.2 File Format

The tool definition file MUST be stored as JSON, referenced by the `identity.tools_path` field in the agent manifest (Section 3).

The file MUST be encoded as UTF-8 without BOM.

### 5.3 Top-Level Structure

The tools file MUST be a JSON array of `ToolDefinition` objects:

```json
[
  { "name": "...", "description": "...", "parameters": { ... } },
  { "name": "...", "description": "...", "parameters": { ... } }
]
```

> **Note:** The SDK configuration loaders also support a versioned wrapper format (`{ "version": "1.0", "tools": [...] }`). For identity hashing purposes, the file content is parsed and canonicalized as-is regardless of wrapper structure.

### 5.4 ToolDefinition Schema

Each tool in the array MUST conform to the following schema:

```typescript
interface ToolDefinition {
  /** Unique tool name. MUST match ^[a-z][a-z0-9_]{0,63}$ */
  name: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** JSON Schema object describing the tool's input parameters */
  parameters: ParametersSchema;

  /** Optional: tool category for policy matching (e.g. "files", "network") */
  category?: string;

  /** Optional: governance metadata */
  compliance?: ComplianceMetadata;
}
```

### 5.5 ToolDefinition Field Requirements

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | MUST | string | Unique tool identifier. MUST match the pattern `^[a-z][a-z0-9_]{0,63}$` (lowercase alphanumeric with underscores, 1–64 characters, starting with a letter). |
| `description` | MUST | string | Human-readable description. SHOULD be a single sentence or short paragraph. MUST NOT be empty. |
| `parameters` | MUST | object | JSON Schema object describing the tool's input. See Section 5.6. |
| `category` | MAY | string | Logical grouping for policy matching. Used in category wildcard patterns (e.g., `files:*`). See Section 7.7 for pattern semantics. |
| `compliance` | MAY | object | Governance annotations. See Section 5.9. |

### 5.6 Parameters Schema

The `parameters` field MUST be a valid [JSON Schema](https://json-schema.org/) object describing the tool's input. Implementations MUST support the following subset of JSON Schema:

```typescript
interface ParametersSchema {
  /** MUST be "object" */
  type: "object";

  /** Map of parameter names to their schema definitions */
  properties: Record<string, ParameterDefinition>;

  /** Array of required parameter names */
  required?: string[];
}

interface ParameterDefinition {
  /** JSON Schema type */
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";

  /** Human-readable description of the parameter */
  description?: string;

  /** Default value */
  default?: any;

  /** Enumerated allowed values (for string or number types) */
  enum?: any[];

  /** For type "array": schema of array items */
  items?: ParameterDefinition;

  /** For type "object": nested properties */
  properties?: Record<string, ParameterDefinition>;

  /** For type "object": required nested fields */
  required?: string[];

  /** Minimum value (for number/integer) or minimum length (for string) */
  minimum?: number;
  minLength?: number;

  /** Maximum value (for number/integer) or maximum length (for string) */
  maximum?: number;
  maxLength?: number;

  /** Regex pattern (for string) */
  pattern?: string;
}
```

### 5.7 Supported JSON Schema Types

Implementations MUST support the following parameter types:

| Type | JSON Type | Description | Example |
|------|-----------|-------------|---------|
| `string` | string | UTF-8 text | `"hello"` |
| `number` | number | IEEE 754 double | `3.14` |
| `integer` | number | Whole number | `42` |
| `boolean` | boolean | True or false | `true` |
| `array` | array | Ordered list; `items` SHOULD be specified | `[1, 2, 3]` |
| `object` | object | Nested key-value structure | `{"key": "value"}` |

### 5.8 Tool Naming Conventions

Tool names serve as the primary key for policy matching (Section 7). Implementations SHOULD follow these conventions:

- Use `snake_case` (e.g., `create_document`, `read_thread`).
- Prefix with a domain when the agent spans multiple services (e.g., `google_docs_create`, `slack_send_message`).
- Category-based naming enables wildcard policy rules: a tool named `file_read` matches the category pattern `file_*` and `files:read`.

### 5.9 Compliance Metadata (OPTIONAL)

Tools MAY include governance annotations that inform policy enforcement:

```typescript
interface ComplianceMetadata {
  /** Access classification */
  level?: "public" | "internal" | "restricted" | "system";

  /** Whether execution requires explicit human approval */
  requires_approval?: boolean;

  /** Data classification tags (e.g., "pii", "financial", "health") */
  data_tags?: string[];
}
```

| Level | Description |
|-------|-------------|
| `public` | No access restrictions; safe for any caller |
| `internal` | Requires authenticated agent identity |
| `restricted` | Requires elevated permissions or approval workflow |
| `system` | Infrastructure-only; not exposed to end users or external agents |

### 5.10 Normative Requirements

1. **Uniqueness**: Tool names MUST be unique within a single tools file. Duplicate names MUST cause a validation error.
2. **Encoding**: The file MUST be valid UTF-8 and valid JSON.
3. **Canonicalization**: For identity hashing (Section 2.2, Step 2), the file is parsed as JSON and re-serialized in compact canonical form (no extra whitespace, keys in parse order). Implementations MUST NOT sort keys during canonicalization.
4. **No Executable Content**: The tools file defines schemas only. It MUST NOT contain implementation code, file paths to handlers, or runtime bindings. Implementation details belong in SDK configuration (non-normative).
5. **Determinism**: The same file content MUST always produce the same `tools_hash`.
6. **Validation**: Implementations SHOULD validate tool definitions against this schema before computing the identity hash.

### 5.11 Size Limits

- Maximum tools per file: implementations SHOULD support at least 256 tools.
- Maximum file size: implementations SHOULD support files up to 1 MB.
- Maximum parameter depth (nested objects): implementations SHOULD support at least 5 levels of nesting.

### 5.12 Relationship to Policy Enforcement

Tool names declared in this file are the identifiers matched against `allowed_tools` and `blocked_tools` in the policy (Section 6.6). A tool that exists in the definition file but is blocked by policy MUST NOT execute. A tool invocation for a name not present in the definition file MUST be rejected regardless of policy.

### 5.13 Example

```json
[
  {
    "name": "create_document",
    "description": "Create a new Google Doc with the specified title and optional content",
    "category": "docs",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "The title of the new document"
        },
        "content": {
          "type": "string",
          "description": "Initial content to add to the document"
        },
        "folder_id": {
          "type": "string",
          "description": "Google Drive folder ID to create the document in"
        }
      },
      "required": ["title"]
    }
  },
  {
    "name": "search_drive",
    "description": "Search Google Drive for files matching a query",
    "category": "drive",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query string"
        },
        "max_results": {
          "type": "integer",
          "description": "Maximum number of results to return",
          "default": 10,
          "minimum": 1,
          "maximum": 100
        },
        "file_type": {
          "type": "string",
          "description": "Filter by file type",
          "enum": ["document", "spreadsheet", "presentation", "pdf", "any"]
        }
      },
      "required": ["query"]
    },
    "compliance": {
      "level": "internal",
      "requires_approval": false,
      "data_tags": ["user_content"]
    }
  },
  {
    "name": "send_notification",
    "description": "Send a notification message to a Slack channel",
    "category": "messaging",
    "parameters": {
      "type": "object",
      "properties": {
        "channel_id": {
          "type": "string",
          "description": "The Slack channel ID"
        },
        "text": {
          "type": "string",
          "description": "The notification message text"
        },
        "thread_ts": {
          "type": "string",
          "description": "Thread timestamp to reply in a thread"
        }
      },
      "required": ["channel_id", "text"]
    }
  }
]
```

---

## 6. Policy Declaration

### 6.1 Overview

Policies define governance constraints that an agent MUST operate within. A policy declares what network, filesystem, API, tool, and model access is permitted, along with rate limits and custom rules.

Policies are evaluated locally by the SDK's policy enforcer. They can be loaded from a local configuration file or fetched from a remote API.

### 6.2 Policy Content Schema

```typescript
interface PolicyContent {
  spec_version?: string;       // OAG spec version
  permissions?: {
    network?: NetworkPermissions;
    filesystem?: FilesystemPermissions;
    api?: ApiPermissions;
  };
  tools?: {
    allowed_tools?: ToolEntry[];
    blocked_tools?: string[];
  };
  models?: {
    allowed_models?: string[];
    blocked_models?: string[];
  };
  rate_limits?: {
    per_agent?: PerAgentLimits;
  };
  custom_rules?: CustomRule[];
}
```

**Source:** `packages/sdks/typescript/src/config/loader.ts:23-63`, `packages/sdks/typescript/src/types/policy.ts`

### 6.3 Network Permissions

```typescript
interface NetworkPermissions {
  enabled?: boolean;          // Whether network access is allowed at all
  require_tls?: boolean;      // Whether HTTPS is required
  allowed_domains?: string[]; // Domain allowlist (if set, only these domains are reachable)
  blocked_domains?: string[]; // Domain blocklist (always denied)
}
```

Domain matching rules (see Section 7.5 for full semantics):
- Exact match: `"api.example.com"` matches only `api.example.com`
- Wildcard subdomain: `"*.example.com"` matches `api.example.com` and `sub.api.example.com`, and also matches the bare domain `example.com`
- Universal wildcard: `"*"` matches all domains

### 6.4 Filesystem Permissions

```typescript
interface FilesystemPermissions {
  enabled?: boolean;              // Whether filesystem access is allowed at all
  allowed_paths?: string[];       // Path allowlist
  blocked_paths?: string[];       // Path blocklist
  allowed_extensions?: string[];  // File extension allowlist (e.g. [".txt", ".json"])
}
```

Path matching rules (see Section 7.6):
- Exact match: `"/data/config.json"` matches only that path
- Prefix wildcard: `"/data/*"` matches any path starting with `/data/`
- Trailing wildcard: `"/data*"` matches any path starting with `/data`

### 6.5 API Permissions

```typescript
interface ApiPermissions {
  enabled?: boolean;
  allowed_services?: Array<{
    service_name: string;
    endpoints?: string[];
  }>;
}
```

### 6.6 Tool Permissions

```typescript
interface ToolEntry {
  name: string;          // Tool name or pattern
  description?: string;
}
```

Tool pattern matching rules (see Section 7.7 for full semantics):
- Exact match: `"file_read"` matches only `file_read`
- Category wildcard: `"files:*"` matches all tools in the `files` category
- Category subset: `"files:[read,write]"` matches `file_read` and `file_write`
- Glob pattern: `"file_*"` matches any tool starting with `file_`

### 6.7 Model Permissions

```typescript
interface ModelPermissions {
  allowed_models?: string[];  // If set, only these models can be used
  blocked_models?: string[];  // These models are always denied
}
```

### 6.8 Rate Limits

```typescript
interface PerAgentLimits {
  requests_per_minute?: number;
  requests_per_hour?: number;
  tokens_per_minute?: number;
}
```

Rate limits are enforced using a sliding window. When a limit is exceeded, the enforcer MUST deny the action with rule ID `rate_limit.exceeded`.

### 6.9 Custom Rules

Custom rules allow arbitrary governance logic beyond the built-in permission categories.

```typescript
interface CustomRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority?: number;
  scope: {
    capabilities: string[];  // Which capabilities this rule applies to
    agents?: string[];       // Optional: restrict to specific agents
  };
  conditions: RuleCondition[];
  logic: "any" | "all";     // How conditions are combined
  action: "deny" | "warn";  // What happens on match
  message: string;           // Human-readable violation message
}

interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  case_sensitive?: boolean;
}

type ConditionOperator =
  | "contains" | "not_contains"
  | "equals" | "not_equals"
  | "starts_with" | "ends_with"
  | "matches"
  | "in" | "not_in"
  | "greater_than" | "less_than";
```

**Source:** `packages/sdks/typescript/src/types/policy.ts:15-41`

### 6.10 Policy Integrity Envelope (OPTIONAL)

Implementations MAY wrap policy content in an integrity envelope for transport or storage:

```typescript
interface PolicyEnvelope {
  policy_id: string;
  version: string;
  status: string;                    // "active", "draft", "archived"
  hash: string;                      // BLAKE3 hash of canonical content
  content: PolicyContent;
  signature?: string;                // Ed25519 signature (hex)
  signing_key_id?: string;
  signing_public_key?: string;
}
```

Rules:
- `hash` MUST equal `hex(BLAKE3(JSON_canonical(content)))`.
- If `signature` is present, the verifier MUST validate the signature over the string `"{policy_id}:{version}:{hash}"`.

**Source:** `packages/sdks/typescript/src/types/policy.ts:1-13`

### 6.11 Default Behavior When Policy Is Absent

If no policy is configured:
- Implementations MAY allow all actions in development mode.
- Implementations SHOULD default-deny in production mode unless explicitly configured otherwise.
- Implementations MUST emit a warning at startup when no policy is loaded.

### 6.12 Example Policy

```yaml
spec_version: "0.1"

permissions:
  network:
    enabled: true
    require_tls: true
    allowed_domains:
      - "*.googleapis.com"
      - "api.openai.com"
    blocked_domains:
      - "*.darkweb.example"
  filesystem:
    enabled: true
    allowed_paths:
      - "/tmp/agent-workspace/*"
      - "/data/shared/*"
    blocked_paths:
      - "/etc/*"
      - "/var/log/*"
    allowed_extensions:
      - ".json"
      - ".txt"
      - ".csv"
  api:
    enabled: true
    allowed_services:
      - service_name: google-calendar
        endpoints:
          - "events.list"
          - "events.create"

tools:
  allowed_tools:
    - name: "files:[read,write]"
    - name: "http_get"
    - name: "json_parse"
  blocked_tools:
    - "shell_exec"
    - "eval"

models:
  allowed_models:
    - "gpt-4o"
    - "claude-sonnet-4-5-20250929"
  blocked_models:
    - "gpt-3.5-turbo"

rate_limits:
  per_agent:
    requests_per_minute: 60
    requests_per_hour: 1000
    tokens_per_minute: 100000

custom_rules:
  - id: no-pii-in-logs
    name: "Prevent PII in log output"
    enabled: true
    scope:
      capabilities:
        - "logging"
    conditions:
      - field: "content"
        operator: matches
        value: "\\b\\d{3}-\\d{2}-\\d{4}\\b"
    logic: any
    action: deny
    message: "Log content must not contain SSN patterns"
```

---

## 7. Enforcement Decision Contract

### 7.1 Overview

The enforcement decision contract defines the interface between policy evaluation and runtime behavior. When an agent attempts an action, the policy enforcer evaluates it against the active policy and produces a `PolicyDecision`.

### 7.2 PolicyDecision

```typescript
interface PolicyDecision {
  allowed: boolean;
  violations: PolicyViolation[];
  warnings: PolicyViolation[];
}
```

- `allowed`: `true` if the action is permitted, `false` if denied.
- `violations`: Non-empty when `allowed` is `false`. Each entry describes a rule that was violated.
- `warnings`: Advisory violations that do not block the action. Logged but not enforced. Warnings MUST NOT silently override violations.

### 7.3 PolicyViolation

```typescript
interface PolicyViolation {
  rule_id: string;
  rule_name: string;
  message: string;
  capability: string;
}
```

- `rule_id`: Machine-readable identifier (e.g. `"network.blocked"`, `"fs.not_allowed"`, `"tool.blocked"`).
- `rule_name`: Human-readable rule name.
- `message`: Explanation of why the violation occurred.
- `capability`: The enforcement category (see Section 7.4).

### 7.4 Enforcement Categories

Implementations MUST support the following enforcement categories:

| Category | Rule ID Prefix | Description |
|----------|---------------|-------------|
| Network | `network.*` | Domain access, TLS requirements |
| Filesystem | `fs.*` | Path access, extension restrictions |
| Tool | `tool.*` | Tool execution permissions |
| Model | `model.*` | LLM model selection |
| API | `api.*` | External API service access |
| Rate Limit | `rate_limit.*` | Request/token throughput limits |

**Standard rule IDs:**

| Rule ID | Trigger |
|---------|---------|
| `network.disabled` | Network access attempted when `enabled: false` |
| `network.tls_required` | Non-HTTPS request when `require_tls: true` |
| `network.blocked` | Domain matches `blocked_domains` |
| `network.not_allowed` | Domain not in `allowed_domains` |
| `network.missing` | Network permissions not configured (warning only) |
| `fs.disabled` | Filesystem access attempted when `enabled: false` |
| `fs.blocked` | Path matches `blocked_paths` |
| `fs.not_allowed` | Path not in `allowed_paths` |
| `fs.ext` | File extension not in `allowed_extensions` |
| `fs.missing` | Filesystem permissions not configured (warning only) |
| `tool.blocked` | Tool name in `blocked_tools` |
| `tool.not_allowed` | Tool name not matched by any `allowed_tools` pattern |
| `model.blocked` | Model in `blocked_models` |
| `model.not_allowed` | Model not in `allowed_models` |
| `api.disabled` | API access attempted when `enabled: false` |
| `api.not_allowed` | Service not in `allowed_services` |
| `api.missing` | API permissions not configured (warning only) |
| `rate_limit.exceeded` | Rate limit threshold exceeded |

**Source:** `packages/sdks/typescript/src/policy-enforcer.ts`

### 7.5 Domain Matching Semantics

When evaluating a domain against a pattern list:

1. If the pattern is `"*"`, it matches all domains.
2. If the pattern starts with `*.`, extract the suffix after `*.`. The pattern matches if:
   - The domain equals the suffix exactly, OR
   - The domain ends with `.{suffix}`
3. Otherwise, the pattern matches only if the domain equals the pattern exactly.

Evaluation order:
1. Check `blocked_domains` first. If the domain matches any blocked pattern, DENY.
2. If `allowed_domains` is set and the domain does not match any allowed pattern, DENY.
3. Otherwise, ALLOW.

**Source:** `packages/sdks/typescript/src/policy-enforcer.ts:239-248`

### 7.6 Path Matching Semantics

When evaluating a filesystem path against a pattern list:

1. If the pattern ends with `/*`, extract the prefix before `/*`. Match if the path starts with that prefix.
2. If the pattern ends with `*` (but not `/*`), extract the prefix before `*`. Match if the path starts with that prefix.
3. Otherwise, match only if the path equals the pattern exactly.

Evaluation order:
1. Check `blocked_paths` first. If the path matches any blocked pattern, DENY.
2. If `allowed_paths` is set and the path does not match any allowed pattern, DENY.
3. If `allowed_extensions` is set, extract the file extension. If the extension is not in the list, DENY.
4. Otherwise, ALLOW.

**Source:** `packages/sdks/typescript/src/policy-enforcer.ts:250-262`

### 7.7 Tool Pattern Matching Semantics

When evaluating a tool name against an allowed tools list:

1. **Exact match:** If the pattern equals the tool name, ALLOW.
2. **Category wildcard:** If the pattern contains `:` and the operation part is `*` (e.g. `files:*`), resolve the category prefix and match any tool starting with `{prefix}_`.
3. **Category subset:** If the pattern contains `:` and the operation part is `[op1,op2,...]` (e.g. `files:[read,write]`), match tools named `{prefix}_{op}` for each listed operation.
4. **Glob pattern:** If the pattern contains `*` (without `:`), convert to a regex by replacing `*` with `.*` and test against the tool name.

Category prefix mapping:

| Category | Prefix |
|----------|--------|
| `files` | `file` |
| `directories` | `dir` |
| `network` | `http` |
| `data` | `json` |
| `system` | `env` |

If the category is not in this map, the category string itself is used as the prefix.

Evaluation order:
1. If the tool name matches any entry in `blocked_tools`, DENY.
2. If `allowed_tools` is empty or not set, ALLOW all tools.
3. If the tool name matches any allowed pattern (using the rules above), ALLOW.
4. Otherwise, DENY.

**Source:** `packages/sdks/typescript/src/policy-enforcer.ts:74-140`

### 7.8 Enforcement Behavior

When a policy violation occurs, implementations MUST behave as follows:

- **Deny action (`action: "deny"`):** Throw a `PolicyViolationError` (or language equivalent) with the rule ID and message. The action MUST NOT proceed.
- **Warn action (`action: "warn"`):** Log the violation at warning level. The action MAY proceed.

**Development override:** When the environment variable `SEKUIRE_POLICY_DEV_OVERRIDE` is set to `"true"`, all deny actions MUST be downgraded to warnings. This allows developers to iterate without being blocked by policy during development. Implementations MUST log a warning at initialization when override mode is active. Override mode MUST still emit audit events for every overridden violation.

### 7.9 Enforcement Hooks

An OAG-compliant runtime SHOULD implement the following interception points in the agent execution loop:

1. **`pre_tool_execution`**: Check tool name and arguments against the policy before execution.
2. **`pre_network_request`**: Validate domain, protocol, and TLS requirements before outbound requests.
3. **`pre_file_access`**: Validate path, extension, and operation type before filesystem operations.
4. **`pre_model_call`**: Verify the model identifier is permitted before LLM inference.
5. **`on_policy_violation`**: Standardized error reporting. MUST emit an audit event.

**Source:** `packages/sdks/typescript/src/policy-enforcer.ts:7-24`

---

## 8. Audit Event Format

### 8.1 Overview

Agents emit structured audit events for every significant action. Events are buffered locally and submitted in batches to an audit sink (remote API endpoint, local file, or stdout).

### 8.2 EventLog Schema

```typescript
interface EventLog {
  spec_version?: string;           // OAG spec version
  event_id?: string;               // UUID v4 (assigned by sink if absent)
  sekuire_id: string;              // Agent's SekuireID
  session_id: string;              // UUID v4 session identifier
  workspace_id?: string;           // Optional workspace/scope identifier
  trace_id?: string;               // Correlation ID across delegation chains
  event_type: EventType;
  severity: Severity;
  event_timestamp: string;         // ISO 8601 UTC (e.g. "2026-02-16T14:30:00.000Z")
  event_data: Record<string, any>; // Event-specific payload
  metadata: Record<string, any>;   // SDK version, environment, etc.
}
```

**Source:** `packages/sdks/typescript/src/logger.ts:34-43`, `packages/protocol/src/lib.rs:531-541`

### 8.3 Event Types

Implementations MUST support the following event types:

| Event Type | Description |
|------------|-------------|
| `tool_execution` | An agent tool was invoked |
| `model_call` | An LLM inference call was made |
| `policy_violation` | A policy rule was violated |
| `policy_check` | A policy evaluation occurred (pass or fail) |
| `network_access` | An outbound network request was made |
| `file_access` | A filesystem read or write occurred |
| `health` | Health heartbeat signal |

### 8.4 Severity Levels

| Severity | Description |
|----------|-------------|
| `debug` | Verbose diagnostic information |
| `info` | Normal operational events |
| `warn` | Advisory conditions (e.g. policy warnings) |
| `error` | Failures requiring attention |

### 8.5 Batch Submission Format

Events SHOULD be submitted in batches for efficiency. The batch request body:

```typescript
interface LogEventRequest {
  events: EventLog[];  // Array of events, max 100 per batch
}
```

The batch response:

```typescript
interface LogEventResponse {
  success: boolean;
  events_logged: number;
  errors: string[];
}
```

### 8.6 Event Signing (OPTIONAL)

Implementations MAY sign audit events to prevent tampering:

```
canonical = JSON_canonical(event_without_signature_field)
hash = BLAKE3(canonical)
signature = Ed25519_Sign(hash, agent_private_key)
```

To verify:

```
canonical = JSON_canonical(event_without_signature_field)
hash = BLAKE3(canonical)
valid = Ed25519_Verify(hash, signature, agent_public_key)
```

### 8.7 Event Chaining (OPTIONAL)

For tamper-evident audit trails, implementations MAY chain events using hash links:

```typescript
interface ChainedEventLog extends EventLog {
  prev_event_hash?: string;   // BLAKE3 hash of previous event's canonical form
  evidence_hash?: string;     // BLAKE3 hash of related payload (e.g. tool output)
  signature?: string;         // Ed25519 signature of this event
}
```

Each event includes the hash of the previous event. This creates a Merkle chain where:
- Modifying any event breaks the chain
- Reordering events breaks the chain
- Detecting tampering is O(1) per event

### 8.8 Health Heartbeat

Agents SHOULD emit periodic health heartbeats (RECOMMENDED interval: 30 seconds).

```typescript
interface AgentHealthRequest {
  sekuire_id: string;
  status: string;          // "active", "idle", "error"
  session_id: string;
  sdk_version: string;
  environment: string;
  metadata: Record<string, any>;
}
```

### 8.9 Local Sink Behavior

When no remote API endpoint is configured (or the endpoint is unreachable), implementations SHOULD fall back to local output:

1. Write events to stdout as newline-delimited JSON.
2. Optionally write to a local file.

Events MUST NOT be silently dropped. Implementations SHOULD buffer events and retry submission when connectivity is restored, or log a warning indicating the number of events lost.

### 8.10 Sensitive Data Handling

Audit events MUST NOT contain raw credentials, secrets, or API keys. Implementations SHOULD apply the following sanitization before logging:

- **Credentials**: Replace API keys, passwords, and tokens with `"[REDACTED]"`
- **PII**: Mask email addresses, phone numbers, and government IDs when the policy requires it
- **Large payloads**: Truncate to a reasonable size (RECOMMENDED: 1KB) with a `"[truncated]"` marker

**Source:** `packages/sdks/typescript/src/logger.ts:54-283`

---

## 9. Verification Result Schema

### 9.1 Overview

Verification is a multi-stage process that evaluates an agent's security posture and compliance. The output is a `VerificationReport` that summarizes findings, scores, and pass/fail status.

### 9.2 VerificationReport

```typescript
interface VerificationReport {
  sekuire_id: string;
  timestamp: string;            // ISO 8601
  version: string;              // Report format version (currently "1.0")

  // Scores
  security_score: number;       // 0-100, starts at 100, deductions applied
  compliance_score: number;     // 0-100, percentage of passed compliance checks
  passed: boolean;

  // Summary
  issues_summary: IssuesSummary;
  recommendations: string[];
}
```

**Source:** `services/core/src/verification/report.rs:12-31`

### 9.3 IssuesSummary

```typescript
interface IssuesSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total_vulnerabilities: number;
}
```

**Source:** `services/core/src/verification/report.rs:33-41`

### 9.4 SecurityIssue

```typescript
interface SecurityIssue {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  file_path?: string;
  line_number?: number;
  recommendation: string;
}
```

**Source:** `services/core/src/verification/models.rs:196-205`

### 9.5 Vulnerability

```typescript
interface Vulnerability {
  cve_id: string;
  severity: Severity;
  package_name: string;
  affected_version: string;
  fixed_version?: string;
  description: string;
}
```

**Source:** `services/core/src/verification/models.rs:208-216`

### 9.6 Severity and Score Impact

| Severity | Score Deduction |
|----------|----------------|
| `critical` | -25 points |
| `high` | -15 points |
| `medium` | -10 points |
| `low` | -5 points |
| `info` | 0 points |

The security score starts at 100 and each issue's deduction is subtracted. The final score is clamped to the range [0, 100].

**Source:** `services/core/src/verification/models.rs:183-193`

### 9.7 Pass Criteria

An agent passes verification when ALL of the following are true:

1. `security_score >= 70`
2. `compliance_score >= 60`
3. Zero critical issues (`issues_summary.critical == 0`)
4. Agent has a `get_verification_status` tool declared

**Source:** `services/core/src/verification/scorer.rs:92-111`

### 9.8 Risk Level Calculation

```
if critical_issues > 0:                "critical"
if security < 50 or compliance < 40:   "high"
if security < 70 or compliance < 60:   "medium"
otherwise:                             "low"
```

**Source:** `services/core/src/verification/scorer.rs:70-89`

### 9.9 Compliance Frameworks

The verification engine supports the following compliance frameworks. Each framework defines a set of checks against the agent manifest and code analysis results.

| Framework | Key Checks |
|-----------|------------|
| HIPAA | Audit logging, encryption, access controls, data privacy |
| SOC2 | Access controls, monitoring, encryption, vulnerability management |
| GDPR | Data privacy, right to erasure, consent, data minimization |
| PCI-DSS | Network security, encryption, access controls, vulnerability management |

The compliance score is computed as: `(passed_checks / total_checks) * 100`.

### 9.10 VerificationStatus

```typescript
type VerificationStatus = "unverified" | "pending" | "verified" | "suspended";
```

| Status | Meaning |
|--------|---------|
| `unverified` | No verification has been performed |
| `pending` | Verification is in progress |
| `verified` | Agent passed all verification criteria |
| `suspended` | Verification was revoked (e.g. due to a dispute) |

**Source:** `packages/protocol/src/lib.rs:207-219`

### 9.11 Local Verification

A local verifier MUST be able to:

1. Recompute `sekuire_id` from manifest inputs using the algorithm in Section 2.2.
2. Validate policy `hash` and optional `signature` per Section 6.10.
3. Validate audit event schema and required fields per Section 8.2.

---

## 10. Trust Protocol Headers

### 10.1 Overview

Trust protocol headers are HTTP headers that convey an agent's identity, reputation, and verification status across service boundaries. They are protocol-agnostic and work with MCP, A2A, REST, or any HTTP-based transport.

### 10.2 Header Definitions

| Header | Type | Description |
|--------|------|-------------|
| `X-Sekuire-Agent-ID` | string | The agent's SekuireID (64-char hex) |
| `X-Sekuire-Reputation` | integer | Reputation score, 0-100 |
| `X-Sekuire-Credentials` | string | Comma-separated list of badges (e.g. `"verified,hipaa,soc2"`) |
| `X-Sekuire-Verification-Status` | string | One of: `unverified`, `pending`, `verified`, `suspended` |
| `X-Sekuire-Risk-Level` | string | One of: `low`, `medium`, `high`, `unknown` |

### 10.3 Header Generation

Implementations SHOULD add trust headers to outbound HTTP responses when agent identity information is available.

```
X-Sekuire-Agent-ID: 8573fa8aa6712ef844b45e6a43078b12ed4ce9de26db9947db2aba595732fced
X-Sekuire-Reputation: 85
X-Sekuire-Credentials: verified,hipaa
X-Sekuire-Verification-Status: verified
X-Sekuire-Risk-Level: low
```

### 10.4 Header Extraction

When receiving requests with trust headers, implementations SHOULD extract and validate the headers. If the `X-Sekuire-Agent-ID` header is missing, the request SHOULD be treated as coming from an unidentified agent. Missing optional headers default to:

- `X-Sekuire-Verification-Status`: `"unverified"`
- `X-Sekuire-Risk-Level`: `"unknown"`
- `X-Sekuire-Credentials`: empty
- `X-Sekuire-Reputation`: not assumed

**Source:** `services/core/src/headers.rs`

---

## 11. Handshake Protocol

### 11.1 Overview

The handshake protocol provides mutual authentication between a client and an agent using Ed25519 signatures. It is a three-step challenge-response flow.

### 11.2 Protocol Flow

```
Client                              Agent
  |                                   |
  |--- HandshakeHello --------------->|   Step 1: Client sends nonce
  |                                   |
  |<-- HandshakeWelcome --------------|   Step 2: Agent proves identity
  |                                   |
  |--- HandshakeAuth ---------------->|   Step 3: Client proves identity
  |                                   |
```

### 11.3 Step 1: HandshakeHello

The client generates a random nonce and sends it to the agent.

```typescript
interface HandshakeHello {
  client_nonce: string;   // 64-char hex (32 random bytes)
}
```

### 11.4 Step 2: HandshakeWelcome

The agent responds with:
1. Its SekuireID
2. A fresh agent nonce
3. An Ed25519 signature of the client's nonce (proving the agent holds the private key)
4. A list of credential JWTs

```typescript
interface HandshakeWelcome {
  agent_id: string;          // SekuireID of the agent
  agent_nonce: string;       // 64-char hex (32 random bytes)
  signature_c: string;       // Ed25519 signature of client_nonce using agent's private key
  agent_public_key: string;  // Agent Ed25519 public key (32-byte hex)
  credentials: string[];     // List of signed verifiable credentials (JWTs)
}
```

**Client verification:**
1. Prefer `agent_public_key` from the handshake response.
2. If omitted by implementation, look up the agent's public key using `agent_id`.
3. Verify that `Ed25519_Verify(client_nonce, signature_c, agent_public_key)` returns true.
4. If verification fails, abort the handshake.

### 11.5 Step 3: HandshakeAuth

The client signs the agent's nonce, proving its own identity.

```typescript
interface HandshakeAuth {
  signature_a: string;        // Ed25519 signature of agent_nonce using client's private key
  client_public_key: string;  // Client Ed25519 public key (32-byte hex)
  client_nonce?: string;      // Optional HELLO nonce echo (for nonce consistency checks)
}

interface HandshakeAuthResult {
  success: true;
  session_token: string;      // Opaque short-lived token for signed endpoint calls
  expires_in_seconds: number; // Session TTL
}
```

**Agent verification:**
1. Validate `client_public_key` format.
2. Verify that `Ed25519_Verify(agent_nonce, signature_a, client_public_key)` returns true.
3. If `client_nonce` is present, it MUST match the HELLO nonce for this handshake.
4. If verification fails, reject the client.
5. On success, return a short-lived `session_token`.

### 11.6 Security Considerations

- Nonces MUST be cryptographically random and MUST NOT be reused.
- Each nonce SHOULD be valid for a limited time window (RECOMMENDED: 60 seconds).
- Implementations SHOULD reject handshakes where the nonce has expired.
- The handshake is one-time mutual authentication. Implementations MAY additionally issue a short-lived session token for signed endpoint requests.

### 11.7 Signed Endpoint Requests (Recommended)

For runtime endpoints that execute agent actions (for example `/chat`, `/webhook`), implementations SHOULD require signed requests bound to a valid handshake session.

Recommended request headers:

| Header | Description |
|---|---|
| `x-sekuire-session` | Session token returned by `HandshakeAuthResult` |
| `x-sekuire-timestamp` | Unix epoch milliseconds (or ISO timestamp) |
| `x-sekuire-signature` | Ed25519 signature over canonical request message |

Recommended canonical request message:

```text
UPPERCASE_METHOD + "\n" + PATH + "\n" + TIMESTAMP_MS + "\n" + BLAKE3(CANONICAL_BODY)
```

Where:
- `PATH` is the request path without query string.
- `CANONICAL_BODY` is empty string for no body, otherwise compact JSON serialization.
- `TIMESTAMP_MS` is numeric milliseconds since epoch.

Verification requirements:
1. Reject missing/expired session tokens.
2. Reject timestamps outside the allowed skew window (RECOMMENDED: ±5 minutes).
3. Verify signature using the client public key bound to the authenticated session.
4. Return `401 Unauthorized` on verification failure.

**Source:** `packages/protocol/src/lib.rs:260-278`

---

## 12. A2A Interoperability Types

### 12.1 Overview

These types define agent-to-agent communication aligned with the [A2A Protocol](https://github.com/a2aproject/A2A).

### 12.2 AgentCard

The AgentCard is the self-description document that an agent publishes for discovery.

```typescript
interface AgentCard {
  agentId: string;
  name: string;
  description: string;
  version: string;
  provider?: { name: string; url?: string };
  protocolVersions: string[];
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    extendedAgentCard: boolean;
  };
  skills: AgentSkill[];
  defaultInputModes?: string[];   // MIME types (e.g. ["text/plain", "application/json"])
  defaultOutputModes?: string[];
  securitySchemes?: Record<string, SecurityScheme>;
  security?: string[];
  url: string;                    // Base URL for A2A endpoints
}

interface AgentSkill {
  id: string;                     // e.g. "document:summarize"
  name: string;
  description?: string;
  tags?: string[];
  inputModes?: string[];
  outputModes?: string[];
  examples?: string[];
}

interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
}
```

**Source:** `packages/sdks/typescript/src/types/a2a-types.ts:13-101`

### 12.3 Messages

```typescript
interface A2AMessage {
  role: "user" | "agent";
  parts: A2AMessagePart[];
}

type A2AMessagePart =
  | { type: "text"; text: string }
  | { type: "file"; uri: string; mimeType?: string }
  | { type: "data"; data: unknown };
```

### 12.4 Tasks

```typescript
type A2ATaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "failed"
  | "canceled"
  | "rejected"
  | "auth-required";

interface A2ATask {
  taskId: string;
  contextId?: string;
  status: { state: A2ATaskState; timestamp: string };
  artifacts: A2AArtifact[];
  history: A2AMessage[];
  parentTaskId?: string;   // For delegation chains
  traceId?: string;        // Shared across delegation chain
}

interface A2AArtifact {
  name?: string;
  parts: A2AMessagePart[];
  index?: number;
}
```

### 12.5 JSON-RPC 2.0 Transport

A2A communication uses JSON-RPC 2.0 as the transport envelope.

```typescript
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  id: string | number;
  params?: unknown;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}
```

**Standard methods:**

| Method | Description | Parameters |
|--------|-------------|------------|
| `tasks/send` | Send a message to an agent | `{ taskId?, message, contextId? }` |
| `tasks/get` | Get current task state | `{ taskId }` |
| `tasks/cancel` | Cancel a running task | `{ taskId }` |
| `tasks/sendSubscribe` | Send and subscribe to updates via SSE | `{ taskId?, message }` |

### 12.6 SSE Streaming Format

For streaming task updates, the server sends Server-Sent Events:

```typescript
interface TaskUpdateEvent {
  taskId: string;
  status: A2ATaskState;
  updatedAt: string;          // ISO 8601
  message?: A2AMessage;
  artifacts?: A2AArtifact[];
}
```

Each SSE event is a JSON-serialized `TaskUpdateEvent`.

**Source:** `packages/sdks/typescript/src/types/a2a-types.ts`

---

## 13. Conformance Levels

Implementations MAY declare their conformance level. Three levels are defined:

### Level 1: Identity + Policy

- Implements Sections 2 (Identity), 3 (Manifest), 4 (System Prompt), 5 (Tool Definition), and 6 (Policy Declaration).
- Agent can compute its SekuireID, provide conforming system prompt and tool definitions, and declare a policy.
- Runtime enforcement is not required.

### Level 2: Runtime Enforcement

- All of Level 1, plus Section 7 (Enforcement Decision Contract).
- Agent enforces policy at runtime and produces `PolicyDecision` results.
- Audit logging is not required.

### Level 3: Verifiable Audit Trail

- All of Level 2, plus Section 8 (Audit Event Format) and Section 9.11 (Local Verification).
- Agent emits signed audit events.
- Third parties can verify identity, policy integrity, and audit evidence.

---

## 14. Security Considerations

### 14.1 Key Management

- Private keys MUST NOT be committed to source control.
- Keys SHOULD be stored in protected local paths (e.g. `~/.sekuire/secret.key`) or secret managers.
- Implementations SHOULD support key rotation.

### 14.2 Policy Integrity

- Policy signatures SHOULD be verified before activation.
- Implementations SHOULD reject policies with invalid or missing hashes.
- The enforcer binary/code SHOULD be integrity-checked to prevent bypass.

### 14.3 Replay Attacks

- Include timestamps in all signed messages (reject if outside a time window).
- Include nonces in handshake flows (reject duplicates).
- Use Merkle chaining for audit events (detect reordering).

### 14.4 Data Exfiltration

- Network allowlists limit outbound destinations.
- Audit events MUST NOT contain raw secrets or credentials.
- Tool/resource fields SHOULD be sanitized before persistence to avoid injection in downstream systems.

### 14.5 Timestamps

- All timestamps MUST use UTC ISO 8601 format.
- Verifiers SHOULD account for bounded clock skew (RECOMMENDED: 5 minutes).

---

## 15. Extension Model

Extensions are allowed with namespacing:

- Custom capability names SHOULD use `namespace:capability` format (e.g. `acme:data:export`).
- Custom audit metadata SHOULD be under namespaced keys.
- Unknown fields MUST be ignored by conforming implementations unless marked required by a profile.
- Extensions MUST NOT redefine the semantics of fields defined in this specification.

---

## Appendix A: Cryptographic Primitive Reference

| Primitive | Algorithm | Input | Output | Encoding |
|-----------|-----------|-------|--------|----------|
| SekuireID | BLAKE3 | Fingerprint string | 32 bytes | 64-char lowercase hex |
| Prompt hash | BLAKE3 | Trimmed prompt bytes | 32 bytes | 64-char lowercase hex |
| Tools hash | BLAKE3 | Canonical JSON bytes | 32 bytes | 64-char lowercase hex |
| Key pair | Ed25519 | CSPRNG seed | pub 32B + priv 64B | Lowercase hex |
| Signature | Ed25519 (detached) | Message bytes + private key | 64 bytes | 128-char lowercase hex |
| Nonce | CSPRNG | N/A | 32 bytes | 64-char lowercase hex |

## Appendix B: Reference Implementations

| Language | Package | Location |
|----------|---------|----------|
| Rust | `sekuire-cli` | `packages/cli/` |
| Rust | `sekuire-protocol` | `packages/protocol/` |
| TypeScript | `@sekuire/sdk` | `packages/sdks/typescript/` |
| Python | `sekuire` | `packages/sdks/python/` |

The Rust CLI implementation (`packages/cli/src/services/auth.rs`) is the reference for the identity algorithm. TypeScript and Python implementations MUST produce identical SekuireIDs for the same inputs.

## Appendix C: Normative References

- **BLAKE3**: https://github.com/BLAKE3-team/BLAKE3-specs
- **Ed25519**: RFC 8032 - Edwards-Curve Digital Signature Algorithm (EdDSA)
- **JSON Canonicalization**: RFC 8785 - JSON Canonicalization Scheme (JCS)
- **RFC 2119**: Key words for use in RFCs to Indicate Requirement Levels
- **ISO 8601**: Date and time format
- **Semantic Versioning 2.0**: https://semver.org

## Appendix D: Future Work (v0.2 Candidates)

- Canonical JSON profile publication with test vectors
- Standardized audit hash-chain profile
- Signed trust assertion format
- Interop test suite and compliance harness
- `require_approval` as a third enforcement action (beyond allow/deny)

## Appendix E: Unified File Format (Informative)

A `sekuire.yml` file MAY combine agent manifest (Section 3), policy (Section 6), and SDK runtime extensions in a single file. The three zones are:

1. **Manifest zone** - `spec_version`, `project`, `identity`, `capabilities`, `discovery`, `a2a`, `deployment`
2. **Policy zone** - `permissions`, `tools`, `models`, `rate_limits`, `custom_rules`
3. **SDK extension zone** - `llm`, `memory`, `compliance`, `logger`, `server` (non-normative)

This layout is RECOMMENDED but not required. Implementations MAY split manifest and policy into separate files.

```yaml
# Zone 1: Manifest (OAGS Section 3)
spec_version: "0.1"

project:
  name: my-agent
  version: "1.0.0"

identity:
  model: gpt-4o
  system_prompt_path: ./system_prompt.md
  tools_path: ./tools.json

# Zone 2: Policy (OAGS Section 6)
permissions:
  network:
    enabled: true
    require_tls: true

tools:
  blocked_tools:
    - "shell_exec"

models:
  allowed_models:
    - "gpt-4o"

# Zone 3: SDK Extensions (non-normative)
llm:
  provider: openai
  model: gpt-4o
  api_key_env: OPENAI_API_KEY
```

For the full canonical schema, see `sekuire-yml-schema.md`.

## Appendix F: Changelog

### v0.1.2 (2026-02-16)

- Added Section 4: System Prompt Format — standardizes structure, encoding, normative requirements, versioning, and size limits for system prompt files
- Added Section 5: Tool Definition Schema — standardizes tool definition file format including ToolDefinition schema, ParametersSchema (JSON Schema subset), supported types, naming conventions, compliance metadata, and normative requirements
- Renumbered Sections 4–13 to 6–15 to accommodate new sections
- Updated all cross-references to reflect new section numbering
- Updated Conformance Level 1 to include Sections 4 and 5

### v0.1.1 (2026-02-16)

- Renamed `agent.models` to root-level `models` in PolicyContent schema (Section 6.2) to eliminate ambiguity with the overloaded `agent` key
- Updated Section 6.12 example policy to use `models` instead of `agent.models`
- Added Appendix E: Unified File Format (informative) describing how manifest + policy + SDK extensions coexist in a single `sekuire.yml`
- Published companion document `sekuire-yml-schema.md` as the canonical file format reference

### v0.1.0 (2026-02-16)

- Initial draft specification
- Defined identity primitive with canonical BLAKE3 fingerprint algorithm
- Defined manifest schema based on Rust protocol types
- Defined policy declaration schema with network, filesystem, tool, model, API, and rate limit categories
- Defined enforcement decision contract with standard rule IDs and matching semantics
- Defined audit event format with batch submission, optional signing, and optional Merkle chaining
- Defined verification result schema with scoring and pass criteria
- Defined trust protocol headers
- Defined handshake authentication protocol
- Defined A2A interoperability types aligned with A2A protocol spec
- Defined three conformance levels
- Defined extension model with namespacing
