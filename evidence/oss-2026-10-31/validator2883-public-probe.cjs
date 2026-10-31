const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const where = process.argv[2];
const forms = {source: require(where+'/src').default || require(where+'/src'), node:require(where), browser:require(where+'/validator.js'), minified:require(where+'/validator.min.js')};
const samples = ['ab','abc','a'.repeat(15),'a'.repeat(16),'   ','a\nb','a\tb','a^b','😀😀','ab@','a#b','ab$'];
const results = {};
for(const [name,v] of Object.entries(forms)) {
 results[name] = samples.map(value => ({value,utf16_units:value.length,codepoints:Array.from(value).length,accepted:v.isUsername(value)}));
 for(const value of ['abc','a'.repeat(15)]) assert.equal(v.isUsername(value),true);
 for(const value of ['ab','a'.repeat(16),'ab@','a#b','ab$']) assert.equal(v.isUsername(value),false);
 for(const value of [null,undefined,42,{},[]]) assert.throws(()=>v.isUsername(value));
 assert.equal(v.isNumeric(''),false);assert.equal(v.isNumeric('',{no_symbols:true}),false);
}
for(const a of Object.values(results)) assert.deepEqual(a,results.source);
console.log(JSON.stringify({forms:4,samples_per_form:samples.length,results,scope:'Observed username policy, exact 3/15 UTF16 boundaries, public exports, non-string inputs and empty numeric controls; not a universal username security policy'},null,2));
