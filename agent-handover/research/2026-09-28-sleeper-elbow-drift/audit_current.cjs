// Read-only synthetic probe against the supplied checkout; never a patient test.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(process.argv[2]);
const load = createRequire(path.join(root, 'package.json'));
const ts = load('typescript');
require.extensions['.ts'] = function(module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText, filename);
};
const { analyseSession } = require(path.join(root, 'src/services/movement/analysis.ts'));
const { appliesTo } = require(path.join(root, 'src/services/movement/compensations.ts'));
const frames = Array.from({length: 241}, (_, i) => {
  const phase = (i % 120) / 120;
  return { t: i * 33, angle: 10 + 80 * Math.sin(Math.PI * phase), landmarks: [], view: 'front' };
});
const ctx = { joint: 'shoulder', side: 'left', exerciseId: 'shoulder-external-rotation' };
const supplied = { id: 'elbow_from_side', severity: 'warn', value: 19.2, unit: 'deg', durationMs: 450 };
const result = analyseSession(frames, ctx, {}, { detect: () => [supplied] });
const finding = result.findings.find(f => f.id === supplied.id);
if (!result.reps.length || !finding) throw Error('Positive control absent');
const output = {scope:'Production aggregation with injected synthetic detection; NOT sleeper accuracy',
  repetitions:result.reps.length, detector_input:supplied, aggregate_output:finding,
  quantitative_fields_retained:['value','unit','durationMs'].filter(k=>k in finding),
  external_rotation_detector_applies:appliesTo('elbow_from_side',ctx),
  sleeper_detector_applies:appliesTo('elbow_from_side',{...ctx,exerciseId:'sleeper-stretch'})};
let holdCalls = 0;
const hold = analyseSession(frames.map(f => ({...f, angle:6, view:'side'})),
  {joint:'knee',side:'left',exerciseId:'heel-prop-extension'}, {},
  {detect:() => { holdCalls++; return [supplied]; }});
output.held_assessment_control = {result:hold.result.status, compensation_callback_calls:holdCalls};
if (hold.result.status !== 'measured') throw Error('Held positive control absent');
console.log(JSON.stringify(output,null,2));
