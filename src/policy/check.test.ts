import { describe, expect, it } from 'vitest'
import { check } from './check'
import { compile } from './parse'
import { toLamports } from './amounts'
import { STRANGER, TREASURY, VENDOR } from './fixtures'
import type { IntendedTransfer, Rule } from './types'

const sol = (amount: string) => toLamports(amount)!

function rulesFrom(mandate: string): Rule[] {
  const result = compile(mandate)
  if (!result.ok) throw new Error(`fixture mandate does not compile: ${mandate}`)
  return result.rules
}

function transfer(overrides: Partial<IntendedTransfer> = {}): IntendedTransfer {
  return {
    recipient: TREASURY,
    lamports: sol('0.1'),
    spentTodayLamports: 0,
    ...overrides,
  }
}

const FULL_MANDATE = [
  'Never send more than 0.5 SOL in one transfer.',
  'Never send more than 2 SOL per day.',
  `Only send to ${TREASURY} and ${VENDOR}.`,
  'The mandate is active.',
].join('\n')

describe('check · refusing by default', () => {
  it('refuses everything under an empty mandate', () => {
    const decision = check([], transfer())
    expect(decision.verdict).toBe('refused')
    expect(decision.reason).toContain('empty mandate allows nothing')
    expect(decision.decidedBy).toBeUndefined()
  })

  it('refuses when the mandate never says who may receive funds', () => {
    const decision = check(rulesFrom('Never send more than 1 SOL per transfer.'), transfer())
    expect(decision.verdict).toBe('refused')
    expect(decision.reason).toContain('never says who may receive funds')
  })

  it('refuses an amount that is not a whole positive number of lamports', () => {
    for (const lamports of [0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 2]) {
      expect(check(rulesFrom(FULL_MANDATE), transfer({ lamports })).verdict).toBe('refused')
    }
  })
})

describe('check · the four rules', () => {
  const rules = rulesFrom(FULL_MANDATE)

  it('allows a transfer that every rule permits', () => {
    const decision = check(rules, transfer())
    expect(decision.verdict).toBe('allowed')
    expect(decision.decidedBy).toBeUndefined()
    expect(decision.reason).toContain('0.1 SOL')
  })

  it('names every rule that let the transfer through, for the memo', () => {
    expect(check(rules, transfer()).satisfied).toEqual(['L1', 'L2', 'L3', 'L4'])
  })

  it('names no satisfied rules on a refusal', () => {
    expect(check(rules, transfer({ recipient: STRANGER })).satisfied).toBeUndefined()
  })

  it('refuses a recipient that is not on the list, and says which line decided', () => {
    const decision = check(rules, transfer({ recipient: STRANGER }))
    expect(decision.verdict).toBe('refused')
    expect(decision.decidedBy?.kind).toBe('allowed_recipients')
    expect(decision.decidedBy?.line).toBe(3)
    expect(decision.reason).toContain(STRANGER)
  })

  it('refuses a transfer above the per-transfer limit', () => {
    const decision = check(rules, transfer({ lamports: sol('0.6') }))
    expect(decision.decidedBy?.kind).toBe('max_per_transfer')
    expect(decision.reason).toContain('0.5 SOL')
  })

  it('allows a transfer exactly at the per-transfer limit', () => {
    expect(check(rules, transfer({ lamports: sol('0.5') })).verdict).toBe('allowed')
  })

  it('counts what was already sent today against the daily budget', () => {
    const atTheLine = check(
      rules,
      transfer({ lamports: sol('0.5'), spentTodayLamports: sol('1.5') }),
    )
    expect(atTheLine.verdict).toBe('allowed')

    const overIt = check(
      rules,
      transfer({ lamports: sol('0.5'), spentTodayLamports: sol('1.500000001') }),
    )
    expect(overIt.verdict).toBe('refused')
    expect(overIt.decidedBy?.kind).toBe('daily_budget')
    expect(overIt.reason).toContain('already sent today')
  })

  it('refuses everything while the mandate is paused', () => {
    const paused = rulesFrom(FULL_MANDATE.replace('is active', 'is paused'))
    const decision = check(paused, transfer())
    expect(decision.verdict).toBe('refused')
    expect(decision.decidedBy?.kind).toBe('paused')
  })
})

describe('check · which rule gets to decide', () => {
  it('is the first one in the mandate that objects, reading top to bottom', () => {
    // This transfer breaks two rules at once: too large, and to a stranger.
    const capFirst = rulesFrom(
      [
        'Never send more than 0.5 SOL in one transfer.',
        `Only send to ${TREASURY}`,
      ].join('\n'),
    )
    const listFirst = rulesFrom(
      [
        `Only send to ${TREASURY}`,
        'Never send more than 0.5 SOL in one transfer.',
      ].join('\n'),
    )
    const bad = transfer({ recipient: STRANGER, lamports: sol('9') })

    expect(check(capFirst, bad).decidedBy?.kind).toBe('max_per_transfer')
    expect(check(listFirst, bad).decidedBy?.kind).toBe('allowed_recipients')
  })
})

describe('check · determinism', () => {
  it('returns the same decision for the same input, every time', () => {
    const rules = rulesFrom(FULL_MANDATE)
    const input = transfer({ lamports: sol('0.4'), spentTodayLamports: sol('1.7') })
    const decisions = Array.from({ length: 50 }, () => check(rules, input))

    expect(new Set(decisions.map((d) => JSON.stringify(d))).size).toBe(1)
  })
})
