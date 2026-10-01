// Independent browser probe. Run from the tested Util checkout:
// node /path/to/this-file.cjs /path/to/playwright [base commit] [Chromium executable]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const repoRequire = createRequire(path.join(process.cwd(), 'package.json'));
const ts = repoRequire('typescript');
const { chromium } = require(path.resolve(process.argv[2]));
const base = process.argv[3] || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const modules = ['canUseDom', 'contains', 'dynamicCSS'];

function bundle(revision) {
  const factories = modules.map(name => {
    const file = `src/Dom/${name}.ts`;
    const source = revision === 'head'
      ? fs.readFileSync(file, 'utf8')
      : execFileSync('git', ['show', `${revision}:${file}`], { encoding: 'utf8' });
    const js = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    return `${JSON.stringify(`./${name}`)}: function(module, exports, require) {\n${js}\n}`;
  });
  return `(function(){const factories={${factories.join(',')}}; const cache={};
    function require(name){if(!cache[name]){const module={exports:{}};cache[name]=module;
      factories[name](module,module.exports,require);}return cache[name].exports;}
    window.dynamicCSS=require('./dynamicCSS');})();`;
}

(async () => {
  const bundles = { base: bundle(base), head: bundle('head') };
  const server = http.createServer((req, res) => {
    const match = /^\/(base|head)\/bundle.js$/.exec(req.url);
    if (match) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(bundles[match[1]]);
      return;
    }
    const variant = req.url === '/base' ? 'base' : 'head';
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Security-Policy': "require-trusted-types-for 'script'; trusted-types 'none'",
    });
    res.end(`<!doctype html><html><head><script src="/${variant}/bundle.js"></script></head>
      <body><div class="probe">probe</div></body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.argv[4] });
    const results = {};
    for (const variant of ['base', 'head']) {
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${server.address().port}/${variant}`);
      results[variant] = await page.evaluate(() => {
        const attempt = fn => {
          try { return { success: true, result: fn() }; }
          catch (error) { return { success: false, error: `${error.name}: ${error.message}` }; }
        };
        const policyControl = attempt(() => {
          document.createElement('style').innerHTML = '.probe {}';
        });
        const inject = attempt(() => {
          const css = '.probe { color: rgb(1, 2, 3); } /* <tag>& literal */';
          const style = window.dynamicCSS.injectCSS(css, { csp: { nonce: 'probe' } });
          return { textMatches: style.textContent === css, nonce: style.nonce,
            color: getComputedStyle(document.querySelector('.probe')).color };
        });
        // Preexisting-node update exercises a separate sink from initial injection.
        const existing = document.createElement('style');
        existing.textContent = '.probe { color: rgb(4, 5, 6); }';
        existing.setAttribute('rc-util-key', 'probe-existing');
        existing.nonce = 'old';
        document.head.appendChild(existing);
        const update = attempt(() => {
          const css = '.probe { color: rgb(7, 8, 9); }';
          const updated = window.dynamicCSS.updateCSS(css, 'probe-existing', { csp: { nonce: 'new' } });
          const repeated = window.dynamicCSS.updateCSS(css, 'probe-existing');
          return { sameNode: updated === existing && repeated === existing,
            textMatches: existing.textContent === css, nonce: existing.nonce,
            count: document.querySelectorAll('style[rc-util-key="probe-existing"]').length,
            color: getComputedStyle(document.querySelector('.probe')).color };
        });
        return { policyControl, inject, update };
      });
      await page.close();
    }
    for (const variant of ['base', 'head']) {
      assert.equal(results[variant].policyControl.success, false);
      assert.match(results[variant].policyControl.error, /TrustedHTML/);
    }
    for (const operation of ['inject', 'update']) {
      assert.equal(results.base[operation].success, false);
      assert.match(results.base[operation].error, /TrustedHTML/);
      assert.equal(results.head[operation].success, true);
      assert.equal(results.head[operation].result.textMatches, true);
    }
    assert.deepEqual(results.head.inject.result, { textMatches: true, nonce: 'probe', color: 'rgb(1, 2, 3)' });
    assert.deepEqual(results.head.update.result, { sameNode: true, textMatches: true,
      nonce: 'new', count: 1, color: 'rgb(7, 8, 9)' });
    console.log(JSON.stringify({ checked_at_utc: new Date().toISOString(), base,
      node: process.version, typescript: ts.version, playwright: require(path.join(path.resolve(process.argv[2]), 'package.json')).version,
      browser: browser.version(), policy: "require-trusted-types-for 'script'; trusted-types 'none'",
      results, assertions: 'pass' }, null, 2));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
