/**
 * Live checks against Solana devnet.
 *
 * Skipped unless DEVNET_LIVE=1, so CI stays offline and deterministic: a suite
 * that goes red because a public faucet is dry tells you nothing about your
 * code. Run by hand when the chain path changes:
 *
 *     DEVNET_LIVE=1 npx vitest run src/chain/devnet.live.test.ts
 */

import { readFileSync } from 'node:fs'
import { Keypair } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { check, compile, fingerprint } from '../policy'
import {
  airdrop,
  balance,
  devnet,
  newWallet,
  sendAllowedTransfer,
  simulateMemo,
} from './devnet'
import { MEMO_PROGRAM_ID } from './memo'

const live = process.env.DEVNET_LIVE === '1'

/**
 * A funded devnet payer, if one has been prepared on this machine.
 *
 * The public faucet is rate limited per IP and regularly dry, so a repeatable
 * live check needs an account that already holds devnet SOL. The file is
 * git-ignored: it is a throwaway with no real value, and it still does not
 * belong in a repository.
 */
function preparedPayer(): Keypair | null {
  const path = process.env.DEVNET_PAYER ?? '.devnet-payer.json'
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, 'utf8'))))
  } catch {
    return null
  }
}

/** The payer, funded either by the faucet or in advance — or null. */
async function fundedPayer(): Promise<Keypair | null> {
  const prepared = preparedPayer()
  if (prepared && (await balance(prepared.publicKey)) > 0) return prepared

  const fresh = newWallet().keypair
  try {
    await airdrop(fresh.publicKey)
    return fresh
  } catch {
    return null
  }
}

function mandateFor(recipient: string): string {
  return [
    'Never send more than 0.5 SOL in one transfer.',
    'Never send more than 2 SOL per day.',
    `Only send to ${recipient}.`,
    'The mandate is active.',
  ].join('\n')
}

describe.skipIf(!live)('devnet', () => {
  it(
    'accepts and logs the memo we build',
    { timeout: 60_000 },
    async ({ skip }) => {
      const payer = await fundedPayer()
      if (!payer) {
        skip('no funded devnet payer: faucet is dry and .devnet-payer.json is empty')
        return
      }

      const { logs, err } = await simulateMemo(payer, ['L1', 'L2'], 'abcdef0123456789')

      if (logs.length === 0) {
        skip(`devnet would not simulate: ${JSON.stringify(err)}`)
        return
      }

      expect(logs.join('\n')).toContain(MEMO_PROGRAM_ID.toBase58())
      expect(logs.join('\n')).toContain('mandate/1 rules=L1,L2 sha256=abcdef0123456789')
    },
  )

  it(
    'refuses what the mandate forbids and sends what it allows',
    { timeout: 120_000 },
    async ({ skip }) => {
      const payer = await fundedPayer()
      if (!payer) {
        // A dry faucet is a fact about the faucet, not about this code, so the
        // check steps aside rather than reporting a failure it cannot fix.
        skip('no funded devnet payer: faucet is dry and .devnet-payer.json is empty')
        return
      }

      const wallet = { keypair: payer, recipient: newWallet().recipient }
      const recipient = wallet.recipient.toBase58()
      const mandate = mandateFor(recipient)

      const compiled = compile(mandate)
      expect(compiled.ok).toBe(true)
      if (!compiled.ok) return

      const tooMuch = check(compiled.rules, {
        recipient,
        lamports: 800_000_000,
        spentTodayLamports: 0,
      })
      expect(tooMuch.verdict).toBe('refused')
      expect(tooMuch.decidedBy?.id).toBe('L1')

      const allowed = check(compiled.rules, {
        recipient,
        lamports: 100_000_000,
        spentTodayLamports: 0,
      })
      expect(allowed.verdict).toBe('allowed')

      const signature = await sendAllowedTransfer({
        wallet: wallet.keypair,
        recipient: wallet.recipient,
        lamports: 100_000_000,
        satisfiedRuleIds: allowed.satisfied ?? [],
        mandateFingerprint: await fingerprint(mandate),
      })

      const transaction = await devnet().getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      })
      const memo = transaction?.meta?.logMessages?.find((line) => line.includes('Memo'))

      expect(memo).toContain('rules=L1,L2,L3,L4')
      console.log('signature:', signature)
      console.log('memo log:', memo)
    },
  )
})
