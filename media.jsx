/* Fair Migration — Media & press. */
(function () {
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { useLiveCount, SiteNav, PageHead, Footer, Eyebrow } = F;
  const { Button } = DS;

  const MEDIA_EMAIL = 'media@fairmigration.vote';

  const OFFER = [
    { h: 'Data on any postcode', p: 'Real ABS Census figures on migration intensity, population growth and rental stress for all 2,532 Australian postcodes — with the methodology behind them.' },
    { h: 'Interviews on background', p: 'We speak to press on background. Our supporters and organisers keep their names private so they and their families cannot be targeted for holding a mainstream view.' },
    { h: 'Supporter numbers', p: 'Current signature counts, growth rates and the geographic spread of the campaign, on request.' },
  ];

  const ASSETS = [
    { label: 'Fair Migration logo (PNG)', href: 'assets/logo-full.png' },
    { label: 'Campaign hero image', href: 'assets/hero-bg.jpg' },
    { label: 'The petition and our three demands', href: 'petition.html' },
    { label: 'Your suburb’s migration data', href: 'problem.html#map' },
  ];

  function Page() {
    const [count] = useLiveCount();
    return (
      <div>
        <SiteNav active="media" count={count} />
        <PageHead
          eyebrow="Media"
          title="For journalists and producers."
          lead="Fair Migration is a grassroots campaign of everyday Australians. We are happy to help with data, figures and background." />

        <section className="section">
          <div className="container media-contact">
            <div>
              <Eyebrow>Media enquiries</Eyebrow>
              <a className="media-email" href={'mailto:' + MEDIA_EMAIL}>{MEDIA_EMAIL}</a>
              <p className="body-p">We aim to respond within one business day. For anything urgent, say so in the subject line.</p>
            </div>
            <Button variant="primary" size="lg" href={'mailto:' + MEDIA_EMAIL}>Email the media team &rarr;</Button>
          </div>
        </section>

        <section className="section section--tint">
          <div className="container container--wide">
            <div className="section-head">
              <Eyebrow>What we can provide</Eyebrow>
              <h2 className="h2-display">Facts, figures and access.</h2>
            </div>
            <ul className="media-offer">
              {OFFER.map((o, i) => (<li key={i}><h3>{o.h}</h3><p>{o.p}</p></li>))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="container container--wide">
            <h2 className="h2-display" style={{ fontSize: 'clamp(26px,3vw,38px)', marginBottom: '20px' }}>Press kit &amp; assets.</h2>
            <ul className="media-assets">
              {ASSETS.map((a, i) => (<li key={i}><a href={a.href}>{a.label}</a></li>))}
            </ul>
            <p className="body-p" style={{ marginTop: '22px', maxWidth: '70ch' }}>
              A note on attribution: we keep the identities of our organisers and supporters private. It is not evasiveness —
              Australians who speak up on migration have lost work and had their families targeted. We will always give you
              the numbers and the reasoning on the record.
            </p>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
