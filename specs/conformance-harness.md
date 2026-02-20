# OAGS Conformance Harness

The canonical conformance runner and adapters currently live in the sibling platform workspace:

- Runner: `/Volumes/Work/code/sekuire/platform/packages/protocol/conformance/runner.py`
- Adapters:
  - `packages/protocol/conformance/adapters/typescript.sh`
  - `packages/protocol/conformance/adapters/python.sh`
  - `packages/protocol/conformance/adapters/rust.sh`

## Profiles

- `identity`
- `signing`
- `policy`

Test vectors consumed by the harness are mirrored in this repo under `specs/test-vectors/`.

## Usage

```bash
cd /Volumes/Work/code/sekuire/platform
python3 packages/protocol/conformance/runner.py \
  --adapter packages/protocol/conformance/adapters/typescript.sh --verbose
```

```bash
python3 packages/protocol/conformance/runner.py \
  --adapter packages/protocol/conformance/adapters/rust.sh --profile identity
```

```bash
python3 packages/protocol/conformance/runner.py \
  --adapter packages/protocol/conformance/adapters/python.sh --json
```

## Output Contract

The harness emits per-vector pass/fail and an aggregate summary.
Implementations should treat any failing vector as non-conformant for the selected profile.
