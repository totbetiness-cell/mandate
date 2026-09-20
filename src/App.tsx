import { useMemo, useState } from 'react'
import './App.css'
import { check, compile, toLamports } from './policy'
import type { Decision } from './policy'
import { MandateEditor } from './components/MandateEditor'
import { TransferCheck } from './components/TransferCheck'
import { DEMO_TREASURY, EXAMPLE_MANDATE } from './lib/demo'

const STORAGE_KEY = 'mandate.text'

function storedMandate(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? EXAMPLE_MANDATE
  } catch {
    // Private windows and blocked site data are fine; the example still works.
    return EXAMPLE_MANDATE
  }
}

function remember(text: string) {
  try {
    localStorage.setItem(STORAGE_KEY, text)
  } catch {
    // Not being able to remember the draft is not a reason to stop working.
  }
}

export default function App() {
  const [mandate, setMandate] = useState(storedMandate)
  const [recipient, setRecipient] = useState(DEMO_TREASURY)
  const [amount, setAmount] = useState('0.1')
  const [spentToday, setSpentToday] = useState('0')

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

    const lamports = toLamports(amount)
    if (lamports === null || lamports === 0) {
      return { decision: null, blockedBy: `"${amount}" is not an amount of SOL.` }
    }

    const spent = toLamports(spentToday)
    if (spent === null) {
      return { decision: null, blockedBy: `"${spentToday}" is not an amount of SOL.` }
    }

    return {
      decision: check(compiled.rules, {
        recipient: recipient.trim(),
        lamports,
        spentTodayLamports: spent,
      }),
      blockedBy: null,
    }
  }, [compiled, recipient, amount, spentToday])

  function updateMandate(text: string) {
    setMandate(text)
    remember(text)
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

      <MandateEditor
        value={mandate}
        onChange={updateMandate}
        onReset={() => updateMandate(EXAMPLE_MANDATE)}
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
      />

      <section className="panel panel--muted">
        <h2>What this is</h2>
        <p>
          The engine above refuses by default: an empty mandate allows nothing,
          and a mandate that never names a recipient allows nobody. Rules are
          read top to bottom and the first one that objects decides, so a
          refusal always points at a line you can go and read.
        </p>
        <p className="footnote">
          Devnet only. The decision is deterministic TypeScript — no clock, no
          network, no model call. The two addresses in the example are
          placeholders until the demo wallet lands.
        </p>
      </section>
    </main>
  )
}
