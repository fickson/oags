# Open Agent Governance Specification (OAGS)

An open specification for identity, policy, enforcement, audit, and verification of autonomous AI agents.

## Overview

OAGS defines **local-first governance primitives** that work across any language or runtime:

- **Deterministic Identity** — content-addressable agent IDs derived from code + prompt
- **Runtime Policy Enforcement** — policies enforced during execution, not just declared
- **Cryptographic Verification** — all claims backed by Ed25519 digital signatures
- **Mutual Authentication** — agent-to-agent trust handshake protocol
- **Audit Trail** — structured, tamper-evident audit logging

## Specification

The canonical spec is [`specs/oags-v0.1.md`](specs/oags-v0.1.md) (v0.1.0, Draft).

## Repository Structure

```
├── specs/          # Canonical specification
├── examples/       # Reference governance artifacts
├── LICENSE         # Apache 2.0
├── CONTRIBUTING.md # Contribution guidelines
└── CODE_OF_CONDUCT.md
```

## Examples

See [`examples/`](examples/) for reference policy and governance workflow artifacts.

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting.

For spec-related issues or pull requests, use the `[OAGS-Spec]` prefix in the title.

## License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2024-present Sekuire, Inc.
