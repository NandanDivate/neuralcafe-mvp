# NeuralCafe UI Redesign Task for Antigravity

## Mission

Redesign the existing NeuralCafe web application into a **premium modern AI workstation with balanced Windows 7 Aero styling**. Use an **Obsidian + Champagne + Brushed Silver** palette and ensure the experience is fully responsive on mobile, tablet, and desktop.

This is an implementation task. Inspect the existing repository and make the changes directly. Do not merely describe the changes or create mockups.

## Non-negotiable requirements

1. **Preserve existing functionality.** Do not break or replace the current authentication, wallet, model selection, session creation, countdown, chat, copy, navigation, or end-session logic.
2. **Mobile-first responsiveness is mandatory.** Treat mobile layout as a first-class design, not a final patch.
3. **Remove nonfunctional minimize and maximize buttons.** Keep only the **Close (×) button** in the custom application title bars. Do not leave empty placeholders for the removed controls. The Close button must have a meaningful, safe action:
   - If it represents a real in-app window/panel that can be dismissed, close that panel using existing app behavior.
   - If it is only decorative desktop-style chrome and there is no meaningful close action, either make it a clear navigation/back action only when appropriate, or remove the entire custom window-control group rather than presenting a fake close action.
   - Never attempt to close or minimize the user's browser window.
4. **Do not invent data or integrations.** Keep existing authoritative values, APIs, model names, prices, wallet behavior, and authentication integrations. Do not replace production behavior with mock data.
5. **Keep demo behavior honest.** If wallet top-ups are simulated, retain a clear demo/simulation label. Do not imply that a simulated balance change is a real payment.
6. **Use shared reusable components and centralized design tokens** where practical. Avoid duplicating slightly different styles across the five screens.
7. Inspect the codebase before editing, then implement the changes and run available checks.

## Visual direction

The product should feel like modern enterprise software with Windows 7 Aero DNA, not a full retro imitation or a neon gaming dashboard.

- Keep subtle glass/gradient treatment on title bars and selected controls.
- Use bevels and metallic borders sparingly.
- Remove excessive cyan/blue glow, heavy outlines, and oversized shadows.
- Keep the majority of surfaces neutral graphite/obsidian.
- Use champagne as a restrained accent for primary actions, selected states, and important highlights.
- Use modern, readable typography and consistent spacing.
- Preserve recognizable Aero window framing on desktop, but simplify the frame on small screens.
- Do not make every card, button, or border champagne-colored.

### Suggested color tokens

Adapt existing styles rather than blindly duplicating tokens if a design system already exists.

```css
:root {
  --nc-bg: #17191d;
  --nc-bg-elevated: #1d2025;
  --nc-surface: #24272d;
  --nc-surface-raised: #2d3138;

  --nc-titlebar-top: #515761;
  --nc-titlebar-bottom: #252930;

  --nc-champagne: #d8c29a;
  --nc-champagne-hover: #e6d2ad;
  --nc-champagne-muted: #88795e;

  --nc-silver: #555b64;
  --nc-border: #3d424b;

  --nc-text: #f0f1f3;
  --nc-text-secondary: #b1b6c0;
  --nc-text-muted: #858d99;

  --nc-success: #75b895;
  --nc-warning: #e2b56d;
  --nc-danger: #e18b87;
}
```

Use the existing font stack where sensible, or prefer `"Segoe UI", Inter, system-ui, sans-serif`. Check contrast on actual rendered surfaces. These values are a starting point, not a reason to create unreadable combinations.

## Responsive requirements

Use mobile-first CSS and content-driven breakpoints. Suggested ranges:

- **320–479 px:** single-column mobile layout.
- **480–767 px:** mobile layout with more breathing room.
- **768–1023 px:** tablet layout, one or two columns as appropriate.
- **1024 px and above:** desktop workstation framing.

Requirements:
- Support widths down to **320 CSS pixels** without unintended horizontal page scrolling.
- Use fluid widths and `minmax(0, 1fr)` in grids; avoid fixed desktop widths on main content.
- Add `min-width: 0` to flex/grid children when necessary to prevent overflow.
- Allow long account emails, model names, and text to wrap safely.
- Do not use `overflow-x: hidden` as a blanket fix for layout bugs.
- Use a single-column layout for narrow screens and stack cards when necessary.
- Keep controls at least approximately **44 × 44 CSS pixels** where practical.
- Do not disable browser zoom.
- Respect `prefers-reduced-motion`.
- Account for mobile safe areas when positioning bottom controls.
- Verify portrait and landscape layouts.
- Do not depend on hover-only interactions.

### Desktop vs mobile window framing

**Desktop:**
- Centered Aero-inspired application windows where appropriate.
- Restrained title-bar gradient, fine metallic border, subtle shadow.
- Show only the Close (×) control in custom title bars.

**Mobile:**
- Expand the app surface to available width with modest page padding.
- Reduce decorative shadows and excessive outer margins.
- Keep the title bar compact.
- Keep only the Close (×) control, subject to the meaningful-action rule above.
- Remove minimize and maximize controls entirely.
- Do not imitate browser-level controls or suggest the website can close the browser.
- Prefer natural document scrolling to a fixed desktop canvas.

## Screen-by-screen implementation

### 1. Landing page

- Keep the main product message and “Start an AI Session” action prominent.
- Use a restrained dark cinematic background, graphite cards, champagne highlights, and subtle Aero framing.
- Reduce excessive decorative glow and empty space.
- Stack feature cards on mobile.
- Ensure the headline wraps naturally and the primary action is easy to tap.
- Preserve existing navigation and authentication checks.

