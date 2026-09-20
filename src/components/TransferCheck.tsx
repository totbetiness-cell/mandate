import type { Decision } from '../policy'

interface Props {
  recipient: string
  amount: string
  spentToday: string
  onRecipient: (value: string) => void
  onAmount: (value: string) => void
  onSpentToday: (value: string) => void
  decision: Decision | null
  /** Why there is no decision to show yet. */
  blockedBy: string | null
}

export function TransferCheck({
  recipient,
  amount,
  spentToday,
  onRecipient,
  onAmount,
  onSpentToday,
  decision,
  blockedBy,
}: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Try a transfer</h2>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Recipient</span>
          <input
            value={recipient}
            spellCheck={false}
            onChange={(event) => onRecipient(event.target.value)}
          />
        </label>
        <label className="field field--narrow">
          <span>Amount (SOL)</span>
          <input
            value={amount}
            inputMode="decimal"
            onChange={(event) => onAmount(event.target.value)}
          />
        </label>
        <label className="field field--narrow">
          <span>Already sent today (SOL)</span>
          <input
            value={spentToday}
            inputMode="decimal"
            onChange={(event) => onSpentToday(event.target.value)}
          />
        </label>
      </div>

      <div className="decision" aria-live="polite">
        {blockedBy !== null ? (
          <p className="decision-reason">{blockedBy}</p>
        ) : decision ? (
          <>
            <p
              className={
                decision.verdict === 'allowed'
                  ? 'verdict verdict--allowed'
                  : 'verdict verdict--refused'
              }
            >
              {decision.verdict === 'allowed' ? 'Allowed' : 'Refused'}
            </p>
            <p className="decision-reason">{decision.reason}</p>
            {decision.decidedBy && (
              <blockquote className="deciding-rule">
                <span className="rule-line">{decision.decidedBy.id}</span>
                {decision.decidedBy.source}
              </blockquote>
            )}
          </>
        ) : null}
      </div>

      <p className="footnote">
        Nothing is signed and nothing is sent — the devnet integration is the
        next piece of work. This panel shows the decision the engine would make
        before a signature is ever produced.
      </p>
    </section>
  )
}
