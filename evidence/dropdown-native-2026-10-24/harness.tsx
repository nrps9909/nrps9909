import React from 'react';
import {createRoot} from 'react-dom/client';
import Dropdown from '@rc-component/dropdown';
import Menu from '@rc-component/menu';
const events:string[]=[];
const log=(s:string)=>{events.push(s);document.getElementById('events')!.textContent=events.join(' | ')};
function App(){return <main><h1>Native Tab and Escape integration</h1><Dropdown trigger={['click']} onOpenChange={o=>log('panel:'+o)} overlay={<div tabIndex={-1} id="panel" onClick={e=>e.stopPropagation()}><input aria-label="Search" id="search" onKeyDown={e=>{if(e.key==='Tab'){log('local Tab');e.stopPropagation();}}}/><button id="next">Next inside panel</button></div>}><button id="panel-trigger">Panel actions</button></Dropdown><Dropdown trigger={['click']} onOpenChange={o=>log('menu:'+o)} overlay={<Menu items={[{key:'sub',label:'Submenu',children:[{key:'child',label:'Child'}]}]}/>}><button id="menu-trigger">Menu actions</button></Dropdown><button>After controls</button><p id="focus"/><p id="events"/></main>}
createRoot(document.getElementById('root')!).render(<App/>);
setInterval(()=>{const el=document.activeElement as HTMLElement;document.getElementById('focus')!.textContent='Focus: '+(el?.id||el?.textContent?.slice(0,40)||el?.tagName)},100);
