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
Only send to Treasury11111111111111111111111111111111111.
The mandate is active.
```

(That address is a readable stand-in. The page fills the example in with a real
devnet address it generated for you, so the mandate works the moment you open
it.)

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

### The audit trail

Every answer is recorded in the browser: time, verdict, amount, recipient, the
quoted rule that decided, and — for a transfer that was actually sent — a link
to it on the explorer. Refused entries carry no link, because nothing was
signed and there is nothing on the chain to show.

The trail lives in your browser and nowhere else. There is no backend, so there
is no server-side log you would have to take our word for. Once a transfer is
sent, the entry that matters is public — it is the transaction on devnet, and
the trail links straight to it.

## Status

**Day 2 of the build** (first commit 2026-09-20). Write a mandate, try a
transfer, and the page answers before anything is signed. An allowed transfer is
built, signed and sent on devnet with a memo naming the rules that allowed it;
a refused one produces no signature at all.

**Not yet demonstrated on-chain.** The send path is built and covered by tests,
but no funded transfer has been made yet: the public devnet faucet has been
rate-limited for this project's address since 2026-09-20. Until that changes,
there are no example signatures to show, and this README will not pretend
otherwise. Either way the answer is kept in the audit trail, so the refusals are
visible next to the approvals — that absence of a signature is the product
working. This repository's history is public and starts at zero; what is
listed as done is what exists.

- [x] Project scaffold, production build, test harness
- [x] Amount handling: SOL parsed from decimal strings into integer lamports,
      so no limit can be walked past by floating-point rounding
- [x] Deployment to GitHub Pages — <https://totbetiness-cell.github.io/mandate/>
- [x] Policy engine: four rule kinds, parser, 46 unit tests
- [x] Mandate editor with live rule readout
- [x] Devnet integration: keypair, airdrop, transfer, memo
- [x] Audit trail with explorer links, refusals included
- [ ] Demo video

## Run it locally

Requires Node 22 or newer (built with 24.21.0; CI runs 24 — the lock file resolves differently under npm 10).

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
| Demo addresses | generated per visitor, in the browser; never reused, never uploaded |
| Example signatures | _pending: the public devnet faucet is currently rate limited, see below_ |

No mainnet. No transaction in this project moves funds with real value.

The memo of an allowed transfer reads:

```
mandate/1 rules=L1,L2,L3,L4 sha256=1a2b3c4d5e6f7a8b
```

The rule ids point into the mandate; the fingerprint is the truncated SHA-256
of its exact wording, so nobody can later claim a different mandate was in
force.

**Devnet faucet.** Funding is rate limited per address and per IP and the
faucet is regularly dry. If the airdrop button will not pay out, the page shows
the demo address so it can be funded at
[faucet.solana.com](https://faucet.solana.com). The live chain check in
`src/chain/devnet.live.test.ts` skips rather than fails when no funded payer is
available — a test that goes red because someone else's faucet is empty tells
you nothing about this code.

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

## Who this is for

**Teams running an agent or a script on a wallet.** A trading bot, a payout
job, a treasury agent, anything where software moves funds without a person
approving each transfer. They need a limit that does not live inside the thing
being limited.

**The person who has to answer for it afterwards.** A founder, a treasurer, an
auditor. Today the answer to "why did it send that?" is a log file, if anyone
kept one. With Mandate the answer is a sentence someone wrote and a transaction
that cites it.

**Teams shipping agents to other people.** If your product signs on a
customer's behalf, "the model was told not to" is not a control you can show
anyone. A mandate is.

## Why now

Agent wallets are arriving on Solana faster than the controls for them. The
pattern that keeps repeating is the same one this project started from: the
guardrails live inside the agent, in its prompt or its code, and the agent is
the one component that cannot be trusted to enforce them. A prompt is a
request, not a limit.

Two things make this the moment. First, the check needs no new on-chain program
to be useful — it can ship today against programs that already exist. Second,
the pieces for a verifiable answer are already on the chain: put the reason in
the transaction and the audit trail is public by construction, with nothing to
self-host and nothing to trust.

## What this is not

Being clear about the edges matters more than sounding big:

- **Not a wallet, and not custody.** Mandate never holds anyone's keys. In this
  demo the key is generated in your browser and never leaves it.
- **Not a smart contract.** The check runs before signing, off-chain. That is a
  deliberate limitation: it constrains the client that signs, not the chain. An
  attacker holding the private key is out of scope — this stops an agent
  misbehaving, not a thief.
- **Not an AI product.** There is no model anywhere in the decision path, on
  purpose. The whole value is that the answer is predictable.
- **Not a compliance product.** It records what a mandate allowed. It makes no
  claim about any regulation.

## Where it could go

Roughly in the order the constraints suggest, not as promises:

1. **A signer, not a page.** The same engine behind a signing interface an
   existing agent can call, so the rules apply without rewriting the agent.
2. **Rules that need more than arithmetic.** Time windows, per-recipient
   budgets, token-aware limits, a second signature above a threshold.
3. **On-chain enforcement where it is worth it.** For a treasury that cannot
   accept a client-side check, the same mandate compiled into a program that
   enforces it. Off-chain first because it is useful sooner, not because on-chain
   is wrong.
4. **Mandates that outlive one browser.** Shared, versioned, with the
   fingerprint making it provable which wording was in force for any transfer.

No revenue figures, market sizes or user counts appear here. This project has
none yet, and inventing them would undermine the one thing it is built to
demonstrate: claims you can check.

## Licence

MIT — see [LICENSE](LICENSE).
