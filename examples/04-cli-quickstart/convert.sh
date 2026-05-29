#!/usr/bin/env bash
# Demonstrates every CLI invocation form for codejson-crosswalk.
# Run with: bash convert.sh

set -euo pipefail

# ── 1. File input → stdout ────────────────────────────────────────────────────
echo "=== code.json → codemeta (stdout) ==="
npx --yes codejson-crosswalk code.json --to codemeta

# ── 2. File input → output file ───────────────────────────────────────────────
echo ""
echo "=== code.json → codemeta (write to file) ==="
npx --yes codejson-crosswalk code.json --to codemeta --out out-codemeta.json
echo "Wrote out-codemeta.json"

# ── 3. Reverse direction: codemeta.json → code.json ──────────────────────────
echo ""
echo "=== codemeta.json → code.json (stdout) ==="
npx --yes codejson-crosswalk codemeta.json --to codejson

# ── 4. Short flags (-t and -o) ────────────────────────────────────────────────
echo ""
echo "=== Short flags: -t and -o ==="
npx --yes codejson-crosswalk code.json -t codemeta -o out-codemeta-short.json
echo "Wrote out-codemeta-short.json"

# ── 5. Pipe from stdin ────────────────────────────────────────────────────────
echo ""
echo "=== stdin pipe: cat code.json | codejson-crosswalk --to codemeta ==="
cat code.json | npx --yes codejson-crosswalk --to codemeta

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -f out-codemeta.json out-codemeta-short.json
echo ""
echo "Done."
