# W0-A addendum

Typecheck (`vue-tsc -p tsconfig.app.json`) and `check-css-tokens` both pass. I did not run the e2e spec, which needs Keycloak.

1. `fold(text)` is exported from `src/lib/utils.ts` with JSDoc: NFD, `\p{M}` stripped, `toLocaleLowerCase`, final sigma ς folded to σ. I did not edit any caller.
2. `e2e/touch-and-forced-colours.spec.ts`: the not-found heading name is now "Page not found".
3. `src/style.css` forced colours:
   - The `[aria-current] *` rule now excludes `.forced-step-current` and its descendants.
   - I also added `.forced-step-current * { color: CanvasText !important }`, so the current-step number stays visible.
   - Probe on `UX-R3-p2 Trail` with forced colours: the first-run guide's current-step circle "4" computes to color `rgb(0,0,0)` on `rgb(255,255,255)` with the 4 px border, and the number is readable in the shot.
   - In this DOM the circle is not inside an `aria-current` element, so the new exclusion was not exercised by the probe.
   - Shot: `ux-audit/round-3/implementation/W0-A/after/forced-colours-first-run__1440.png`. Probe: `ux-audit/round-3/implementation/W0-A/probes/firstrun.mjs`.
4. `src/lib/format.ts` `formatBytes`: whole megabytes print without ".0" ("20 MB"); other values keep one decimal. I did not run `formatBytes` after the edit; it is covered only by the typecheck.

The toast action button was skipped as asked.
