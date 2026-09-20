/**
 * Amounts are held in lamports, as integers, everywhere inside the engine.
 *
 * A limit is worth nothing if 0.1 + 0.2 can walk past it, so SOL values are
 * converted from their decimal *string* form and never travel through a float.
 */

export const LAMPORTS_PER_SOL = 1_000_000_000

const DECIMALS = 9
const SOL_PATTERN = /^(\d+)(?:\.(\d+))?$/

/**
 * Convert a decimal SOL string ("1.5", "0.000000001") to whole lamports.
 * Returns null for anything that is not a plain non-negative decimal number,
 * or that is more precise than a lamport — the caller decides what to do with
 * bad input, the engine never guesses.
 */
export function toLamports(sol: string): number | null {
  const match = SOL_PATTERN.exec(sol.trim())
  if (!match) return null

  const [, whole, fraction = ''] = match
  if (fraction.length > DECIMALS) return null

  const padded = fraction.padEnd(DECIMALS, '0')
  const lamports = Number(whole) * LAMPORTS_PER_SOL + Number(padded)

  return Number.isSafeInteger(lamports) ? lamports : null
}

/**
 * Render lamports as SOL for display: no exponent notation, no trailing
 * zeroes, and "0" stays "0".
 */
export function formatSol(lamports: number): string {
  const sign = lamports < 0 ? '-' : ''
  const abs = Math.abs(lamports)
  const whole = Math.floor(abs / LAMPORTS_PER_SOL)
  const fraction = String(abs % LAMPORTS_PER_SOL)
    .padStart(DECIMALS, '0')
    .replace(/0+$/, '')

  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`
}
