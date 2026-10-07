# Focused maintenance path

I am an external contributor (`nrps9909`) with READ access, without Ant Design organization membership or write permission. This is a proposed responsibility path, not an upstream appointment.

## Upstream route

Ant Design's current [Collaborators guide](https://github.com/ant-design/ant-design/wiki/Collaborators) asks for sustained engagement and a significant contribution, such as an important feature, major refactor, or long-standing problem. The published route uses [#3222](https://github.com/ant-design/ant-design/issues/3222), community assessment, and an invitation. The [official maintenance guide](https://ant.design/docs/blog/contributor-development-maintenance-guide/) describes ongoing issue/PR and merge responsibilities. A recent invitation in August 2026 confirms the thread remains in use, despite being closed and unlocked.

My 25 merged Ant Design PRs provide a contribution history; they do not establish that the significant-contribution requirement or role assessment has been met. Collaborator, repository permissions, and any formal core-maintainer appointment are separate states.

Marked's [role definitions](https://github.com/markedjs/marked/blob/master/docs/AUTHORS.md) distinguish contributors, committers, admins, and publishers. Committers participate in direction and review/merge others' work. Marked remains a secondary maintenance direction, with adopted review work already recorded. I have submitted one scoped proposal to Ant Design in this round.

## Proposed responsibility

[Submitted proposal](https://github.com/ant-design/ant-design/issues/3222#issuecomment-6033907706): maintain **Menu/Dropdown keyboard activation and focus behavior**, including canonical rc-menu / rc-dropdown changes and Ant Design integration. Current state: **PROPOSED**. No scope agreement, assignment, vote, invitation, or elevated permission has been verified.

The work includes minimal issue reproductions, overlapping-PR checks, reviewing the actual commit with regression and native-browser evidence, collaboration with existing authors, and following dependency release / Ant Design integration. I asked maintainers which useful, unclaimed long-standing feature I should own to meet their significant-contribution criterion.

## First executed round

[rc-menu #898 review](https://github.com/react-component/menu/pull/898#pullrequestreview-5439489565) addresses the canonical fix for [Ant #57766](https://github.com/ant-design/ant-design/issues/57766). The original first-focus link-navigation failure is fixed on the tested head / merge preview, while real Chrome tests expose duplicate native Enter activation (including reversed multiple selection) and lost preventScroll in direct item focus.

Complete head / preview tests pass 146/146, base 144/144; copied new author tests fail twice on base. TypeScript and package compilation pass; lint has no errors and 11 warnings. The review preserves exact commits, merge parents, native browser results, inherited arrow-activation behavior, controls, and the remote-CI boundary. No duplicate source PR was created. [Reproduction and receipts](./evidence/maintainer-path-2026-10-07/).

## Ongoing work and milestones

- Daily maintenance prioritizes new maintainer feedback, #898 changes, and actionable existing PR regressions / conflicts. Unchanged heads are not repeatedly retested or prompted.
- The [initial weekly issue queue](./evidence/maintainer-path-2026-10-07/weekly-issue-queue-2026-10-07.json) records confirmed problems, canonical patches, release / integration status, and concrete blockers. External updates require new evidence or a necessary maintainer request.
- After upstream feedback, take ownership of an agreed unclaimed follow-up, reproduce it, add meaningful regression coverage, publish signed fixes, and follow review through release and integration.
- Pursue the published Collaborator process with delivered significant work and sustained responsibility. Record proposal, scope agreement, assignment, nomination, community assessment, invitation, accepted permissions, and formal role separately. Upstream decides the appointment; there is no guaranteed promotion deadline.

AI assistance: Codex helped research the process, run isolated validation, and prepare these records. Upstream commit, message, and permission readbacks are preserved. [Dated snapshot](./evidence/maintainer-path-2026-10-07.json).
