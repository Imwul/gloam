#!/usr/bin/env node
/* Run: GLOAM_PLAYWRIGHT_MODULE=/path/to/playwright node scripts/gothic-visual-certification.cjs [URL] [output directory] */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.GLOAM_PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:5190/';
const output = path.resolve(process.argv[3] || '_bmad-output/validation/gothic');
const viewports = [[3440,1440],[1920,1080],[1440,900],[768,1024],[390,844],[340,844]];
const tabs = ['play','tests','character','map','magic','downtime'];
const report = { url, viewports: [], checks: [], failures: [], browserErrors: [], contrast: [] };
const check = (ok, name, detail) => { report.checks.push({name,passed:!!ok,...(detail?{detail}: {})}); if(!ok) report.failures.push(name); };

let browser;
(async () => {
  fs.mkdirSync(output,{recursive:true});
  browser = await chromium.launch({executablePath:process.env.GLOAM_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const page = await browser.newPage({viewport:{width:3440,height:1440}});
  page.on('pageerror',error => report.browserErrors.push(error.message));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.locator('.topbar').waitFor();
  await page.evaluate(async () => {
    const { freshState } = await import('/src/App.tsx');
    const s=freshState();
    Object.assign(s.character,{
      name:'이렌',age:24,vocation:'Knight-Errant',stats:{cups:1,wands:2,swords:4,coins:3},resolve:3,xp:2,
      lifepath:['소드 7 · 전쟁으로 찢어진 변경에서 자람'],
      goals:[{id:'goal1',text:'영주에게 빼앗긴 가족의 방앗간을 되찾는다.',status:'active',note:''},{id:'goal2',text:'낡은 다리를 고쳐 마을의 길을 다시 잇는다.',status:'active',note:''},{id:'goal3',text:'사라진 언니를 찾아 수도원에서 데려온다.',status:'active',note:''}],
      instincts:['위험이 보이면 검을 뽑는다.','아이를 만나면 먼저 돕는다.','귀족의 약속을 믿지 않는다.'],talents:['Sally Forth'],
      inventory:['Sword','Helmet','Rations (7)','Bedroll','Torches (3)'].map((name,i)=>({id:'item'+i,name,category:i===0?'weapon':i===1?'armor':'trade',slots:1,damaged:false,uses:i===2?7:null,notes:'',contents:''})),
      friends:[{id:'friend1',name:'마라',location:'남쪽 마을',connection:'오래된 여행 동료',history:[]}],foes:[],npcs:[],hirelings:[]
    });
    s.campaignName='안개숲의 길';s.sessionNumber=1;
    localStorage.setItem('gloam_companion_v2',JSON.stringify({version:2,state:s,undo:[]}));
  });
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  for (const [width,height] of viewports) {
    await page.setViewportSize({width,height});
    const viewport={width,height,screens:[]};
    for(const tab of tabs){
      await page.locator(`button[data-tab="${tab}"]`).click();
      await page.evaluate(()=>document.fonts.ready);
      const geometry=await page.evaluate(()=>{
        const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
        const visible=el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(el).visibility!=='hidden';};
        return {viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,scrollY,
          shell:box(document.querySelector('.app-shell')),main:box(document.querySelector('main')),
          panels:[...document.querySelectorAll('.panel')].map(el=>({title:el.querySelector('h2')?.textContent,...box(el)})),
          navigation:box(document.querySelector('.tabs')),
          drawButton:document.querySelector('.play-draw-line .play-primary')?box(document.querySelector('.play-draw-line .play-primary')):null,
          eventButton:[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='사건 카드 뽑기')?box([...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='사건 카드 뽑기')):null,
          escapedElements:[...document.querySelectorAll('body *')].filter(el=>visible(el)&&el.getBoundingClientRect().right>innerWidth+2&&!el.closest('.tabs,.quick-layout nav')).slice(0,8).map(el=>({tag:el.tagName,class:el.className,...box(el)}))};
      });
      check(geometry.documentWidth<=width+1,`${width}px ${tab}: no document horizontal overflow`,geometry.documentWidth);
      check(geometry.scrollY<2,`${width}px ${tab}: navigation begins at top`);
      if(width>=1920){
        check(geometry.shell.width<=2200,`${width}px ${tab}: content shell has bounded reading width`,Math.round(geometry.shell.width));
        check(Math.abs((width-geometry.shell.width)/2-geometry.shell.x)<=2,`${width}px ${tab}: shell is centered`);
      }
      viewport.screens.push({tab,...geometry});
      await page.screenshot({path:path.join(output,`${width}-${tab}.png`),animations:'disabled'});
    }
    await page.locator('button[data-tab="play"]').click();
    await page.getByRole('button',{name:'판정 규칙',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'규칙 빠른 참조'});
    await dialog.waitFor();
    check(await page.getByLabel('규칙 검색').evaluate(el=>el===document.activeElement),`${width}px rules: search receives focus`);
    check(await page.evaluate(()=>document.body.style.overflow==='hidden'),`${width}px rules: background scroll is locked`);
    await page.getByLabel('규칙 검색').fill('회피');
    check((await page.locator('.quick-layout nav').innerText()).includes('전투'),`${width}px rules: combat response search succeeds`);
    await page.locator('.quick-layout nav button').first().click();
    const ruleGeometry=await dialog.evaluate(el=>{const r=el.getBoundingClientRect();const reading=el.querySelector('.quick-reading');const rr=reading.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,readingWidth:rr.width,readingHeight:rr.height,readingScroll:reading.scrollHeight,readingClient:reading.clientHeight};});
    check(ruleGeometry.x>=-1&&ruleGeometry.width<=width+1&&ruleGeometry.y>=-1&&ruleGeometry.bottom<=height+1,`${width}px rules: dialog fits viewport`,ruleGeometry);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}px rules: no document horizontal overflow`);
    const nav=page.locator('.quick-layout nav');
    const before=await nav.evaluate(el=>el.scrollLeft);
    await nav.locator('button').last().focus();
    const after=await nav.evaluate(el=>el.scrollLeft);
    check(width>=768||after>before,`${width}px rules: narrow navigation can scroll to final topic`);
    await page.screenshot({path:path.join(output,`${width}-rules.png`),animations:'disabled'});
    const controls=dialog.locator('button,input,[tabindex="0"]');
    await controls.last().focus();await page.keyboard.press('Tab');
    check(await controls.first().evaluate(el=>el===document.activeElement),`${width}px rules: forward focus is trapped`);
    check(await controls.first().evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth)>0&&getComputedStyle(el).outlineStyle!=='none'),`${width}px rules: keyboard focus remains visible`);
    await page.keyboard.press('Escape');
    check(await dialog.count()===0,`${width}px rules: Escape closes drawer`);
    check(await page.getByRole('button',{name:'판정 규칙',exact:true}).evaluate(el=>el===document.activeElement),`${width}px rules: trigger regains focus`);
    check(await page.evaluate(()=>document.body.style.overflow!=='hidden'),`${width}px rules: background scroll is restored`);
    viewport.rules=ruleGeometry;report.viewports.push(viewport);
  }
  await page.setViewportSize({width:1440,height:900});await page.locator('button[data-tab="play"]').click();
  const captureContrast = () => page.evaluate(()=>{
    const parse=s=>{const a=s.match(/[\d.]+/g)?.map(Number)||[];return{rgb:a.slice(0,3),alpha:a.length>3?a[3]:1};};
    const luminance=rgb=>rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>{const l1=luminance(a),l2=luminance(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);};
    const background=el=>{let colors=[];while(el){const style=getComputedStyle(el),c=parse(style.backgroundColor);colors.push(c);el=el.parentElement;}let rgb=[255,255,255];for(const c of colors.reverse())rgb=c.rgb.map((x,i)=>x*c.alpha+rgb[i]*(1-c.alpha));return rgb;};
    return [...document.querySelectorAll('.topbar button,.tabs button,.chapter-heading .eyebrow,.panel h2,.panel p,.panel small,.panel label,.panel input,.panel select,.panel button,.panel .hint,.panel .text-button,.play-goals-list button,.quick-reading p,.quick-reading small,.quick-reading button,.quick-dialog h2,.quick-dialog input,.quick-layout nav button,.quick-layout nav small')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&!el.disabled&&getComputedStyle(el).opacity==='1';}).map(el=>{const style=getComputedStyle(el),fg=parse(style.color).rgb,bg=background(el),fontSize=parseFloat(style.fontSize),weight=parseInt(style.fontWeight)||400,minimum=fontSize>=24||(fontSize>=18.66&&weight>=700)?3:4.5;return{text:el.textContent.trim().slice(0,90),class:el.className,fontSize,weight,color:style.color,background:bg.map(Math.round),ratio:Number(ratio(fg,bg).toFixed(2)),minimum};});
  });
  report.contrast=(await captureContrast()).map(item=>({...item,screen:'play'}));
  await page.locator('button[data-tab="tests"]').click();
  await page.getByRole('button',{name:'괴수 들이기',exact:true}).click();
  await page.getByRole('button',{name:'플레이어 4장까지 · 괴수마다 3장',exact:true}).click();
  report.contrast.push(...(await captureContrast()).map(item=>({...item,screen:'active-combat'})));
  await page.setViewportSize({width:3440,height:1440});
  await page.screenshot({path:path.join(output,'3440-active-combat.png'),animations:'disabled'});
  report.activeCombatGeometry=await page.evaluate(()=>{const box=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};return{objective:box(document.querySelector('.combat-objective input')),monsterSelect:box(document.querySelector('select[aria-label="괴수 도감 선택"]'))};});
  check(report.activeCombatGeometry.objective.width<=1000,'3440px combat: objective field is bounded',report.activeCombatGeometry.objective.width);
  check(report.activeCombatGeometry.monsterSelect.width<=500,'3440px combat: short monster selector is bounded',report.activeCombatGeometry.monsterSelect.width);
  await page.getByRole('button',{name:'이 화면의 규칙 ↗',exact:true}).click();
  report.contrast.push(...(await captureContrast()).map(item=>({...item,screen:'rules'})));
  await page.keyboard.press('Escape');
  check(report.browserErrors.length===0,'No browser runtime errors',report.browserErrors);
  const failures=report.contrast.filter(x=>x.ratio<x.minimum);
  report.contrastWarnings=failures;
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({checks:report.checks.length,passed:report.checks.filter(x=>x.passed).length,failures:report.failures,contrastWarnings:failures,output},null,2));
  await browser.close();
  process.exitCode=report.failures.length?1:0;
})().catch(async error=>{console.error(error);if(browser)await browser.close();process.exitCode=1;});
