# ADR-010: Component Folder Structure Reorganization

**Date:** 2026-08-27  
**Status:** Accepted  
**Author:** Epris R.

---

## Context

Fortify's `components/` directory is currently flat: 23 files plus `SignUp/` and `ui/` subfolders, reflecting the tutorial-based structure the project started from. The PRD has since scoped new feature work across four new domains, forecasting/runway, top-up, withdrawal, currency exchange, and settings/verification, adding roughly 10 new components. At 30+ flat files the directory stops being easily navigable.

The same problem exists in `constants/index.ts` (238 lines) and `types/index.d.ts` (369 lines), both single-file monoliths that will grow alongside the same new features. No routes exist yet for the new features either (`settings/`, `top-up/`, `withdraw/`, `exchange/`).

---

## Decision

Reorganize `components/` into feature subfolders alongside the existing `ui/` and `SignUp/`:

```
components/
  layout/
  accounts/
  transfers/
  transactions/
  forecast/
  money-movement/
  settings/
  ui/          (existing)
  SignUp/      (existing)
```

Migrate incrementally: new components are built directly into their feature folder from day one. Existing components move only when already being touched for other work, not as a dedicated refactor pass.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|-------|
| **Feature subfolders, incremental migration** *(chosen)* | New code lands in the right place immediately, no dedicated refactor session, existing working code isn't touched unnecessarily | Directory looks inconsistent during the transition period |
| **Leave flat, rely on naming conventions** | No migration effort | Already at the point of diminishing returns at 23 files, will get worse with 10 more |
| **Big-bang reorganization now** | Clean slate before new features land | Refactor time produces zero new functionality, risk of breaking working Phase 1 code for no product value |

---

## Consequences

**Good:**
- New feature work has a clear home from day one. No ambiguity about where a new component belongs.
- Feature progress isn't blocked or derailed by a dedicated refactor session.

**Bad / Trade-offs:**
- The directory is inconsistent during the transition period: new features organized, older components still flat at the root. That resolves naturally as existing components get touched in the course of other work.

**Deferred:**
- `constants/index.ts` and `types/index.d.ts` should eventually split along the same domain boundaries, but that's lower priority and not part of this decision.

---

## Consequences (Actual)

*To be filled in after migration is underway.*

---

## References
- Fortify Banking PRD