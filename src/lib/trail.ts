/**
 * The audit trail: every answer the mandate gave, in the order it gave them.
 *
 * It lives in this browser and nowhere else. There is no backend, so there is
 * no server-side log you would have to take our word for — the entries that
 * matter are the ones on the chain, and each sent entry links straight to it.
 *
 * The refusals are the interesting half. They have no signature and no
 * transaction, by design: that absence is the product working.
 */

import type { Decision } from '../policy'

/** Enough to show the pattern, small enough never to bloat storage. */
export const TRAIL_LIMIT = 25

export interface TrailEntry {
  id: string
  /** ISO 8601, in UTC. Rendered in the reader's local time. */
  at: string
  verdict: Decision['verdict']
  lamports: number
  recipient: string
  reason: string
  /** The rule that refused, quoted. Absent when nothing objected. */
  rule: { id: string; source: string } | null
  /** Present only for a transfer that was actually sent. */
  signature: string | null
  /** Present when the chain refused what the mandate allowed. */
  error: string | null
}

export interface NewEntry {
  decision: Decision
  lamports: number
  recipient: string
  signature?: string | null
  error?: string | null
  /** Injected so the function stays pure and testable. */
  at?: string
  id?: string
}

export function entryFrom(input: NewEntry): TrailEntry {
  return {
    id: input.id ?? crypto.randomUUID(),
    at: input.at ?? new Date().toISOString(),
    verdict: input.decision.verdict,
    lamports: input.lamports,
    recipient: input.recipient,
    reason: input.decision.reason,
    rule: input.decision.decidedBy
      ? { id: input.decision.decidedBy.id, source: input.decision.decidedBy.source }
      : null,
    signature: input.signature ?? null,
    error: input.error ?? null,
  }
}

/** Newest first, and never longer than the limit. */
export function prepend(
  trail: TrailEntry[],
  entry: TrailEntry,
  limit = TRAIL_LIMIT,
): TrailEntry[] {
  return [entry, ...trail].slice(0, limit)
}

const STORAGE_KEY = 'mandate.trail'

export function loadTrail(): TrailEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as TrailEntry[]) : []
  } catch {
    // Blocked storage or a corrupted entry costs the history, nothing more.
    return []
  }
}

export function saveTrail(trail: TrailEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trail))
  } catch {
    // The trail on the chain is the one that counts.
  }
}
