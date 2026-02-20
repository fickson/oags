# Open Agent Governance Specification (OAGS)

An open specification for identity, policy, enforcement, audit, and verification of autonomous AI agents.

## Overview

OAGS defines **local-first governance primitives** that work across any language or runtime:

- **Deterministic Identity** — content-addressable agent IDs derived from code + prompt
- **Runtime Policy Enforcement** — policies enforced during execution, not just declared
- **Cryptographic Verification** — all claims backed by Ed25519 digital signatures
- **Mutual Authentication** — agent-to-agent trust handshake protocol
- **Signed Runtime Requests** — optional session-backed signatures for protected HTTP endpoints
- **Audit Trail** — structured, tamper-evident audit logging

## Specifications

- **[Start Here](specs/README.md)** - Recommended reading order for first-time implementers.
- **[5-Minute Quickstart](specs/quickstart-5-minutes.md)** - Fastest path from clean clone to first conformance run.
- **[OAGS v0.1](specs/oags-v0.1.md)** - The core specification: identity, policy, enforcement, audit, verification, trust headers, handshake, and A2A types (v0.1.1, Draft).
- **[sekuire.yml Schema](specs/sekuire-yml-schema.md)** - Canonical file format reference for `sekuire.yml` / `sekuire.json`. Defines the unified manifest + policy + SDK extension schema.
- **[Conformance Harness](specs/conformance-harness.md)** - Runner/adapters and profile execution contract.
- **[Conformance Matrix](specs/conformance-matrix.md)** - SDK conformance status across reference implementations.
- **[Profile Schemas](specs/profiles/)** - JSON schemas for each OAGS profile (identity, policy, audit, trust headers, handshake, A2A).
- **[Test Vectors](specs/test-vectors/)** - Shared test vectors for cross-implementation conformance testing.

## Website

The specification website is available at [oags.sekuire.ai](https://oags.sekuire.ai) and lives in the `website/` directory. It is a Next.js site that presents the spec content, conformance levels, implementation links, and community resources.

```bash
cd website
npm install
npm run dev
```

## Repository Structure

```
├── specs/
│   ├── README.md                 # Start-here index
│   ├── quickstart-5-minutes.md   # First implementation path
│   ├── oags-v0.1.md              # Core specification
│   ├── sekuire-yml-schema.md     # File format reference
│   ├── conformance-harness.md    # Harness usage guide
│   ├── conformance-matrix.md     # SDK conformance status
│   ├── profiles/                 # JSON profile schemas
│   └── test-vectors/             # Shared conformance vectors
├── examples/
│   ├── customer-support/         # Policy with restrictions and custom rules
│   ├── research-assistant/       # Full-featured (manifest + policy + SDK)
│   ├── minimal-agent/            # Bare minimum Level 1 conformance
│   └── multi-provider/           # LLM provider configuration variants
├── website/                      # Next.js specification website
├── LICENSE                       # Apache 2.0
├── CHANGELOG.md                  # Spec/docs change history
├── CONTRIBUTING.md               # Contribution guidelines
└── CODE_OF_CONDUCT.md
```

Each example is a self-contained agent project with a `sekuire.yml`, `system_prompt.md`, and `tools.json`.

## Examples

| Example | Description |
|---------|-------------|
| [customer-support](examples/customer-support/) | Billing and ticket agent with network/filesystem restrictions, tool allowlists, rate limits, custom rules for refund approval, and compliance metadata on sensitive tools |
| [research-assistant](examples/research-assistant/) | Full-featured example showing all three zones: manifest with capabilities/discovery/deployment, policy, and SDK extensions (LLM, memory, logger) |
| [minimal-agent](examples/minimal-agent/) | Bare minimum Level 1 conformance - just `spec_version`, `project`, `identity`, and one tool |
| [multi-provider](examples/multi-provider/) | Shows how the same agent can target different LLM providers by changing the SDK extension section |

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

For spec-related issues or pull requests, use the `[OAGS-Spec]` prefix in the title.

## License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2024-present Sekuire, Inc.
