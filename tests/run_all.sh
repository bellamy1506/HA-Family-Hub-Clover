#!/usr/bin/env bash
# House fork: every test, one command. Runs them all, then exits nonzero if
# any failed. CI (.github/workflows/tests.yml) runs this on every pull request.
# Run: bash tests/run_all.sh
set -u
cd "$(dirname "$0")/.."
failed=()
for t in tests/*.js; do
  node "$t" || failed+=("$t")
done
python3 -m unittest discover -s tests || failed+=("python unittest")
node tests/browser/test_board_open.js || failed+=("tests/browser/test_board_open.js")
if [ ${#failed[@]} -gt 0 ]; then
  printf 'FAILED: %s\n' "${failed[@]}"
  exit 1
fi
echo "all tests passed"
