> **STATUS: SUPERSEDED**
> This document has been superseded by `oss/specs/oags-v0.1.md`.
> It is retained for historical reference only.

# Agent Governance Protocol (AGP) v0.1

**Version:** 0.1.0
**Status:** Draft / Initial Release
**Editor:** Sekuire Engineering
**Date:** February 16, 2026
**License:** Apache 2.0

---

## 1. Introduction

The Agent Governance Protocol (AGP) defines a standardized framework for the identity, policy enforcement, and auditability of AI agents. It ensures that autonomous systems operate within verifiable safety and security constraints.

### 1.1 Design Principles
*   **Runtime Enforceable:** Policies must be enforceable during execution, not just logged post-hoc.
*   **Cryptographically Verifiable:** All behavioral claims must be backed by digital signatures.
*   **Implementation Agnostic:** The protocol works across programming languages, models, and platforms.
*   **Offline Capable:** Core primitives (Identity, Local Enforcement) MUST work without internet connectivity.

### 1.2 Terminology
*   **Agent (Subject):** An autonomous AI unit that executes actions.
*   **AGP-ID:** A content-addressable, deterministic identifier for an agent.
*   **Policy Manifest:** A declarative document defining the "sandbox" for an agent.
*   **Enforcement Point:** A runtime interceptor that evaluates actions against a policy.
*   **Witness Event:** An immutable, signed record of a governed action and decision.
*   **Verifier:** An actor that validates identity, policy integrity, or behavioral evidence.

### 1.3 Scope
AGP defines:
1.  **Identity (AGP-ID):** A deterministic, content-addressable fingerprint for agent configuration.
2.  **Policy Manifest:** A declarative schema for runtime constraints (Network, FS, Tools).
3.  **System Roles:** A vendor-neutral architecture for governance participants.
4.  **Enforcement Decision:** A standardized contract for runtime intercepts.
5.  **Audit (Witness Events):** Cryptographically signed and chained behavioral proofs.
6.  **Trust Protocol:** Handshake and headers for secure agent-to-agent (A2A) interactions.

---

## 2. System Roles

The AGP ecosystem consists of four primary roles:

1.  **The Subject (Agent):** The autonomous entity being governed. It enforces policy locally and signs its behavior.
2.  **The Policy Authority:** An external service (or local config) that provides signed policy updates.
3.  **The Witness Authority:** An independent service that receives and archives audit events, providing third-party attestation.
4.  **The Trust Registry:** A directory mapping AGP-IDs to reputation and verification status.

---

## 3. Agent Identity (AGP-ID)

An agent's identity (AGP-ID) is a deterministic, 64-character hex string derived from its behavior-defining configuration.

### 3.1 The Hashing Algorithm (AGP-Fingerprint)
AGP v0.1 uses **BLAKE3**. The ID is computed over a canonicalized fingerprint string:

```
Fingerprint = "model:" + model_id + "|prompt:" + hex(BLAKE3(trimmed_prompt)) + "|tools:" + hex(BLAKE3(canonical_json_tools))
AGP-ID = hex(BLAKE3(Fingerprint))
```

### 3.2 Canonicalization Rules
*   **Prompt:** Leading/trailing whitespace is trimmed. Line endings normalized to `\n`.
*   **Tools:** Must be parsed as JSON and re-serialized in compact form with keys sorted alphabetically.
*   **Model:** Used as-is (e.g., `gpt-4o`).

### 3.3 Cryptographic Signing
Agents use **Ed25519** for signing claims.
*   **Public Key:** 32 bytes (64 hex characters).
*   **Private Key:** 64 bytes (128 hex characters).
*   **Signature:** 64 bytes (128 hex characters).

---

## 4. Manifest & Policy Schema

### 4.1 Agent Manifest (`sekuire.yml`)
The manifest describes the agent's identity, capabilities, and metadata.

