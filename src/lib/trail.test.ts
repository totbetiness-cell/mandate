import { describe, expect, it } from 'vitest'
import { entryFrom, prepend, TRAIL_LIMIT } from './trail'
import type { TrailEntry } from './trail'
import { check, compile } from '../policy'
import { STRANGER, TREASURY } from '../policy/fixtures'

function rules(recipient = TREASURY) {
  const compiled = compile(
    ['Never send more than 0.5 SOL in one transfer.', `Only send to ${recipient}`].join('\n'),
  )
  if (!compiled.ok) throw new Error('fixture mandate does not compile')
  return compiled.rules
}

describe('entryFrom', () => {
  it('keeps the quoted rule of a refusal', () => {
    const decision = check(rules(), {
      recipient: STRANGER,
      lamports: 100_000_000,
      spentTodayLamports: 0,
    })
    const entry = entryFrom({
      decision,
      lamports: 100_000_000,
      recipient: STRANGER,
      at: '2026-09-20T18:00:00.000Z',
      id: 'fixed',
    })

    expect(entry).toMatchObject({
      verdict: 'refused',
      signature: null,
      rule: { id: 'L2' },
    })
    expect(entry.rule?.source).toContain('Only send to')
  })

  it('carries the signature of a transfer that was sent', () => {
    const decision = check(rules(), {
      recipient: TREASURY,
      lamports: 100_000_000,
      spentTodayLamports: 0,
    })
    const entry = entryFrom({
      decision,
      lamports: 100_000_000,
      recipient: TREASURY,
      signature: 'sig123',
    })

    expect(entry.verdict).toBe('allowed')
    expect(entry.signature).toBe('sig123')
    expect(entry.rule).toBeNull()
  })
})

describe('prepend', () => {
  const entry = (id: string): TrailEntry => ({
    id,
    at: '2026-09-20T18:00:00.000Z',
    verdict: 'refused',
    lamports: 1,
    recipient: TREASURY,
    reason: 'because',
    rule: null,
    signature: null,
    error: null,
  })

  it('puts the newest first', () => {
    expect(prepend([entry('old')], entry('new')).map((item) => item.id)).toEqual([
      'new',
      'old',
    ])
  })

  it('never grows past the limit', () => {
    const full = Array.from({ length: TRAIL_LIMIT }, (_, index) => entry(`e${index}`))
    const result = prepend(full, entry('newest'))

    expect(result).toHaveLength(TRAIL_LIMIT)
    expect(result[0].id).toBe('newest')
    expect(result.at(-1)?.id).toBe(`e${TRAIL_LIMIT - 2}`)
  })
})
