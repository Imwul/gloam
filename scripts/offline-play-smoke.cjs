// Run against a production preview with Service Worker enabled. Uses an isolated browser context.
// GLOAM_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/offline-play-smoke.cjs http://127.0.0.1:4173
const {chromium}=require(process.env.GLOAM_PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const output=process.env.GLOAM_CERT_OUTPUT || path.join(os.tmpdir(),'gloam-offline-smoke');
fs.mkdirSync(output,{recursive:true});
const url=process.argv[2] || 'http://127.0.0.1:5173/';
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath=process.env.GLOAM_BROWSER_EXECUTABLE || (fs.existsSync(chrome)?chrome:undefined);
(async()=>{
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await page.evaluate(()=>{const bundle=JSON.parse(localStorage.getItem('gloam_companion_v2'));bundle.state.character.name='오프라인 검증 인물';bundle.state.character.age=18;localStorage.setItem('gloam_companion_v2',JSON.stringify(bundle));});
 await page.reload({waitUntil:'networkidle'});
 await page.getByRole('button',{name:'판정 규칙',exact:true}).click();
 await page.getByRole('button',{name:'규칙 빠른 참조 닫기'}).click();
 await page.locator('.play-draw-line button').click();
 await page.waitForTimeout(240);
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('gloam_companion_v2')).state);
 await page.evaluate(async()=>{
  const worker=navigator.serviceWorker.controller;
  await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=resolve;worker.postMessage({type:'CACHE_USED_RESOURCES',urls:performance.getEntriesByType('resource').map(r=>r.name)},[channel.port2]);});
 });
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.play-test').waitFor();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('gloam_companion_v2')).state);
 assert.deepEqual(after,before);
 await page.getByRole('button',{name:'판정 규칙',exact:true}).click();
 await page.getByLabel('규칙 검색').fill('휴식');
 assert.ok(await page.locator('.quick-layout nav button').count());
 await page.keyboard.press('Escape');
 for(const name of ['tests','character','map','magic','downtime','play']) await page.locator(`button[data-tab="${name}"]`).click();
 assert.deepEqual(errors,[]);
 await page.screenshot({path:path.join(output,'offline-play-390.png')});
 fs.writeFileSync(path.join(output,'offline-smoke-report.json'),JSON.stringify({passed:true,checks:['production shell registered andcontrolled','cached offline reload','stored campaign unchanged','offlinequickrules search','sixsectionnavigation','no browserpageerrors'],limitations:'Unvisited card images and encrypted source unlock are outside this smoke test.'},null,2));
 console.log('PASS production offline smoke:6checks');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
