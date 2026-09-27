#!/usr/bin/env node
// The old downloader gate is retired. Check the actual supported source boundary.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const name of ['react-native-ytdl', '@react-native-camera-roll/camera-roll']) {
  assert(!pkg.dependencies[name], `Retired dependency is still declared: ${name}`);
}
assert(
  !fs.existsSync(
    path.join(root, 'src/features/videoComparison/services/youtubeService.ts')
  )
);
for (const name of [
  'src/components/video/ExerciseVideo.tsx',
  'src/components/video/playerDocument.ts',
  'src/components/exercises/useMovementAnalysis.ts',
  'src/services/movement/analysis.ts',
]) {
  assert(fs.existsSync(path.join(root, name)), `Required retained path missing: ${name}`);
}
console.log(
  'Downloader retirement source checks passed. This is not a runtime playback, clinical or release acceptance.'
);