### 2. Google sign-in

- Keep the existing Google OAuth integration, redirects, callback handling, and session persistence.
- Use a compact centered panel on desktop and a near-full-width card on mobile.
- Make the sign-in action full-width on narrow screens.
- Implement visible loading, failure, and cancellation states using the existing flow.
- Do not ask for or store Google passwords in the app.
- Do not make unsupported security claims.

### 3. Wallet manager

- Make the current wallet balance prominent and readable.
- Show preset recharge amounts in one row on wide screens and a two-column grid on mobile.
- Keep the custom amount input and primary action full-width on mobile.
- Preserve existing validation and wallet integration.
- Prevent duplicate submissions while an operation is pending.
- Reflect actual operation results; do not report success before confirmation.
- Preserve any demo/simulated-top-up label.

### 4. Session configuration

- Keep the duration options and model choices clear and easy to compare.
- Use horizontal card layouts on wide screens and stacked or compact layouts on mobile.
- Make selected duration and model obvious using border, background, and a non-color indicator.
- Keep selected price and wallet balance visible near the launch action.
- Preserve current model names, prices, availability, backend validation, and session creation logic.
- Prevent duplicate session creation.

### 5. Active chat session

- Keep the conversation as the visual focus.
- Show selected model, countdown, wallet/session information, and End Session action in a compact status area.
- Ensure the composer remains usable with the mobile keyboard open.
- Prevent the composer from covering the latest message.
- Support long assistant messages, code blocks, copy actions, loading states, request errors, and session expiry.
- Keep code blocks within their own scrollable area if necessary; avoid page-wide overflow.
- Preserve existing chat and session lifecycle behavior.
- Ensure End Session remains accessible and distinguishable from the title-bar Close button.

## Title-bar close button requirements

The current UI includes minimize, maximize, and close controls. Implement the following:

- Remove the minimize (`−`) and maximize (`□`) buttons and any associated unused handlers, styles, or state.
- Keep only a Close (`×`) control if it has a valid in-app action.
- If the title bar belongs to a non-dismissible full-page layout, do not add a fake Close button just for appearance. Remove the control group in that case.
- If Close dismisses a dialog/panel, ensure it is keyboard accessible, has an accessible label such as `Close dialog`, and returns focus appropriately.
- If Close navigates back, use existing routing/history behavior and provide a safe fallback when there is no prior in-app route.
- Never call `window.close()` to try to close a normal browser tab.
- Never use a fake button that has no action.
- Ensure the close action does not accidentally end an AI session or discard wallet/authentication work. Those actions must remain separate and explicit.

## Suggested implementation approach

1. **Audit first:** inspect the repository structure, routing, current components, global styles, authentication flow, wallet logic, session APIs, and chat lifecycle. Identify the existing stack and scripts.
2. **Map existing functionality:** note which components and functions must remain intact. Do not assume file names or frameworks.
3. **Create/refine design tokens:** centralize colors, spacing, radii, shadows, and focus states.
4. **Build shared visual primitives:** reusable Aero title bar, app shell, surface/card, button, input, selection card, status badge, and responsive layout helpers where useful.
5. **Redesign the five screens incrementally:** reuse existing logic and wire new UI to existing handlers/state.
6. **Remove nonfunctional window controls:** remove minimize/maximize, then verify the remaining Close action is real and safe.
7. **Test responsiveness:** inspect each screen at 320, 360, 390, 430, 768, 1024, and 1440 CSS pixels. Test mobile portrait/landscape and the active chat with the keyboard open.
8. **Run validation:** execute the repository's existing build, lint, and test scripts. Fix failures caused by the changes and report any unrelated pre-existing failures clearly.

## Acceptance checklist

- [ ] All five screens follow the Obsidian + Champagne design system.
- [ ] The interface feels like premium modern software with balanced Windows 7 Aero styling.
- [ ] Excessive blue/cyan glow is removed or substantially reduced.
- [ ] Minimize and maximize buttons are removed from all custom title bars.
- [ ] Any remaining Close button has a meaningful, safe, accessible action.
- [ ] No code attempts to close or minimize the browser window.
- [ ] All five screens work at 320 CSS pixels and above.
- [ ] No unintended horizontal page overflow or clipped content.
- [ ] Mobile buttons and controls are comfortable to tap.
- [ ] The chat composer works with the mobile keyboard open.
- [ ] Long messages and code blocks remain readable.
- [ ] Google sign-in and navigation continue to work.
- [ ] Wallet validation and demo/production distinctions remain correct.
- [ ] Model selection, pricing, session creation, countdown, and end-session behavior remain intact.
- [ ] Loading, success, error, disabled, and selected states are implemented.
- [ ] Keyboard navigation, focus visibility, contrast, and reduced-motion behavior are checked.
- [ ] Existing build/lint/test commands have been run where available.

## Required completion report

When finished, report:
1. Files changed.
2. Components added or reused.
3. How the five screens changed.
4. How mobile behavior was implemented.
5. How the minimize/maximize controls were removed and what the Close button does.
6. Tests/build commands run and their results.
7. Any known limitations or remaining failures.

**Final target:** NeuralCafe should look like a premium AI workstation on desktop and a deliberately designed, touch-friendly AI app on mobile. Preserve its functionality and Aero identity without fake window controls or desktop-only layouts.
