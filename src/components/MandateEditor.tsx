import type { CompileResult } from '../policy'
import { describeRule } from '../lib/describeRule'

interface Props {
  value: string
  onChange: (value: string) => void
  onReset: () => void
  compiled: CompileResult
}

export function MandateEditor({ value, onChange, onReset, compiled }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Your mandate</h2>
        <button type="button" className="link-button" onClick={onReset}>
          Reset to example
        </button>
      </div>

      <div className="editor-grid">
        <label className="visually-hidden" htmlFor="mandate">
          Mandate, one rule per line
        </label>
        <textarea
          id="mandate"
          className="mandate-input"
          value={value}
          spellCheck={false}
          rows={8}
          onChange={(event) => onChange(event.target.value)}
        />

        {compiled.ok ? (
          <div className="readout" aria-live="polite">
            <p className="readout-head readout-head--ok">
              {compiled.rules.length === 0
                ? 'No rules yet'
                : `${compiled.rules.length} rule${compiled.rules.length === 1 ? '' : 's'} understood`}
            </p>
            <ol className="rule-list">
              {compiled.rules.map((rule) => (
                <li key={rule.id}>
                  <span className="rule-line">{rule.id}</span>
                  {describeRule(rule)}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="readout" aria-live="polite">
            <p className="readout-head readout-head--problem">
              {compiled.problems.length} line
              {compiled.problems.length === 1 ? '' : 's'} not understood
            </p>
            <ul className="rule-list">
              {compiled.problems.map((problem) => (
                <li key={problem.line}>
                  <span className="rule-line">L{problem.line}</span>
                  {problem.message}
                </li>
              ))}
            </ul>
            <p className="footnote">
              While any line is unclear, this mandate produces no rules at all
              and nothing may be sent. A half-understood mandate would leave a
              hole exactly where you thought you had put a limit.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
