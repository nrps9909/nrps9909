const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const esbuild = require(process.env.ESBUILD_MODULE || 'esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const evidence = __dirname;
const root = process.env.MENU_REVIEW_ROOT;
if (!root) throw new Error('Set MENU_REVIEW_ROOT to the parent of the three exact-commit menu checkouts.');
(async () => {
 const builds = {};
 for (const leg of ['base','head','preview']) {
   const repo = path.join(root, `menu-maintainer-898-${leg}-20261007`);
   const result = await esbuild.build({ entryPoints: [path.join(evidence,'menu-898-browser-harness.tsx')], bundle: true, write: false, platform:'browser', format:'iife', define:{'process.env.NODE_ENV':'"production"'}, nodePaths:[path.join(root,'menu-maintainer-898-head-20261007/node_modules')], alias:{'menu-source':path.join(repo,'src/index.ts')}, logLevel:'warning' });
   builds[leg] = result.outputFiles[0].text;
 }
 const server=http.createServer((req,res) => {
  const leg=req.url.slice(1).split('/')[0];
  if(req.url.endsWith('/app.js')) {res.setHeader('Content-Type','application/javascript');res.end(builds[leg]);}
  else {res.setHeader('Content-Type','text/html');res.end(`<!doctype html><html><head><meta charset="utf-8"><title>rc-menu exact-head probe</title><style>body{margin:0;min-height:4000px}#root{margin-top:1600px;width:400px}li{min-height:40px}a{display:inline-block;padding:8px}</style></head><body><div id="root"></div><div id="destination">Destination</div><script src="/${leg}/app.js"></script></body></html>`);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const browser=await chromium.launch({...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {}),headless:true});
 const page=await browser.newPage({viewport:{width:1000,height:700}});
 const report={started_at_utc:new Date().toISOString(),browser:browser.version(),scope:'Chromium native DOM focus, scroll preservation, keyboard Enter and arrow controls; no screen-reader or complete WCAG claim',results:{}};
 try {
  for(const leg of ['base','head','preview']) {
   const obs={};
   await page.goto(`http://127.0.0.1:${port}/${leg}/`);
   await page.evaluate(()=>window.mountMenu());
   await page.evaluate(()=>window.focusMenu({preventScroll:true}));
   obs.refFocus=await page.evaluate(()=>window.snapshot());
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>window.events.some(e=>e.type==='menu-click'));
   obs.refEnter=await page.evaluate(()=>window.snapshot());
   await page.evaluate(()=>{history.replaceState(null,'',location.pathname);window.mountMenu({multiple:true});window.focusMenu();});
   await page.keyboard.press('Enter');
   obs.multipleEnter=await page.evaluate(()=>({ ...window.snapshot(), selected: document.querySelectorAll('.rc-menu-item-selected').length }));
   await page.evaluate(()=>{history.replaceState(null,'',location.pathname);window.mountMenu();window.scrollTo(0,0);window.focusItem({preventScroll:true});});
   obs.itemPreventScroll=await page.evaluate(()=>window.snapshot());
   await page.evaluate(()=>{window.mountMenu();window.scrollTo(0,0);window.focusMenu({preventScroll:true});});
   obs.menuPreventScroll=await page.evaluate(()=>window.snapshot());
   await page.keyboard.press('ArrowDown');
   await page.waitForFunction(()=>document.activeElement.id==='second-link');
   obs.arrowDown=await page.evaluate(()=>window.snapshot());
   await page.keyboard.press('Enter');
   obs.arrowEnter=await page.evaluate(()=>window.snapshot());
   await page.evaluate(()=>document.getElementById('second-link').focus());
   await page.keyboard.press('End');
   await page.waitForFunction(()=>document.activeElement.textContent==='plain');
   obs.end=await page.evaluate(()=>window.snapshot());
   await page.keyboard.press('Home');
   await page.waitForFunction(()=>document.activeElement.id==='first-link');
   obs.home=await page.evaluate(()=>window.snapshot());
   await page.evaluate(()=>{window.mountMenu({disabled:true});window.focusMenu();});
   obs.disabledSkip=await page.evaluate(()=>window.snapshot());
   await page.evaluate(()=>{window.mountMenu({activeKey:'second'});window.focusMenu();});
   obs.activeKey=await page.evaluate(()=>window.snapshot());
   await page.evaluate(()=>{window.mountMenu({items:'plain'});window.focusMenu();});
   obs.plainFallback=await page.evaluate(()=>window.snapshot());
   report.results[leg]=obs;
  }
  for(const leg of ['head','preview']) {
   assert.equal(report.results[leg].refFocus.active,'first-link');
   assert.equal(report.results[leg].refEnter.hash,'#destination');
   assert.equal(report.results[leg].multipleEnter.selected,0);
   assert.equal(report.results[leg].refEnter.events.filter(e=>e.type==='menu-click').length,2);
   assert.equal(report.results[leg].menuPreventScroll.scrollY,0);
   assert.ok(report.results[leg].itemPreventScroll.scrollY>0);
   assert.equal(report.results[leg].disabledSkip.active,'first-link');
   assert.equal(report.results[leg].activeKey.active,'second-link');
   assert.equal(report.results[leg].plainFallback.active,'LI');
  }
  assert.equal(report.results.base.refFocus.active,'LI');
  assert.equal(report.results.base.refEnter.hash,'');
  assert.equal(report.results.base.multipleEnter.selected,1);
  assert.equal(report.results.base.refEnter.events.filter(e=>e.type==='menu-click').length,1);
  assert.equal(report.results.base.itemPreventScroll.scrollY,0);
  report.completed_at_utc=new Date().toISOString();
  fs.writeFileSync(path.join(evidence,'menu-898-browser-results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({browser:report.browser,results:report.results},null,2));
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
