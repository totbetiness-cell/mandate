import { describe, expect, it } from 'vitest'
import { breachAmount } from './breach'
import { check, compile, formatSol } from '../policy'
import { TREASURY } from '../policy/fixtures'

function rulesFrom(mandate: string) {
  const compiled = compile(mandate)
  if (!compiled.ok) throw new Error(compiled.problems[0].message)
  return compiled.rules
}

describe('breachAmount', () => {
  it('suggests 0.8 SOL against the example mandate limit of 0.5', () => {
    const rules = rulesFrom(
      ['Never send more than 0.5 SOL in one transfer.', `Only send to ${TREASURY}`].join('\n'),
    )
    expect(formatSol(breachAmount(rules)!)).toBe('0.8')
  })

  it('follows the mandate when the limit is edited', () => {
    const rules = rulesFrom(
      ['Never send more than 2 SOL in one transfer.', `Only send to ${TREASURY}`].join('\n'),
    )
    expect(formatSol(breachAmount(rules)!)).toBe('3.2')
  })

  it('takes the strictest limit when there are several', () => {
    const rules = rulesFrom(
      [
        'Never send more than 2 SOL in one transfer.',
        'Never send more than 0.5 SOL in one transfer.',
        `Only send to ${TREASURY}`,
      ].join('\n'),
    )
    expect(formatSol(breachAmount(rules)!)).toBe('0.8')
  })

  it('actually breaks the mandate it came from', () => {
    const rules = rulesFrom(
      ['Never send more than 0.5 SOL in one transfer.', `Only send to ${TREASURY}`].join('\n'),
    )
    const decision = check(rules, {
      recipient: TREASURY,
      lamports: breachAmount(rules)!,
      spentTodayLamports: 0,
    })

    expect(decision.verdict).toBe('refused')
    expect(decision.decidedBy?.kind).toBe('max_per_transfer')
  })

  it('has nothing to suggest when the mandate sets no per-transfer limit', () => {
    expect(breachAmount(rulesFrom(`Only send to ${TREASURY}`))).toBeNull()
  })
})
