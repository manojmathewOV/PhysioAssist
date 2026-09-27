#!/usr/bin/env python3
"""Generate runbook views. Native CCore declaration validation is not gate acceptance."""
from pathlib import Path
import argparse,hashlib,json,sys,shlex,re

def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def row(tag,**fields):return tag+' '+' '.join(k+'='+json.dumps(str(v),ensure_ascii=False) for k,v in fields.items())

def bind_predicate_roots(lines):
 # Standard canonical row-tile byte rule, verified against the native inspector.
 records=[(tokens[0],dict(t.split('=',1) for t in tokens[1:])) for tokens in map(shlex.split,lines)]
 def scalar(value):
  return json.dumps(value,ensure_ascii=False) if any(c.isspace() or c in '\\"' for c in value) else value
 def canonical(tag,fields):
  return tag+' '+' '.join(k+'='+scalar(v) for k,v in sorted(fields.items()))
 for tag,fields in records:
  if tag!='dod.contract': continue
  predicates=[(t,f) for t,f in records if t=='validation.predicate' and f['dod']==fields['id']]
  refs={f['validation_ref'] for _,f in predicates}
  selected=predicates+[(t,f) for t,f in records if t=='validation.request' and f['id'] in refs]
  selected.sort(key=lambda pair:(pair[0],sorted(pair[1].items())))
  tile='\n'.join(canonical(t,f) for t,f in selected)
  fields['predicate_set_root']='sha256:'+hashlib.sha256(tile.encode()).hexdigest()
 return [row(t,**f) for t,f in records]

def render(m,vm):
 ids=[g['id'] for g in m['gates']];tests={x['id']:x for x in vm['criteria']}
 c=[row('@',v='μrunbook0.4',ops='ccore1.0.6',fmt='unicode',lifecycle='semantic_authority',auth='R3',compat='conform'),
 row('summary.what',role='runbook_definition',id='physioassist_ios_patient_mvp',scope='owner_requested_patient_only_local_first_iPhone_MVP',consumer='ai_coder|ccore.runbook'),
 row('summary.claim',target='claim.G10',claim_ceiling='declarations_only_no_implementation_clinical_or_release_acceptance',acceptance='independent_owner_meet'),
 row('summary.flow',state='drafted',convergence='narrowing',focus='G01',next='G01_native_dependency_portability',blockers='hosted_Pods_failure|feature_scoped_owner_decisions'),
 row('runbook.identity',id='physioassist_ios_patient_mvp',project_identity='sha256:da5e294123e29de3b6f46e1c59011bd453b843b4063436f27736ab078bf79754',definition_hash='sha256:'+digest(m),owner='Manoj'),
 row('runbook.epoch_template',baseline=m['baseline']['application_sha'],topology='acceptance_dependency_DAG',amendment='freeze_or_next_epoch')]
 for i,g in enumerate(m['gates']):
  n=g['id'];cl='claim.'+n;dod='dod.'+n;b='budget.'+n;vs=g['validation_ids']
  c.append(row('claim.unit',id=cl,subject=n,predicate=g['outcome'],ceiling='declared_outcome_not_observed',owner=g['acceptance']['acceptor']))
  c.append(row('run.node',id=n,name=g['title'],scope='runbook.json#/gates/'+str(i),owner=g['owner'],salience=100-i*5,state='declared',after='none',dod=dod,budget=b))
  c.append(row('dod.contract',id=dod,claim=cl,behavior=g['outcome'],oracle='independent_evidence_review_not_yet_observed',negative='|'.join(vs),profiles=tests[vs[0]]['evidence_class'],integration='acceptance_requires:' + ('|'.join(g['depends_on']) or 'none'),rollback=g['recovery'],subject=n,scope='runbook.json#/gates/'+str(i)+'/definition_of_done',blast_owner=g['owner'],positive='defined_in_validation-matrix.json',oracle_independence='executor_cannot_self_accept',evidence_owner=g['acceptance']['acceptor'],evidence_grade='required_not_observed',freshness_key='source_sha+fixture_hash+method+toolchain',invalidation_refs='source_or_requirement_or_counterexample_changed',residual_policy='no_critical_open_defect_at_accepted_scope',claim_ceiling='declaration_only',terminal_receiver='owner_and_independent_reviewer',wake_key='STATUS.json',predicate_refs='|'.join('predicate.'+x for x in vs),predicate_set_root='sha256:'+digest([tests[x] for x in vs])))
  c.append(row('budget.contract',id=b,owner=g['owner'],attempts=2,wall_ms=1200000,cost_units=1,cost_unit='bounded_engineering_probe',review_after_ms=300000,exhaustion='bounded_residual',escape='record_blocker_and_discriminating_RCA'))
  c.append(row('loop.contract',id='loop.'+n,node=n,trigger='failed_or_contradictory_evidence',target=cl,observe='record_exact_failure_and_basis',act='smallest_scoped_repair',progress='new_evidence_not_repeated_command',budget=b,stop='acceptance_submission_or_named_hard_blocker',escape='owner_or_independent_review'))
  c.append(row('evidence.graph.edge',id='evidence.'+n,**{'from':cl,'to':'validation-matrix.json#'+n,'relation':'requires'}))
  for d in g['depends_on']:c.append(row('dependency.dag.step',id=d+'_to_'+n,**{'from':d,'to':n,'relation':'acceptance_requires'}))
  for t in vs:
   x=tests[t];vid='validation.'+t
   c.append(row('validation.request',id=vid,owner=x['executor'],action='verify_declared_criterion',intent=x['scenario'],scope=n,language='mixed',module='PhysioAssist',source_path='agent-handover/runbooks/ios-patient-mvp/validation-matrix.json',target=t,profile=x['evidence_class']))
   c.append(row('validation.predicate',id='predicate.'+t,dod=dod,validation_ref=vid,claim_ref=cl,claim_kind='declared_gate_outcome',predicate=t,oracle_kind=x['evidence_class'],oracle_state_root='not_observed',contract_ref='validation-matrix.json#'+t,expected_observation='criterion_holds_with_positive_and_negative_controls',claim_ceiling='declared_expectation_not_executed'))
 c.append(row('vector.chunk',id='frontier',members='G00|G01|G02',purpose='integration_then_data_safety',salience=100))
 c.append(row('vector.chunk',id='long_horizon',members='|'.join(ids),purpose='useful_patient_MVP_without_clinician_backend',salience=50))
 c.append(row('terminal.contract',id='terminal.patient_mvp',members='|'.join(ids),reducer='independent_meet',residual_policy='no_critical_gap_or_unapproved_claim',acceptance_owner='Manoj_and_independent_required_reviewers'))
 return '\n'.join(bind_predicate_roots(c))+'\n'

