/**
 * The vocabulary of a mandate.
 *
 * A mandate is a handful of sentences a human wrote. Parsing turns those
 * sentences into `Rule` objects; checking turns a `Rule[]` plus an
 * `IntendedTransfer` into a `Decision`. Nothing in this folder talks to the
 * network, reads the clock without being handed one, or calls a model. Given
 * the same mandate and the same transfer it returns the same decision, every
 * time — that is the whole point of the product.
 */

export type RuleKind = Rule['kind']

interface RuleBase {
  /** Stable identifier, written into the on-chain memo of an allowed transfer. */
  id: string
  /** The sentence the human wrote, quoted back verbatim when the rule decides. */
  source: string
  /** 1-based line number in the mandate text. */
  line: number
}

/** Refuse anything above a fixed amount in a single transfer. */
export interface MaxPerTransferRule extends RuleBase {
  kind: 'max_per_transfer'
  lamports: number
}

/** Refuse once the sum already sent today would be exceeded. */
export interface DailyBudgetRule extends RuleBase {
  kind: 'daily_budget'
  lamports: number
}

/** Refuse any recipient that is not on the list. */
export interface AllowedRecipientsRule extends RuleBase {
  kind: 'allowed_recipients'
  addresses: string[]
}

/** Refuse everything while the mandate is paused. */
export interface PausedRule extends RuleBase {
  kind: 'paused'
  paused: boolean
}

export type Rule =
  | MaxPerTransferRule
  | DailyBudgetRule
  | AllowedRecipientsRule
  | PausedRule

export interface IntendedTransfer {
  /** Base58 recipient address, as typed by the user. */
  recipient: string
  /** Amount in lamports. Integer — SOL never enters the engine as a float. */
  lamports: number
  /** Lamports already sent today under this mandate. */
  spentTodayLamports: number
}

export type Verdict = 'allowed' | 'refused'

export interface Decision {
  verdict: Verdict
  /**
   * The rule that decided. On a refusal: the first rule in the mandate the
   * transfer broke, reading top to bottom, so the author can point at the line.
   * On an approval: undefined — nothing objected.
   *
   * Absent on a refusal only when no rule was involved at all, e.g. an empty
   * mandate or a nonsensical amount.
   */
  decidedBy?: Rule
  /** Plain sentence for the UI. Assembled from the rule, never from a model. */
  reason: string
}
