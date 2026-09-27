#!/usr/bin/env python3
"""Render the portable CNP declaration. This is not native CCore admission."""
from pathlib import Path
import argparse, json, sys

def render(m):
 q=lambda v:json.dumps(str(v),ensure_ascii=False)
 c=['@ v=μrunbook0.4 ops=ccore1.0.6 fmt=unicode lifecycle=authoritative_durable consumer=ai_coder|ccore.runbook auth=R2 compat=claim_capped',
 'summary.what role=contract id=physioassist_ios_patient_mvp title="iPhone patient-only local-first MVP" consumer=ai_coder lifecycle=authoritative_durable auth=R2 compat=claim_capped',
 'summary.claim claim=plan_authored claim_ceiling=declaration_only_no_implementation_or_clinical_acceptance basis=runbook.json validation=portable_structure_only_native_inspection_refused claim_effect=no_claim_uplift',
 'summary.flow state=planned convergence=narrowing focus=G00 next=reconcile_current_basis_and_decisions blockers=owner_decisions_and_implementation_evidence_open zoom=z0',
 'runbook.identity runbook_id=physioassist_ios_patient_mvp schema=μrunbook0.4 epoch=design1 active_epoch_frozen=false parent_programme=PhysioAssist adoption_class=external_patient_app',
 'runbook.intent source=user date=2026-09-27 statement="iPhone first patient app with registration, low-footprint local progress, approved instructions and future connection seams; no clinician platform in MVP"',
 'runbook.claim_wall allowed=plan_authored|source_inspected forbidden=application_implemented|clinical_approved|patient_validated|release_ready',
 'runbook.nonclaim compile_does_not_execute=true research_does_not_set_law=true agent_does_not_self_accept_terminal=true',
 'attention.frontier id=mvp.awareness short_term_need=G00 long_horizon_aim=independent_usable_local_patient_app why_here=user_scope_narrowed where_next=G01 claim_ceiling=plan_only owner_refs=DECISIONS.md|STATUS.json']
 for g in m['gates']:
  c.append('phase id='+g['id']+' title='+q(g['title'])+' serves_ref=runbook.intent state=unstarted deps='+('|'.join(g['depends_on']) or 'none')+' semantic_owner='+g['owner']+' accountable_custodian=implementation_lead reviewer=independent_reviewer acceptor=independent_reviewer output='+q('; '.join(g['deliverables'])))
  ax={**m['definition_of_done_defaults'],'outcome_predicate':g['outcome'],'known_failure_modes':g['risks'],'falsifier_classes':f"runbook.json#/gates/{int(g['id'][1:])}/acceptance_tests"}
  c.append('dod id=DOD.'+g['id']+' phase='+g['id']+' predicate='+q(g['outcome'])+' '+' '.join(k+'='+q('; '.join(v) if isinstance(v,list) else v) for k,v in ax.items())+' evidence=required_before_acceptance')
  for d in g['depends_on']: c.append('dependency.dag.step id='+d+'_to_'+g['id']+' from='+d+' to='+g['id']+' action=accept_prerequisite_and_reconcile_current_ground')
 c += ['residual status=open item=implementation_and_clinical_evidence next=G00 claim_effect=no_claim_uplift','drill.to question=complete_gate_definitions ref=runbook.json','drill.to question=current_progress ref=STATUS.json','drill.to question=source_and_uncertainty ref=RESEARCH.md']
 return '\n'.join(c)+'\n'

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
 root=Path(__file__).resolve().parents[1]; content=render(json.loads((root/'runbook.json').read_text())); target=root/'ROADMAP.cnp'
 if args.check:
  if target.read_text()!=content:
   print('CNP projection differs; regenerate and re-review.',file=sys.stderr);return 1
  print('CNP declaration matches JSON generator; native inspection remains refused.')
 else:
  target.write_text(content);print('Rendered declaration; no native admission effect.')
 return 0

if __name__=='__main__':
 try: sys.exit(main())
 except (OSError,ValueError,KeyError) as exc:
  print('ERROR:',exc,file=sys.stderr);sys.exit(1)
