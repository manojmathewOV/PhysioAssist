#!/bin/sh
# Full-suite clean-exit check (P08). Usage: sh jest-clean-exit.sh [log-dir]; run from the repo root.
# Never uses --forceExit. PER_SUITE=1 additionally runs every suite alone.
LOGS=${1:-./jest-clean-exit-logs}
mkdir -p "$LOGS"
npx tsc --noEmit -p . && npx tsc --noEmit --project tsconfig.prepush.json && npx eslint src __tests__/setup.ts --quiet && echo "static: ok" || echo "static: FAILED"
for mode in "" "--runInBand" "--detectOpenHandles"; do
  name=${mode#--}; name=${name:-parallel}
  timeout 900 ./node_modules/.bin/jest --ci $mode > "$LOGS/$name.txt" 2>&1
  status=$?
  f="$LOGS/$name.txt"
  echo "$name: exit=$status $(grep -E '^Tests:' "$f") | forced=$(grep -c 'force exited' "$f") did_not_exit=$(grep -c 'did not exit' "$f") log_after_done=$(grep -c 'Cannot log after' "$f") open_handles=$(grep -c 'Jest has detected' "$f")"
done
if [ -n "$PER_SUITE" ]; then
  ./node_modules/.bin/jest --listTests 2>/dev/null | while read -r suite; do
    out=$(timeout 180 ./node_modules/.bin/jest --runTestsByPath "$suite" --runInBand --watchman=false 2>&1)
    echo "$out" | grep -q 'did not exit' && echo "HANG $suite"
  done
  echo "per-suite: done (any HANG lines above are suites that kept Jest alive)"
fi
