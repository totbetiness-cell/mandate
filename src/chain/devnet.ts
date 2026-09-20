/**
 * Everything that touches the chain. Devnet, and only devnet.
 *
 * The wallet here is a throwaway: generated in the browser, kept in browser
 * storage, funded from the devnet faucet. It is not a wallet you connect —
 * there is deliberately no wallet-adapter in this project, because a demo that
 * asks a stranger to connect a real wallet teaches exactly the wrong habit.
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from '@solana/web3.js'
import { memoInstruction, memoText } from './memo'

export const CLUSTER = 'devnet' as const
export const AIRDROP_LAMPORTS = LAMPORTS_PER_SOL

const SECRET_KEY = 'mandate.devnet.secret'
const RECIPIENT_KEY = 'mandate.devnet.recipient'

let connection: Connection | null = null

export function devnet(): Connection {
  connection ??= new Connection(clusterApiUrl(CLUSTER), 'confirmed')
  return connection
}

export interface DemoWallet {
  /** The throwaway account this page sends from. */
  keypair: Keypair
  /** A second generated address, used as the allowed recipient in the example. */
  recipient: PublicKey
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // A wallet that cannot be remembered still works for this session.
  }
}

/**
 * Load the demo wallet, or make one. Both keys are generated here in the
 * browser and never sent anywhere: there is no backend to send them to.
 */
export function loadWallet(): DemoWallet {
  const storedSecret = read(SECRET_KEY)
  const storedRecipient = read(RECIPIENT_KEY)

  if (storedSecret && storedRecipient) {
    try {
      return {
        keypair: Keypair.fromSecretKey(decode(storedSecret)),
        recipient: new PublicKey(storedRecipient),
      }
    } catch {
      // Unreadable storage is not worth rescuing for a throwaway devnet key.
    }
  }

  return newWallet()
}

export function newWallet(): DemoWallet {
  const keypair = Keypair.generate()
  const recipient = Keypair.generate().publicKey

  write(SECRET_KEY, encode(keypair.secretKey))
  write(RECIPIENT_KEY, recipient.toBase58())

  return { keypair, recipient }
}

export async function balance(address: PublicKey): Promise<number> {
  return devnet().getBalance(address)
}

export async function airdrop(address: PublicKey): Promise<string> {
  const connection = devnet()
  const signature = await connection.requestAirdrop(address, AIRDROP_LAMPORTS)
  const latest = await connection.getLatestBlockhash()

  await connection.confirmTransaction({ signature, ...latest }, 'confirmed')
  return signature
}

export interface SendRequest {
  wallet: Keypair
  recipient: PublicKey
  lamports: number
  /** Rule ids that allowed this transfer, straight from the decision. */
  satisfiedRuleIds: string[]
  mandateFingerprint: string
}

/**
 * Build, sign and send the transfer — plus the memo that says which rules
 * allowed it.
 *
 * Nothing in this function decides anything. It is called only after the
 * engine has already returned `allowed`, which is why it takes the rule ids
 * as an argument rather than the mandate: by this point the decision is made,
 * and this code's only job is to record it faithfully.
 */
export async function sendAllowedTransfer(request: SendRequest): Promise<string> {
  const connection = devnet()
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: request.wallet.publicKey,
      toPubkey: request.recipient,
      lamports: request.lamports,
    }),
    memoInstruction(memoText(request.satisfiedRuleIds, request.mandateFingerprint)),
  )

  const latest = await connection.getLatestBlockhash()
  transaction.recentBlockhash = latest.blockhash
  transaction.feePayer = request.wallet.publicKey
  transaction.sign(request.wallet)

  const signature = await connection.sendRawTransaction(transaction.serialize())
  await connection.confirmTransaction({ signature, ...latest }, 'confirmed')

  return signature
}

/**
 * Ask devnet to run a transaction without sending it.
 *
 * Useful when the faucet is dry: it still proves that the memo program accepts
 * our instruction and logs the text we built, which is the part of the chain
 * integration worth checking.
 */
export async function simulateMemo(
  payer: Keypair,
  satisfiedRuleIds: string[],
  mandateFingerprint: string,
): Promise<{ logs: string[]; err: unknown }> {
  const connection = devnet()
  const transaction = new Transaction().add(
    memoInstruction(memoText(satisfiedRuleIds, mandateFingerprint)),
  )
  transaction.feePayer = payer.publicKey
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  const simulated = await connection.simulateTransaction(transaction, [payer], false)
  return { logs: simulated.value.logs ?? [], err: simulated.value.err }
}

export function explorerTx(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`
}

export function explorerAddress(address: PublicKey | string): string {
  const value = typeof address === 'string' ? address : address.toBase58()
  return `https://explorer.solana.com/address/${value}?cluster=${CLUSTER}`
}

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}
