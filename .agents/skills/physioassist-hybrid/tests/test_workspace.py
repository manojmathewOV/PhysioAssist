import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

p=Path(__file__).resolve().parents[1]/'scripts/workspace.py'
spec=importlib.util.spec_from_file_location('workspace',p);w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)

class WorkspaceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        for n in ['repo','RDC/metadata','RDC/runs','RDC/cache','RDC/toolchain']:(self.root/n).mkdir(parents=True,exist_ok=True)
        self.repo=self.root/'repo';self.cfg={'owner':w.ID,'schema':1,'repo':'repo','runs':'RDC/runs','cache':'RDC/cache','toolchain':'RDC/toolchain','minimum_free_gib':0}
        w.atomic(self.root/'RDC/metadata/workspace.json',self.cfg)
        subprocess.run(['git','init','-q'],cwd=self.repo,check=True)
        for k,v in [('user.email','test@example.invalid'),('user.name','Test')]:subprocess.run(['git','config',k,v],cwd=self.repo,check=True)
        (self.repo/'fixture.txt').write_text('synthetic')
        subprocess.run(['git','add','.'],cwd=self.repo,check=True);subprocess.run(['git','commit','-qm','fixture'],cwd=self.repo,check=True)
        subprocess.run(['git','remote','add','origin','https://github.com/manojmathewOV/PhysioAssist.git'],cwd=self.repo,check=True)
        self.sha=w.git(self.repo,'rev-parse','HEAD')
    def tearDown(self):self.tmp.cleanup()
    def run_code(self,code,timeout=2):
        with patch.object(w,'environment',return_value=os.environ.copy()), patch.object(w,'command_for',return_value=([sys.executable,'-c',code],self.repo,timeout)):
            return w.execute(self.root,self.cfg,'typecheck',self.sha,False)
    def test_valid_marker(self):self.assertEqual(w.load(self.root)[1],self.cfg)
    def test_bad_marker_refused(self):
        w.atomic(self.root/'RDC/metadata/workspace.json',{})
        with self.assertRaises(ValueError):w.load(self.root)
    def test_traversal_refused(self):
        with self.assertRaises(ValueError):w.contained(self.root,'../outside')
    def test_absolute_refused(self):
        with self.assertRaises(ValueError):w.contained(self.root,'/tmp')
    def test_symlink_refused(self):
        (self.root/'escape').symlink_to(self.tmp.name)
        with self.assertRaises(ValueError):w.contained(self.root,'escape/file')
    def test_atomic_replace(self):
        p=self.root/'RDC/metadata/test.json';w.atomic(p,{'a':1});w.atomic(p,{'a':2});self.assertEqual(json.loads(p.read_text()),{'a':2})
    def test_second_job_lock_refused(self):
        with w.lock(self.root):
            with self.assertRaises(RuntimeError):
                with w.lock(self.root):pass
    def test_lock_released(self):
        with w.lock(self.root):pass
        with w.lock(self.root):pass
    def test_dry_run_preserves_cache(self):
        p=self.root/'RDC/cache/DerivedData';p.mkdir();(p/'dummy').write_text('cache')
        r=w.prune(self.root,self.cfg,None);self.assertFalse(r['applied']);self.assertTrue(p.exists())
    def test_changed_digest_refused(self):
        with self.assertRaises(RuntimeError):w.prune(self.root,self.cfg,'0'*64)
    def test_tracked_cache_refused(self):
        p=self.repo/'dist';p.mkdir();(p/'source.txt').write_text('not disposable')
        subprocess.run(['git','add','dist'],cwd=self.repo,check=True)
        with self.assertRaises(RuntimeError):w.prune(self.root,self.cfg,None)
    def test_fingerprint_changes(self):
        p=self.root/'RDC/cache/test';p.mkdir();(p/'a').write_text('a');before=w.fingerprint(p);(p/'a').write_text('different');self.assertNotEqual(before,w.fingerprint(p))
    def test_wrong_head_refused(self):
        with self.assertRaises(RuntimeError):w.execute(self.root,self.cfg,'test','0'*40,False)
    def test_dirty_refused(self):
        (self.repo/'new').write_text('candidate')
        with self.assertRaises(RuntimeError):w.execute(self.root,self.cfg,'test',self.sha,False)
    def test_success_recorded(self):
        r=self.run_code("print('done')");self.assertEqual(r['state'],'passed');self.assertEqual(r['exit_code'],0)
    def test_failure_recorded(self):
        r=self.run_code('raise SystemExit(3)');self.assertEqual(r['state'],'failed');self.assertEqual(r['exit_code'],3)
    def test_warning_is_not_clean_success(self):
        r=self.run_code("print('A worker process has failed to exit gracefully')");self.assertEqual(r['exit_code'],0);self.assertEqual(r['state'],'failed')
    def test_timeout_recorded(self):
        r=self.run_code('import time; time.sleep(20)',timeout=0.1);self.assertEqual(r['state'],'timeout')
    def test_unique_run_records(self):
        a=self.run_code('print(1)');b=self.run_code('print(2)');self.assertNotEqual(a['run_id'],b['run_id'])
    def test_commands_have_resource_limits(self):
        out=self.root/'RDC/runs/example'
        cmd,_,_=w.command_for('test',self.root,self.cfg,self.repo,out);self.assertIn('--maxWorkers=2',cmd);self.assertNotIn('--forceExit',cmd)
        cmd,_,_=w.command_for('ios-build',self.root,self.cfg,self.repo,out);self.assertEqual(cmd[cmd.index('-jobs')+1],'2')
    def test_pods_frozen(self):
        cmd,cwd,_=w.command_for('pods',self.root,self.cfg,self.repo,self.root)
        self.assertEqual(cmd, ['bash', 'scripts/ci/install-pods.sh'])
        self.assertEqual(cwd, self.repo)
        # Freeze and failure semantics are executed by scripts/ci/tests/test_install_pods.py.
    def test_simulator_signing_is_adhoc_only(self):
        cmd,_,_=w.command_for('ios-build',self.root,self.cfg,self.repo,self.root)
        self.assertIn('iphonesimulator',cmd)
        self.assertIn('CODE_SIGN_IDENTITY=-',cmd)
        self.assertIn('CODE_SIGNING_ALLOWED=YES',cmd)
        self.assertNotIn('CODE_SIGNING_ALLOWED=NO',cmd)
    def test_existing_ruby_configuration_is_reused(self):
        (self.repo/'.nvmrc').write_text('18.17.0')
        node=self.root/'RDC/toolchain/node-v18.17.0-darwin-arm64/bin'
        node.mkdir(parents=True);(node/'node').touch()
        ruby=self.root/'ruby-bin';ruby.mkdir();(ruby/'ruby').touch();(ruby/'bundle').touch()
        gems=self.root/'existing-gems';gems.mkdir()
        self.cfg.update(ruby_bin=str(ruby),gem_home=str(gems))
        with patch.object(w.subprocess,'check_output',return_value='v18.17.0'):
            env=w.environment(self.root,self.cfg,self.repo)
        self.assertEqual(env['PATH'].split(':')[:2],[str(node),str(ruby)])
        self.assertEqual(env['GEM_HOME'],str(gems))
    def test_missing_configured_ruby_is_not_installed(self):
        (self.repo/'.nvmrc').write_text('18.17.0')
        node=self.root/'RDC/toolchain/node-v18.17.0-darwin-arm64/bin'
        node.mkdir(parents=True);(node/'node').touch()
        self.cfg['ruby_bin']=str(self.root/'absent-ruby')
        with self.assertRaises(RuntimeError):w.environment(self.root,self.cfg,self.repo)
        self.assertFalse((self.root/'absent-ruby').exists())
    def test_unsupported_action_refused(self):
        with self.assertRaises(ValueError):w.command_for('shell-from-PR',self.root,self.cfg,self.repo,self.root)

if __name__=='__main__':unittest.main(verbosity=2)
