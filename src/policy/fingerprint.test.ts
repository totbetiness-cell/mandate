import { describe, expect, it } from 'vitest'
import { fingerprint } from './fingerprint'

describe('fingerprint', () => {
  it('is stable for the same text', async () => {
    const once = await fingerprint('Never send more than 1 SOL per transfer.')
    const twice = await fingerprint('Never send more than 1 SOL per transfer.')
    expect(once).toBe(twice)
    expect(once).toMatch(/^[0-9a-f]{16}$/)
  })

  it('changes when a single character changes', async () => {
    const before = await fingerprint('Never send more than 1 SOL per transfer.')
    const after = await fingerprint('Never send more than 2 SOL per transfer.')
    expect(after).not.toBe(before)
  })

  it('is the truncated SHA-256 of the text', async () => {
    // Known value: SHA-256 of the empty string starts e3b0c44298fc1c14.
    expect(await fingerprint('')).toBe('e3b0c44298fc1c14')
  })
})
