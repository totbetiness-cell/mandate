/**
 * Placeholders for the example mandate.
 *
 * Valid base58 by shape, obviously invented by sight. They stay placeholders
 * only until the devnet integration lands and the page can seed the example
 * with the demo wallet it actually generated.
 */
export const DEMO_TREASURY = 'Treasury11111111111111111111111111111111111'
export const DEMO_VENDOR = 'Vendor22222222222222222222222222222222222222'

export const EXAMPLE_MANDATE = [
  '# Edit these sentences — the rules on the right follow along.',
  'Never send more than 0.5 SOL in one transfer.',
  'Never send more than 2 SOL per day.',
  `Only send to ${DEMO_TREASURY} and ${DEMO_VENDOR}.`,
  'The mandate is active.',
].join('\n')
