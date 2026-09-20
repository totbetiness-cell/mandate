import { describe, expect, it } from 'vitest'
import { MEMO_PROGRAM_ID, memoInstruction, memoText } from './memo'

describe('memoText', () => {
  it('names the rules and the mandate wording that allowed the transfer', () => {
    expect(memoText(['L2', 'L3'], '1a2b3c4d5e6f7a8b')).toBe(
      'mandate/1 rules=L2,L3 sha256=1a2b3c4d5e6f7a8b',
    )
  })

  it('stays small enough to be cheap', () => {
    // Even a mandate with ten rules fits comfortably in a memo.
    const ids = Array.from({ length: 10 }, (_, index) => `L${index + 1}`)
    expect(memoText(ids, '1a2b3c4d5e6f7a8b').length).toBeLessThan(100)
  })
})

describe('memoInstruction', () => {
  it('targets the documented memo program and signs with nobody', () => {
    const instruction = memoInstruction('mandate/1 rules=L1 sha256=0000000000000000')
    expect(instruction.programId.toBase58()).toBe(
      'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
    )
    expect(instruction.programId.equals(MEMO_PROGRAM_ID)).toBe(true)
    expect(instruction.keys).toEqual([])
    expect(instruction.data.toString('utf8')).toContain('rules=L1')
  })
})
