"""G01/I01 wrapper controls, using no network or real CocoaPods installation."""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'install-pods.sh'

class InstallPodsTests(unittest.TestCase):
    def probe(self, mode):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'scripts/ci').mkdir(parents=True)
            (root / 'ios').mkdir()
            (root / 'bin').mkdir()
            shutil.copy2(SCRIPT, root / 'scripts/ci/install-pods.sh')
            (root / 'Gemfile').write_text('synthetic')
            (root / 'ios/Podfile.lock').write_text('original')
            bundle = root / 'bin/bundle'
            bundle.write_text('''#!/usr/bin/env bash
set -eu
printf '%s|%s|%s\\n' "$*" "$BUNDLE_FROZEN" "$NO_FLIPPER" >> "$PROBE_LOG"
case "$*" in
 check) [ "$PROBE_MODE" != missing ] || exit 9 ;;
 'exec ruby '*) exit 0 ;;
 'exec pod install --deployment')
   [ "$PROBE_MODE" != fail ] || exit 7
   if [ "$PROBE_MODE" = mutate ]; then echo changed > Podfile.lock; fi ;;
 *) exit 11 ;;
esac
''')
            bundle.chmod(0o755)
            env = os.environ.copy()
            env.pop('BUNDLE_GEMFILE', None)
            env.update(PATH=str(root / 'bin') + ':' + env['PATH'], PROBE_MODE=mode,
                       PROBE_LOG=str(root / 'calls'))
            if mode == 'foreign':
                env['BUNDLE_GEMFILE'] = str(root / 'other-Gemfile')
            result = subprocess.run(['bash', str(root / 'scripts/ci/install-pods.sh')],
                                    cwd=root, env=env, capture_output=True, text=True, timeout=10)
            calls = (root / 'calls').read_text() if (root / 'calls').exists() else ''
            return result.returncode, calls

    def test_success_uses_frozen_bundle_and_deployment(self):
        code, calls = self.probe('ok')
        self.assertEqual(code, 0)
        self.assertIn('exec pod install --deployment|true|1', calls)

    def test_pod_failure_survives(self):
        self.assertEqual(self.probe('fail')[0], 7)

    def test_missing_bundle_stops_before_pods(self):
        code, calls = self.probe('missing')
        self.assertEqual(code, 9)
        self.assertNotIn('exec pod', calls)

    def test_lock_mutation_refuses_success(self):
        self.assertEqual(self.probe('mutate')[0], 3)
