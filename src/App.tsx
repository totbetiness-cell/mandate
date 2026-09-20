import './App.css'

const EXAMPLE_MANDATE = `Never send more than 0.5 SOL in one transfer.
Never send more than 2 SOL per day.
Only send to the treasury and the payroll wallet.
The mandate is active.`

export default function App() {
  return (
    <main className="page">
      <header className="masthead">
        <h1>Mandate</h1>
        <p className="tagline">
          Plain-language rules that every Solana transaction must pass before it
          is signed.
        </p>
      </header>

      <section className="panel">
        <h2>What this is</h2>
        <p>
          You write your rules as ordinary sentences. Mandate turns them into a
          deterministic checklist and runs it <em>before</em> anything is
          signed. A transfer that passes is sent with a memo carrying the rule
          it satisfied, so the on-chain record points back to the sentence that
          allowed it. A transfer that fails is never signed, and you are told
          the exact line it broke.
        </p>
        <pre className="mandate-sample">{EXAMPLE_MANDATE}</pre>
        <p className="footnote">
          Solana devnet only. The demo keypair is generated in your browser and
          never leaves it. No backend, no account, no model call at runtime.
        </p>
      </section>

      <section className="panel panel--muted">
        <h2>Status</h2>
        <p>
          Day 2: the policy engine is written and tested — four rule kinds, a
          parser that refuses to guess, and a check that refuses by default.
          Nothing is wired to this page or to a chain yet, so the example above
          is still only an illustration. The editor, the devnet integration and
          the audit trail land here over the coming days; the commit history is
          public and shows the work as it happens.
        </p>
      </section>
    </main>
  )
}
