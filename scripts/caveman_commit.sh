#!/usr/bin/env bash
# caveman_commit.sh
# Runs the opencode caveman-commit command and extracts the commit message
# starting with a conventional-commit header (type(scope):) up to the final
# closing triple backticks.
# Usage: ./caveman_commit.sh <number_of_commits>

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <number_of_commits>" >&2
  exit 1
fi

commit_count=$1

printf 'Generating %s commit message(s) with opencode...\n\n' "${commit_count}" >&2

# Execute the opencode command and capture its full output, silencing stderr
output=$(opencode run "/caveman-commit generate ${commit_count} commits; include body messages; outline the affected files for each" \
  --auto --no-replay --model opencode/muse-spark-1.3-contributor-free 2>/dev/null)

# Use Perl in slurp mode (-0777) to apply a greedy regex across the whole output.
# Captures from the first conventional-commit header (\w+\(.+\):) through the
# last "```" block (trailing .* is greedy), then strips all triple backticks
# from the extracted message.
perl -0777 -ne 'if (/(\w+\(.+?\):.*)```/s) { $m = $1; $m =~ s/```//g; print $m }' <<< "$output"