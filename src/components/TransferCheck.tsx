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
  onCheckAndSend: () => void
  onTryBreach: () => void
  /** Formatted amount that breaks the mandate, or null if it sets no limit. */
  breach: string | null
  sending: boolean
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
  onCheckAndSend,
  onTryBreach,
  breach,
  sending,
}: Props) {
  const allowed = decision?.verdict === 'allowed'
  const ready = decision !== null && !sending

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Send a transfer</h2>
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
            <p className={allowed ? 'verdict verdict--allowed' : 'verdict verdict--refused'}>
              {allowed ? 'Allowed' : 'Refused'}
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

      <div className="send-row">
        <button
          type="button"
          className="button button--primary"
          onClick={onCheckAndSend}
          disabled={!ready}
        >
          {sending ? 'Sending…' : 'Check and send'}
        </button>

        {breach && (
          <button type="button" className="button" onClick={onTryBreach} disabled={sending}>
            Try {breach} SOL — breaks the mandate
          </button>
        )}

        <p className="footnote send-note">
          {allowed
            ? 'The rules allow this one, so pressing the button signs it and sends it on devnet.'
            : 'Press it anyway: the refusal is recorded in the trail, and nothing is signed.'}
        </p>
      </div>
    </section>
  )
}
