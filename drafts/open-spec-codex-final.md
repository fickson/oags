> **STATUS: SUPERSEDED**
> This document has been superseded by `oss/specs/oags-v0.1.md`.
> It is retained for historical reference only.

# Open Agent Governance Specification (OAGS) v0.1 Final Draft

Status: Final Draft  
Editor: Codex (GPT-5)  
Date: February 16, 2026  
License: Apache 2.0 (recommended for reference implementations)

## 1. Preamble

## 1.1 Purpose

This specification defines a local-first, implementation-agnostic standard for:

1. deterministic agent identity,
2. runtime policy declaration and enforcement,
3. cryptographically verifiable audit events, and
4. interoperable verification flows.

Goal:

How can a third party verify that an AI agent acted within declared constraints?

## 1.2 Scope

In scope:

- identity derivation and signatures
- manifest and policy schemas
- enforcement decision contract and matching semantics
- audit event schema, signing, and optional chaining
- verification workflows and conformance levels
- optional interop profiles (trust headers, handshake, A2A types)

Out of scope:

- UI/dashboard behavior
- billing or entitlement logic
- vendor-specific API endpoints
- product packaging decisions

## 1.3 Normative Language

The keywords "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" are interpreted as in RFC 2119.

Unless explicitly marked "Informative", sections are normative.

## 2. System Roles

The OAGS ecosystem can include:

1. Subject Agent: runtime being governed.
2. Policy Authority: source of policy (local file or remote authority).
3. Witness Authority: optional external sink for signed audit evidence.
4. Trust Directory: optional directory mapping agent IDs to metadata and trust signals.
5. Verifier: actor that validates identity, policy integrity, and/or audit evidence.

This spec does not require centralized deployment. All core requirements are satisfiable in standalone mode.

## 3. Cryptographic Primitive Summary

| Primitive | Algorithm | Output | Encoding |
|---|---|---|---|
| Identity hash | BLAKE3 | 32 bytes | 64-char lowercase hex |
| Prompt hash | BLAKE3 | 32 bytes | 64-char lowercase hex |
| Tools hash | BLAKE3 | 32 bytes | 64-char lowercase hex |
| Signature | Ed25519 | 64 bytes | 128-char lowercase hex |
| Public key | Ed25519 | 32 bytes | 64-char lowercase hex |
| Nonce | CSPRNG | 32 bytes | 64-char lowercase hex |

## 4. Identity Primitive (OAG-ID)

## 4.1 Requirements

Identity MUST be:

- deterministic,
- content-addressable,
- reproducible by third parties.

Changing model, prompt content, or tool definition MUST change identity.

## 4.2 OAG-ID Algorithm

Implementations MUST compute identity as follows.

Step 1: prompt hash

1. Read prompt bytes as UTF-8 text.
2. Normalize line endings to `\n`.
3. Trim leading/trailing whitespace.
4. Compute:
   `prompt_hash = hex(BLAKE3(prompt_normalized_bytes))`

Step 2: tools hash

1. Read tools definition as UTF-8 JSON.
2. Parse JSON.
3. Serialize to canonical JSON (RFC 8785 preferred; deterministic compact form required).
4. Compute:
   `tools_hash = hex(BLAKE3(canonical_tools_json_bytes))`

Step 3: identity preimage

`fingerprint = "model:{model_norm}|prompt:{prompt_hash}|tools:{tools_hash}"`

Where:
- `model_norm = lowercase(trim(model_identifier))`

Step 4: final ID

`oag_id = hex(BLAKE3(utf8(fingerprint)))`

Output:
- 64-char lowercase hex string.

## 4.3 Validation Rules

An OAG-ID MUST:

- be exactly 64 chars,
- use only `[0-9a-f]`.

## 4.4 Signing

Required algorithm:
- Ed25519.

Standard publication signature:
- `signature = Sign(private_key, utf8(oag_id))`

Output:
- `signature` hex (128 chars),
- `public_key` hex (64 chars).

## 4.5 Nonce Generation

Nonces used in mutual auth MUST be:
- 32 bytes from a cryptographically secure RNG,
- encoded as 64-char lowercase hex.

