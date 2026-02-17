# OAG Conformance Matrix

This document tracks conformance of first-party SDK implementations against the
Open Agent Governance Specification (OAGS) shared test vectors and profile schemas.

## Conformance Levels

| Level | Requirements |
|-------|-------------|
| L1 - Core | Identity + Policy Enforcement + Audit event construction |
| L2 - Authenticated | L1 + Ed25519 Signing/Verification (Handshake profile) |
| L3 - Interoperable | L2 + A2A task delegation + Trust headers |

## Test Vector Results

### Identity (10 vectors)

Shared vectors: `packages/protocol/test-vectors/identity.json`

| Vector | Description | TypeScript | Rust | Python |
|--------|-------------|-----------|------|--------|
| reference | gpt-4o, simple prompt, empty tools | PASS | PASS | PASS |
| different_model | claude-3-opus, same prompt | PASS | PASS | PASS |
| with_tools | gpt-4o, tools object | PASS | PASS | PASS |
| prompt_whitespace_trim | leading/trailing whitespace | PASS | PASS | PASS |
| already_trimmed | no-op trim | PASS | PASS | PASS |
| empty_prompt | empty string prompt | PASS | PASS | PASS |
| tools_whitespace | JSON whitespace normalization | PASS | PASS | PASS |
| complex_tools | multi-tool array with params | PASS | PASS | PASS |
| anthropic_model | claude-3.5-sonnet | PASS | PASS | PASS |
| multiline_prompt | multi-line system prompt | PASS | PASS | PASS |

**Result: 10/10 all SDKs**

### Ed25519 Signing (3 vectors)

Shared vectors: `packages/protocol/test-vectors/signing.json`

| Vector | Description | TypeScript | Rust | Python |
|--------|-------------|-----------|------|--------|
| simple_message | "Hello, OAGS!" | PASS | PASS | PASS |
| empty_message | empty string | PASS | PASS | PASS |
| agent_id_message | 64-char hex agent ID | PASS | PASS | PASS |

**Result: 3/3 all SDKs**

### Policy Enforcement (19 vectors)

Shared vectors: `packages/protocol/test-vectors/policy-enforcement.json`

| Category | Vectors | TypeScript | Rust | Python |
|----------|---------|-----------|------|--------|
| Network | 5 (disabled, TLS, blocked, allowed, wildcard) | 5/5 | 5/5 | 5/5 |
| Filesystem | 4 (disabled, blocked, allowed, wildcard) | 4/4 | 4/4 | 4/4 |
| Tools | 3 (blocked, allowed, not in list) | 3/3 | 3/3 | 3/3 |
| Models | 3 (blocked, allowed, not in list) | 3/3 | 3/3 | 3/3 |
| API | 2 (disabled, not allowed) | 2/2 | 2/2 | 2/2 |
| Rate Limits | 2 (exceeded, within) | 2/2 | 2/2 | 2/2 |

**Result: 19/19 all SDKs**

Note: Python SDK has 4 pre-existing unit test failures in its own test suite
(`test_policy_enforcer.py`) related to edge cases in model blocking, tool
allow-any semantics, empty policy handling, and wildcard domain matching. These
are implementation-level bugs unrelated to the shared conformance vectors.

### Audit Event Construction

| Capability | TypeScript | Rust | Python |
|-----------|-----------|------|--------|
| Event schema matches OAG Audit v1.0 | YES | YES | YES |
| Batch request support | YES | YES | YES |
| Health heartbeat | YES | YES | YES |

## SDK Conformance Summary

| SDK | Version | L1 (Core) | L2 (Authenticated) | L3 (Interoperable) |
|-----|---------|-----------|-------------------|-------------------|
| TypeScript | 0.1.x | PASS | PASS | Not yet tested |
| Rust | 0.1.x | PASS | PASS | Not yet tested |
| Python | 0.1.x | PASS | PASS | Not yet tested |

L3 conformance requires A2A task delegation and trust header generation, which
are currently defined in the profile schemas but not yet implemented as testable
SDK features.

## Profile Schema Coverage

| Profile | Type | Schema | TS | Rust | Python |
|---------|------|--------|-----|------|--------|
| Identity v1.0 | Core | `oag-identity-v1.0.schema.json` | Implemented | Implemented | Implemented |
| Policy v1.0 | Core | `oag-policy-v1.0.schema.json` | Implemented | Implemented | Implemented |
| Audit v1.0 | Core | `oag-audit-v1.0.schema.json` | Implemented | Implemented | Implemented |
| Trust Headers v1.0 | Optional | `oag-trust-headers-v1.0.schema.json` | Partial | N/A | N/A |
| Handshake v1.0 | Optional | `oag-handshake-v1.0.schema.json` | Partial | N/A | N/A |
| A2A v1.0 | Optional | `oag-a2a-v1.0.schema.json` | Partial | N/A | N/A |

## How to Run

```bash
# TypeScript
pnpm -C packages/sdks/typescript test

# Rust
cargo test -p sekuire-sdk

# Python
cd packages/sdks/python && python -m pytest tests/ -q
```

## Adding Test Vectors

Shared test vectors live in `packages/protocol/test-vectors/`. To add a new vector:

1. Add the vector to the appropriate JSON file
2. Run the TypeScript SDK as reference implementation to generate expected values
3. Verify all 3 SDKs produce identical results
4. Update this matrix
