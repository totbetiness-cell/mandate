/**
 * An amount that is certain to break the mandate.
 *
 * The page uses it twice: to phrase the nudge that gets a first-time visitor
 * to the point ("change the amount to 0.8"), and for the button that does it
 * for them. Both are derived from the mandate actually on screen, so editing
 * the limit changes the suggestion with it — a hint that contradicts the rules
 * it is demonstrating would be worse than no hint.
 */

import type { Rule } from '../policy'

/** Comfortably over the line, without looking like a typo. */
const OVERSHOOT = 1.6

export function breachAmount(rules: Rule[]): number | null {
  const caps = rules
    .filter((rule) => rule.kind === 'max_per_transfer')
    .map((rule) => rule.lamports)

  if (caps.length === 0) return null
  return Math.round(Math.min(...caps) * OVERSHOOT)
}
