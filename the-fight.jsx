/* Fair Migration — The Fight: what we're fighting for and how we win. */
(function () {
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { useLiveCount, SiteNav, PageHead, Footer, Eyebrow, Star, CFG } = F;
  const { Button } = DS;

  const PANELS = [
    { kicker: 'The demand', title: 'Cut the intake', body: 'Bring migration back to a level our housing, hospitals and infrastructure can actually carry. Not a pause. A permanent, honest number.' },
    { kicker: 'The demand', title: 'Open the books', body: 'An independent audit of a migration program that has run for years without one. Australians deserve to see what was decided, and who it was decided for.' },
    { kicker: 'The demand', title: 'Australians first', body: 'A system run in the interests of the people who built this country and pay for its services — not corporate lobbyists chasing cheap labour.' },
  ];

  const STEPS = [
    { n: '01', h: 'Build the number', p: 'Every signature is a name Canberra has to answer to. A million of them is a mandate they cannot spin, bury or wait out.' },
    { n: '02', h: 'Put it in front of them', p: 'We take the petition, the data and your suburb’s numbers directly to MPs — and to the voters in the seats that decide elections.' },
    { n: '03', h: 'Make it an election issue', p: 'Ads, research and organising in the marginal seats, so no candidate can face a voter without a straight answer on migration.' },
  ];

  function Page() {
    const [count] = useLiveCount();
    return (
      <div>
        <SiteNav active="fight" count={count} />
        <PageHead
          eyebrow="The fight"
          title="They are betting you will get tired before they do."
          lead="Fair Migration exists to make that bet fail. Here is exactly what we are demanding, and how we intend to win it." />

        <section className="section">
          <div className="container container--wide">
            <div className="section-head">
              <Eyebrow>What we demand</Eyebrow>
              <h2 className="h2-display">Three things. No hedging.</h2>
            </div>
            <div className="fight-panels">
              {PANELS.map((p, i) => (
                <a className="fight-panel" href={CFG.signHref || 'petition.html'} key={i}>
                  <span className="fight-panel-kicker">{p.kicker}</span>
                  <h3 className="fight-panel-title">{p.title}</h3>
                  <p>{p.body}</p>
                  <span className="fight-panel-cta">Sign the petition <span aria-hidden="true">&rarr;</span></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--tint">
          <div className="container container--wide">
            <div className="section-head">
              <Eyebrow>How we win</Eyebrow>
              <h2 className="h2-display">A campaign they cannot ignore.</h2>
            </div>
            <ol className="fight-steps">
              {STEPS.map((s) => (
                <li className="fight-step" key={s.n}>
                  <span className="fight-step-n">{s.n}</span>
                  <div><h4>{s.h}</h4><p>{s.p}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="fight-cta">
          <div className="container fight-cta-inner">
            <Star size={38} color="#fff" style={{ display: 'block', margin: '0 auto 18px' }} />
            <h2>Australia&rsquo;s future is on the line.</h2>
            <p>It takes ten seconds to add your name. It takes a million of us to force a government to move.</p>
            <div className="fight-cta-buttons">
              <Button variant="primary" size="lg" href="petition.html">Add your signature &rsaquo;</Button>
              <Button variant="outline" size="lg" href="donate.html">Fund the fight</Button>
            </div>
          </div>
        </section>

        <Footer hideCta />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
