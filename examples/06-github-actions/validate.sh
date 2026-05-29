#!/usr/bin/env bash
# Validates that code.json converts to a well-formed codemeta.json with all
# required fields present. Exits 0 on success, 1 with a descriptive message
# on failure. Designed to be run locally or by a CI workflow.
#
# Requirements: Node.js 18+, jq

set -euo pipefail

CODEMETA=$(npx --yes codejson-crosswalk code.json --to codemeta)

check_field() {
  local field="$1"
  local value
  value=$(echo "$CODEMETA" | jq -r ".$field // empty")
  if [[ -z "$value" ]]; then
    echo "ERROR: Missing required field: $field" >&2
    return 1
  fi
  echo "  $field: $value"
}

echo "Validating codemeta output from code.json..."

check_field "name"
check_field "description"
check_field "codeRepository"
check_field "developmentStatus"
check_field "license"

CONTEXT=$(echo "$CODEMETA" | jq -r '.["@context"] // empty')
if [[ "$CONTEXT" != "https://w3id.org/codemeta/3.0" ]]; then
  echo "ERROR: @context is '${CONTEXT:-<missing>}', expected 'https://w3id.org/codemeta/3.0'" >&2
  exit 1
fi
echo "  @context: $CONTEXT"

TYPE=$(echo "$CODEMETA" | jq -r '.["@type"] // empty')
if [[ "$TYPE" != "SoftwareSourceCode" ]]; then
  echo "ERROR: @type is '${TYPE:-<missing>}', expected 'SoftwareSourceCode'" >&2
  exit 1
fi
echo "  @type: $TYPE"

echo ""
echo "Validation passed."
