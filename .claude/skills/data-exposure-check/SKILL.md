---
name: data-exposure-check
description: Check new or changed code for the ADR-007 data-exposure pattern before marking a roadmap sub-feature done. Use whenever new code queries account, user, transaction, or verification data, or before closing out any roadmap "ADR-007 risk check" line item.
---

# Data exposure check

## Background

ADR-007 found a real, severe bug: a client component called a data-fetch function directly instead of going through a server action. Appwrite auto-expands relationship fields on read, so that one call returned the recipient's SSN, date of birth, home address, and both parties' bank credentials, in plaintext, into the sender's browser, on every transfer. The fix moved the entire transfer flow behind a single server action that never lets the client touch a raw account or user record, and replaced base64 account-ID obfuscation (trivially reversible) with real AES-256-GCM encryption.

This is a class of bug, not a one-time fix. Any new feature that queries a collection with relationships can reintroduce it.

## When to run this

Before marking any roadmap sub-feature "Live" if it touches account, user, transaction, or verification data. This is not optional for those — it's listed as its own line item in `docs/roadmap.md` for exactly this reason.

## Steps

1. **Find what's new.** `git diff` (or the relevant PR) against the base branch. List every file that adds or changes a call into `lib/actions/` or any direct Appwrite SDK call.

2. **For each new data-fetching call, check:**
   - **Is it called from a server action** (`lib/actions/` or `lib/server/`), never directly from a client component (`'use client'` file)? A client component should only ever receive already-filtered data from a server action, never call Appwrite itself.
   - **Does the query select explicit fields**, or does it return the whole document (and therefore every auto-expanded relationship) wholesale? If Appwrite's relationship expansion isn't explicitly limited, assume it's returning more than the caller needs.
   - **Does any identifier reaching the client** (account ID, user ID, transaction ID) go through the AES-256-GCM encryption established in ADR-007, rather than being passed raw or base64-encoded?

3. **Trace one level further.** If the new server action calls an existing helper, check that helper too — the original bug was one level removed from the component that triggered it.

4. **Report findings as a pass/fail list**, one line per file, with the specific field or line number if something fails:

   ```
   lib/actions/recurring.actions.ts
     ✓ called only from server context
     ✗ getRecurringItems() returns full account relation — should
       select only { id, name, frequency } before returning to client
   ```

5. **Don't mark the roadmap's "ADR-007 risk check" row Live until every item passes.** A partial pass means the sub-feature isn't done yet, same as any other unfinished checklist item.

## What NOT to do

- Don't treat this as a one-time audit that's already complete. Run it fresh for each stage that touches sensitive data.
- Don't assume a helper is safe because it looks similar to already-fixed code — check it directly.
- Don't pass or log full record objects "just for debugging" in server actions that handle account, user, or verification data.
