import { formatSol } from '../policy'
import { explorerTx } from '../chain/devnet'
import { short } from '../lib/describeRule'
import type { TrailEntry } from '../lib/trail'

interface Props {
  trail: TrailEntry[]
  onClear: () => void
}

const time = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export function TrailPanel({ trail, onClear }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Audit trail</h2>
        {trail.length > 0 && (
          <button type="button" className="link-button" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {trail.length === 0 ? (
        <p className="footnote">
          Every answer the mandate gives lands here — the refusals too. Press
          the button above to make the first entry.
        </p>
      ) : (
        <ol className="trail">
          {trail.map((entry) => (
            <li key={entry.id} className="trail-entry">
              <div className="trail-head">
                <span
                  className={
                    entry.verdict === 'allowed'
                      ? 'verdict verdict--allowed'
                      : 'verdict verdict--refused'
                  }
                >
                  {entry.verdict === 'allowed' ? 'Sent' : 'Refused'}
                </span>
                <span className="trail-amount">
                  {formatSol(entry.lamports)} SOL → {short(entry.recipient)}
                </span>
                <time className="trail-time" dateTime={entry.at}>
                  {time.format(new Date(entry.at))}
                </time>
              </div>

              <p className="trail-reason">{entry.reason}</p>

              {entry.rule && (
                <blockquote className="deciding-rule">
                  <span className="rule-line">{entry.rule.id}</span>
                  {entry.rule.source}
                </blockquote>
              )}

              {entry.signature ? (
                <p className="trail-link">
                  <a href={explorerTx(entry.signature)} target="_blank" rel="noreferrer">
                    {short(entry.signature)} on the explorer
                  </a>
                </p>
              ) : entry.error ? (
                <p className="trail-link trail-link--error">{entry.error}</p>
              ) : (
                <p className="trail-link">
                  Nothing was signed, so there is nothing on the chain to show.
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
