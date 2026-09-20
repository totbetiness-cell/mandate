/**
 * A short, stable fingerprint of the mandate text.
 *
 * It goes into the memo of every transfer the mandate authorised, so that a
 * transaction on the chain can be tied back to the exact wording that allowed
 * it. Change one character of the mandate and the fingerprint changes, which
 * is the property that matters: nobody can later claim a different mandate was
 * in force.
 *
 * SHA-256, truncated to 16 hex characters to keep the memo small. That is a
 * fingerprint for humans comparing two values, not a commitment scheme.
 */

const FINGERPRINT_LENGTH = 16

export async function fingerprint(mandate: string): Promise<string> {
  const bytes = new TextEncoder().encode(mandate)
  const digest = await crypto.subtle.digest('SHA-256', bytes)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, FINGERPRINT_LENGTH)
}
