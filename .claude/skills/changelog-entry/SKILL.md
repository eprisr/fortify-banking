---
name: changelog-entry
description: Draft a CHANGELOG.md entry from git history when a roadmap stage or feature ships. Use when the user says a stage or feature is done, asks to update the changelog, or asks what should go in the changelog since the last entry.
---

# Changelog entry

Fortify Banking tracks shipped work in `CHANGELOG.md` at the repo root, newest entry first. Each entry is one stage or feature from `docs/roadmap.md`, not one commit — the changelog is a delivery trail for someone skimming the project, not a mirror of git history.

## Steps

1. **Find the last entry.** Read the top of `CHANGELOG.md` for its date. If the file doesn't exist yet, this is the first entry — start it.
2. **Get the commit history since then.** Run `git log --oneline --since="<last entry date>"`. Skim the messages and, where a commit message is unclear, `git show <hash>` to see what actually changed.
3. **Match commits to a roadmap stage.** Check `docs/roadmap.md` for which stage this work belongs to, and whether every sub-feature under that stage is now Live. If any sub-feature is still Planned or In progress, this isn't a stage-complete entry yet — either write a smaller entry for what actually shipped, or hold off.
4. **Check for a companion blog post or ADR.** Look in `docs/decisions/` and ask the user whether a blog post exists or is planned for this stage — link both if they do.
5. **Draft the entry.** One line, plain and direct — no marketing language, no "successfully," no exclamation points:

   ```
   ## 2026-09-15 — Bill pay

   Extended the transfer flow to support paying a biller directly, not just
   moving money between linked accounts or contacts. Confirmation follows
   the same no-back-button pattern as other transfers.

   [ADR-008](docs/decisions/ADR-008_...) · [Blog post](https://www.eprisr.com/blog/...)
   ```

6. **Append it above the previous entry**, not below — newest on top.
7. **Don't touch older entries.** This skill only ever adds one new entry at the top; it never rewrites history that's already there.

## What NOT to do

- Don't write an entry per commit. Squash the whole stage into one entry.
- Don't write an entry for a stage that's only partially done — check the roadmap's sub-feature table first.
- Don't editorialize or oversell. Match the direct, no-em-dash, comma-over-semicolon tone used everywhere else in this project's docs.
- Don't link a blog post that doesn't exist yet — ask rather than guess.
