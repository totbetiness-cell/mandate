import { useCallback, useEffect, useMemo, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import './App.css'
import { check, compile, fingerprint, formatSol, toLamports } from './policy'
import type { Decision } from './policy'
import {
  airdrop,
  balance,
  loadWallet,
  newWallet,
  sendAllowedTransfer,
} from './chain/devnet'
import type { DemoWallet } from './chain/devnet'
import { MandateEditor } from './components/MandateEditor'
import { TransferCheck } from './components/TransferCheck'
import { WalletPanel } from './components/WalletPanel'
import { exampleMandate } from './lib/demo'

const MANDATE_KEY = 'mandate.text'

function storedMandate(recipient: string): string {
  try {
    return localStorage.getItem(MANDATE_KEY) ?? exampleMandate(recipient)
  } catch {
    // Private windows and blocked site data are fine; the example still works.
    return exampleMandate(recipient)
  }
}

function remember(text: string) {
  try {
    localStorage.setItem(MANDATE_KEY, text)
  } catch {
    // Not being able to remember the draft is no reason to stop working.
  }
}

/** Turn whatever the chain threw into a sentence a person can act on. */
function readable(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (/airdrop|faucet|429|rate/i.test(message)) {
    return (
      'The devnet faucet turned this request down — it is rate limited and ' +
      'often dry. Try again in a minute, or top the address up at ' +
      'faucet.solana.com.'
    )
  }
  if (/insufficient|0x1\b/i.test(message)) {
    return 'Not enough devnet SOL in the demo wallet. Request an airdrop first.'
  }
  return message
}

export default function App() {
  const [wallet, setWallet] = useState<DemoWallet>(loadWallet)
  const [mandate, setMandate] = useState(() =>
    storedMandate(wallet.recipient.toBase58()),
  )
  const [recipient, setRecipient] = useState(() => wallet.recipient.toBase58())
  const [amount, setAmount] = useState('0.1')
  const [spentToday, setSpentToday] = useState('0')

  const [lamports, setLamports] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshBalance = useCallback(async (which: DemoWallet) => {
    try {
      setLamports(await balance(which.keypair.publicKey))
    } catch {
      setLamports(null)
    }
  }, [])

  // Reading the balance is what an effect is for: synchronising with an
  // external system. oxlint warns here anyway; the state is set from the
  // reply, not synchronously, so the warning is accepted rather than silenced.
  useEffect(() => {
    void refreshBalance(wallet)
  }, [wallet, refreshBalance])

  const compiled = useMemo(() => compile(mandate), [mandate])

  const { decision, blockedBy } = useMemo<{
    decision: Decision | null
    blockedBy: string | null
  }>(() => {
    if (!compiled.ok) {
      return {
        decision: null,
        blockedBy:
          'Fix the lines above first. An unclear mandate decides nothing, so nothing may be sent.',
      }
    }

    const value = toLamports(amount)
    if (value === null || value === 0) {
      return { decision: null, blockedBy: `"${amount}" is not an amount of SOL.` }
    }

    const spent = toLamports(spentToday)
    if (spent === null) {
      return { decision: null, blockedBy: `"${spentToday}" is not an amount of SOL.` }
    }

    return {
      decision: check(compiled.rules, {
        recipient: recipient.trim(),
        lamports: value,
        spentTodayLamports: spent,
      }),
      blockedBy: null,
    }
  }, [compiled, recipient, amount, spentToday])

  function updateMandate(text: string) {
    setMandate(text)
    remember(text)
  }

  async function requestAirdrop() {
    setBusy(true)
    setNotice(null)
    try {
      await airdrop(wallet.keypair.publicKey)
      await refreshBalance(wallet)
      setNotice('Airdrop confirmed.')
    } catch (caught) {
      setNotice(readable(caught))
    } finally {
      setBusy(false)
    }
  }

  function startOver() {
    const fresh = newWallet()
    setWallet(fresh)
    setRecipient(fresh.recipient.toBase58())
    updateMandate(exampleMandate(fresh.recipient.toBase58()))
    setLamports(null)
    setSignature(null)
    setNotice('New throwaway wallet generated.')
  }

  async function send() {
    // Belt and braces: the button is already disabled unless the engine
    // allowed it, and the engine is asked again here before anything is signed.
    if (!decision || decision.verdict !== 'allowed') return

    const value = toLamports(amount)
    if (value === null) return

    setSending(true)
    setError(null)
    setSignature(null)
    try {
      const sent = await sendAllowedTransfer({
        wallet: wallet.keypair,
        recipient: new PublicKey(recipient.trim()),
        lamports: value,
        satisfiedRuleIds: decision.satisfied ?? [],
        mandateFingerprint: await fingerprint(mandate),
      })

      setSignature(sent)
      // Today's total is what the daily budget is measured against, so a real
      // send has to count towards it.
      const spent = toLamports(spentToday) ?? 0
      setSpentToday(formatSol(spent + value))
      await refreshBalance(wallet)
    } catch (caught) {
      setError(readable(caught))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="page">
      <header className="masthead">
        <h1>Mandate</h1>
        <p className="tagline">
          Plain-language rules that every Solana transaction must pass before it
          is signed.
        </p>
      </header>

      <WalletPanel
        wallet={wallet}
        lamports={lamports}
        busy={busy}
        onAirdrop={() => void requestAirdrop()}
        onNewWallet={startOver}
        notice={notice}
      />

      <MandateEditor
        value={mandate}
        onChange={updateMandate}
        onReset={() => updateMandate(exampleMandate(wallet.recipient.toBase58()))}
        compiled={compiled}
      />

      <TransferCheck
        recipient={recipient}
        amount={amount}
        spentToday={spentToday}
        onRecipient={setRecipient}
        onAmount={setAmount}
        onSpentToday={setSpentToday}
        decision={decision}
        blockedBy={blockedBy}
        onSend={() => void send()}
        sending={sending}
        signature={signature}
        error={error}
      />

      <section className="panel panel--muted">
        <h2>What this is</h2>
        <p>
          The engine above refuses by default: an empty mandate allows nothing,
          and a mandate that never names a recipient allows nobody. Rules are
          read top to bottom and the first one that objects decides, so a
          refusal always points at a line you can go and read.
        </p>
        <p>
          When a transfer is allowed, the transaction carries a memo naming the
          rules that allowed it and a fingerprint of the mandate they came from.
          The reason for the payment ends up on the chain, next to the payment.
        </p>
        <p className="footnote">
          Devnet only. The decision is deterministic TypeScript — no clock, no
          network, no model call.
        </p>
      </section>
    </main>
  )
}
