/**
 * The check that runs before anything is signed.
 *
 * Two properties matter more than any feature here:
 *
 * 1. **It refuses by default.** An empty mandate allows nothing. A mandate
 *    that does not mention recipients allows nothing to any recipient. The
 *    burden is on the sentences to permit, never on the engine to forbid.
 * 2. **It is deterministic.** No clock, no network, no randomness, no model.
 *    Everything it needs is in its arguments, which is why the tests can pin
 *    its behaviour down completely.
 *
 * Rules are read top to bottom and the first one that objects decides, so the
 * refusal always points at a line the author can go and read.
 */

import { formatSol } from './amounts'
import type { Decision, IntendedTransfer, Rule } from './types'

export function check(rules: Rule[], transfer: IntendedTransfer): Decision {
  if (!Number.isSafeInteger(transfer.lamports) || transfer.lamports <= 0) {
    return {
      verdict: 'refused',
      reason: 'A transfer has to be a whole, positive number of lamports.',
    }
  }

  if (rules.length === 0) {
    return {
      verdict: 'refused',
      reason: 'This mandate is empty, and an empty mandate allows nothing.',
    }
  }

  if (!rules.some((rule) => rule.kind === 'allowed_recipients')) {
    return {
      verdict: 'refused',
      reason:
        'This mandate never says who may receive funds, so nobody may. ' +
        'Add a line such as "Only send to <address>".',
    }
  }

  for (const rule of rules) {
    const refusal = objection(rule, transfer)
    if (refusal) {
      return { verdict: 'refused', decidedBy: rule, reason: refusal }
    }
  }

  return {
    verdict: 'allowed',
    reason: `Every rule in this mandate allows it: ${formatSol(
      transfer.lamports,
    )} SOL to ${transfer.recipient}.`,
  }
}

/** The sentence a rule says when it refuses, or null when it has no objection. */
function objection(rule: Rule, transfer: IntendedTransfer): string | null {
  switch (rule.kind) {
    case 'paused':
      return rule.paused ? 'The mandate is paused, so nothing may be sent.' : null

    case 'allowed_recipients':
      return rule.addresses.includes(transfer.recipient)
        ? null
        : `${transfer.recipient} is not on the list of allowed recipients.`

    case 'max_per_transfer':
      return transfer.lamports > rule.lamports
        ? `${formatSol(transfer.lamports)} SOL is above the limit of ` +
            `${formatSol(rule.lamports)} SOL for a single transfer.`
        : null

    case 'daily_budget': {
      const spent = transfer.spentTodayLamports
      const total = spent + transfer.lamports
      if (total <= rule.lamports) return null

      return (
        `${formatSol(transfer.lamports)} SOL would bring today's total to ` +
        `${formatSol(total)} SOL, above the daily budget of ` +
        `${formatSol(rule.lamports)} SOL` +
        (spent > 0 ? ` (${formatSol(spent)} SOL already sent today).` : '.')
      )
    }
  }
}
