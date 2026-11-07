const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(process.env.COLOR_PICKER_REPO);
const xroot=path.resolve(process.env.PUPPETEER_REPO);
const esbuild=require(path.join(root,'node_modules/esbuild'));
const puppeteer=require(path.join(xroot,'node_modules/puppeteer'));
const prev='fce493d2113c33127a87aca99c9f5fe3ad1d72a3';
const head='9ce50dcf3b7d3b3fd58d24e2c538107957c7ec4f';
const hook=path.join(root,'src/hooks/useColorDrag.ts');
const entry=`
import React,{useRef} from 'react';import {createRoot} from 'react-dom/client';
import useColorDrag from './src/hooks/useColorDrag';import {Color} from './src/color';
const color=new Color('#123456');window.changes=[];window.completions=0;window.events=[];
for(const type of ['touchmove','touchcancel','touchend']) window.addEventListener(type,e=>window.events.push({type:e.type,prevented:e.defaultPrevented,cancelable:e.cancelable,target:e.target.id}),{passive:true});
function Fixture(){const panel=useRef(null),thumb=useRef(null);const [,start]=useColorDrag({color,containerRef:panel,targetRef:thumb,calculate:()=>({x:0,y:0}),onDragChange:p=>window.changes.push(p),onDragChangeComplete:()=>window.completions++});return <div id="panel" ref={panel} onTouchStart={start} style={{width:250,height:250,background:'#eee',position:'absolute',left:20,top:20}}><div id="thumb" ref={thumb} style={{width:12,height:12}} /></div>;}
const root=createRoot(document.querySelector('#root'));root.render(<Fixture/>);window.removeFixture=()=>root.unmount();
`;
(async()=>{
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE,args:['--no-first-run']});
const result={chrome:await browser.version(),checked_at_utc:new Date().toISOString(),variants:{}};
try{
for(const [name,sha] of [['prior',prev],['current',head],['candidate',head]]){
 const source=name==='candidate'?fs.readFileSync(process.env.CANDIDATE_SOURCE,'utf8'):execFileSync('git',['show',sha+':src/hooks/useColorDrag.ts'],{cwd:root,encoding:'utf8'});
 const built=await esbuild.build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'browser',plugins:[{name:'exact-hook',setup(build){build.onLoad({filter:/useColorDrag\.ts$/},args=>args.path===hook?{contents:source,loader:'ts',resolveDir:path.dirname(hook)}:undefined);}}]});
 const page=await browser.newPage();await page.setViewport({width:390,height:740,isMobile:true,hasTouch:true,deviceScaleFactor:1});const session=await page.createCDPSession();
 const touch=(type,x,y)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:x==null?[]:[{x,y,id:0}]});
 const init=async()=>{await page.goto('about:blank');await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;height:2200px}#outside{position:absolute;left:290px;top:20px;width:90px;height:650px;background:#dca}</style><div id="root"></div><div id="outside"></div>');await page.addScriptTag({content:built.outputFiles[0].text});await page.waitForSelector('#panel');};
 const state=()=>page.evaluate(()=>({events:window.events,changes:window.changes,completions:window.completions,scrollY:scrollY}));
 const pan=async(x,y1,y2)=>{await touch('touchStart',x,y1);for(let i=1;i<=5;i++)await touch('touchMove',x,y1+(y2-y1)*i/5);await touch('touchEnd');await new Promise(r=>setTimeout(r,180));};
 await init();await pan(100,210,90);const normal=await state();await pan(330,480,210);const afterEnd=await state();
 await init();await touch('touchStart',100,160);await touch('touchMove',100,120);await touch('touchCancel');const canceled=await state();await pan(330,480,210);const afterCancel=await state();
 await init();await touch('touchStart',100,160);await page.evaluate(()=>window.removeFixture());await touch('touchCancel');await pan(330,480,210);const afterUnmount=await state();
 result.variants[name]={sha,normal,afterEnd,canceled,afterCancel,afterUnmount};await page.close();
}
}finally{await browser.close();}
fs.writeFileSync(path.join(__dirname,'chrome-rerun.json'),JSON.stringify(result,null,2));
for(const [k,v] of Object.entries(result.variants))console.log(k,Object.fromEntries(['normal','afterEnd','canceled','afterCancel','afterUnmount'].map(n=>[n,{scroll:v[n].scrollY,changes:v[n].changes.length,ends:v[n].completions,prevented:v[n].events.filter(e=>e.type==='touchmove'&&e.prevented).length,cancels:v[n].events.filter(e=>e.type==='touchcancel').length}])));
})().catch(e=>{console.error(e);process.exitCode=1;});
