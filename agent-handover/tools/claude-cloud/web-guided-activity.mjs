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
 await page.getByTestId('start-routine-button').click();await page.getByTestId('guided-time').waitFor();
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
 await page.getByTestId('start-routine-button').click();await page.waitForTimeout(1100);await page.getByTestId('guided-stop').click();
 await page.getByTestId('guided-stopped-early').click();await page.getByTestId('guided-save-state').filter({hasText:'Saved on this device'}).waitFor();
 await page.getByTestId('guided-done').click();check('early stop advances without completing',(await page.getByTestId('today-next-title').innerText()).includes('Sleeper'));
 await page.getByTestId('start-routine-button').click();await page.waitForTimeout(1100);await page.getByTestId('guided-stop').click();
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
 await failed.getByTestId('tab-exercises').click();await failed.getByTestId('start-routine-button').click();
 await failed.waitForTimeout(1100);await failed.getByTestId('guided-stop').click();await failed.getByTestId('guided-completed').click();
 await failed.getByTestId('guided-save-state').filter({hasText:'could not be confirmed'}).waitFor();
 check('failed write gives no saved credit',(await historyOf(failed)).length===0);
 await image(failed,'guided-save-failed-320');await failed.getByTestId('guided-done').click();
 await failed.getByTestId('pending-activity-notice').waitFor();
 check('failure remains visible after leaving summary',(await failed.getByTestId('pending-activity-notice').innerText()).includes('do not need to repeat'));
 await failed.evaluate(()=>{window.blockExerciseSave=false;});
 await failed.locator('[data-testid^="retry-pending-"]').click();
 await failed.waitForFunction(()=>JSON.parse(JSON.parse(localStorage.getItem('persist:exercise')).history).length===1);
 check('retry saves once with same explicit source',(await historyOf(failed))[0].writeRevision===2&&(await historyOf(failed))[0].instructionRevision===instructionRevision);
 await failed.reload();await failed.getByTestId('tab-progress').click();await failed.getByTestId('progress-session-0').waitFor();
 check('retry survives restart with no duplicate',(await historyOf(failed)).length===1);
 await image(failed,'guided-recovered-320');check('no app runtime error',result.errors.length===0);
 result.complete=true;
} catch(error){result.complete=false;result.error=String(error);throw error;}
finally{fs.writeFileSync(path.join(out,'journey.json'),JSON.stringify(result,null,2));await browser.close();console.log(JSON.stringify(result,null,2));}
