import { describe, expect, it } from 'vitest'
import { compile, parse } from './parse'
import { TREASURY, VENDOR } from './fixtures'

describe('parse', () => {
  it('reads the four rule kinds', () => {
    const { rules, problems } = parse(
      [
        'Never send more than 0.5 SOL in one transfer.',
        'Never send more than 2 SOL per day.',
        `Only send to ${TREASURY} and ${VENDOR}.`,
        'The mandate is active.',
      ].join('\n'),
    )

    expect(problems).toEqual([])
    expect(rules.map((rule) => rule.kind)).toEqual([
      'max_per_transfer',
      'daily_budget',
      'allowed_recipients',
      'paused',
    ])
    expect(rules[0]).toMatchObject({ id: 'L1', line: 1, lamports: 500_000_000 })
    expect(rules[1]).toMatchObject({ lamports: 2_000_000_000 })
    expect(rules[2]).toMatchObject({ addresses: [TREASURY, VENDOR] })
    expect(rules[3]).toMatchObject({ paused: false })
  })

  it('does not care about case, spacing or the full stop', () => {
    const { rules, problems } = parse('  never  send more than 1 SOL PER transfer  ')
    expect(problems).toEqual([])
    expect(rules[0]).toMatchObject({ kind: 'max_per_transfer', lamports: 1_000_000_000 })
  })

  it('quotes the line back as it was written', () => {
    const { rules } = parse('   Never send more than 1 SOL per transfer.   ')
    expect(rules[0].source).toBe('Never send more than 1 SOL per transfer.')
  })

  it('skips blank lines and comments but keeps line numbers honest', () => {
    const { rules, problems } = parse(
      ['# my mandate', '', 'The mandate is paused.'].join('\n'),
    )
    expect(problems).toEqual([])
    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({ line: 3, id: 'L3', paused: true })
  })

  it('accepts a recipient list separated by commas, "and", or both', () => {
    const { rules } = parse(`Only send to ${TREASURY}, ${VENDOR}`)
    expect(rules[0]).toMatchObject({ addresses: [TREASURY, VENDOR] })
  })

  it('reports a line it does not understand instead of ignoring it', () => {
    const { rules, problems } = parse(
      ['Never send more than 1 SOL per transfer.', 'Be careful with the money.'].join('\n'),
    )

    expect(rules).toHaveLength(1)
    expect(problems).toEqual([
      {
        line: 2,
        source: 'Be careful with the money.',
        message: 'I do not understand this line, so I will not act on it.',
      },
    ])
  })

  it('rejects an amount it cannot represent exactly', () => {
    expect(parse('Never send more than 0.0000000001 SOL per transfer.').problems).toHaveLength(1)
    expect(parse('Never send more than lots SOL per day.').problems).toHaveLength(1)
    expect(parse('Never send more than 0 SOL per transfer.').problems).toHaveLength(1)
  })

  it('rejects anything in a recipient list that is not shaped like an address', () => {
    const { problems } = parse(`Only send to ${TREASURY} and my brother`)
    expect(problems).toHaveLength(1)
    expect(problems[0].message).toContain('my brother')
  })
})

describe('compile', () => {
  it('hands back rules when every line was understood', () => {
    const result = compile(`Only send to ${TREASURY}`)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.rules).toHaveLength(1)
  })

  it('hands back no rules at all when one line was not', () => {
    const result = compile(
      [`Only send to ${TREASURY}`, 'And use your best judgement.'].join('\n'),
    )

    // A half-understood mandate is not a mandate: the caller gets problems,
    // never a partial rule set it might mistake for the whole thing.
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.problems).toHaveLength(1)
    expect('rules' in result).toBe(false)
  })
})
