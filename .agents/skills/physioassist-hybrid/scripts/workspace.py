#!/usr/bin/env python3
"""Bounded, local PhysioAssist task runner. Standard library only; no daemon."""
from __future__ import annotations
import argparse
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import time
import uuid

ID = 'physioassist-hybrid-v1'
GIB = 1024 ** 3
WARNINGS = ('failed to exit gracefully', 'Jest has detected the following', 'Jest did not exit')

def atomic(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.tmp-' + uuid.uuid4().hex[:8])
    temp.write_text(json.dumps(value, indent=2) + '\n')
    os.replace(temp, path)

def contained(base: Path, rel: str) -> Path:
    part = Path(rel)
    if part.is_absolute() or '..' in part.parts or not part.parts:
        raise ValueError('A nonempty relative path without traversal is required')
    target = base / part
    here = base
    for component in part.parts:
        here = here / component
        if here.is_symlink():
            raise ValueError('Symlink is not an owned storage boundary: ' + rel)
    if not target.resolve().is_relative_to(base.resolve()):
        raise ValueError('Path escapes workspace')
    return target

def load(root: Path) -> tuple[Path, dict]:
    if root.is_symlink():
        raise ValueError('Landing root must not be a symlink')
    root = root.resolve()
    cfg = json.loads(contained(root, 'RDC/metadata/workspace.json').read_text())
    if cfg.get('owner') != ID or cfg.get('schema') != 1:
        raise ValueError('Unrecognised workspace marker')
    for key in ('repo', 'runs', 'cache', 'toolchain'):
        contained(root, cfg[key])
    return root, cfg

def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(['git', *args], cwd=repo, text=True, timeout=30).strip()

def allocated(path: Path) -> int:
    """Owned allocated blocks, no symlink traversal; APFS clones may share blocks."""
    if not path.exists():
        return 0
    total = path.lstat().st_blocks * 512
    if path.is_dir():
        for parent, dirs, files in os.walk(path, followlinks=False):
            dirs[:] = [d for d in dirs if not (Path(parent) / d).is_symlink()]
            for name in dirs + files:
                p = Path(parent) / name
                total += p.lstat().st_blocks * 512
    return total

@contextlib.contextmanager
def lock(root: Path):
    path = contained(root, 'RDC/metadata/execution.lock')
    with path.open('a+') as stream:
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError('Another managed job or cleanup is active; inspect status') from exc
        try:
            yield
        finally:
            fcntl.flock(stream, fcntl.LOCK_UN)

def inventory(root: Path, cfg: dict) -> dict:
    rows = []
    for rel in (cfg['repo'], cfg['runs'], cfg['cache'], cfg['toolchain'], 'RDC/skills', 'RDC/metadata'):
        p = contained(root, rel)
        rows.append({'path': rel, 'allocated_bytes': allocated(p)})
    return {'owner': ID, 'entries': rows, 'free_bytes': shutil.disk_usage(root).free,
            'note': 'Allocated blocks are not guaranteed unique physical APFS usage.'}

def fingerprint(path: Path) -> dict:
    """Metadata-bound cleanup plan; file contents are never assumed disposable."""
    if not path.exists():
        return {'exists': False}
    digest = hashlib.sha256()
    st = path.lstat()
    entries = [(path, '.')]
    if path.is_dir():
        for parent, dirs, files in os.walk(path, followlinks=False):
            dirs.sort(); files.sort()
            entries.extend((Path(parent) / name, str((Path(parent) / name).relative_to(path))) for name in dirs + files)
            dirs[:] = [d for d in dirs if not (Path(parent) / d).is_symlink()]
    for p, rel in entries:
        s = p.lstat()
        digest.update(json.dumps([rel, s.st_mode, s.st_size, s.st_mtime_ns, s.st_ino]).encode())
    return {'exists': True, 'inode': st.st_ino, 'metadata_sha256': digest.hexdigest(), 'entries': len(entries)}

def prune(root: Path, cfg: dict, apply_digest: str | None) -> dict:
    # Never recurse over the whole root or accept a path from a PR/job payload.
    rels = ['RDC/cache/DerivedData', 'RDC/cache/DerivedData-pre-move', 'RDC/cache/jest', 'repo/dist', 'repo/coverage']
    report = {'kind': 'disposable_build_cache_only', 'targets': []}
    for rel in rels:
        p = contained(root, rel)
        # Even allowed cache roots are refused if any member is tracked.
        if rel.startswith('repo/') and git(contained(root, cfg['repo']), 'ls-files', '--', rel[5:]):
            raise RuntimeError('Refusing tracked content: ' + rel)
        report['targets'].append({'path': rel, 'fingerprint': fingerprint(p), 'allocated_bytes': allocated(p)})
    digest = hashlib.sha256(json.dumps(report, sort_keys=True).encode()).hexdigest()
    report['plan_sha256'] = digest
    report['applied'] = False
    if apply_digest:
        if apply_digest != digest:
            raise RuntimeError('Cleanup plan changed; inspect a fresh dry-run')
        # No unmanaged process may use the workspace. This script's own argv may contain root.
        ps = subprocess.check_output(['ps', '-axo', 'pid,command'], text=True, timeout=10)
        for line in ps.splitlines()[1:]:
            parts = line.strip().split(None, 1)
            if len(parts) == 2 and int(parts[0]) not in (os.getpid(), os.getppid()) and str(root) in parts[1]:
                raise RuntimeError('Workspace process present; cleanup refused: PID ' + parts[0])
        for row in report['targets']:
            p = contained(root, row['path'])
            if fingerprint(p) != row['fingerprint']:
                raise RuntimeError('Cache changed before deletion')
            if p.exists():
                shutil.rmtree(p) if p.is_dir() else p.unlink()
        report['applied'] = True
    return report

def environment(root: Path, cfg: dict, repo: Path) -> dict:
    version = (repo / '.nvmrc').read_text().strip()
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Unsupported Node version declaration')
    bindir = contained(root, cfg['toolchain']) / ('node-v' + version + '-darwin-arm64') / 'bin'
    if not (bindir / 'node').is_file():
        raise RuntimeError('Pinned Node is not provisioned; install once with verified source/checksum')
    env = os.environ.copy()
    env.update({'PATH': str(bindir) + ':' + env.get('PATH', ''), 'CI': '1',
                'LANG': 'en_US.UTF-8', 'LC_ALL': 'en_US.UTF-8', 'NO_FLIPPER': '1',
                'NODE_OPTIONS': '--max-old-space-size=2048'})
    actual = subprocess.check_output([str(bindir / 'node'), '--version'], text=True, timeout=10).strip()
    if actual != 'v' + version:
        raise RuntimeError('Pinned Node version mismatch')
    return env

def command_for(action: str, root: Path, cfg: dict, repo: Path, out: Path):
    jest = ['node_modules/.bin/jest', '--ci', '--watchman=false', '--cacheDirectory=' + str(contained(root, 'RDC/cache/jest'))]
    choices = {
        'typecheck': (['npm', 'run', 'type-check'], repo, 180),
        'lint': (['npm', 'run', 'lint'], repo, 240),
        'test': (jest + ['--maxWorkers=2', '--json', '--outputFile=' + str(out / 'tests.json')], repo, 300),
        'test-handles': (jest + ['--detectOpenHandles'], repo, 360),
        'prepush': (['sh', '.husky/pre-push'], repo, 180),
        'pods': (['pod', 'install', '--deployment'], repo / 'ios', 600),
        'web-build': (['npm', 'run', 'build:web'], repo, 240),
        'ios-build': (['xcodebuild', '-workspace', 'ios/PhysioAssist.xcworkspace', '-scheme', 'PhysioAssist',
                      '-configuration', 'Release', '-sdk', 'iphonesimulator',
                      '-derivedDataPath', str(contained(root, 'RDC/cache/DerivedData')),
                      '-resultBundlePath', str(out / 'build.xcresult'), '-jobs', '2',
                      'ARCHS=arm64', 'ONLY_ACTIVE_ARCH=YES', 'COMPILER_INDEX_STORE_ENABLE=NO',
                      'CODE_SIGNING_ALLOWED=NO', 'build'], repo, 1200),
    }
    if action not in choices:
        raise ValueError('Unknown action')
    return choices[action]

def execute(root: Path, cfg: dict, action: str, expected_sha: str, allow_dirty: bool) -> dict:
    repo = contained(root, cfg['repo'])
    if not re.fullmatch('[a-f0-9]{40}', expected_sha) or git(repo, 'rev-parse', 'HEAD') != expected_sha:
        raise RuntimeError('Exact expected commit does not match checkout')
    remote = git(repo, 'remote', 'get-url', 'origin').removesuffix('.git')
    if remote not in ('https://github.com/manojmathewOV/PhysioAssist', 'git@github.com:manojmathewOV/PhysioAssist'):
        raise RuntimeError('Unexpected origin')
    dirty = git(repo, 'status', '--porcelain')
    if dirty and not allow_dirty:
        raise RuntimeError('Dirty checkout; review changes and explicitly use --allow-dirty for candidate testing')
    if shutil.disk_usage(root).free < cfg.get('minimum_free_gib', 20) * GIB:
        raise RuntimeError('Free disk below configured build reserve; inspect usage')
    if allocated(contained(root, cfg['cache'])) > cfg.get('cache_budget_gib', 8) * GIB:
        raise RuntimeError('Owned cache exceeds budget; inspect dry-run cleanup')
    env = environment(root, cfg, repo)
    if action == 'ios-build' and sys.platform == 'darwin':
        battery = subprocess.check_output(['pmset', '-g', 'batt'], text=True, timeout=10)
        if 'AC Power' not in battery:
            raise RuntimeError('Native build requires AC power under this profile')
    stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    run_id = stamp + '-' + action + '-' + uuid.uuid4().hex[:8]
    out = contained(root, cfg['runs']) / run_id
    out.mkdir(parents=True, exist_ok=False)
    cmd, cwd, timeout = command_for(action, root, cfg, repo, out)
    patch = subprocess.check_output(['git', 'diff', 'HEAD', '--binary'], cwd=repo)
    record = {'schema': 1, 'run_id': run_id, 'action': action, 'source_sha': expected_sha,
              'candidate_dirty': bool(dirty), 'status_before': dirty,
              'tracked_diff_sha256': hashlib.sha256(patch).hexdigest(),
              'untracked_files_are_not_attested': True, 'command': cmd, 'timeout_seconds': timeout,
              'state': 'running', 'owner_pid': os.getpid(), 'started_at': stamp,
              'claim_ceiling': 'command observation only; not visual, clinical or release acceptance'}
    (out / 'tracked.diff').write_bytes(patch)
    log = out / 'command.log'; proc = None; keeper = None; start = time.monotonic()
    def save():
        atomic(out / 'run.json', record)
        atomic(contained(root, 'RDC/metadata/last-run.json'), {'run_id': run_id, 'record': str((out / 'run.json').relative_to(root)), 'state': record['state']})
    save()
    try:
        with log.open('wb') as output:
            proc = subprocess.Popen(cmd, cwd=cwd, env=env, stdout=output, stderr=subprocess.STDOUT,
                                    start_new_session=True)
            record['child_pid'] = proc.pid
            save()
            if sys.platform == 'darwin':
                keeper = subprocess.Popen(['caffeinate', '-i', '-w', str(os.getpid())], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            while proc.poll() is None:
                if time.monotonic() - start > timeout:
                    record['state'] = 'timeout'; break
                if log.stat().st_size > 50 * 1024 ** 2:
                    record['state'] = 'log_budget_exceeded'; break
                time.sleep(0.2)
            if record['state'] != 'running':
                os.killpg(proc.pid, signal.SIGTERM)
                try: proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    os.killpg(proc.pid, signal.SIGKILL); proc.wait(timeout=10)
            record['exit_code'] = proc.wait()
        text = log.read_text(errors='replace')
        record['teardown_warning'] = any(word in text for word in WARNINGS)
        if record['state'] == 'running':
            record['state'] = 'passed' if record['exit_code'] == 0 and not record['teardown_warning'] else 'failed'
        record['head_after'] = git(repo, 'rev-parse', 'HEAD')
        if record['head_after'] != expected_sha:
            record['state'] = 'source_changed'
        if action == 'ios-build' and record['state'] == 'passed' and '** BUILD SUCCEEDED **' not in text:
            record['state'] = 'unconfirmed_build'
        record['log_sha256'] = hashlib.sha256(log.read_bytes()).hexdigest()
    except BaseException as exc:
        record['state'] = 'interrupted' if isinstance(exc, KeyboardInterrupt) else 'error'
        record['error'] = str(exc)
        if proc is not None and proc.poll() is None:
            os.killpg(proc.pid, signal.SIGTERM)
            try: proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL); proc.wait(timeout=10)
    finally:
        if keeper is not None: keeper.terminate(); keeper.wait(timeout=10)
        record['seconds'] = round(time.monotonic() - start, 2)
        save()
    return record

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('action', choices=['status','disk','prune','typecheck','lint','test','test-handles','prepush','pods','web-build','ios-build'])
    parser.add_argument('--expect-sha')
    parser.add_argument('--allow-dirty', action='store_true')
    parser.add_argument('--apply-digest')
    args = parser.parse_args(); root,cfg = load(args.root)
    if args.action == 'status':
        repo = contained(root, cfg['repo']); last = contained(root, 'RDC/metadata/last-run.json')
        result = {'source_sha': git(repo,'rev-parse','HEAD'), 'branch':git(repo,'branch','--show-current'),
                  'dirty':git(repo,'status','--short'), 'last_run':json.loads(last.read_text()) if last.exists() else None,
                  'no_background_agent': True}
    elif args.action == 'disk': result = inventory(root,cfg)
    else:
        os.nice(10)
        with lock(root):
            if args.action == 'prune':
                result = prune(root,cfg,args.apply_digest)
                if result['applied']: atomic(contained(root,'RDC/metadata/last-prune.json'),result)
            else:
                if not args.expect_sha: raise ValueError('--expect-sha is required for task execution')
                result = execute(root,cfg,args.action,args.expect_sha,args.allow_dirty)
    print(json.dumps(result,indent=2))
    return 0 if result.get('state','passed') == 'passed' else 1

if __name__ == '__main__':
    def interrupted(signum, frame):
        raise KeyboardInterrupt('Received signal ' + str(signum))
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGHUP, interrupted)
    try: sys.exit(main())
    except (OSError,ValueError,RuntimeError,subprocess.SubprocessError) as exc:
        print('Refused: '+str(exc),file=sys.stderr);sys.exit(2)
