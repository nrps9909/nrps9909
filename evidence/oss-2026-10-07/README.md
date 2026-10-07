# Marked merged review follow-up, October 7, 2026

[Marked #4121](https://github.com/markedjs/marked/pull/4121) and [#4123](https://github.com/markedjs/marked/pull/4123) were merged by UziTech on October 6 at 14:59:30 and 15:00:27 UTC. Their final authored heads are unchanged from my AI-disclosed reviews. Both author heads are unsigned; both squash commits are GitHub Verified. These are other authors' PRs and do not increase my authored-merge total.

The #4121 squash is `627d9ae4e5ea403580782a8f6e21fbc8bf56f4c1`. Both changed files match the reviewed head byte for byte. The #4123 squash is `cc07bb9cb62bfd41a724d0a426f194188d7b35c1`, whose parent is #4121's squash. Its two fixtures match the reviewed head; `src/Tokenizer.ts` also includes prior upstream changes, so its complete blob differs. The added/deleted lines implementing enclosing-link-state restoration match the authored patch exactly.

Fresh local `npm test` at `cc07bb9` passes **1,907 specification tests / 199 unit tests**, builds, docs, UMD/CJS, types, package checks and lint. The original independent probes also pass against the combined merged source: **8,192 result / 317,080 token comparisons**, five iterator regressions, **6,912 link observations** with zero violations (base: 2,304), **9,216 control comparisons**, and eight seeded state cases. Source checkouts and locks remain unchanged.

The `head` label in `marked-4121-merged-probe.json` means the actual merged commit. The `preview` label in `marked-4123-merged-probe.json` also means that actual merged commit, not a current GitHub merge preview. Remote CI counts in the merge receipt belong to the final authored heads. Local merged-source tests, reviews, signatures and actual merge state are separate evidence.

## Reproduce

Use Node 24, a clone of this public profile, and a Marked clone containing the following revisions. Create separate worktrees for each revision and install the merged worktree's locked dependencies. npm 12 needs per-command opt-in for the inspected testutils tarball, Marked v18.0.11; the lock integrity remains enforced and lifecycle scripts are disabled during installation.

```sh
git worktree add --detach ../walk-base 4ee44f7f2167bec4079255e32b520dd47f16486c
git worktree add --detach ../walk-previous 920d86db9d65d87e39851c84364ed71488cb667a
git worktree add --detach ../link-base c18a64fa5e8c97cb92a8ea709a4542ea94b1c740
git worktree add --detach ../link-head 00073f9e91ebab73a67949cc9e9cf02de2dc8a84
git worktree add --detach ../merged cc07bb9cb62bfd41a724d0a426f194188d7b35c1
cd ../merged
npm ci --ignore-scripts --no-audit --no-fund --allow-remote=all
npm test
```

Build all walkTokens inputs with identical options using esbuild from the merged worktree's dependencies. The same options below can also build link-base/link-head inputs. Output files must be outside the source worktrees.

```sh
node --input-type=module -e 'import {build} from "esbuild"; await build({entryPoints:[process.argv[1]],outfile:process.argv[2],bundle:true,format:"esm",platform:"node",target:"node24",minify:false});' ../walk-base/src/marked.ts ../walk-base.esm.mjs
node --input-type=module -e 'import {build} from "esbuild"; await build({entryPoints:[process.argv[1]],outfile:process.argv[2],bundle:true,format:"esm",platform:"node",target:"node24",minify:false});' ../walk-previous/src/marked.ts ../walk-previous.esm.mjs
node --input-type=module -e 'import {build} from "esbuild"; await build({entryPoints:[process.argv[1]],outfile:process.argv[2],bundle:true,format:"esm",platform:"node",target:"node24",minify:false});' src/marked.ts ../merged.esm.mjs
node --input-type=module -e 'import {build} from "esbuild"; await build({entryPoints:[process.argv[1]],outfile:process.argv[2],bundle:true,format:"esm",platform:"node",target:"node24",minify:false});' ../link-base/src/marked.ts ../link-base.esm.mjs
node --input-type=module -e 'import {build} from "esbuild"; await build({entryPoints:[process.argv[1]],outfile:process.argv[2],bundle:true,format:"esm",platform:"node",target:"node24",minify:false});' ../link-head/src/marked.ts ../link-head.esm.mjs
```

Set `profile_clone` to your local clone of `nrps9909/nrps9909`, then reuse the original published probes:

```sh
node "$profile_clone/evidence/oss-2026-10-03/marked-4121-probe.mjs" ../walk-base.esm.mjs ../merged.esm.mjs ../walk-previous.esm.mjs > walk-result.json
node "$profile_clone/evidence/oss-2026-10-04/marked-4123-probe.mjs" ../link-base.esm.mjs ../link-head.esm.mjs lib/marked.esm.js > link-result.json
```

The walkTokens benchmark measures only traversal, excluding lexing, with no absolute timing gate. Sparse arrays intentionally gain own undefined entries; the tested Promise.all results match. Link tests inspect serialized HTML/tokens, not browser DOM or exhaustive specification conformance. All validation and evidence preparation used AI assistance; no new upstream comment, review or source patch was posted for this follow-up.
