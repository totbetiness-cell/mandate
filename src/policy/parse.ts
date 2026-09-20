/**
 * Turning sentences into rules.
 *
 * The grammar is deliberately tiny. A mandate is only useful if the person
 * who wrote it can predict what it does, so there is no clever inference here:
 * a line either matches one of four shapes or it is reported as a problem.
 *
 * Silence is the dangerous failure. A line nobody understood must never be
 * skipped quietly — that would leave a hole in the guardrail exactly where the
 * author believed they had put a limit. `compile` therefore refuses to produce
 * a usable mandate while any line is unparsed.
 */

import { toLamports } from './amounts'
import type { Rule } from './types'

export interface ParseProblem {
  line: number
  source: string
  /** What is wrong, phrased for the person who wrote the line. */
  message: string
}

export interface ParseResult {
  rules: Rule[]
  problems: ParseProblem[]
}

export type CompileResult =
  | { ok: true; rules: Rule[] }
  | { ok: false; problems: ParseProblem[] }

/** `0.5 SOL in one transfer` / `0.5 SOL per transfer` */
const MAX_PER_TRANSFER = /^never send more than (\S+) sol (?:in one|per|a) transfer$/i
/** `2 SOL per day` / `2 SOL in one day` */
const DAILY_BUDGET = /^never send more than (\S+) sol (?:in one|per|a) day$/i
/** `only send to <address>, <address> and <address>` */
const ALLOWED_RECIPIENTS = /^only send to (.+)$/i
/** `the mandate is active` / `the mandate is paused` */
const PAUSED = /^the mandate is (active|paused)$/i

/**
 * Base58 has no 0, O, I or l. This is a shape check, not a validity check:
 * the real one arrives with the Solana SDK. It does not need to be perfect to
 * be safe, because an allow-list is compared by exact string equality — a
 * malformed entry simply never matches anything, so a bad address can only
 * ever cause a refusal, never an unintended approval.
 */
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

const COMMENT = /^#/

function normalise(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').replace(/[.;]+$/, '')
}

export function parse(mandate: string): ParseResult {
  const rules: Rule[] = []
  const problems: ParseProblem[] = []

  mandate.split('\n').forEach((raw, index) => {
    const line = index + 1
    const text = normalise(raw)
    if (text === '' || COMMENT.test(text)) return

    // The source quoted back to the user is the line as they wrote it,
    // not our normalised version.
    const source = raw.trim()
    const id = `L${line}`
    const fail = (message: string) => problems.push({ line, source, message })

    const cap = MAX_PER_TRANSFER.exec(text)
    if (cap) {
      const lamports = toLamports(cap[1])
      if (lamports === null || lamports === 0) {
        fail(`"${cap[1]}" is not an amount of SOL I can use as a limit.`)
        return
      }
      rules.push({ id, kind: 'max_per_transfer', source, line, lamports })
      return
    }

    const daily = DAILY_BUDGET.exec(text)
    if (daily) {
      const lamports = toLamports(daily[1])
      if (lamports === null || lamports === 0) {
        fail(`"${daily[1]}" is not an amount of SOL I can use as a budget.`)
        return
      }
      rules.push({ id, kind: 'daily_budget', source, line, lamports })
      return
    }

    const recipients = ALLOWED_RECIPIENTS.exec(text)
    if (recipients) {
      const addresses = recipients[1]
        .split(/\s*(?:,|\band\b)\s*/i)
        .map((entry) => entry.trim())
        .filter((entry) => entry !== '')

      const malformed = addresses.filter((address) => !BASE58.test(address))
      if (addresses.length === 0 || malformed.length > 0) {
        fail(
          malformed.length > 0
            ? `${malformed.join(', ')} does not look like a Solana address.`
            : 'This line lists no recipient.',
        )
        return
      }

      rules.push({ id, kind: 'allowed_recipients', source, line, addresses })
      return
    }

    const paused = PAUSED.exec(text)
    if (paused) {
      rules.push({
        id,
        kind: 'paused',
        source,
        line,
        paused: paused[1].toLowerCase() === 'paused',
      })
      return
    }

    fail('I do not understand this line, so I will not act on it.')
  })

  return { rules, problems }
}

/**
 * The safe front door. Either every line was understood and you get rules,
 * or you get the problems and no rules at all — a half-understood mandate is
 * not a mandate.
 */
export function compile(mandate: string): CompileResult {
  const { rules, problems } = parse(mandate)
  return problems.length > 0 ? { ok: false, problems } : { ok: true, rules }
}
