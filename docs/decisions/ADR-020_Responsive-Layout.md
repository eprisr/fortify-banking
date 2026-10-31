# ADR-020: Responsive Layout, Retiring the Phone Frame

**Date:** 2026-10-31  
**Status:** Accepted  
**Author:** Epris R

---

## Context

In September I made a deliberate shortcut. I hadn't built Fortify to be responsive, so I locked the layout into a fixed phone-width column, centered on the page, and let desktop users see it letterboxed. Every screen only had to handle one viewport. That was the right call at the time, because it let me finish the auth, MFA, notification and transfer work without also solving layout.

The shortcut has a cost that I knew about when I took it. Radix and shadcn portal sheets and dialogs to the end of `body`, which puts them outside the phone frame. The fix was a small React context, `MobileContainer`, that hands the frame element to the portal so overlays render inside it. It works, but it's a workaround for a layout I no longer want. Right now it's used by `Navbar`, `TwoFactorDisableControl`, `AccountOptionsSheet` and `AccountPicker`, plus the shared sheet and alert dialog components, and all three route layouts (`(root)`, `(auth)`, `(onboarding)`) wrap their children in it.

The frame itself is about 375 by 667 pixels, with rounded corners and a shadow, and only applies from the custom `xs` breakpoint up. On an actual phone it already gets out of the way.

The question came up when I started thinking about who opens this on a laptop. Most visitors will be on desktop, and I weighed two options. Make the app responsive, or build a landing page that shows the mobile app in a phone mockup and funnel people toward it. The landing page option was the easier one, and honestly the better portfolio piece in the short run. I still chose responsive, for one reason. Fortify has to work as a real web application. Someone who signs in on a laptop should be able to use it, not look at a picture of it. And the feature this whole project is positioned on, the forecast, is a chart. It needs width.

Desktop wasn't in the PRD or the roadmap, so this is a scope amendment. It's now Stage 1.7 on the roadmap and a line under "Real" in PRD section 6.

---

## Decision

Make the app responsive across three tiers, and remove the phone frame.

1. **Desktop.** Sidebar navigation and a top bar.
2. **Tablet.** A slim icon rail.
3. **Mobile.** Bottom tabs, as it works today.

Flows that are bottom sheets on mobile, like connecting a bank or account options, become centered modals on desktop.

`MobileContainer` and its portal context get removed from the layouts and from the five components that use it. Sheets and dialogs go back to portaling to `body` the way Radix expects.

I built a layout prototype in Claude to test the shape of this. It's a reference for structure only. It used placeholder colors and a different font from the real design system, and I haven't run it in a browser. The real build uses the Ink, Paper, Cloud, Plum, Gold, Sage and Terracotta tokens and the current type scale.

### Open at the time of writing

- **Breakpoint values.** The prototype used 768px and 1100px. Tailwind's defaults are 768px (`md`) and 1024px (`lg`). I'd rather use the defaults than add another custom breakpoint, and I'll settle it when the shell is built.
- **The `xs` breakpoint.** It exists for the phone frame. It may still be useful for small phones, or it may go away with the frame.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Responsive layout** *(chosen)* | The app actually works on a laptop. The forecast chart gets real width. Removes the portal workaround. | Touches every screen. Needs desktop patterns the mobile-first design system doesn't have yet. |
| **Keep the phone frame, add a landing page** | Least work. Strong first impression for recruiters. | A dead end for anyone who came to use the app. Keeps the portal workaround. The forecast stays squeezed into a phone column. |
| **Separate desktop app or route tree** | Each layout is designed on its own terms. | Two UIs to build, test and keep in sync, on a project that needs to be finished. |

---

## Consequences (Expected)

**Good:**
- Fortify works as a full web application, which is what I set out to build.
- The forecast chart and upcoming bills view can be designed once at full width, which is why this lands before Stage 4.
- One less workaround to explain and maintain.

**Bad / Trade-offs:**
- Every existing screen gets revisited. That's the real cost, and it's why this has its own roadmap stage and not a line item.
- The design system was built mobile-first. Desktop needs layout patterns for tables, wider cards and navigation, and some of those need to be designed before they're built.

**Risks:**
- Scope creep. "Make it work on desktop" can turn into a redesign. The bar is that every existing screen is usable at desktop and tablet widths, not that each one gets a new desktop layout.
- Four Jest suites already fail on `main`, and the navbar suite is one of them. It sits right in the path of this work, so it needed fixing either way. That happened during the CI setup in ADR-021, and the suite will need updating again for the new shell.
- Capacitor stays in the repo as a dev testing aid, and as a door left open to shipping a native app later. Removing the frame doesn't affect it, but a native build would eventually want its own look at layout.

---

## Consequences (Actual)

*To be filled in when Stage 1.7 ships.*

---

## References
- Roadmap, Stage 1.7
- PRD, section 6 (Definition of Done)