def markdown(m,vm):
 tests={x['id']:x for x in vm['criteria']};lines=['# iPhone patient MVP — remaining execution roadmap','',f"Revision {m['revision']}. Stable gates G00–G10; no gate accepted by this declaration. Actual progress is in [STATUS.json](STATUS.json).",'', '## Order and end points','', 'G00 coordination and evidence -> G01 trustworthy integrated baseline -> G02 local data safety -> G03 registration/ownership + G04 programme meaning -> G05 patient journey -> G06 schedules + G07 media/accessibility -> G08 measured capabilities + G09 native journeys -> G10 pilot/release decision.','', 'Dependencies govern acceptance, not all safe preparatory work. Use [PROGRESSION.md](PROGRESSION.md) for states, start/stop rules, recovery and independent acceptance.','']
 for ep in m['endpoints']:lines+=['**'+ep['id']+' — '+ep['name']+':** '+ep['meaning'],'']
 for g in m['gates']:
  lines+=['## '+g['id']+' — '+g['title'],'','**Outcome:** '+g['outcome'],'','**Closure requires:** '+(', '.join(g['depends_on']) or 'No prior gate')+'. **Executor:** '+g['owner']+'. **Acceptor:** '+g['acceptance']['acceptor']+'.','', '**Next bounded work:** '+g['next_work_item']['candidate_action'],'','**Remaining work:**']
  lines+=['- '+s for s in g['remaining_work']]
  lines+=['','**Required validation:**']+['- **'+t+'** '+tests[t]['scenario'] for t in g['validation_ids']]
  lines+=['','**Deliverables:** '+'; '.join(g['deliverables'])+'.','', '**Decision dependencies:** '+(', '.join(g['decision_dependencies']) or 'None for this engineering declaration')+'.','', '**DoD:** all mandatory validation IDs, exact implementation/evidence coordinates, independent acceptance, no critical unresolved defect, satisfied closure prerequisites and the eleven axes in `runbook.json`.','', '**Recovery:** '+g['recovery'],'', '**Reopen:** changed source/dependency/protocol/method/platform or conflicting observation, scoped to affected claims.','']
 return '\n'.join(lines)+'\n'
def matrix_md(vm):
 l=['# Validation matrix — planned versus observed','',f"{len(vm['criteria'])} named scenarios. All entries are planned for this runbook revision unless an exact evidence reference explicitly records a result. This count is not a count of executed application tests.",'','| ID | Gate | Evidence class | Required scenario |','|---|---|---|---|']
 for x in vm['criteria']:l.append('| '+x['id']+' | '+x['gate']+' | '+x['evidence_class']+' | '+x['scenario'].replace('|',' / ')+' |')
 l+=['','Required evidence: source SHA, criterion ID, fixture/protocol identity, command or observed task, result, evidence type, recorder and limits. Native and human evidence have additional fields in `validation-matrix.json`.','', 'An unavailable/opt-in dataset does not validate a clinical endpoint. A method/endpoint change reopens affected observation comparisons. Historical evidence stays pinned rather than being copied into new pass states.']
 return '\n'.join(l)+'\n'
def main():
 a=argparse.ArgumentParser();a.add_argument('--check',action='store_true');args=a.parse_args();p=Path(__file__).resolve().parents[1];m=json.loads((p/'runbook.json').read_text());v=json.loads((p/'validation-matrix.json').read_text())
 out={'ROADMAP.cnp':render(m,v),'RUNBOOK.md':markdown(m,v),'TEST_MATRIX.md':matrix_md(v)}
 if args.check:
  wrong=[n for n,text in out.items() if not (p/n).exists() or (p/n).read_text()!=text]
  if wrong: print('Generated views differ: '+', '.join(wrong));return 1
  print('Three generated views match manifest/matrix. This is not native or clinical acceptance.')
 else:
  for n,text in out.items():(p/n).write_text(text)
  print('Generated CCore declaration, roadmap and matrix; no execution or acceptance effect.')
 return 0
if __name__=='__main__':sys.exit(main())
