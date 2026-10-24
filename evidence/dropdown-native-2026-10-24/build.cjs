// Source-only reproduction. Does not change either checkout or run Git commands that write files.
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const [dropdownArg, menuArg, outArg] = process.argv.slice(2);
if (!dropdownArg || !menuArg || !outArg) throw new Error('Usage: node build.cjs <dropdown-273-checkout> <menu-899-checkout> <output-dir>');
const dropdown = path.resolve(dropdownArg), menu = path.resolve(menuArg), out = path.resolve(outArg);
for (const [dir, sha] of [[dropdown,'b22af69306b82d60e64c6f513956564d019fe781'],[menu,'e00e0c2a5b87dd2b7408156bf68eb808cf672b6f']]) {
  if (cp.execFileSync('git',['rev-parse','HEAD'],{cwd:dir,encoding:'utf8'}).trim() !== sha) throw new Error('Unexpected checkout HEAD: '+dir);
  if (cp.execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:dir,encoding:'utf8'}).trim()) throw new Error('Tracked source changes: '+dir);
}
for (const [name, version] of Object.entries({'react':'19.3.1','react-dom':'19.3.1','@rc-component/menu':'1.6.0','@rc-component/trigger':'3.10.1','@rc-component/portal':'2.2.1'})) {
  if (JSON.parse(fs.readFileSync(path.join(dropdown,'node_modules',name,'package.json'),'utf8')).version !== version) throw new Error('Unexpected dependency version: '+name+'; see README');
}
const esbuild = require(path.join(dropdown,'node_modules/esbuild'));
(async () => {
  fs.mkdirSync(out,{recursive:true});
  for (const variant of ['base','head273','escape-only-combined']) {
    await esbuild.build({entryPoints:[path.join(__dirname,'harness.tsx')],bundle:true,nodePaths:[path.join(dropdown,'node_modules')],outfile:path.join(out,variant+'.js'),define:{'process.env.NODE_ENV':'"production"'},alias:{'@rc-component/dropdown':path.join(dropdown,'src'),'@rc-component/menu':variant==='escape-only-combined'?path.join(menu,'src'):path.join(dropdown,'node_modules/@rc-component/menu'),'react':path.join(dropdown,'node_modules/react'),'react-dom':path.join(dropdown,'node_modules/react-dom')},plugins:[{name:'hook-control',setup(build){build.onLoad({filter:/src\/hooks\/useAccessibility\.ts$/},args=>{
      if (!args.path.startsWith(dropdown+path.sep)) return;
      let contents=fs.readFileSync(args.path,'utf8');
      if(variant==='base') contents=cp.execFileSync('git',['show','b4ea62f3293851934d64d9d92cbbd07d87a40dea:src/hooks/useAccessibility.ts'],{cwd:dropdown,encoding:'utf8'});
      if(variant==='escape-only-combined') contents=fs.readFileSync(path.join(__dirname,'escape-only-with275-candidate.ts'),'utf8');
      return {contents,loader:'ts'};
    });}}]});
    fs.writeFileSync(path.join(out,variant+'.html'),'<!doctype html><meta charset="utf-8"><title>Native Tab '+variant+'</title><style>body{font:18px sans-serif;padding:32px}button,input{margin:12px;padding:12px}.rc-dropdown-hidden,.rc-menu-submenu-hidden{display:none}.rc-dropdown,.rc-menu-submenu-popup{background:white;border:1px solid #444;padding:10px}li{padding:10px}:focus{outline:3px solid blue}</style><div id="root"></div><script src="'+variant+'.js"></script>');
  }
})().catch(error=>{console.error(error);process.exit(1)});