```yaml
version: "0.1"
project:
  name: "support-agent"
  version: "1.2.0"
identity:
  model: "gpt-4o"
  system_prompt_path: "./prompt.md"
  tools_path: "./tools.json"
governance:
  network:
    enabled: true
    allowed_domains: ["*.stripe.com", "api.zendesk.com"]
    tls_required: true
  filesystem:
    enabled: true
    read_only: true
    allowed_paths: ["/tmp/workdir/*"]
  tools:
    allowed_tools: ["search:*", "file:read"]
    blocked_tools: ["system:*"]
  rate_limits:
    per_agent:
      requests_per_minute: 60
```

### 4.2 Enforcement Categories
| Category | Scope | Standard Rule IDs |
| :--- | :--- | :--- |
| **Network** | Egress control | `network.blocked`, `network.tls_required` |
| **Filesystem** | Local access | `fs.not_allowed`, `fs.read_only_violation` |
| **Tool** | Capability gating | `tool.blocked`, `tool.not_allowed` |
| **Model** | Provider control | `model.not_allowed` |
| **Rate Limit** | Throughput | `rate_limit.exceeded` |

---

## 5. Audit & Witness Events

### 5.1 Witness Event Schema
Every governed action MUST emit an event. Events SHOULD be chained using a Merkle link.

```json
{
  "event_id": "evt_abc123",
  "timestamp": "2026-02-16T10:00:00Z",
  "agent_id": "agp_5f3a...9d2e",
  "event_type": "tool_execution",
  "action": {
    "kind": "tool_call",
    "name": "network:http_get",
    "params": { "url": "https://api.stripe.com/v1/charges" }
  },
  "decision": { "allowed": true, "rule_id": "network.allowed" },
  "prev_event_hash": "optional_merkle_link",
  "signature": "sig_ed25519_..."
}
```

---

## 6. Handshake & Trust Protocol

### 6.1 Mutual Authentication
Mutual trust is established via a 3-step handshake:
1.  **HandshakeHello:** Client sends a 32-byte `client_nonce`.
2.  **HandshakeWelcome:** Agent responds with its `agent_id`, an `agent_nonce`, and `sig_agent(client_nonce)`.
3.  **HandshakeAuth:** Client responds with `sig_client(agent_nonce)`.

### 6.2 Trust Headers
When calling external services, agents SHOULD include:
*   `X-AGP-ID`: The 64-char hex AGP-ID.
*   `X-AGP-Verification`: Verification status (e.g., `verified`).
*   `X-AGP-Signature`: Ed25519 signature of the request payload.

---

## 7. Verification Protocol

The verification protocol allows a third party (the **Verifier**) to validate an agent's compliance posture:

1.  **Retrieve Manifest:** Fetch the `sekuire.yml` and the agent's Public Key.
2.  **Recalculate AGP-ID:** Recompute the BLAKE3 hash from the manifest inputs. If it doesn't match the claimed AGP-ID, the agent is **Unverified**.
3.  **Validate Signatures:** Verify that Witness Events are signed by the private key corresponding to the AGP-ID's public key.
4.  **Policy Re-evaluation:** Independently run the events against the manifest rules to ensure the recorded decisions match the expected policy outcomes.
5.  **Score Posture:** Apply scoring deductions for security issues (e.g., CVEs in agent dependencies) or compliance gaps (e.g., missing audit logs).

---

## 8. Compliance Levels

*   **Level 1 (Local):** Self-attested identity and local policy enforcement.
*   **Level 2 (Witnessed):** Signed events streamed to an independent **Witness Authority**.
*   **Level 3 (Orchestrated):** Policy managed by an **External Authority** via signed leases.
*   **Level 4 (Registry-Verified):** Identity and reputation validated by a global **Trust Registry**.

---

## Appendix: Implementation Reference
*   **Hashing:** BLAKE3 (32-byte output).
*   **Signing:** Ed25519 (RFC 8032).
*   **Encoding:** Lowercase Hex (Standard) or Base64 (Optional for metadata).
