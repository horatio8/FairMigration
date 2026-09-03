/* Fair Migration — microsite landing (single-page sign funnel).
   Reuses the main site's brand + components via window.FM; posts to the main API. */
(function () {
  const { useState } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { useLiveCount, markSigned, isSigned, safeGet, clean4, Eyebrow,
    SiteNav, SignatureBar, PetitionSection, Demand, Footer } = F;
  const { Button } = DS;

  function Hero() {
    return (
      <section className="hero">
        <div className="hero-left"><div className="hero-inner"><div className="hero-text">
          <Eyebrow variant="light">A campaign for everyday Australians</Eyebrow>
          <h1 className="display">Australians don't have to live like this.</h1>
          <p className="hero-redline">Put Australians first.</p>
          <p className="hero-lead">
            Mass migration has reached a critical tipping point — and they're trying to hide what it's doing to
            everyday Australians. It's <span className="caps">your</span> rent, <span className="caps"> your</span> hospital
            queue and <span className="caps"> your</span> taxes paying the price.
          </p>
          <div className="hero-cta"><Button variant="primary" size="lg" href="#sign">Add your signature ›</Button></div>
        </div></div></div>
      </section>
    );
  }

  function Page() {
    const [count, setCount] = useLiveCount();
    const [signed, setSigned] = useState(isSigned());
    const [pc, setPc] = useState(safeGet('fm_pc') || '');
    const onSign = (data) => { markSigned(data); setSigned(true); setCount((c) => c + 1); setPc(clean4(data.postcode)); };
    return (
      <div>
        <SiteNav minimal count={count} />
        <Hero />
        <SignatureBar count={count} />
        <PetitionSection count={count} signed={signed} pc={pc} onSign={onSign} />
        <Demand />
        <Footer minimal />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
