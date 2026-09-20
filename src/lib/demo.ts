/**
 * The example mandate the page starts with.
 *
 * It is built around the demo wallet's own generated recipient, so the example
 * is immediately usable: the address in the allow-list is a real devnet
 * address this page can actually send to.
 */
export function exampleMandate(recipient: string): string {
  return [
    '# Edit these sentences — the rules on the right follow along.',
    'Never send more than 0.5 SOL in one transfer.',
    'Never send more than 2 SOL per day.',
    `Only send to ${recipient}.`,
    'The mandate is active.',
  ].join('\n')
}
