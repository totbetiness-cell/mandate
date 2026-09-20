import { formatSol } from '../policy'
import { explorerAddress } from '../chain/devnet'
import { short } from '../lib/describeRule'
import type { DemoWallet } from '../chain/devnet'

interface Props {
  wallet: DemoWallet
  lamports: number | null
  busy: boolean
  onAirdrop: () => void
  onNewWallet: () => void
  notice: string | null
}

export function WalletPanel({
  wallet,
  lamports,
  busy,
  onAirdrop,
  onNewWallet,
  notice,
}: Props) {
  const address = wallet.keypair.publicKey.toBase58()

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Demo wallet · devnet</h2>
        <button type="button" className="link-button" onClick={onNewWallet} disabled={busy}>
          New wallet
        </button>
      </div>

      <div className="wallet-row">
        <div>
          <p className="wallet-label">Address</p>
          <p className="wallet-value">
            <a href={explorerAddress(address)} target="_blank" rel="noreferrer">
              {short(address)}
            </a>
          </p>
        </div>
        <div>
          <p className="wallet-label">Balance</p>
          <p className="wallet-value">
            {lamports === null ? '…' : `${formatSol(lamports)} SOL`}
          </p>
        </div>
        <button type="button" className="button" onClick={onAirdrop} disabled={busy}>
          {busy ? 'Working…' : 'Request 1 SOL'}
        </button>
      </div>

      {notice && <p className="notice">{notice}</p>}

      {lamports === 0 && (
        <p className="notice">
          The devnet faucet is rate limited per address and per IP, and it is
          regularly dry. If the button above will not pay out, fund this address
          at{' '}
          <a href="https://faucet.solana.com" target="_blank" rel="noreferrer">
            faucet.solana.com
          </a>
          :
          <br />
          <code className="wallet-full">{address}</code>
        </p>
      )}

      <p className="footnote">
        Generated in your browser, kept in your browser, funded from the devnet
        faucet. There is no backend to send a key to, and this page never asks
        you to connect a wallet of your own.
      </p>
    </section>
  )
}
