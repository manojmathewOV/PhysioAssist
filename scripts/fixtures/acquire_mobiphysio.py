#!/usr/bin/env python3
"""Bounded CC0 Dataverse v3 development batch. No model training or test-set selection."""
from pathlib import Path
import hashlib,json,subprocess,time
import argparse
a=argparse.ArgumentParser();a.add_argument('--repo',required=True);a.add_argument('--output',required=True);args=a.parse_args()
R=Path(args.repo).resolve();D=Path(args.output).resolve()
if D==R or R in D.parents:raise ValueError('Raw identifiable benchmark media must remain outside the repository')
(D/'metadata').mkdir(parents=True,exist_ok=True)
metadata=D/'metadata/dataverse-v3.json'
if not metadata.exists():
 subprocess.run(['curl','--fail','--location','--max-time','90','https://dataverse.harvard.edu/api/datasets/:persistentId/versions/3.0?persistentId=doi:10.7910/DVN/XSI0QN','-o',str(metadata)],check=True)
D.chmod(0o700)
M=json.loads((R/'docs/benchmarks/mobiphysio-pilot-manifest.json').read_text())
V=json.loads((D/'metadata/dataverse-v3.json').read_text())['data']
assert V['license']['rightsIdentifier']=='CC0-1.0' and V['versionNumber']==3
files={x['dataFile']['id']:x for x in V['files']}
selected=[v for v in M['videos'] if v['group']=='inspection' and v['participant'] in ['P05','P09'] and ((v['exercise']=='E01' and v['angle'] in ['F','R'] and v['variation'] in ['FL','LL','O']) or (v['exercise']=='E03' and v['angle']=='F' and v['variation']=='FL'))]
assert 0<len(selected)<=10 and sum(v['bytes'] for v in selected)<300*1024**2
(D/'raw').mkdir(exist_ok=True);(D/'landmarks').mkdir(exist_ok=True)
result={'dataset':M['doi'],'license':V['license'],'version':'3.0','source_manifest_sha256':hashlib.sha256((R/'docs/benchmarks/mobiphysio-pilot-manifest.json').read_bytes()).hexdigest(),'selection':'inspection P05/P09 E01 F/R FL/LL/O plus E03 F/FL; existing holdout participants untouched','files':[]}
for v in selected:
 f=files[v['id']];d=f['dataFile'];assert not f['restricted'] and d['filename']==v['file'] and d['checksum']['value']==v['md5']
 dest=D/'raw'/v['file'];assert dest.parent==D/'raw' and not dest.is_symlink()
 md5=lambda p:hashlib.md5(p.read_bytes()).hexdigest()
 if not (dest.exists() and md5(dest)==v['md5']):
  if dest.exists(): raise RuntimeError('Existing cache checksum differs; inspect before replacement')
  partial=dest.with_suffix('.partial');assert not partial.is_symlink();p=subprocess.run(['curl','--fail','--location','--max-time','180','--retry','1','--retry-delay','2','--max-filesize',str(v['bytes']+1),'https://dataverse.harvard.edu/api/access/datafile/'+str(v['id']),'-o',str(partial)],capture_output=True,text=True)
  if p.returncode or not partial.exists() or partial.stat().st_size!=v['bytes'] or md5(partial)!=v['md5']:
   result['error']='Download/size/checksum failure for '+v['name'];(D/'acquisition.json').write_text(json.dumps(result,indent=2));raise RuntimeError(result['error'])
  partial.replace(dest)
 dest.chmod(0o600)
 result['files'].append({**v,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'verified':True})
 (D/'acquisition.json').write_text(json.dumps(result,indent=2));print('VERIFIED',v['name'],dest.stat().st_size,flush=True)
(D/'manifest.json').write_text(json.dumps({**M,'videos':selected,'note':'Current bounded development replay; not fresh holdout validation. No angle/rep ground truth in this corpus.'},indent=2))
print('COMPLETE',len(selected),'clips',sum(v['bytes'] for v in selected),'bytes',flush=True)
