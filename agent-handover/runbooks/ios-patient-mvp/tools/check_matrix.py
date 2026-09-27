#!/usr/bin/env python3
"""Validate prospective criteria and reject unearned acceptance; not an app test."""
from pathlib import Path
import copy, hashlib, json, re, subprocess, sys
from check_runbook import validate as validate_runbook, validate_delivery


def validate(manifest, state, research, matrix):
    errors = validate_runbook(manifest, state, research) + validate_delivery(manifest, state)
    gates = {g['id']: g for g in manifest['gates']}
    criteria = matrix.get('criteria', [])
    ids = [c.get('id') for c in criteria]
    if len(ids) != len(set(ids)): errors.append('duplicate criterion')
    expected = [v for g in gates.values() for v in g.get('validation_ids', [])]
    if sorted(ids) != sorted(expected): errors.append('criterion coverage mismatch')
    if matrix.get('revision') != manifest['revision']: errors.append('matrix revision drift')
    for c in criteria:
        if c.get('gate') not in gates: errors.append('orphan criterion'); continue
        if c.get('id') not in gates[c['gate']]['validation_ids']: errors.append('wrong gate assignment')
        for key in ['scenario', 'evidence_class', 'executor', 'acceptor', 'fixture_policy']:
            if not c.get(key): errors.append('missing criterion '+key)
        if 'status' in c: errors.append('ambiguous legacy criterion status key')
        if c.get('state') == 'accepted':
            if not c.get('evidence_refs'): errors.append('accepted criterion lacks evidence')
            if c.get('acceptor') == c.get('executor'): errors.append('criterion self-acceptance')
            if c.get('evidence_class') in ['human_usability', 'physical_device', 'clinical_reference'] and c.get('observed_evidence_class') == 'synthetic':
                errors.append('synthetic evidence substituted for human or physical evidence')
    for g in gates.values():
        if state['gate_states'][g['id']] == 'accepted':
            if any(c.get('state') != 'accepted' for c in criteria if c['gate'] == g['id']):
                errors.append('gate accepted with unaccepted criteria')
    return errors


def main():
    root = Path(__file__).resolve().parents[1]
    m,s,r,v = [json.loads((root/p).read_text()) for p in ['runbook.json','STATUS.json','research.json','validation-matrix.json']]
    errors = validate(m,s,r,v)
    if errors: print(json.dumps({'status':'failed','errors':errors},indent=2)); return 1
    tests=[]
    def mutant(name, mutate):
        a,b,c,d = copy.deepcopy((m,s,r,v)); mutate(a,b,c,d)
        if not validate(a,b,c,d): raise AssertionError('undetected mutation: '+name)
        tests.append(name)
    mutant('duplicate criterion', lambda a,b,c,d: d['criteria'].append(copy.deepcopy(d['criteria'][0])))
    mutant('missing criterion', lambda a,b,c,d: d['criteria'].pop())
    mutant('orphan gate', lambda a,b,c,d: d['criteria'][0].update(gate='G99'))
    mutant('wrong gate', lambda a,b,c,d: d['criteria'][0].update(gate='G09'))
    mutant('missing scenario', lambda a,b,c,d: d['criteria'][0].update(scenario=''))
    mutant('missing evidence class', lambda a,b,c,d: d['criteria'][0].update(evidence_class=''))
    mutant('matrix revision', lambda a,b,c,d: d.update(revision=-1))
    mutant('unearned criterion', lambda a,b,c,d: d['criteria'][0].update(state='accepted'))
    mutant('self acceptance', lambda a,b,c,d: d['criteria'][0].update(state='accepted',evidence_refs=['synthetic-test'],acceptor=d['criteria'][0]['executor']))
    mutant('synthetic substituted for human', lambda a,b,c,d: d['criteria'][0].update(state='accepted',evidence_refs=['synthetic-test'],evidence_class='human_usability',observed_evidence_class='synthetic'))
    mutant('unknown source', lambda a,b,c,d: c['questions'][0].update(sources=['UNKNOWN']))
    mutant('unearned gate', lambda a,b,c,d: b['gate_states'].update(G00='accepted'))
    mutant('DoD axis removed', lambda a,b,c,d: a['definition_of_done_defaults'].pop('unknown_policy'))
    mutant('cyclic dependencies', lambda a,b,c,d: a['gates'][0].update(depends_on=['G10']))
    archive = root.parents[1]/'archive/2026-09-27-before-reconciliation/ARCHIVE.json'
    for entry in json.loads(archive.read_text())['files']:
        p=root.parents[2]/entry['archived_path']
        if hashlib.sha256(p.read_bytes()).hexdigest()!=entry['sha256']:
            raise AssertionError('archive bytes changed: '+entry['archived_path'])
    subprocess.run([sys.executable,str(root/'tools/render_cnp.py'),'--check'],check=True)
    print(json.dumps({'status':'passed','scope':'plan and archive consistency only','gates':len(m['gates']),'criteria':len(v['criteria']),'matrix_negative_mutations_detected':len(tests),'mutations':tests,'archive_bytes_verified':True,'accepted_gates':sum(x=='accepted' for x in s['gate_states'].values())},indent=2))
    return 0

if __name__=='__main__':
    try: sys.exit(main())
    except (OSError,ValueError,KeyError,AssertionError,subprocess.CalledProcessError) as exc:
        print('ERROR:',exc,file=sys.stderr);sys.exit(1)