## 5. Manifest Schema

## 5.1 Canonical Structure

Implementations MUST support a manifest equivalent to:

```yaml
spec_version: "0.1"
project:
  name: "my-agent"
  version: "1.0.0"
identity:
  model: "gpt-4o"
  system_prompt_path: "./prompts/system.md"
  tools_path: "./tools.json"
  system_prompt_hash: null
  tools_hash: null
capabilities:
  provides: ["summarize"]
  requires: []
discovery:
  tags: []
```

Required fields:

- `project.name`
- `project.version`
- `identity.model`
- `identity.system_prompt_path`
- `identity.tools_path`

## 5.2 File Formats

Manifest MAY be YAML or JSON.
Equivalent semantic content MUST produce equivalent identity inputs.

## 6. Policy Declaration

## 6.1 Canonical Policy Structure

Policy content MUST support categories equivalent to:

```json
{
  "spec_version": "0.1",
  "policy_id": "policy_default",
  "version": "1.0.0",
  "agent": {
    "models": {
      "allowed_models": ["gpt-4o"],
      "blocked_models": []
    }
  },
  "tools": {
    "allowed_tools": [{"name": "network:*"}, {"name": "files:[read]"}],
    "blocked_tools": ["files:delete"]
  },
  "permissions": {
    "network": {
      "enabled": true,
      "require_tls": true,
      "allowed_domains": ["api.example.com", "*.trusted.com"],
      "blocked_domains": ["*.evil.com"]
    },
    "filesystem": {
      "enabled": true,
      "allowed_paths": ["/app/data/*"],
      "blocked_paths": ["/etc/*"],
      "allowed_extensions": [".txt", ".json"]
    },
    "api": {
      "enabled": true,
      "allowed_services": [{"service_name": "crm"}]
    }
  },
  "rate_limits": {
    "per_agent": {
      "requests_per_minute": 60,
      "requests_per_hour": 1000,
      "tokens_per_minute": 20000
    }
  }
}
```

## 6.2 Policy Integrity Envelope (Optional)

A transport/storage envelope MAY be used:

```json
{
  "policy_id": "policy_default",
  "scope_id": "optional_scope_identifier",
  "version": "1.0.0",
  "status": "active",
  "hash": "hex_blake3_hash_of_content",
  "content": {},
  "signature": "optional_ed25519_signature_hex",
  "signing_key_id": "optional_key_id",
  "signing_public_key": "optional_public_key_hex"
}
```

Rules:

- `hash` MUST equal `BLAKE3(canonical_json(content))`.
- If signature fields exist, verifier MUST validate signature over:
  `"{policy_id}:{version}:{hash}"`.

## 7. Enforcement Contract

## 7.1 PolicyDecision

Runtime checks MUST return:

```json
{
  "allowed": false,
  "violations": [
    {
      "rule_id": "network.not_allowed",
      "rule_name": "Network allowlist",
      "message": "Domain foo.com is not in the allowlist",
      "capability": "network:http_get"
    }
  ],
  "warnings": []
}
```

Semantics:

- `allowed=true`: action MAY proceed.
- `allowed=false`: action MUST be blocked, unless explicit override mode is enabled.
- `warnings` are advisory and MUST NOT negate violations.

## 7.2 Rule Categories

Implementations SHOULD support:

- `network.*`
- `fs.*`
- `tool.*`
- `model.*`
- `api.*`
- `rate_limit.*`

## 7.3 Policy Precedence

Required precedence:

1. Explicit block rules (`blocked_*`) override all.
2. Explicit allow rules (`allowed_*`) permit when matched.
3. If allowlist exists and no match, deny.
4. If neither list is set, allow (unless default-deny policy is configured by implementation).

## 7.4 Matching Semantics

## 7.4.1 Domain matching

- `*` matches all domains.
- `*.example.com` matches `example.com` and any subdomain.
- `example.com` matches exact domain only.

Evaluation order:

1. blocked list, then
2. allowed list.

## 7.4.2 Filesystem path matching

- `prefix/*` matches prefix subtree.
- `prefix*` matches prefix string.
- otherwise exact match.

