interface Props {
  /** The amount that breaks the mandate currently on screen, already formatted. */
  nudge: string | null
}

export function Intro({ nudge }: Props) {
  return (
    <section className="panel panel--intro">
      <p>
        A <strong>mandate</strong> is a few plain sentences saying what a wallet
        may do — a cap per transfer, a daily budget, who may be paid. Write them
        below and Mandate turns them into a checklist.
      </p>
      <p>
        Underneath, try a transfer against it. The check runs{' '}
        <strong>before anything is signed</strong>: if the rules refuse, no
        signature is ever produced, and you are told which line said no. Every
        answer, yes or no, is kept in the trail at the bottom.
      </p>
      {nudge && (
        <p className="nudge">
          Try it: set the amount to <strong>{nudge} SOL</strong> and press
          “Check and send”. Then put it back to 0.1 and watch it go through.
        </p>
      )}
    </section>
  )
}
