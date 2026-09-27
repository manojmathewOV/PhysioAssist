/** Node-only: read a gzipped recorded-patient fixture (tests and benchmarks). */
import fs from 'fs';
import zlib from 'zlib';
import type { RecordedFixture } from './RecordedPatient';

export const loadFixture = (file: string): RecordedFixture =>
  JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