Evaluation order:

1. blocked paths,
2. allowlist check (if configured),
3. extension constraints (if configured).

## 7.4.3 Tool matching

Supported forms:

- exact match: `file_read`
- category wildcard: `files:*`
- category subset: `files:[read,write]`
- glob-like wildcard: `network:*` or `http_*`

`blocked_tools` MUST be evaluated before `allowed_tools`.

## 7.5 Override Mode

If an implementation supports development override:

- it MUST downgrade denies to warnings only when explicitly enabled,
- it MUST emit audit evidence for each overridden violation,
- it MUST provide a visible runtime warning that override mode is active.

## 8. Runtime Enforcement Hooks

Conforming runtimes SHOULD provide interception points for:

1. pre-model-call
2. pre-tool-execution
3. post-tool-execution
4. pre-network-egress
5. pre-filesystem-access
6. on-policy-violation

Hook names are implementation-defined; behavior requirements are normative.

## 9. Audit Event Specification

## 9.1 Event Schema

All enforcement-relevant actions SHOULD produce an audit event:

```json
{
  "spec_version": "0.1",
  "event_id": "uuid",
  "timestamp": "2026-02-16T00:00:00Z",
  "agent_id": "oag_id_hex",
  "scope_id": "optional_scope_identifier",
  "session_id": "optional_session_id",
  "trace_id": "optional_trace_id",
  "event_type": "tool_execution",
  "severity": "info",
  "action": {
    "kind": "tool_call",
    "name": "network:http_get",
    "resource": "https://api.example.com/data"
  },
  "decision": {
    "result": "allowed",
    "rule_id": "network.allowed",
    "reason": "Domain allowlisted"
  },
  "event_data": {},
  "metadata": {},
  "evidence_hash": "optional_blake3_hash",
  "prev_event_hash": "optional_hash_chain_link",
  "signature": "optional_ed25519_signature_hex"
}
```

Minimum required fields:

- `event_id`
- `timestamp`
- `agent_id`
- `event_type`
- `decision.result` in `allowed|denied|warned`

## 9.2 Standard Event Types

Implementations SHOULD support:

- `tool_execution`
- `model_call`
- `policy_violation`
- `policy_check`
- `network_access`
- `file_access`
- `health`

## 9.3 Severity Levels

- `debug`
- `info`
- `warn`
- `error`

## 9.4 Event Signing (Optional but Recommended)

When signing is enabled:

1. Remove `signature` field from event object.
2. Canonicalize JSON.
3. Hash canonical bytes with BLAKE3 (recommended).
4. Sign hash (or canonical bytes) with Ed25519.
5. Store signature as lowercase hex.

Verifiers MUST know which signing input strategy is used (hash-first vs direct-bytes) to verify correctly.

## 9.5 Event Chaining (Optional)

Implementations MAY include `prev_event_hash` to form tamper-evident chains.

Recommended:
- `current_event_hash = BLAKE3(canonical_event_without_signature)`
- `prev_event_hash = previous current_event_hash`

## 9.6 Sensitive Data Handling

Implementations SHOULD:

- redact credentials/tokens/secrets,
- mask PII when policy requires,
- bound payload sizes with truncation markers.

## 10. Verification Workflows

## 10.1 Local Verification

A local verifier MUST be able to:

1. Recompute OAG-ID from manifest inputs.
2. Validate policy integrity envelope (if present).
3. Validate audit event schema and required fields.
4. Verify signatures when provided.

## 10.2 Networked Verification (Informative, Optional)

A verifier MAY use remote directory/registry services to:

- resolve public keys and metadata,
- fetch trust status,
- correlate evidence across sessions/scopes.

## 10.3 Verification Result (Recommended)

Recommended result shape:

```json
{
  "passed": true,
  "security_score": 84,
  "compliance_score": 78,
  "issues_summary": {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 4,
    "info": 3
  },
  "recommendations": [],
  "timestamp": "2026-02-16T00:00:00Z"
}
```

Scoring models are implementation-specific unless a profile standardizes them.

## 11. Optional Interop Profiles

