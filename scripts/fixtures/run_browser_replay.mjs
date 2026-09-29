#!/usr/bin/env node
// Bounded RGB benchmark. Existing browser/toolchain only; no download or training.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const flags = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, xs) => i % 2 ? a : [...a, [x.replace(/^--/, ''), xs[i+1]]], []));
for (const name of ['repo','data','out','playwright','chrome']) if (!flags[name]) throw new Error(`Missing --${name}`);
const repo = path.resolve(flags.repo), data = path.resolve(flags.data), out = path.resolve(flags.out);
if (out === repo || out.startsWith(repo + path.sep)) throw new Error('Evidence/media output must be outside Git');
fs.mkdirSync(out, { recursive: true });
const load = createRequire(path.join(repo, 'package.json'));
const webpack = load('webpack');
const config = load(path.join(repo, 'webpack.config.js'))({}, { mode: 'production' });
config.mode = 'production'; config.entry = path.join(repo, 'src/testing/videoPatient/browserReplay.ts');
config.output = { path: path.join(out, 'bundle'), filename: 'replay.js', clean: true };
config.optimization = { minimize: false }; config.devtool = false;
await new Promise((resolve, reject) => webpack(config, (error, stats) => {
  if (error || stats.hasErrors()) return reject(error || new Error(stats.toString({ all:false, errors:true })));
  fs.writeFileSync(path.join(out,'build.txt'), stats.toString({ all:false, warnings:true, assets:true })); resolve();
}));
const { chromium } = await import(pathToFileURL(path.join(path.resolve(flags.playwright), 'index.mjs')).href);
const manifest = JSON.parse(fs.readFileSync(path.join(data, 'manifest.json'), 'utf8'));
const hash = (file, kind='sha256') => crypto.createHash(kind).update(fs.readFileSync(file)).digest('hex');
const allowed = new Map(manifest.videos.map(v => [v.file, path.join(data, 'raw', v.file)]));
for (const v of manifest.videos) if (hash(allowed.get(v.file),'md5') !== v.md5) throw new Error('Raw checksum mismatch');
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = pathname.startsWith('/raw/') ? allowed.get(pathname.slice(5)) :
    pathname === '/replay.js' ? path.join(out,'bundle/replay.js') :
    pathname === '/' ? path.join(out,'bundle/index.html') : undefined;
  if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  const size = fs.statSync(file).size, range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  const start = range ? Number(range[1]) : 0, end = range && range[2] ? Math.min(Number(range[2]), size-1) : size-1;
  if (start > end || start < 0) { res.writeHead(416);res.end();return; }
  res.writeHead(range ? 206 : 200, { 'Content-Type':file.endsWith('.mp4')?'video/mp4':file.endsWith('.js')?'text/javascript':'text/html',
    'Content-Length':end-start+1,'Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${size}`}:{}) });
  fs.createReadStream(file,{start,end}).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath:flags.chrome, headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const report = { sourceSha:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),
  diffSha256:crypto.createHash('sha256').update(execFileSync('git',['diff'],{cwd:repo})).digest('hex'),
  entrySha256:hash(config.entry), browser:await browser.version(), dataset:manifest.doi,
  participants:[...new Set(manifest.videos.map(v=>v.participant))],
  scope:'Inspection-only RGB replay of web inference; no angle or rep reference truth, no native/device/clinical validation',
  assets:{}, results:[], errors:[] };
const save = () => fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
for (const v of manifest.videos) if (!['E01','E03'].includes(v.exercise)) throw new Error('Unmapped exercise');
const jobs = manifest.videos.map(v => ({v, transform:'none'}));
if (jobs.length) jobs.push({v:manifest.videos[0],transform:'mirror'},{v:manifest.videos[0],transform:'black'});
try {
  for (const {v,transform} of jobs) {
    const context = await browser.newContext(); const page = await context.newPage();
    page.on('pageerror', e => report.errors.push({file:v.file, transform, error:e.message}));
    await page.route('https://cdn.jsdelivr.net/npm/@mediapipe/pose/**', async route => {
      const name = path.basename(new URL(route.request().url()).pathname);
      const file = path.join(repo,'node_modules/@mediapipe/pose',name);
      if (!fs.existsSync(file)) { report.errors.push({asset:name,error:'not in installed package'});return route.abort(); }
      report.assets[name] = hash(file);
      await route.fulfill({path:file,contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.wasm')?'application/wasm':'application/octet-stream'});
    });
    let perClipTimer;
    try {
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>typeof window.replayPhysioVideo==='function');
      const result = await Promise.race([
        page.evaluate(args=>window.replayPhysioVideo(args),{url:`${base}/raw/${v.file}`,fps:15,transform,exerciseId:v.exercise==='E03'?'shoulder-external-rotation':'side-arm-raise'}),
        new Promise((_,reject)=>{ perClipTimer=setTimeout(()=>reject(new Error('Per-clip timeout')),180000);perClipTimer.unref(); }),
      ]);
      report.results.push({file:v.file,rawSha256:hash(allowed.get(v.file)),label:v.angle,condition:v.variation,...result});
      console.log('REPLAYED',v.file,transform,result.frames,result.poseCoverage,flushLine(result.sides));
    } catch(e) { report.errors.push({file:v.file,transform,error:String(e)});throw e; }
    finally { clearTimeout(perClipTimer);await context.close();save(); }
  }
  report.complete = report.results.length===jobs.length;
} finally {
  save(); await browser.close(); await new Promise(resolve=>server.close(resolve));
}
function flushLine(sides) { return sides.map(s=>`${s.side}: ${s.reps} reps, ${Math.round(s.coverage*100)}% coverage`).join('; '); }
console.log('COMPLETE',report.complete,'clips/conditions',report.results.length);
