import type { Decision } from '../policy'
import { explorerTx } from '../chain/devnet'

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
  onSend: () => void
  sending: boolean
  signature: string | null
  error: string | null
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
  onSend,
  sending,
  signature,
  error,
}: Props) {
  const allowed = decision?.verdict === 'allowed'

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
          onClick={onSend}
          disabled={!allowed || sending}
        >
          {sending ? 'Sending…' : 'Sign and send on devnet'}
        </button>
        <p className="footnote send-note">
          {allowed
            ? 'The engine allowed it, so this button can sign.'
            : 'No signature is produced while the mandate refuses. The button is not disabled to be polite — there is simply nothing to sign.'}
        </p>
      </div>

      {error && <p className="notice notice--error">{error}</p>}

      {signature && (
        <p className="notice notice--ok">
          Sent, with a memo naming the rules that allowed it.{' '}
          <a href={explorerTx(signature)} target="_blank" rel="noreferrer">
            See it on the explorer
          </a>
          .
        </p>
      )}
    </section>
  )
}