This section is informative unless explicitly adopted by an implementation profile.

## 11.1 Trust Headers Profile (HTTP)

Recommended header keys:

- `X-OAG-Agent-ID`
- `X-OAG-Signature`
- `X-OAG-Timestamp`
- `X-OAG-Nonce`

Optional trust metadata:

- `X-OAG-Verification-Status`
- `X-OAG-Risk-Level`
- `X-OAG-Credentials`
- `X-OAG-Reputation`

Receivers SHOULD validate signature, freshness, and nonce replay protection when these headers are used.

## 11.2 Mutual Authentication Handshake Profile

Three-step flow:

1. `HandshakeHello` with client nonce
2. `HandshakeWelcome` with server nonce + signature over client nonce
3. `HandshakeAuth` with signature over server nonce

Message types:

```json
{"client_nonce":"hex_32_bytes"}
```

```json
{"agent_id":"oag_id_hex","agent_nonce":"hex_32_bytes","signature_c":"hex_sig","credentials":[]}
```

```json
{"signature_a":"hex_sig"}
```

Both parties verify signatures using known public keys for claimed identities.

## 11.3 A2A Type Profile

Implementations MAY expose A2A-compatible types:

- `AgentCard`
- `A2AMessage`
- `A2ATask` and task state machine
- JSON-RPC request/response envelopes
- SSE task update events

The transport profile is intentionally optional for v0.1 core conformance.

## 12. Conformance Levels

Core conformance:

Level 1: Identity + Policy Declaration
- Sections 4, 5, 6

Level 2: Runtime Enforcement
- Level 1 + Sections 7, 8

Level 3: Verifiable Audit Trail
- Level 2 + Sections 9, 10.1

Implementations SHOULD publish declared level.

## 13. Deployment Assurance Levels (Optional Classification)

This optional classification can be used in audits/procurement:

- D1 Self-Attested: local-only identity/policy/audit
- D2 Witnessed: external witness authority stores signed audit evidence
- D3 Orchestrated: external policy authority manages signed policy rollouts
- D4 Directory-Verified: trust directory validation across organizations

## 14. Security Considerations

Minimum requirements:

- private keys MUST NOT be committed to source control
- nonce reuse MUST be prevented in handshake contexts
- timestamp freshness checks SHOULD be enforced for replay-sensitive flows
- policy signatures SHOULD be verified before policy activation
- implementers SHOULD bound resource usage (payload size, request rates)
- audit sinks SHOULD fail visibly (not silently) when delivery fails

## 15. Versioning and Compatibility

- version field: `spec_version`
- this document specifies `0.1`
- minor updates MAY add optional fields
- major updates MAY change required semantics and MUST provide migration guidance

Legacy behavior MAY be supported, but implementations MUST document:

- which sections are not implemented,
- any divergences from canonical identity or matching rules.

## 16. Extension Model

Extensions MUST be namespaced.

Recommendations:

- capabilities: `namespace:capability`
- metadata keys: `namespace.key`
- unknown fields: ignore by default unless a profile marks them required

## 17. References

- RFC 2119 (normative language)
- RFC 8032 (Ed25519)
- BLAKE3 specification
- RFC 8785 (JSON Canonicalization Scheme)

## 18. Appendix A - Minimal Conformance Checklist

Level 1 checklist:

- [ ] OAG-ID algorithm implemented exactly
- [ ] required manifest fields supported
- [ ] policy schema categories supported

Level 2 checklist:

- [ ] enforcement decision contract returned on governed actions
- [ ] rule precedence implemented
- [ ] domain/path/tool matching semantics implemented

Level 3 checklist:

- [ ] audit event schema implemented
- [ ] signature verification supported (if signatures are emitted)
- [ ] local verification workflow available

## 19. Appendix B - Editor Notes

This final draft consolidates strengths from:

- `oss/open-spec-claude.md` (precision in semantics),
- `oss/open-spec-copilot.md` (coverage of examples and interop profiles),
- `oss/open-spec-codex.md` (neutral normative core and conformance structure),
- `oss/spec.md` (clear role model and assurance layering).

