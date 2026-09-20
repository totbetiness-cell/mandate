import { describe, expect, it } from 'vitest'
import { describeRule, short } from './describeRule'
import { compile } from '../policy'
import { TREASURY, VENDOR } from '../policy/fixtures'

function rule(line: string) {
  const result = compile(line)
  if (!result.ok) throw new Error(result.problems[0].message)
  return result.rules[0]
}

describe('describeRule', () => {
  it('has a line for every rule kind', () => {
    expect(describeRule(rule('Never send more than 0.5 SOL per transfer.'))).toBe(
      'At most 0.5 SOL in a single transfer',
    )
    expect(describeRule(rule('Never send more than 2 SOL per day.'))).toBe(
      'At most 2 SOL in a day',
    )
    expect(describeRule(rule(`Only send to ${TREASURY}`))).toContain('One allowed recipient')
    expect(describeRule(rule(`Only send to ${TREASURY} and ${VENDOR}`))).toContain(
      '2 allowed recipients',
    )
    expect(describeRule(rule('The mandate is paused.'))).toBe('Paused — nothing may be sent')
    expect(describeRule(rule('The mandate is active.'))).toBe('Active')
  })
})

describe('short', () => {
  it('keeps both ends so two addresses can be told apart', () => {
    expect(short(TREASURY)).toBe('Trea…1111')
    expect(short('abc')).toBe('abc')
  })
})
