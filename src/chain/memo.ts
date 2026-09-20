/**
 * The audit record that travels with an allowed transfer.
 *
 * The memo is the point of the whole product: it puts the reason for a
 * transfer on the chain, next to the transfer, where anyone can read it —
 * rather than in a log file on our server that you would have to trust us
 * about. We run no server, so there would be no such log anyway.
 */

import { PublicKey, TransactionInstruction } from '@solana/web3.js'
// web3.js types instruction data as a Buffer; the browser has no Buffer, so we
// use the same polyfill the library itself depends on rather than a global.
import { Buffer } from 'buffer'

/**
 * SPL Memo program.
 *
 * Verified 2026-09-20 against the official documentation at
 * https://spl.solana.com/memo (which redirects to
 * https://www.solana-program.com/docs/memo) and confirmed on devnet via
 * getAccountInfo: executable, owned by BPFLoader2.
 *
 * Two other memo deployments exist and are also executable on devnet
 * (Memo1Uhk… under BPFLoader1, Memo4c2p… under the upgradeable loader). This
 * is the one the docs name and the one explorers label as "Memo", which is
 * what matters for an audit trail a third party is meant to read.
 */
export const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
)

export const MEMO_FORMAT_VERSION = 'mandate/1'

/**
 * `mandate/1 rules=L2,L3,L4 sha256=1a2b3c4d5e6f7a8b`
 *
 * Short on purpose: a memo is transaction data, and every byte is paid for.
 * The rule ids point into the mandate; the fingerprint pins down which
 * wording of it was in force.
 */
export function memoText(satisfiedRuleIds: string[], mandateFingerprint: string): string {
  return [
    MEMO_FORMAT_VERSION,
    `rules=${satisfiedRuleIds.join(',')}`,
    `sha256=${mandateFingerprint}`,
  ].join(' ')
}

/** A memo with no signer accounts: it only needs to be logged, not attested. */
export function memoInstruction(text: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(text, 'utf8'),
  })
}
