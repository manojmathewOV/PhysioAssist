// Actual production-web player check. Official API sample; not clinical media.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE);
const output = process.env.OUT; fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); page.setDefaultTimeout(25000);
const report = { basis: process.env.SOURCE_SHA, scope: 'production web / real official player / synthetic practice, no native or clinical validation', checks: [], errors: [] };
page.on('pageerror', e => report.errors.push(e.stack || e.message));
const check = (name, actual) => { assert(actual, name); report.checks.push(name); };
const yt = () => page.frames().find(f => f.url().includes('youtube-nocookie.com/embed'));
const sample = async () => yt().evaluate(() => { const v=document.querySelector('video');return v && {t:v.currentTime,paused:v.paused}; });
async function waitPlayer() { await page.getByTestId('reference-player-state').filter({hasText:/ready/}).waitFor(); }
async function playing() { await yt().waitForFunction(()=>{const v=document.querySelector('video');return v&&!v.paused&&v.currentTime>8.3;}); }
async function paused() { await yt().waitForFunction(()=>document.querySelector('video')?.paused); }
try {
  await page.goto(process.env.BASE_URL,{waitUntil:'domcontentloaded'});await page.waitForTimeout(1000);
  await page.evaluate(()=>{
    const root=JSON.parse(localStorage.getItem('persist:root'));
    root.user=JSON.stringify({currentUser:{id:'video-audit',name:'Synthetic audit',email:'audit@example.com'},isAuthenticated:true,hasCompletedOnboarding:true,isLoading:false,error:null});
    root.settings=JSON.stringify({...JSON.parse(root.settings),exercisePlan:{joint:'shoulder',side:'left',version:1,routine:[{exerciseId:'arm-raise',reps:2}],videos:{'arm-raise':'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=8s'}}});
    localStorage.setItem('persist:root',JSON.stringify(root));localStorage.setItem('persist:exercise',JSON.stringify({history:'[]',_persist:JSON.stringify({version:-1,rehydrated:true})}));
  });
  await page.reload();await page.getByTestId('tab-exercises').click();await waitPlayer();
  await page.getByTestId('reference-play-pause').click();await playing();check('real preparation playback',true);
  const oldFrame=await page.getByTestId('reference-webview').elementHandle();await page.getByTestId('reference-enlarge').click();
  check('enlarge retains player',await oldFrame.evaluate(el=>el.isConnected));
  await page.screenshot({path:path.join(output,'prep-390.png')});
  for(const width of [320,390]){
    await page.setViewportSize({width,height:844});const rect=await page.getByTestId('reference-player-viewport').boundingBox();
    check(`viewport at ${width} >=200 both axes`,rect.width>=200&&rect.height>=200);
  }
  await page.getByTestId('start-routine-button').click();await page.getByTestId('use-practice-mode').click();await page.getByTestId('follow-along').waitFor();
  check('follow-along does not load before requested',await page.getByTestId('reference-webview').count()===0);
  await page.getByTestId('follow-along-toggle').click();await waitPlayer();await page.getByTestId('reference-play-pause').click();await playing();
  await page.getByTestId('exercise-pause').click();await paused();const pause1=await sample();await page.waitForTimeout(1200);const pause2=await sample();
  check('app Pause stops reference',Math.abs(pause2.t-pause1.t)<0.2);report.pause={pause1,pause2};
  await page.getByTestId('exercise-pause').click();await playing();check('app Resume restarts previously playing reference',true);
  const liveFrame=await page.getByTestId('reference-webview').elementHandle();await page.getByTestId('follow-along-toggle').click();await page.waitForTimeout(500);report.hiddenSnapshot=await sample();await paused();const hidden=await sample();
  await page.getByTestId('follow-along-toggle').click();await playing();const shown=await sample();
  check('hide/show retains mounted player',await liveFrame.evaluate(el=>el.isConnected));
  check('hide/show does not restart',shown.t>=hidden.t-0.25);report.position={hidden,shown};
  await page.getByTestId('reference-play-pause').filter({hasText:'Pause video'}).click();await paused();await page.getByTestId('follow-along-toggle').click();await page.getByTestId('follow-along-toggle').click();await page.waitForTimeout(800);
  check('manual video pause survives hide/show',(await sample()).paused);
  for(const size of [{width:390,height:844},{width:320,height:568}]){
    await page.setViewportSize(size);await page.screenshot({path:path.join(output,`live-${size.width}.png`)});
    const pauseRect=await page.getByTestId('exercise-pause').boundingBox();report[`pauseControl${size.width}`]=pauseRect;
    const viewport=await page.getByTestId("reference-player-viewport").boundingBox();const instruction=await page.getByTestId("exercise-feedback").boundingBox();report[`layout${size.width}`]={viewport,instruction};check(`player does not cover instruction ${size.width}`,viewport.y>=instruction.y+instruction.height);
    check(`pause control on screen ${size.width}`,pauseRect.y>=0&&pauseRect.y+pauseRect.height<=size.height);
  }
  check('no app runtime errors',report.errors.length===0);report.status='passed';
}catch(error){report.status='failed';report.failure=String(error.stack || error);await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});}
finally {fs.writeFileSync(path.join(output,'observations.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));}
if(report.status!=='passed')process.exitCode=1;
