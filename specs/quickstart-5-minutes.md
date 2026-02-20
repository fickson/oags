# OAGS Quickstart (5 Minutes)

This guide is the fastest path from zero to a valid OAGS Level 1 agent.

## Prerequisites

- A clone of this repo at `/Volumes/Work/code/sekuire/oags`
- Python 3.9+
- A sibling clone of the protocol harness at `/Volumes/Work/code/sekuire/platform`

## 1. Create a minimal OAGS project (1 minute)

Use the reference files under `examples/minimal-agent/`:

```bash
cd /Volumes/Work/code/sekuire/oags
mkdir -p /tmp/oags-quickstart
cp examples/minimal-agent/sekuire.yml /tmp/oags-quickstart/
cp examples/minimal-agent/system_prompt.md /tmp/oags-quickstart/
cp examples/minimal-agent/tools.json /tmp/oags-quickstart/
```

## 2. Validate required shape (1 minute)

```bash
python3 - <<'PY'
import re
from pathlib import Path

content = Path('/tmp/oags-quickstart/sekuire.yml').read_text()
required = ["spec_version", "project", "identity"]
missing = [key for key in required if not re.search(rf"(?m)^\s*{key}\s*:", content)]
if missing:
    raise SystemExit(f'Missing required keys: {missing}')
print('OK: minimal OAGS manifest shape is valid')
PY
```

## 3. Run conformance harness (2 minutes)

```bash
cd /Volumes/Work/code/sekuire/platform
python3 packages/protocol/conformance/runner.py \
  --adapter packages/protocol/conformance/adapters/typescript.sh --profile identity
```

Optional: run signing and policy profiles too.

```bash
python3 packages/protocol/conformance/runner.py \
  --adapter packages/protocol/conformance/adapters/typescript.sh --profile signing

python3 packages/protocol/conformance/runner.py \
  --adapter packages/protocol/conformance/adapters/typescript.sh --profile policy
```

## 4. Confirm expected outcome (1 minute)

A passing run should report all vectors as `pass` for the selected profile(s).

If any vector fails:
- Confirm your implementation uses canonical JSON normalization for tool definitions.
- Confirm test vectors match `specs/test-vectors/`.
- Re-run with `--verbose` for per-vector diagnostics.
