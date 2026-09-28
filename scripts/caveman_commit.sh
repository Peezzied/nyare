#!/usr/bin/env bash
# caveman_commit.sh
# Runs the opencode caveman-commit command and extracts the commit message
# starting with a conventional-commit header (type(scope):) up to the final
# closing triple backticks.
# Usage: ./caveman_commit.sh <number_of_commits> [extra_instruction]

set -euo pipefail

# Ensure at least 1 argument is provided, but allow up to 2
if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <number_of_commits> [extra_instruction]" >&2
  exit 1
fi

commit_count=$1
# Use parameter expansion to default to an empty string if $2 is not provided
extra_instruction="${2:-}" 

printf 'Generating %s commit message(s) with opencode...\n\n' "${commit_count}" >&2

# Execute the opencode command and capture its full output, silencing stderr
output=$(opencode run "/caveman-commit generate ${commit_count} commits; include body messages; outline the affected files for each; ${extra_instruction}" \
  --auto --no-replay --model opencode/muse-spark-1.3-contributor-free 2>/dev/null)

perl -0777 -ne 'if (/(```.*)/s) { print $1 }' <<< "$output"