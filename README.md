# Mandate

**Plain-language rules that every Solana transaction must pass before it is signed.**

Built for the Colosseum "Crypto World's Fair" hackathon (14 Sep – 12 Oct 2026).
Devnet only.

---

## The problem

Wallets on Solana are increasingly driven by scripts, bots and AI agents. When
one of them moves funds, nobody can point to the rule that allowed it — because
usually there wasn't one. The guardrails, where they exist at all, live inside
the agent: the one component you cannot trust to enforce them. A prompt is not
a limit.

## What Mandate does

You write your mandate as ordinary sentences:

```
Never send more than 0.5 SOL in one transfer.
Never send more than 2 SOL per day.
Only send to the treasury and the payroll wallet.
The mandate is active.
```

Mandate compiles those sentences into a deterministic checklist and runs it
**before anything is signed**. That is the design; the status section below says
what is actually built so far.

- **Passes** → the transfer is sent with an SPL Memo instruction carrying the
  rule ID and a hash of the mandate that authorised it. The on-chain record
  points back to the sentence that allowed it.
- **Fails** → the transfer is never signed, and you are shown the exact line it
  broke.

### Three properties the engine is built around

**It refuses by default.** An empty mandate allows nothing. A mandate that never
says who may receive funds allows nobody. The burden is on your sentences to
permit; it is never on the engine to guess what you meant to forbid.

**A line it does not understand stops everything.** A mandate with one
unparseable sentence produces no rules at all, rather than a partial rule set
you might mistake for the whole thing. Silent omission is the dangerous failure
mode for a guardrail: it leaves a hole exactly where the author believed they
had put a limit.

**It is deterministic.** No clock, no network, no randomness, no model call.
Given the same mandate and the same transfer it returns the same decision every
time. A guardrail whose output you cannot predict is not a guardrail — so the
one component that has to be boring is boring on purpose.

Rules are read top to bottom and the first one that objects decides, so a
refusal always points at a line you can go and read.

## Status

**Day 3 of the build.** The editor is live: type a mandate, watch the rules
appear, try a transfer against them and see which line decides. Nothing is
signed or sent yet — the devnet integration is next. This repository's history
is public and starts at zero; what is listed as done is what exists.

- [x] Project scaffold, production build, test harness
- [x] Amount handling: SOL parsed from decimal strings into integer lamports,
      so no limit can be walked past by floating-point rounding
- [x] Deployment to GitHub Pages — <https://totbetiness-cell.github.io/mandate/>
- [x] Policy engine: four rule kinds, parser, 26 unit tests
- [x] Mandate editor with live rule readout
- [ ] Devnet integration: keypair, airdrop, transfer, memo
- [ ] Audit trail with explorer links
- [ ] Demo video

## Run it locally

Requires Node 22 or newer (built with 24.21.0; CI runs 22).

```bash
npm install
npm run dev     # http://localhost:5173/mandate/
npm test        # unit tests
npm run build   # production build into dist/
```

## Architecture

```
browser
  └─ mandate (text)  ──►  policy engine  ──►  decision + the deciding rule
                          (deterministic,        │
                           offline, tested)      │  only when allowed
                                                 ▼
                                    transaction built and signed locally
                                                 │
                                                 ▼
                                    Solana devnet RPC  ──►  signature
```

There is no backend, no database and no account system. Everything runs in the
browser; the demo keypair is generated there and never leaves it.

## Network and on-chain artifacts

| | |
|---|---|
| Cluster | Solana **devnet** (public RPC) |
| Custom program | none — the check happens off-chain, before signing |
| Programs used | System Program (transfers) and SPL Memo, `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` (verified against the official docs and the devnet RPC) |
| Demo addresses | _added when the devnet integration lands_ |
| Example signatures | _added when the devnet integration lands_ |

No mainnet. No transaction in this project moves funds with real value.

## Non-custodial by construction

The demo keypair is generated in your browser, kept in browser storage and
never transmitted. There is no server to send it to. Do not connect a wallet
holding real funds — this is a devnet demo, and it does not ask you to.

## How this was built

This project is built with AI assistance throughout:
[Claude Code](https://claude.com/claude-code) is the primary tool for the code
and for drafting the technical design. Scope, direction and what ships are the
author's decisions. Stated here rather than left to be inferred from the commit
history.

## Licence

MIT — see [LICENSE](LICENSE).
