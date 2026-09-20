/**
 * One short line per rule, for the list beside the editor.
 *
 * This is presentation only: the engine never reads these strings, and a
 * change here can never change a decision.
 */

import { formatSol } from '../policy'
import type { Rule } from '../policy'

export function describeRule(rule: Rule): string {
  switch (rule.kind) {
    case 'max_per_transfer':
      return `At most ${formatSol(rule.lamports)} SOL in a single transfer`
    case 'daily_budget':
      return `At most ${formatSol(rule.lamports)} SOL in a day`
    case 'allowed_recipients':
      return rule.addresses.length === 1
        ? `One allowed recipient: ${short(rule.addresses[0])}`
        : `${rule.addresses.length} allowed recipients: ${rule.addresses.map(short).join(', ')}`
    case 'paused':
      return rule.paused ? 'Paused — nothing may be sent' : 'Active'
  }
}

/** Addresses are long and the eye only needs the ends to compare two of them. */
export function short(address: string): string {
  return address.length <= 12 ? address : `${address.slice(0, 4)}…${address.slice(-4)}`
}
