#!/usr/bin/env bash
# G01/I01: identical locked native tooling locally and in hosted CI.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 BUNDLE_FROZEN=true
export NO_FLIPPER=1
: "${BUNDLE_GEMFILE:=$ROOT/Gemfile}"
export BUNDLE_GEMFILE
if [ "$BUNDLE_GEMFILE" != "$ROOT/Gemfile" ]; then
  echo 'Refusing a different Gemfile for this native build.' >&2
  exit 2
fi
bundle check
bundle exec ruby -rcocoapods -rjson -rdigest -e '
  puts JSON.generate({ruby: RUBY_VERSION, cocoapods: Pod::VERSION,
    json: JSON::VERSION, xcodeproj: Xcodeproj::VERSION,
    gem_lock_sha256: Digest::SHA256.file("Gemfile.lock").hexdigest,
    pod_lock_sha256: Digest::SHA256.file("ios/Podfile.lock").hexdigest})
'
BEFORE="$(shasum -a 256 ios/Podfile.lock)"
(cd ios && bundle exec pod install --deployment)
AFTER="$(shasum -a 256 ios/Podfile.lock)"
if [ "$BEFORE" != "$AFTER" ]; then
  echo 'Frozen native install changed Podfile.lock; refusing success.' >&2
  exit 3
fi
