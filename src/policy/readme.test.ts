import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compile } from './parse'

/**
 * The README shows an example mandate. If the parser cannot read it, the
 * documentation is quietly lying about the product — which is the one thing
 * this product cannot afford. So the example is a test fixture.
 */
describe('the example mandate in the README', () => {
  it('compiles', () => {
    const readme = readFileSync('README.md', 'utf8')
    const example = /```\n(Never send[\s\S]*?)```/.exec(readme)?.[1]

    expect(example, 'no example mandate found in README.md').toBeDefined()

    const result = compile(example!)
    expect(result.ok, JSON.stringify(result.ok ? [] : result.problems)).toBe(true)
    if (result.ok) expect(result.rules).toHaveLength(4)
  })
})
