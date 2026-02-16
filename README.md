# Open Agent Governance Specification (OAGS)

An open specification for identity, policy, enforcement, audit, and verification of autonomous AI agents.

## Overview

OAGS defines **local-first governance primitives** that work across any language or runtime:

- **Deterministic Identity** — content-addressable agent IDs derived from code + prompt
- **Runtime Policy Enforcement** — policies enforced during execution, not just declared
- **Cryptographic Verification** — all claims backed by Ed25519 digital signatures
- **Mutual Authentication** — agent-to-agent trust handshake protocol
- **Audit Trail** — structured, tamper-evident audit logging

## Specifications

- **[OAGS v0.1](specs/oags-v0.1.md)** - The core specification: identity, policy, enforcement, audit, verification, trust headers, handshake, and A2A types (v0.1.1, Draft).
- **[sekuire.yml Schema](specs/sekuire-yml-schema.md)** - Canonical file format reference for `sekuire.yml` / `sekuire.json`. Defines the unified manifest + policy + SDK extension schema.

## Repository Structure

```
├── specs/
│   ├── oags-v0.1.md              # Core specification
│   └── sekuire-yml-schema.md     # File format reference
├── examples/
│   ├── customer_support.yml      # Policy with restrictions and custom rules
│   ├── research_assistant.yml    # Full-featured (manifest + policy + SDK)
│   ├── minimal_agent.yml         # Bare minimum Level 1 conformance
│   └── multi_provider.yml        # LLM provider configuration variants
├── LICENSE                       # Apache 2.0
├── CONTRIBUTING.md               # Contribution guidelines
└── CODE_OF_CONDUCT.md
```

## Examples

| File | Description |
|------|-------------|
| [customer_support.yml](examples/customer_support.yml) | Customer support agent with network/filesystem restrictions, tool allowlists, rate limits, and custom rules for refund approval |
| [research_assistant.yml](examples/research_assistant.yml) | Full-featured example showing all three zones: manifest with capabilities/discovery/deployment, policy, and SDK extensions (LLM, memory, logger) |
| [minimal_agent.yml](examples/minimal_agent.yml) | Bare minimum Level 1 conformance - just `spec_version`, `project`, and `identity` |
| [multi_provider.yml](examples/multi_provider.yml) | LLM provider configuration variants: OpenAI, Anthropic, Google, Ollama, and custom/self-hosted |

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

For spec-related issues or pull requests, use the `[OAGS-Spec]` prefix in the title.

## License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2024-present Sekuire, Inc.
