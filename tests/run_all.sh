#!/usr/bin/env bash
# House fork: every test, one command. Runs them all, then exits nonzero if
# any failed. CI (.github/workflows/tests.yml) runs this on every pull request.
# Run: bash tests/run_all.sh
set -u
shopt -s nullglob
cd "$(dirname "$0")/.."
failed=()
skipped=()
for t in tests/*.js tests/browser/test_*.js; do
  out=$(node "$t" 2>&1)
  status=$?
  printf '%s\n' "$out"
  [ $status -ne 0 ] && failed+=("$t")
  printf '%s' "$out" | grep -q ': skipped' && skipped+=("$t")
done
python3 -m unittest discover -s tests || failed+=("python unittest")
[ ${#skipped[@]} -gt 0 ] && printf 'SKIPPED: %s\n' "${skipped[@]}"
if [ ${#failed[@]} -gt 0 ]; then
  printf 'FAILED: %s\n' "${failed[@]}"
  exit 1
fi
if [ ${#skipped[@]} -gt 0 ]; then echo "passed, with skips"; else echo "all tests passed"; fi
