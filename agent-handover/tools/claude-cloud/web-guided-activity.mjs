#!/usr/bin/env node
// Actual production web app, synthetic programme only. No fake camera/pose.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const [base, outArg, playwrightDir, chrome] = process.argv.slice(2);
if (!base || !outArg || !playwrightDir || !chrome) throw new Error('Usage: URL OUTPUT PLAYWRIGHT_DIR CHROME');
const out=path.resolve(outArg);fs.mkdirSync(out,{recursive:true});
const {chromium}=await import(pathToFileURL(path.join(playwrightDir,'index.mjs')).href);
const browser=await chromium.launch({headless:true,executablePath:chrome});
const result={scope:'Synthetic guided activity browser journey, not clinical prescription or camera accuracy',checks:[],errors:[],screens:[]};
const check=(name,condition)=>{assert.ok(condition,name);result.checks.push(name);};
const instructionRevision='manoj-lying-shoulder-20260928-v1';
const ids=['supine-assisted-elevation','supine-stick-external-rotation','sleeper-stretch'];
const plan={joint:'shoulder',side:'left',version:1,
 episode:{id:'synthetic-episode-A',pathway:'frozen_shoulder',phase:'symptom_limited',confirmedAt:'2026-09-28T00:00:00Z'},
 routine:ids.map(exerciseId=>({exerciseId,repRange:{min:2,max:3},instructionRevision}))};
