#!/usr/bin/env bash
# House fork: every test, one command. Runs them all, then exits nonzero if
# any failed. CI (.github/workflows/tests.yml) runs this on every pull request.
# Run: bash tests/run_all.sh
set -u
shopt -s nullglob
cd "$(dirname "$0")/.."
failed=()
skipped=()
log=$(mktemp)
trap 'rm -f "$log"' EXIT
for t in tests/*.js tests/browser/test_*.js; do
  # Output streams as it runs; the copy in $log is checked for a skip.
  node "$t" 2>&1 | tee "$log"
  [ "${PIPESTATUS[0]}" -ne 0 ] && failed+=("$t")
  grep -q ': skipped' "$log" && skipped+=("$t")
done
# Date checks again in three zones (borrow.md, item 2): New York is home and
# behind UTC, Sydney is ahead with its clock changes in the other half of the
# year, and UTC is where CI runs. A test opts in with a line starting
# "// Rerun in three zones". A zone that changes clocks must show different
# January and July offsets, or its runs would prove nothing.
for zone in America/New_York Australia/Sydney UTC; do
  if [ "$zone" != UTC ] && ! TZ="$zone" node -e 'process.exit(new Date(2026, 0, 1).getTimezoneOffset() === new Date(2026, 6, 1).getTimezoneOffset() ? 1 : 0)'; then
    failed+=("$zone: no clock change seen, so its date checks prove nothing")
    continue
  fi
  for t in $(grep -l '^// Rerun in three zones' tests/*.js); do
    TZ="$zone" node "$t" || failed+=("$t under $zone")
  done
done
python3 -m unittest discover -s tests || failed+=("python unittest")
[ ${#skipped[@]} -gt 0 ] && printf 'SKIPPED: %s\n' "${skipped[@]}"
if [ ${#failed[@]} -gt 0 ]; then
  printf 'FAILED: %s\n' "${failed[@]}"
  exit 1
fi
if [ ${#skipped[@]} -gt 0 ]; then echo "passed, with skips"; else echo "all tests passed"; fi
