// AI-assisted strict public callback type check for the review's array cases.
// Run head checkout's tsc with --ignoreConfig --noEmit --strict --target es2022 --module nodenext
// --moduleResolution nodenext --allowImportingTsExtensions against this file.
import { Marked } from '../../marked-review-4121/src/marked.ts';

const marked = new Marked();
const tokens = [{ type: 'space', raw: '\n' }];
function callback(): Promise<void>[] {
  const results: Promise<void>[] = [Promise.resolve()];
  Object.defineProperty(results, Symbol.iterator, { value: function*() {} });
  return results;
}
marked.walkTokens(tokens, callback);
marked.walkTokens(tokens, () => Array<void | Promise<void>>(2));
