// Read-only production-web video probe. Use an official player sample, not a clinical reference.
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);
const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true});
const result={source_sha:process.env.SOURCE_SHA,scope:'production web; not native iOS or clinical approval',video:'M7lc1UVf-VE',requests:[],screens:[],errors:[]};
const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(15000);
p.on('requestfailed',r=>{if(/youtube|googlevideo/.test(r.url()))result.requests.push({host:new URL(r.url()).host,error:r.failure()?.errorText});});
p.on('pageerror',e=>result.errors.push(e.message));
async function snap(name){
 const frames=await p.locator('iframe').evaluateAll(els=>els.map(el=>({src:el.src,rect:{width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height},enableApi:new URL(el.src).searchParams.get('enablejsapi')})));
 const text=await p.locator('body').innerText();await p.screenshot({path:path.join(out,name+'.png')});result.screens.push({name,frames,text});
}
async function playerState(){const f=p.frames().find(f=>f.url().includes('youtube-nocookie.com/embed'));
 if(!f)return {frame:false};return await f.evaluate(()=>({text:document.body.innerText.slice(0,900),video:[...document.querySelectorAll('video')].map(v=>({currentTime:v.currentTime,paused:v.paused,readyState:v.readyState,error:v.error?.code}))})).catch(e=>({error:String(e)}));}
try{
 await p.goto(process.env.BASE_URL,{waitUntil:'domcontentloaded'});await p.waitForTimeout(1200);
 await p.evaluate(()=>{const root=JSON.parse(localStorage.getItem('persist:root'));
 root.user=JSON.stringify({currentUser:{id:'audit',name:'Synthetic audit',email:'audit@example.com'},isAuthenticated:true,hasCompletedOnboarding:true,isLoading:false,error:null});
 root.settings=JSON.stringify({...JSON.parse(root.settings),exercisePlan:{joint:'shoulder',side:'left',version:1,routine:[{exerciseId:'arm-raise',reps:2}],videos:{'arm-raise':'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=8s'}}});
 localStorage.setItem('persist:root',JSON.stringify(root));localStorage.setItem('persist:exercise',JSON.stringify({history:'[]',_persist:JSON.stringify({version:-1,rehydrated:true})}));});
 await p.reload();await p.getByTestId('tab-exercises').click();await p.waitForTimeout(3500);await snap('prep-390');
 result.initialPlayer=await playerState();
 const embed=p.frames().find(f=>f.url().includes('youtube-nocookie.com/embed'));
 if(embed){const play=embed.getByRole('button',{name:/play/i}).first();if(await play.count())await play.click().catch(e=>result.playClickError=String(e));}
 await p.waitForTimeout(3000);result.afterPlay=await playerState();await snap('prep-after-play-390');
 await p.setViewportSize({width:320,height:568});await snap('prep-320');
 await p.setViewportSize({width:390,height:844});await p.getByTestId('start-routine-button').click();
 await p.getByTestId('use-practice-mode').click();await p.getByTestId('follow-along').waitFor({timeout:20000});await p.waitForTimeout(2500);await snap('follow-along-390');
 result.livePlayer=await playerState();
 const handles=p.getByTestId('follow-along').locator('iframe');const h0=await handles.elementHandle();
 await p.getByTestId('follow-along-toggle').click();result.hideRemovesPlayer=await handles.count()===0;
 await p.getByTestId('follow-along-toggle').click();result.showCreatesNewPlayer=!(await h0.evaluate(el=>el.isConnected));
 await p.waitForTimeout(1000);result.afterShow=await playerState();
 const pause=p.locator('[data-testid*="pause"]');result.pauseIds=await pause.evaluateAll(es=>es.map(e=>e.getAttribute('data-testid')));
 if(await pause.count()){await pause.first().click();result.afterAppPause=await playerState();await p.waitForTimeout(2200);result.twoSecondsAfterAppPause=await playerState();await snap('paused-390');}
 result.status='journey_inspected';
}catch(e){result.status='partial';result.error=String(e);await snap('failure-frontier').catch(()=>{});}
finally{fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));await b.close();console.log(JSON.stringify(result,null,2));}