async function seed(page,p=plan,history=[]){
 await page.addInitScript(()=>{
  window.cameraCalls=0;
  if(navigator.mediaDevices) navigator.mediaDevices.getUserMedia=()=>{window.cameraCalls++;return Promise.reject(new Error('Test camera must not be used'));};
 });
 await page.goto(base);await page.waitForFunction(()=>localStorage.getItem('persist:root'));
 await page.evaluate(({plan,history})=>{
  const r=JSON.parse(localStorage.getItem('persist:root'));
  r.user=JSON.stringify({currentUser:{id:'synthetic-A',name:'Example Patient',email:'example@example.test',profile:{}},isAuthenticated:true,hasCompletedOnboarding:true,isLoading:false,error:null});
  r.settings=JSON.stringify({...JSON.parse(r.settings),exercisePlan:plan,enableSpeech:false,enableSound:false});
  localStorage.setItem('persist:root',JSON.stringify(r));
  localStorage.setItem('persist:exercise',JSON.stringify({history:JSON.stringify(history),_persist:JSON.stringify({version:-1,rehydrated:true})}));
 },{plan:p,history});
 await page.reload();await page.getByTestId('home-screen').waitFor();
}
const historyOf=page=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('persist:exercise')).history));
async function image(page,name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:false});result.screens.push(name);}
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.on('pageerror',e=>result.errors.push(e.message));await seed(page);
 await page.getByTestId('tab-exercises').click();
 check('exact supine first variant',(await page.getByTestId('today-next-title').innerText()).includes('Lying assisted'));
 await image(page,'guided-prep-390');
 await page.getByTestId('start-routine-button').click();await page.getByTestId('guided-start').waitFor();
 await page.waitForTimeout(1600);check('preparation is untimed',await page.getByTestId('guided-time').count()===0);
 await image(page,'guided-ready-390');await page.getByTestId('guided-start').click();await page.getByTestId('guided-time').waitFor();
 await page.waitForTimeout(1300);await page.getByTestId('guided-pause').click();
 const paused=await page.getByTestId('guided-time').innerText();await page.waitForTimeout(2100);
 check('pause freezes active time',await page.getByTestId('guided-time').innerText()===paused);
 await image(page,'guided-paused-390');
 await page.getByTestId('guided-pause').click();await page.waitForTimeout(1100);
 await page.getByTestId('guided-stop').click();await page.getByTestId('guided-completed').click();
 await page.getByTestId('guided-save-state').filter({hasText:'Saved on this device'}).waitFor();
 let h=await historyOf(page);check('one acknowledged nonmeasured self-report',h.length===1&&h[0].durability==='saved'&&h[0].measured===false&&h[0].reps===0&&h[0].completionBasis==='patient_report'&&h[0].bestDegrees===undefined);
 check('pause retained independently',h[0].pausedSeconds>=2&&h[0].wallSeconds>h[0].duration);
 await image(page,'guided-saved-390');await page.getByTestId('guided-done').click();
 check('next exact assisted rotation',(await page.getByTestId('today-next-title').innerText()).includes('stick-assisted'));
 await page.getByTestId('start-routine-button').click();await page.getByTestId('guided-start').click();await page.waitForTimeout(1100);await page.getByTestId('guided-stop').click();
 await page.getByTestId('guided-stopped-early').click();await page.getByTestId('guided-save-state').filter({hasText:'Saved on this device'}).waitFor();
 await page.getByTestId('guided-done').click();check('early stop advances without completing',(await page.getByTestId('today-next-title').innerText()).includes('Sleeper'));
 await page.getByTestId('start-routine-button').click();await page.getByTestId('guided-start').click();await page.waitForTimeout(1100);await page.getByTestId('guided-stop').click();
 await page.getByTestId('guided-completed').click();await page.getByTestId('guided-save-state').filter({hasText:'Saved on this device'}).waitFor();
 await page.getByTestId('guided-done').click();await page.getByTestId('tab-home').click();
 check('only completed activities count',(await page.getByTestId('home-goal-ring').getAttribute('aria-label'))?.startsWith('2 of 3'));
 check('early stop is not all completed',(await page.locator('body').innerText()).includes('activities recorded'));
 await page.getByTestId('tab-progress').click();await page.getByTestId('progress-session-0').waitFor();
 check('guided records are not failed numerical Checks',await page.getByTestId('progress-series-0').count()===0);
 check('reported activity words',(await page.getByTestId('progress-session-0').innerText()).includes('reported by you'));
 check('camera never opened',await page.evaluate(()=>window.cameraCalls)===0);
 await image(page,'guided-progress-390');const savedIds=(await historyOf(page)).map(x=>x.id);
 await page.reload();await page.getByTestId('tab-progress').click();await page.getByTestId('progress-session-0').waitFor();
 check('restart restores same records',JSON.stringify((await historyOf(page)).map(x=>x.id))===JSON.stringify(savedIds));
 await page.close();
 const failed=await browser.newPage({viewport:{width:320,height:568}});
 failed.on('pageerror',e=>result.errors.push(e.message));await seed(failed,{...plan,routine:[plan.routine[2]]});
 await failed.evaluate(()=>{
  const original=Storage.prototype.setItem;
  window.blockExerciseSave=true;
  Storage.prototype.setItem=function(key,value){if(key==='persist:exercise'&&window.blockExerciseSave)throw new Error('Synthetic storage failure');return original.call(this,key,value);};
 });
 await failed.getByTestId('tab-exercises').click();await failed.getByTestId('start-routine-button').click();await failed.getByTestId('guided-start').click();
 await failed.waitForTimeout(1100);await failed.getByTestId('guided-stop').click();await failed.getByTestId('guided-completed').click();
 await failed.getByTestId('guided-save-state').filter({hasText:'Not saved yet'}).waitFor();
 check('failed write gives no saved credit',(await historyOf(failed)).length===0);
 await image(failed,'guided-save-failed-320');
 const saveBox=await failed.getByTestId('guided-save-state').boundingBox(), returnBox=await failed.getByTestId('guided-done').boundingBox();
 result.saveGeometry={saveBox,returnBox};
 check('save failure is visible above the fixed return action at 320px',saveBox&&returnBox&&saveBox.y>=0&&saveBox.y+saveBox.height<=returnBox.y);

 await failed.getByTestId('guided-done').click();
 const notice=failed.getByTestId('today-prep').getByTestId('pending-activity-notice');
 await notice.waitFor();
 check('failure remains visible after leaving summary',(await notice.innerText()).includes('do not need to repeat'));
 check('pending occurrence cannot be started again',await failed.getByTestId('start-routine-button').isDisabled());
 await failed.getByTestId('tab-home').click();await failed.getByTestId('home-pending-action').waitFor();check('Home offers recovery not repeat',await failed.getByTestId('home-start-exercises').count()===0);
 await image(failed,'guided-pending-home-320');await failed.getByTestId('home-pending-action').click();
 await failed.evaluate(()=>{window.blockExerciseSave=false;});
 await notice.locator('[data-testid^="retry-pending-"]').click();
 await failed.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('persist:exercise')).history).length===1);
 check('retry saves once with same explicit source',(await historyOf(failed))[0].writeRevision===2&&(await historyOf(failed))[0].instructionRevision===instructionRevision);
 await failed.reload();await failed.getByTestId('tab-progress').click();await failed.getByTestId('progress-session-0').waitFor();
 check('retry survives restart with no duplicate',(await historyOf(failed)).length===1);
 await image(failed,'guided-recovered-320');check('no app runtime error',result.errors.length===0);
 const holds=await browser.newPage({viewport:{width:320,height:568}});
 holds.on('pageerror',e=>result.errors.push(e.message));
 await holds.addInitScript(()=>{
  window.requestedSpeech=[];
  const synth=window.speechSynthesis;
  if(synth){const original=synth.speak.bind(synth);synth.speak=u=>{window.requestedSpeech.push(u.text);return original(u);};}
 });
 await seed(holds,{...plan,routine:[{...plan.routine[2],holdSeconds:4}]});
 await holds.getByTestId('tab-exercises').click();await holds.getByTestId('start-routine-button').click();
 await holds.getByTestId('guided-start').waitFor();await holds.waitForTimeout(1400);
 check('hold preparation is not timed',await holds.getByTestId('guided-time').count()===0);
 await image(holds,'guided-hold-ready-320');
 await holds.getByTestId('guided-speech-toggle').click();
 await holds.waitForFunction(()=>window.requestedSpeech.some(t=>t.includes('Get into position')));
 await holds.getByTestId('guided-start').click();
 await holds.getByTestId('guided-instruction').waitFor();
 const instruction=await holds.getByTestId('guided-instruction').boundingBox(),timer=await holds.getByTestId('guided-hold-time').boundingBox(),pause=await holds.getByTestId('guided-pause').boundingBox();
 check('instruction and hold timer stay above the entire fixed footer at 320px',instruction&&timer&&pause&&instruction.y>=0&&Math.max(instruction.y+instruction.height,timer.y+timer.height)<=pause.y-16);
 await image(holds,'guided-hold-active-320');
 await holds.getByTestId('guided-hold-time').filter({hasText:'1 hold timer finished'}).waitFor({timeout:10000});
 const beforeRest=await holds.getByTestId('guided-time').innerText();await holds.waitForTimeout(1600);
 check('between-hold rest is not counted',await holds.getByTestId('guided-time').innerText()===beforeRest);
 check('timer has not created a record',(await historyOf(holds)).length===0);
 await holds.waitForFunction(()=>window.requestedSpeech.some(t=>t.includes('Release and rest')));
 await image(holds,'guided-hold-rest-320');
 await holds.getByTestId('guided-pause').click();
 await holds.getByTestId('guided-hold-time').filter({hasText:'2 hold timers finished'}).waitFor({timeout:10000});
 check('timed minimum still needs patient report',(await historyOf(holds)).length===0&&await holds.getByTestId('guided-pause').count()===0);
 await holds.getByTestId('guided-stop').click();
 check('report starts as a question not a failure',(await holds.getByTestId('guided-unsaved').innerText()).includes('Tell us how it went'));
 await holds.getByTestId('guided-completed').click();await holds.getByTestId('guided-save-state').filter({hasText:'Saved on this device'}).waitFor();
 const heldRecord=(await historyOf(holds))[0];
 check('hold outcome stays self-report and unmeasured',heldRecord.completionBasis==='patient_report'&&heldRecord.measured===false&&heldRecord.reps===0&&heldRecord.bestDegrees===undefined);
 result.speechRequests=await holds.evaluate(()=>window.requestedSpeech);
 check('browser requested prescribed hold and release speech',result.speechRequests.some(t=>t.includes('4 seconds'))&&result.speechRequests.some(t=>t.includes('Release and rest')));
 await holds.getByTestId('guided-done').click();await holds.getByTestId('tab-home').click();
 check('Home shows completion rather than a large duration',(await holds.getByTestId('home-progress').innerText()).includes('Completed'));
 await holds.reload();await holds.getByTestId('tab-progress').click();await holds.getByTestId('progress-session-0').waitFor();
 check('one activity has singular summary',(await holds.getByTestId('progress-streak').innerText()).includes('activity recorded this week'));
 await image(holds,'guided-hold-reopened-320');await holds.close();
 check('no app runtime errors after prescribed-hold journey',result.errors.length===0);

 const videoPage=await browser.newPage({viewport:{width:390,height:844}});
 videoPage.on('pageerror',e=>result.errors.push(e.message));
 await seed(videoPage,{...plan,routine:[plan.routine[0]],videos:{[ids[0]]:'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=8s'}});
 await videoPage.getByTestId('tab-exercises').click();await videoPage.getByTestId('start-routine-button').click();
 await videoPage.getByTestId('guided-watch').click();
 await videoPage.getByTestId('reference-play-pause').waitFor();
 await videoPage.getByTestId('reference-player-state').filter({hasText:'ready'}).waitFor({timeout:30000});
 await videoPage.getByTestId('reference-play-pause').click();
 const frame=()=>videoPage.frames().find(f=>f.url().includes('youtube-nocookie.com/embed'));
 const state=()=>frame().evaluate(()=>{const v=document.querySelector('video');return {time:v.currentTime,paused:v.paused};});
 await frame().waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>8.2;});
 check('real reference can play during untimed preparation',await videoPage.getByTestId('guided-time').count()===0);
 const viewport=await videoPage.getByTestId('reference-player-viewport').boundingBox(),startBox=await videoPage.getByTestId('guided-start').boundingBox();
 check('reference viewport is readable and above fixed footer',viewport&&startBox&&viewport.width>=200&&viewport.height>=200&&viewport.y>=0&&viewport.y+viewport.height<=startBox.y-16);
 await image(videoPage,'guided-reference-private-390');
 const mounted=await videoPage.getByTestId('reference-webview').elementHandle();
 const beforeStart=await state();await videoPage.getByTestId('guided-start').click();
 await frame().waitForFunction(()=>document.querySelector('video')?.paused);
 check('activity keeps the reference mounted but hides and pauses it',await mounted.evaluate(el=>el.isConnected)&&await videoPage.getByTestId('guided-video').isHidden());
 await videoPage.waitForTimeout(1300);await videoPage.getByTestId('guided-watch').click();
 await frame().waitForFunction(()=>!document.querySelector('video')?.paused);
 const later=await state();check('Watch again restores prior playback position',later.time>=beforeStart.time-0.3);
 const activeBefore=await videoPage.getByTestId('guided-time').innerText();await videoPage.waitForTimeout(1300);
 check('watching in activity does not advance its timer',await videoPage.getByTestId('guided-time').innerText()===activeBefore);
 await videoPage.getByTestId('reference-play-pause').click();await frame().waitForFunction(()=>document.querySelector('video')?.paused);
 await videoPage.getByTestId('follow-along-toggle').click();await videoPage.getByTestId('guided-watch').click();await videoPage.waitForTimeout(500);
 check('manual reference pause survives Hide and Watch again',(await state()).paused);
 check('reference viewing has recorded no treatment',(await historyOf(videoPage)).length===0);
 result.referencePosition={beforeStart,later};await videoPage.close();

 result.complete=true;
} catch(error){result.complete=false;result.error=String(error);throw error;}
finally{fs.writeFileSync(path.join(out,'journey.json'),JSON.stringify(result,null,2));await browser.close();console.log(JSON.stringify(result,null,2));}
