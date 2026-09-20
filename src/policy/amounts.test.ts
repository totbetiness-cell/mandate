import { describe, expect, it } from 'vitest'
import { formatSol, LAMPORTS_PER_SOL, toLamports } from './amounts'

describe('toLamports', () => {
  it('converts whole and fractional SOL', () => {
    expect(toLamports('1')).toBe(LAMPORTS_PER_SOL)
    expect(toLamports('1.5')).toBe(1_500_000_000)
    expect(toLamports('0.000000001')).toBe(1)
    expect(toLamports(' 2.25 ')).toBe(2_250_000_000)
  })

  it('does not lose a lamport to floating point', () => {
    // 0.1 + 0.2 as floats is 0.30000000000000004; as lamports it is exact.
    const sum = toLamports('0.1')! + toLamports('0.2')!
    expect(sum).toBe(toLamports('0.3'))
  })

  it('refuses input it cannot represent exactly', () => {
    expect(toLamports('0.0000000001')).toBeNull() // finer than a lamport
    expect(toLamports('-1')).toBeNull()
    expect(toLamports('1e9')).toBeNull()
    expect(toLamports('')).toBeNull()
    expect(toLamports('all of it')).toBeNull()
  })
})

describe('formatSol', () => {
  it('round-trips with toLamports', () => {
    for (const sol of ['0', '1', '1.5', '0.000000001', '123.456']) {
      expect(formatSol(toLamports(sol)!)).toBe(sol)
    }
  })

  it('drops trailing zeroes and never uses exponent notation', () => {
    expect(formatSol(1_500_000_000)).toBe('1.5')
    expect(formatSol(1)).toBe('0.000000001')
    expect(formatSol(0)).toBe('0')
  })
})
