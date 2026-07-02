# Phase 3D v3-r14-r3 Emblem Asset Full Audit

## Purpose

Fix emblem PNGs that looked clipped, unbalanced, or contaminated by neighboring sheet fragments in small UI cards.

## Scope

- Kept the 69 PNG asset structure.
- Kept all TypeScript source, routes, feature guards, and manifest mappings from v3-r14-r1/r2.
- Replaced high-risk IF, habit, and tier assets with closer full cuts from the original emblem sheets.
- Re-centered all 69 PNGs on a consistent 1024x1024 transparent canvas.
- Removed green sheet residue and isolated neighboring-emblem fragments.

## Manually Recut Assets

- `core/habit_assignment_finisher.png`
- `core/habit_iron_will.png`
- `core/habit_reflection_complete.png`
- `core/if_calculation_precision.png`
- `core/if_concept_mastery.png`
- `core/if_flawless_review.png`
- `core/if_recovery.png`
- `core/if_time_control.png`
- `core/if_wrong_answer_conqueror.png`
- `tier/tier_axis_master.png`
- `tier/tier_focus.png`
- `tier/tier_foundation.png`
- `tier/tier_mastery.png`
- `tier/tier_seed.png`
- `tier/tier_strategy.png`

## Verification

- PNG count remains 69.
- `npm run build` passed.
- No feature flag, route, or UI behavior was changed in this cleanup.
