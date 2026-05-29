#!/usr/bin/env bash
# Demonstrates Unix pipe and shell composition patterns for codejson-crosswalk.
# Requires: Node.js 18+, jq
# Run with: bash pipeline.sh

set -euo pipefail

# ── 1. Pipe via stdin ─────────────────────────────────────────────────────────
echo "=== Pattern 1: stdin → stdout ==="
cat code.json | npx --yes codejson-crosswalk --to codemeta

# ── 2. Capture output in a shell variable and extract a field with jq ─────────
echo ""
echo "=== Pattern 2: capture to variable, extract field with jq ==="
CODEMETA=$(cat code.json | npx --yes codejson-crosswalk --to codemeta)
echo "codeRepository: $(echo "$CODEMETA" | jq -r '.codeRepository')"
echo "developmentStatus: $(echo "$CODEMETA" | jq -r '.developmentStatus')"
echo "license: $(echo "$CODEMETA" | jq -r '.license')"

# ── 3. Round-trip: code.json → codemeta → code.json ───────────────────────────
# Note: fields that exist only in code.json (laborHours, organization, etc.)
# are not present in codemeta and will revert to empty defaults after the trip.
echo ""
echo "=== Pattern 3: round-trip (code.json → codemeta → code.json) ==="
echo "Fields preserved:"
cat code.json \
  | npx --yes codejson-crosswalk --to codemeta \
  | npx --yes codejson-crosswalk --to codejson \
  | jq '{name, status, repositoryURL, version}'

# ── 4. Inline transform with jq before conversion ─────────────────────────────
echo ""
echo "=== Pattern 4: modify a field with jq before converting ==="
cat code.json \
  | jq '.status = "Production"' \
  | npx --yes codejson-crosswalk --to codemeta \
  | jq '.developmentStatus'

echo ""
echo "Done."
