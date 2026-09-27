#!/usr/bin/env python3
"""Check portable plan structure, not implementation or clinical acceptance."""
from __future__ import annotations
import copy
import json
from pathlib import Path
import re
import shlex
import sys

AXES = {'outcome_predicate','material_invariants','known_failure_modes','consequence',
        'irreversibility','owner_constraints','composition_boundary','falsifier_classes',
        'unknown_policy','residual_tolerance','reopen_triggers'}
STATES = {'planned','in_progress','blocked','implemented_pending_review','accepted','reopened','deferred'}

def validate(manifest: dict, state: dict, research: dict) -> list[str]:
    errors: list[str] = []
    gates = manifest.get('gates', [])
    ids = [g.get('id') for g in gates]
    if not gates or len(set(ids)) != len(ids): errors.append('missing or duplicate gates')
    by_id = {g.get('id'): g for g in gates}
    if manifest.get('entry_gate') not in by_id: errors.append('unknown entry gate')
    if state.get('current_gate') not in by_id: errors.append('unknown current gate')
    if set(state.get('gate_states', {})) != set(ids): errors.append('status does not cover exact gate set')
    if state.get('runbook_revision') != manifest.get('revision'): errors.append('revision mismatch')
    for key in ('application_sha','handover_sha'):
        if not re.fullmatch('[0-9a-f]{40}', manifest.get('baseline', {}).get(key, '')):
            errors.append(f'invalid pinned {key}')
    for g in gates:
        i = g.get('id')
        for key in ('outcome','owner','implementation','acceptance_tests','deliverables','recovery'):
            if not g.get(key): errors.append(f'{i}: missing {key}')
        deps = g.get('depends_on', [])
        if len(deps) != len(set(deps)): errors.append(f'{i}: duplicate dependency')
        for d in deps:
            if d not in by_id or d == i: errors.append(f'{i}: invalid dependency {d}')
        axes = dict(manifest.get('definition_of_done_defaults', {}))
        dod = g.get('definition_of_done', {})
        for axis in ('outcome_predicate','known_failure_modes','falsifier_classes'):
            field = dod.get(axis+'_ref')
            if field not in g: errors.append(f'{i}: unresolved DoD field {axis}')
            else: axes[axis] = g[field]
        if set(axes) != AXES or any(v is None or v == '' for v in axes.values()):
            errors.append(f'{i}: incomplete eleven-axis DoD')
        s = state.get('gate_states', {}).get(i)
        if s not in STATES: errors.append(f'{i}: invalid state')
        if s == 'accepted':
            acceptance = g.get('acceptance', {})
            if acceptance.get('state') != 'accepted' or not acceptance.get('implementation_sha') or not acceptance.get('evidence_manifest'):
                errors.append(f'{i}: accepted without evidence coordinates')
            if acceptance.get('acceptor') == g.get('owner'): errors.append(f'{i}: executor self-acceptance')
            if any(state['gate_states'].get(d) != 'accepted' for d in deps):
                errors.append(f'{i}: accepted with unaccepted prerequisites')
    visiting: set[str] = set(); visited: set[str] = set()
    def visit(i: str) -> None:
        if i in visiting:
            errors.append('dependency cycle'); return
        if i in visited or i not in by_id: return
        visiting.add(i)
        for d in by_id[i].get('depends_on', []): visit(d)
        visiting.remove(i); visited.add(i)
    for i in ids: visit(i)
    sources = research.get('sources', [])
    source_ids = {s.get('id') for s in sources}
    if len(source_ids) != len(sources): errors.append('duplicate source identity')
    for question in research.get('questions', []):
        if not set(question.get('sources', [])).issubset(source_ids): errors.append('unknown research source')
        if not set(question.get('affects', [])).issubset(set(ids)): errors.append('unknown research gate')
        if not question.get('falsifier'): errors.append('research question missing falsifier')
    return errors

def self_test(manifest: dict, state: dict, research: dict) -> int:
    cases = []
    m=copy.deepcopy(manifest);m['gates'][0]['depends_on']=['G10'];cases.append(('cycle',m,state,research))
    m=copy.deepcopy(manifest);m['gates'].append(copy.deepcopy(m['gates'][0]));cases.append(('duplicate gate',m,state,research))
    m=copy.deepcopy(manifest);del m['definition_of_done_defaults']['unknown_policy'];cases.append(('missing DoD axis',m,state,research))
    s=copy.deepcopy(state);s['gate_states']['G01']='accepted';cases.append(('unearned acceptance',manifest,s,research))
    s=copy.deepcopy(state);s['current_gate']='G99';cases.append(('missing frontier',manifest,s,research))
    r=copy.deepcopy(research);r['questions'][0]['sources']=['MISSING'];cases.append(('missing source',manifest,state,r))
    m=copy.deepcopy(manifest);m['baseline']['application_sha']='latest';cases.append(('unbound basis',m,state,research))
    for name,m,s,r in cases:
        if not validate(m,s,r): raise AssertionError('Mutant not caught: '+name)
    return len(cases)

def main() -> int:
    root=Path(__file__).resolve().parents[1]
    manifest=json.loads((root/'runbook.json').read_text())
    state=json.loads((root/'STATUS.json').read_text())
    research=json.loads((root/'research.json').read_text())
    errors=validate(manifest,state,research)
    # Check the CNP declaration projects the same declared gate identities.
    phases={}
    for line in (root/'ROADMAP.cnp').read_text().splitlines():
        if line.startswith('phase '):
            fields=dict(token.split('=',1) for token in shlex.split(line)[1:])
            phases[fields['id']]=fields
    if set(phases) != {g['id'] for g in manifest['gates']}: errors.append('CNP phase set drift')
    for g in manifest['gates']:
        if g['id'] in phases:
            p=phases[g['id']]
            if p['title'] != g['title'] or p['deps'] != ('|'.join(g['depends_on']) or 'none'):
                errors.append(g['id']+': CNP title/dependency drift')
    # Links outside this folder are checked after integration in the actual repo.
    missing=[]
    for p in root.rglob('*.md'):
        for link in re.findall(r'\]\(([^\s)]+)\)',p.read_text()):
            if '://' in link or link.startswith('#'): continue
            target=link.split('#',1)[0]
            resolved=(p.parent/target).resolve()
            if root in resolved.parents and not resolved.exists(): missing.append(f'{p.name}: {link}')
    errors.extend('missing local link '+s for s in missing)
    if errors:
        print(json.dumps({'status':'failed','errors':errors},indent=2));return 1
    mutants=self_test(manifest,state,research)
    print(json.dumps({'status':'passed','claim':'plan structural consistency only; no app/clinical acceptance',
      'gates':len(manifest['gates']),
      'acceptance_scenarios':sum(len(g['acceptance_tests']) for g in manifest['gates']),
      'dod_axes':len(AXES),'research_questions':len(research['questions']),
      'negative_mutations_detected':mutants,'accepted_implementation_gates':sum(v == 'accepted' for v in state['gate_states'].values())},indent=2))
    return 0

if __name__=='__main__':
    try: sys.exit(main())
    except (OSError,ValueError,KeyError,AssertionError) as exc:
        print('ERROR:',exc,file=sys.stderr);sys.exit(1)
