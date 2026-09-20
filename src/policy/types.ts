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

export type RuleKind =
  /** Refuse anything above a fixed amount in a single transfer. */
  | 'max_per_transfer'
  /** Refuse once the sum already sent today would be exceeded. */
  | 'daily_budget'
  /** Refuse any recipient that is not on the list. */
  | 'allowed_recipients'
  /** Refuse everything while the mandate is paused. */
  | 'paused'

export interface Rule {
  /** Stable identifier, written into the on-chain memo of an allowed transfer. */
  id: string
  kind: RuleKind
  /** The sentence the human wrote, quoted back verbatim when the rule decides. */
  source: string
  /** 1-based line number in the mandate text. */
  line: number
}

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
   * The rule that decided. On a refusal: the first rule the transfer broke.
   * On an approval: undefined — nothing objected.
   */
  decidedBy?: Rule
  /** Plain sentence for the UI. Assembled from the rule, never from a model. */
  reason: string
}
