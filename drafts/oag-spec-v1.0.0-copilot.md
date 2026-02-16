> **STATUS: SUPERSEDED**
> This document has been superseded by `oss/specs/oags-v0.1.md`.
> It is retained for historical reference only.

# Open Agent Governance Specification (OAG)

**Version:** 1.0.0  
**Status:** Draft  
**Date:** February 16, 2026  
**Editors:** GitHub Copilot CLI  
**License:** CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

---

## Abstract

The Open Agent Governance (OAG) specification defines standardized primitives for cryptographic identity, policy enforcement, and auditability of autonomous AI agents. It enables agents to prove their identity deterministically and demonstrate compliance with declared governance constraints, establishing a foundation for trust in agent-to-agent and agent-to-human interactions.

**Key Goals:**
- **Deterministic Identity**: Content-addressable agent identifiers
- **Declarative Governance**: YAML/JSON policy schemas
- **Runtime Enforcement**: Local policy evaluation before action execution
- **Cryptographic Audit**: Signed, tamper-evident event logs
- **Interoperability**: Implementation-agnostic standard

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Agent Identity](#3-agent-identity)
4. [Manifest Schema](#4-manifest-schema)
5. [Policy Declaration](#5-policy-declaration)
6. [Enforcement Semantics](#6-enforcement-semantics)
7. [Audit Events](#7-audit-events)
8. [Verification Protocol](#8-verification-protocol)
9. [Agent-to-Agent Protocol](#9-agent-to-agent-protocol)
10. [Conformance Levels](#10-conformance-levels)
11. [Security Considerations](#11-security-considerations)
12. [References](#12-references)

---

## 1. Introduction

### 1.1 Motivation

Autonomous AI agents are deployed with broad capabilities—file system access, API calls, network requests—yet lack standardized governance. This creates risks:

- **Uncontrolled Actions**: Agents can exceed intended boundaries
- **Accountability Gaps**: No verifiable record of agent behavior
- **Trust Deficits**: Stakeholders cannot validate compliance
- **Regulatory Exposure**: No standard for demonstrating governance

This specification addresses these challenges through five primitives:

1. **Identity**: Deterministic, content-addressable agent IDs
2. **Policy**: Declarative runtime constraints
3. **Enforcement**: Local policy evaluation with clear decisions
4. **Audit**: Cryptographically signed event logs
5. **Verification**: Protocol for validating identity and compliance

### 1.2 Scope

**This specification defines:**

- Agent identity derivation algorithm (content-addressable)
- Manifest format for agent metadata
- Policy schema for runtime constraints
- Enforcement decision contract
- Audit event format with signing
- Verification workflows
- Agent-to-agent mutual authentication

**This specification does NOT define:**

- Multi-agent coordination protocols beyond direct A2A
- Centralized policy distribution mechanisms
- Long-term audit retention infrastructure
- Registry network protocols
- UI/dashboard specifications
- Billing or entitlement models

**Note:** Implementations may extend this specification with additional features while remaining conformant.

### 1.3 Notation

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

### 1.4 Design Principles

1. **Local-First**: Core primitives work without network connectivity
2. **Deterministic**: Same inputs produce same outputs
3. **Transparent**: All algorithms are publicly specified
4. **Minimal**: Fewest primitives necessary
5. **Extensible**: Namespaced extensions permitted

---

## 2. Terminology

| Term | Definition |
|------|------------|
| **Agent** | Autonomous AI system that can execute actions |
| **Sekuire ID** | Content-addressable identifier for an agent |
| **Manifest** | Agent metadata and identity declaration |
| **Policy** | Declared constraints on agent behavior |
| **Enforcer** | Runtime component evaluating actions against policy |
| **Audit Event** | Immutable record of an action and policy decision |
| **Verification** | Process of validating agent identity and compliance |
| **A2A** | Agent-to-Agent protocol for mutual authentication |

---

## 3. Agent Identity

### 3.1 Overview

Every agent has a **Sekuire ID**: a deterministic, content-addressable identifier derived from its configuration. Changing the model, system prompt, or tools produces a different Sekuire ID.

**Properties:**
- **Deterministic**: Same configuration → same ID
- **Content-Addressable**: ID derived from agent's definition
- **Verifiable**: Third parties can reproduce the ID
- **Immutable**: Changed code → new ID

### 3.2 Sekuire ID Computation

Implementations MUST follow these steps to produce a canonical Sekuire ID.

#### Step 1: Hash the System Prompt

```
1. Read system prompt file as UTF-8 text
2. Trim leading and trailing whitespace
3. Compute BLAKE3 hash
4. Encode as 64-character lowercase hex

prompt_hash = hex(BLAKE3(trim(system_prompt_utf8)))
```

#### Step 2: Hash the Tools Definition

```
1. Read tools file as UTF-8 text
2. Parse as JSON
3. Canonicalize JSON (compact, sorted keys)
4. Compute BLAKE3 hash
5. Encode as 64-character lowercase hex

tools_canonical = JSON.stringify(parse(tools_file), sorted_keys)
tools_hash = hex(BLAKE3(tools_canonical))
```

#### Step 3: Compute Sekuire ID

```
1. Construct fingerprint string:
   "model:{model}|prompt:{prompt_hash}|tools:{tools_hash}"

2. Compute BLAKE3 hash of fingerprint (UTF-8 bytes)

3. Encode as 64-character lowercase hex

fingerprint = "model:" + model + "|prompt:" + prompt_hash + "|tools:" + tools_hash
sekuire_id = hex(BLAKE3(fingerprint_utf8))
```

**Example Output:**
```
8573fa8aa6712ef844b45e6a43078b12ed4ce9de26db9947db2aba595732fced
```

### 3.3 Canonicalization Rules

- **System Prompt**: Trim leading/trailing whitespace; preserve interior whitespace
- **Tools Definition**: Parse JSON and re-serialize in compact canonical form
- **Model Identifier**: Used as-is (no normalization)

### 3.4 Validation

A valid Sekuire ID MUST:
- Be exactly 64 characters long
- Contain only characters in `[0-9a-f]`
- Be lowercase

### 3.5 Ed25519 Signatures

Agents use **Ed25519** for cryptographic signing.

**Key Generation:**
```typescript
interface KeyPair {
  publicKey: string;   // 64-char hex (32 bytes)
  privateKey: string;  // 128-char hex (64 bytes)
}

keypair = Ed25519.generate() // CSPRNG required
```

**Signing:**
```
signature = Ed25519.sign(message_bytes, private_key)
// Returns: 128-char hex (64 bytes)
```

**Verification:**
```
valid = Ed25519.verify(message_bytes, signature, public_key)
// Returns: boolean
```

**Key Storage:**
- Private keys MUST be stored securely (HSM, KMS, or encrypted filesystem)
- Private keys MUST NOT be committed to version control
- Use `.sekuire/secret.key` for local development (gitignored)

---

## 4. Manifest Schema

### 4.1 Overview

The agent manifest is a declarative configuration describing identity, capabilities, and metadata. It serves as:
- Input to Sekuire ID computation
- Unit of publication to registries
- Source of truth for agent configuration

### 4.2 File Format

Manifests MUST be one of:
1. `sekuire.yml` (preferred)
2. `sekuire.yaml`
3. `sekuire.json`

Both YAML and JSON formats are supported with identical schema.

### 4.3 Schema Definition

```yaml
# Required fields
project:
  name: string              # Agent name
  version: string           # Semantic version (e.g., "1.0.0")
  description?: string      # Human-readable description
  authors?: [string]        # Author identifiers
  license?: string          # SPDX identifier

identity:
  model: string                    # Model ID (e.g., "gpt-4-turbo")
  system_prompt_path: string       # Relative path to prompt file
  tools_path: string               # Relative path to tools JSON
  system_prompt_hash?: string      # Computed by tooling
  tools_hash?: string              # Computed by tooling

# Optional fields
capabilities:
  provides: [string]               # Skills offered (e.g., "jira:create_ticket")
  requires: [string]               # Skills needed from others
  delegates_to:
    - agent_type: string
      capabilities: [string]

discovery:
  tags: [string]                   # Freeform tags
  categories: [string]             # Category IDs
  search_keywords: [string]        # For search indexing

a2a:
  upstream_url: string             # A2A endpoint (e.g., http://localhost:8001/a2a/tasks)
  public_base_url?: string         # Public URL for direct calls

deployment:
  env:
    - name: string
      required: boolean
      secret: boolean
      description?: string
      default_value?: string
  docker_image?: string
  notes?: string
```

### 4.4 Example Manifest

```yaml
project:
  name: customer-support-agent
  version: "1.2.0"
  description: "Enterprise customer support automation"
  authors:
    - "support-team@company.com"
  license: MIT

identity:
  model: gpt-4-turbo
  system_prompt_path: ./system_prompt.md
  tools_path: ./tools.json
  # Hashes computed by `sekuire publish`
  system_prompt_hash: "a1b2c3d4..."
  tools_hash: "e5f6a7b8..."

capabilities:
  provides:
    - "orders:search"
    - "refunds:process"
    - "tickets:create"
  requires: []

discovery:
  tags:
    - customer-support
    - production
  categories:
    - enterprise
  search_keywords:
    - support
    - orders
    - refunds

a2a:
  upstream_url: http://localhost:8001/a2a/tasks
  public_base_url: https://support-agent.company.com

deployment:
  env:
    - name: OPENAI_API_KEY
      required: true
      secret: true
      description: "OpenAI API key for GPT-4"
    - name: DATABASE_URL
      required: true
      secret: true
      description: "PostgreSQL connection string"
    - name: LOG_LEVEL
      required: false
      secret: false
      default_value: "info"
  docker_image: ghcr.io/company/support-agent:1.2.0
```

---

## 5. Policy Declaration

### 5.1 Overview

Policies define runtime constraints that agents MUST operate within. Policies are evaluated locally by enforcers and can be loaded from local files or remote APIs.

### 5.2 Policy Schema

```yaml
# Optional: Policy metadata (for remote policies)
policy_id?: string
version?: string
status?: "active" | "draft" | "archived"

# Policy content
permissions:
  network:
    enabled: boolean               # Allow network access
    require_tls: boolean           # HTTPS only
    allowed_domains: [string]      # Domain allowlist
    blocked_domains: [string]      # Domain blocklist
    
  filesystem:
    enabled: boolean               # Allow filesystem access
    allowed_paths: [string]        # Path allowlist
    blocked_paths: [string]        # Path blocklist
    allowed_extensions: [string]   # Extension allowlist (e.g., [".txt", ".json"])
    
  api:
    enabled: boolean
    allowed_endpoints: [string]    # API endpoint allowlist
    blocked_endpoints: [string]    # API endpoint blocklist

tools:
  allowed_tools: [string]          # Tool allowlist (glob patterns)
  blocked_tools: [string]          # Tool blocklist (glob patterns)

agent:
  models:
    allowed_models: [string]       # Model allowlist
    blocked_models: [string]       # Model blocklist

rate_limits:
  per_agent:
    requests_per_minute: integer
    requests_per_hour: integer
    tokens_per_hour: integer
    cost_per_hour_usd: float

custom_rules:
  - rule_id: string
    description: string
    enforcement_point: string      # "pre_llm" | "pre_tool" | "post_tool"
    condition: object              # Implementation-specific
```

### 5.3 Pattern Matching

**Tool Patterns (Glob Syntax):**
- `*`: Matches any characters within a segment
- `file:*`: Matches `file:read`, `file:write`, `file:delete`
- `network:http_*`: Matches `network:http_get`, `network:http_post`

**Domain Patterns:**
- `example.com`: Exact match
- `*.example.com`: Matches `api.example.com`, `www.example.com`, and bare `example.com`
- `*`: Matches all domains

**Path Patterns:**
- `/data/config.json`: Exact match
- `/data/*`: Matches any path starting with `/data/`
- `/data/**`: Matches any path under `/data/` recursively

### 5.4 Example Policies

#### HIPAA-Compliant Agent

```yaml
permissions:
  network:
    enabled: true
    require_tls: true
    allowed_domains:
      - "*.healthcare-api.com"
      - "ehr.internal.company.com"
      
  filesystem:
    enabled: false  # No filesystem access
    
tools:
  allowed_tools:
    - "query_patient_records"
    - "schedule_appointment"
  blocked_tools:
    - "send_email"  # Prevent PHI exfiltration
    
rate_limits:
  per_agent:
    requests_per_minute: 50
    cost_per_hour_usd: 100.00
```

#### Read-Only Research Agent

```yaml
permissions:
  network:
    enabled: true
    require_tls: true
    # All domains allowed for research
    
  filesystem:
    enabled: true
    allowed_paths:
      - "/data/research/**"
      - "/data/papers/**"
    blocked_paths:
      - "/etc/**"
      - "/home/**"
    allowed_extensions:
      - ".txt"
      - ".pdf"
      - ".md"
      
tools:
  allowed_tools:
    - "search:*"
    - "file:read"
  blocked_tools:
    - "file:write"
    - "file:delete"
    - "network:http_post"
    
rate_limits:
  per_agent:
    requests_per_minute: 200
    tokens_per_hour: 5000000
```

---

## 6. Enforcement Semantics

### 6.1 Enforcement Flow

```
1. Agent requests action (e.g., call tool, make network request)
2. Enforcer intercepts request
3. Enforcer evaluates action against policy
4. Enforcer returns PolicyDecision
   - If ALLOW: Action proceeds
   - If DENY: Action blocked, error raised
   - If REQUIRE_APPROVAL: Action queued for human review
5. Audit event logged (regardless of decision)
```

### 6.2 PolicyDecision Type

```typescript
interface PolicyDecision {
  allowed: boolean;
  violations: PolicyViolation[];
  warnings: PolicyWarning[];
}

interface PolicyViolation {
  rule_id: string;              // e.g., "network.domain_blocked"
  rule_name: string;            // Human-readable rule name
  message: string;              // Explanation
  capability: string;           // Action that was blocked
}

interface PolicyWarning {
  rule_id: string;
  message: string;
}
```

**Example:**
```json
{
  "allowed": false,
  "violations": [
    {
      "rule_id": "network.domain_blocked",
      "rule_name": "Network domain blocklist",
      "message": "Domain evil.com is blocked by policy",
      "capability": "network:http_get"
    }
  ],
  "warnings": []
}
```

### 6.3 Evaluation Logic

**Precedence (highest to lowest):**

1. **Explicit block** (`blocked_*`) → DENY
2. **Explicit allow** (`allowed_*`) → ALLOW if matched
3. **Default deny** if allowlist exists but no match → DENY
4. **Default allow** if no constraints → ALLOW

**Examples:**

```yaml
# Allowlist mode
tools:
  allowed_tools: ["file:read", "network:http_get"]
# Result: Only listed tools allowed, all others denied

# Blocklist mode  
tools:
  blocked_tools: ["file:delete", "system:*"]
# Result: Listed tools denied, all others allowed

# Mixed mode
tools:
  allowed_tools: ["file:*"]
  blocked_tools: ["file:delete"]
# Result: All file:* allowed EXCEPT file:delete (block wins)
```

### 6.4 Enforcement Points

Implementations SHOULD support enforcement at:

1. **`pre_llm_call`**: Before LLM receives prompt
2. **`pre_tool_execution`**: Before tool invocation
3. **`post_tool_execution`**: After tool returns (filter output)
4. **`on_policy_violation`**: When violation occurs

---

## 7. Audit Events

### 7.1 Event Schema

```typescript
interface AuditEvent {
  // Identity
  event_id: string;              // UUID v4
  sekuire_id: string;            // Agent identifier
  agent_name: string;
  
  // Timing
  timestamp: string;             // ISO 8601 UTC
  duration_ms?: number;          // Action duration
  
  // Action
  action_type: string;           // "tool_call" | "network_request" | "file_operation" | "model_call"
  action: string;                // Specific action (e.g., "file:read")
  parameters: object;            // Sanitized parameters
  result?: object;               // Sanitized result
  
  // Policy
  policy_decision: "allow" | "deny" | "require_approval";
  policy_reason: string;
  matched_rule?: string;
  
  // Context
  session_id?: string;
  user_id?: string;
  workspace_id?: string;
  scope_id?: string;
  trace_id?: string;
  
  // Integrity
  signature?: string;            // Ed25519 signature
  previous_event_hash?: string;  // Merkle chain link
}
```

### 7.2 Event Signing

Events are signed to prevent tampering:

```typescript
function signEvent(event: AuditEvent, privateKey: string): string {
  // 1. Remove signature field
  const { signature, ...eventWithoutSig } = event;
  
  // 2. Canonicalize (sorted keys, compact JSON)
  const canonical = JSON.stringify(eventWithoutSig, Object.keys(eventWithoutSig).sort());
  
  // 3. Hash
  const hash = BLAKE3(canonical);
  
  // 4. Sign
  return Ed25519.sign(hash, privateKey);
}

function verifyEvent(event: AuditEvent, publicKey: string): boolean {
  const { signature, ...eventWithoutSig } = event;
  const canonical = JSON.stringify(eventWithoutSig, Object.keys(eventWithoutSig).sort());
  const hash = BLAKE3(canonical);
  return Ed25519.verify(hash, signature, publicKey);
}
```

### 7.3 Merkle Chaining

Events can be chained for tamper-evidence:

```typescript
function chainEvent(event: AuditEvent, previousHash: string): string {
  event.previous_event_hash = previousHash;
  
  const canonical = JSON.stringify(
    omit(event, ['signature']), 
    Object.keys(event).sort()
  );
  
  return BLAKE3(canonical);
}
```

**Properties:**
- Modifying any event breaks the chain
- Reordering events breaks the chain
- Detecting tampering is O(1)

### 7.4 Sensitive Data Handling

**Sanitization Rules:**
- Never log credentials (API keys, passwords, tokens)
- Mask PII (emails, phone numbers, SSNs)
- Truncate large payloads (max 1KB)

```typescript
function sanitizeParameters(params: object): object {
  return {
    ...params,
    api_key: params.api_key ? "[REDACTED]" : undefined,
    password: params.password ? "[REDACTED]" : undefined,
    email: params.email ? maskEmail(params.email) : params.email,
    large_data: params.large_data?.length > 1024
      ? params.large_data.slice(0, 1024) + "[truncated]"
      : params.large_data
  };
}
```

### 7.5 Example Event

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "sekuire_id": "8573fa8aa6712ef844b45e6a43078b12ed4ce9de26db9947db2aba595732fced",
  "agent_name": "customer-support-agent",
  "timestamp": "2026-02-16T00:15:32.123Z",
  "duration_ms": 245,
  "action_type": "tool_call",
  "action": "search_orders",
  "parameters": {
    "customer_id": "cust_abc123",
    "order_id": "ord_xyz789"
  },
  "result": {
    "orders": [
      { "id": "ord_xyz789", "status": "delivered" }
    ]
  },
  "policy_decision": "allow",
  "policy_reason": "Tool search_orders is in allowlist",
  "matched_rule": "tools.allowed_tools[0]",
  "session_id": "sess_def456",
  "user_id": "user_ghi789",
  "signature": "a1b2c3d4e5f6...",
  "previous_event_hash": "9f8e7d6c5b4a..."
}
```

---

## 8. Verification Protocol

### 8.1 Agent Verification Endpoint

Agents SHOULD expose a verification endpoint at `/.well-known/sekuire/agent`:

**Request:**
```
GET /.well-known/sekuire/agent HTTP/1.1
Host: agent.example.com
```

**Response:**
```json
{
  "name": "customer-support-agent",
  "version": "1.2.0",
  "sekuire_id": "8573fa8a...",
  "public_key": "a1b2c3d4...",
  "manifest_url": "https://agent.example.com/sekuire.yaml",
  "manifest_hash": "9f8e7d6c...",
  "signature": "e5f6a7b8...",
  "capabilities": [
    "search_orders",
    "process_refund"
  ]
}
```

### 8.2 Verification Steps

To verify an agent:

```typescript
async function verifyAgent(agentUrl: string): Promise<VerificationResult> {
  // 1. Fetch verification endpoint
  const response = await fetch(`${agentUrl}/.well-known/sekuire/agent`);
  const data = await response.json();
  
  // 2. Fetch manifest
  const manifest = await fetch(data.manifest_url);
  
  // 3. Compute ID from manifest
  const computedId = computeSekuireId(manifest);
  if (computedId !== data.sekuire_id) {
    return { verified: false, reason: "ID mismatch" };
  }
  
  // 4. Verify manifest hash
  const manifestHash = BLAKE3(manifest);
  if (manifestHash !== data.manifest_hash) {
    return { verified: false, reason: "Manifest hash mismatch" };
  }
  
  // 5. Verify signature
  const message = JSON.stringify(omit(data, ['signature']));
  const valid = Ed25519.verify(message, data.signature, data.public_key);
  if (!valid) {
    return { verified: false, reason: "Invalid signature" };
  }
  
  return { 
    verified: true,
    sekuire_id: data.sekuire_id
  };
}
```

### 8.3 Trust Headers

Agents can include trust headers in requests:

```
X-Sekuire-Agent-ID: 8573fa8aa6712ef844b45e6a43078b12ed4ce9de26db9947db2aba595732fced
X-Sekuire-Signature: a1b2c3d4e5f6...
X-Sekuire-Timestamp: 2026-02-16T00:15:32Z
X-Sekuire-Nonce: 550e8400-e29b-41d4-a716-446655440000
```

Receiving agents validate:
1. Signature is valid for claimed agent ID
2. Timestamp is recent (within 5 minutes)
3. Nonce hasn't been used (replay protection)

---

## 9. Agent-to-Agent Protocol

### 9.1 Mutual Authentication Handshake

When agents communicate directly, they perform mutual authentication:

**Flow:**
```
Client                          Server
  |                               |
  |-- HELLO (client_nonce) ------>|
  |                               |
  |<- WELCOME (server_nonce, -----|
  |   sig(client_nonce),          |
  |   agent_id, capabilities) ----|
  |                               |
  |-- AUTH (sig(server_nonce)) -->|
  |                               |
  |<- SUCCESS (session_token) ----|
```

**Step 1: HELLO**
```json
POST /sekuire/hello
{
  "client_nonce": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Step 2: WELCOME**
```json
{
  "agent_id": "8573fa8a...",
  "agent_nonce": "660f9511...",
  "signature_c": "a1b2c3d4...",  // Sign(client_nonce, server_private_key)
  "public_key": "e5f6a7b8...",
  "capabilities": ["summarize", "translate"]
}
```

Client verifies:
- `signature_c` is valid signature of `client_nonce` by `public_key`
- `agent_id` matches expected server

**Step 3: AUTH**
```json
POST /sekuire/auth
{
  "signature_a": "c9d0e1f2..."  // Sign(agent_nonce, client_private_key)
}
```

Server verifies:
- `signature_a` is valid signature of `agent_nonce` by client's public key

**Step 4: SUCCESS**
```json
{
  "status": "authenticated",
  "session_token": "sess_abc123...",
  "expires_at": "2026-02-16T01:15:32Z"
}
```

### 9.2 Skill Invocation

After authentication:

```json
POST /sekuire/skill/summarize
Authorization: Bearer sess_abc123...
{
  "input": {
    "text": "Long document...",
    "max_length": 200
  },
  "context": {
    "user_id": "user_xyz789"
  }
}
```

**Response:**
```json
{
  "result": {
    "summary": "Brief summary..."
  },
  "metadata": {
    "duration_ms": 1234,
    "tokens_used": 567
  },
  "audit_event_id": "770g0622..."
}
```

---

## 10. Conformance Levels

This specification defines three conformance levels:

### Level 1: Identity + Policy Declaration

**Requirements:**
- ✅ Compute Sekuire ID using canonical algorithm
- ✅ Declare policies in manifest
- ✅ Expose verification endpoint
- ❌ Runtime enforcement (optional)
- ❌ Audit logging (optional)

**Use Case:** Public agents seeking discoverability

---

### Level 2: Runtime Enforcement

**Requirements:**
- ✅ All Level 1 requirements
- ✅ Runtime policy enforcement (block violations)
- ✅ PolicyDecision for all actions
- ❌ Cryptographic audit trail (optional)

**Use Case:** Enterprises requiring basic governance

---

### Level 3: Cryptographic Audit Trail

**Requirements:**
- ✅ All Level 2 requirements
- ✅ Signed audit events
- ✅ Merkle chaining
- ✅ Tamper-evident logging

**Use Case:** Regulated industries (healthcare, finance)

---

## 11. Security Considerations

### 11.1 Key Management

**Threats:**
- Private key theft → impersonation
- Key loss → inability to prove identity

**Mitigations:**
- Store keys in HSM or KMS
- Use environment variables, not config files
- Implement key rotation
- Never commit keys to version control

### 11.2 Policy Bypass

**Threat:** Attacker modifies enforcer to allow all actions

**Mitigations:**
- Code signing for enforcers
- Remote attestation
- Monitor for anomalous behavior
- Canary deployments

### 11.3 Replay Attacks

**Threat:** Attacker captures and replays valid requests

**Mitigations:**
- Include timestamps (reject old events)
- Include nonces (reject duplicates)
- Merkle chaining (detect reordering)

### 11.4 Denial of Service

**Threat:** Malicious agent floods with requests

**Mitigations:**
- Rate limiting (per agent, per IP)
- Authentication before processing
- Request size limits
- Circuit breakers

### 11.5 Data Exfiltration

**Threat:** Agent uses allowed tools to leak sensitive data

**Mitigations:**
- Network allowlists
- Data loss prevention (DLP)
- Outbound traffic monitoring
- Encryption requirements

---

## 12. References

### 12.1 Cryptographic Standards

- **BLAKE3**: https://github.com/BLAKE3-team/BLAKE3-specs
- **Ed25519**: RFC 8032 - Edwards-Curve Digital Signature Algorithm
- **JSON Canonicalization**: RFC 8785 - JSON Canonicalization Scheme

### 12.2 Related Specifications

- **OpenAPI 3.0**: API schema definition
- **JSON Schema**: Data validation
- **YAML 1.2**: Configuration format
- **ISO 8601**: Timestamp format
- **Semantic Versioning 2.0**: Version format
- **RFC 2119**: Key words for requirements

### 12.3 Reference Implementations

- **TypeScript SDK**: (coming soon)
- **Python SDK**: (coming soon)
- **Rust SDK**: (coming soon)
- **CLI Tool**: (coming soon)

---

## Appendix A: Complete Example

### Full Manifest + Policy

```yaml
# sekuire.yaml
project:
  name: enterprise-support-agent
  version: "2.1.0"
  description: "Production customer support agent"
  authors:
    - "support-team@company.com"
  license: MIT

identity:
  model: gpt-4-turbo
  system_prompt_path: ./system_prompt.md
  tools_path: ./tools.json
  public_key: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"

capabilities:
  provides:
    - "orders:search"
    - "refunds:process"
    - "tickets:create"

# Governance policy (embedded or reference external file)
governance:
  permissions:
    network:
      enabled: true
      require_tls: true
      allowed_domains:
        - "api.stripe.com"
        - "*.internal.company.com"
    
    filesystem:
      enabled: true
      allowed_paths:
        - "/data/customer-orders/**"
      blocked_paths:
        - "/etc/**"
  
  tools:
    allowed_tools:
      - "search_orders"
      - "process_refund"
      - "create_ticket"
  
  rate_limits:
    per_agent:
      requests_per_minute: 100
      requests_per_hour: 5000
      cost_per_hour_usd: 50.00
```

---

## Appendix B: Changelog

### Version 1.0.0 (February 16, 2026)
- Initial specification release
- Core primitives: Identity, Policy, Enforcement, Audit, Verification
- Agent-to-Agent protocol
- Three conformance levels
- Security considerations

---

## Contributing

This specification is maintained by an open community.

**How to contribute:**
- Open issues for feedback
- Submit pull requests with proposed changes
- Participate in community discussions

**Contact:**
- Email: governance@sekuire.ai
- GitHub: (repository URL)

---

## License

This specification is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).

You are free to:
- Share — copy and redistribute
- Adapt — remix, transform, and build upon

Under these terms:
- Attribution — Give appropriate credit

Full license: https://creativecommons.org/licenses/by/4.0/

---

**Document End**
