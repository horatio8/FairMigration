/* =====================================================================
   Fair Migration — homepage composition (editorial redesign)
   Split hero w/ live ticker → indexed problem → petition + goal bar →
   impact map on a dark stage → manifesto demand → donate → footer.
   ===================================================================== */

(function () {
  const { useState, useRef, useEffect } = React;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { SiteHeader, PetitionForm, Card, Badge, Button } = DS;
  const { PostcodeTool } = window;
  const A = 'assets/';
  const GOAL = 75000;

  const fmt = (n) => n.toLocaleString();
  const pct = (n) => Math.min(100, (n / GOAL) * 100);

  function Eyebrow({ children, variant }) {
    const cls = 'eyebrow' + (variant ? ' eyebrow--' + variant : '');
    return <div className={cls}>{children}</div>;
  }

  /* ---------------- sticky top: utility bar + header ---------------- */
  function TopBar({ count, onSign }) {
    return (
      <div className="site-top">
        <div className="util-bar">
          <div className="util-inner">
            <span className="util-hide util-dim">Authorised by Fair Migration · Australia</span>
            <span className="util-count">
              <img className="tick-star" src={A + 'favicon-white.png'} alt="" style={{ width: 14, height: 14 }} />
              <b>{fmt(count)}</b>&nbsp;Australians have signed ·{' '}
              <a href="#petition" onClick={(e) => { e.preventDefault(); onSign(); }}>Add your name</a>
            </span>
          </div>
        </div>
        <SiteHeader logoSrc={A + 'logo-full.png'}
          links={[{ label: 'The problem', href: '#problem' }, { label: 'Impact map', href: '#map' }, { label: 'Sign', href: '#petition' }]}
          donateHref="#donate" />
      </div>
    );
  }

  /* ---------------- Hero ---------------- */
  function Hero({ count, onSign, onMap }) {
    return (
      <section className="hero">
        <div className="hero-left">
          <div className="hero-inner">
            <Eyebrow variant="light">A campaign for everyday Australians</Eyebrow>
            <h1 className="display">Australians don't have to live like this.</h1>
            <p className="hero-lead">
              Australia's migration system has reached a critical tipping point — and it's <span className="caps">your</span> rent,
              <span className="caps"> your</span> hospital queue and <span className="caps"> your</span> commute paying the price.
            </p>
            <div className="hero-cta">
              <Button variant="primary" size="lg" onClick={onSign}>Sign the petition</Button>
              <Button variant="solid" size="lg" onClick={onMap}>See your suburb →</Button>
            </div>
            <div className="hero-ticker">
              <img className="tick-star" src={A + 'favicon-white.png'} alt="" />
              <div>
                <div className="tick-count">{fmt(count)}</div>
                <div className="tick-label">Australians have signed</div>
              </div>
              <div className="progress"><div className="progress-fill" style={{ width: pct(count) + '%' }} /></div>
              <div className="goal-label">{fmt(GOAL)} goal</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- The problem (indexed pressure blocks) ---------------- */
  function Problem() {
    const items = [
      { idx: '01', stat: '+39%', h: 'Housing', p: 'Rents have surged at record pace while a generation is locked out of ever owning a home. Demand far outstrips what we can build.' },
      { idx: '02', stat: 'Strained', h: 'Healthcare', p: 'Emergency departments overflow and bulk-billing is in freefall. Our hospitals were never resourced for intake at this scale.' },
      { idx: '03', stat: 'Gridlock', h: 'Infrastructure', p: 'Roads, trains and schools are buckling. Public services are being asked to stretch across far more people than they were built for.' },
    ];
    return (
      <section id="problem" className="section">
        <div className="container container--wide">
          <div className="section-head">
            <Eyebrow>The problem</Eyebrow>
            <h2 className="h2-display">For years, our leaders drove radical migration intakes. <span style={{ color: 'var(--red-500)' }}>Everyday Australians were left to suffer.</span></h2>
            <p className="lead-p">Our Government <span className="caps">MUST</span> put Australians first. The strain shows up in three places — and you feel all three.</p>
          </div>
          <div className="pressures">
            {items.map((it) => (
              <div className="pressure" key={it.idx}>
                <div className="pressure-idx">{it.idx}</div>
                <div className="pressure-stat">{it.stat}</div>
                <div className="pressure-h">{it.h}</div>
                <p className="pressure-p">{it.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Petition + goal thermometer ---------------- */
  function PetitionBlock({ petitionRef, count, signed, onSign }) {
    return (
      <section id="petition" className="section section--tint">
        <div className="container">
          <div className="section-head">
            <Eyebrow variant="navy">Add your name</Eyebrow>
            <h2 className="h2-display">Sign the petition. Then see what it's doing to <span style={{ color: 'var(--red-500)' }}>your</span> suburb.</h2>
          </div>
          <div className="petition-grid">
            <div>
              <p className="body-p" style={{ fontSize: '17px', marginTop: '4px' }}>
                We are calling for an immediate overhaul of Australia's migration policies — so that migration is done in <span className="caps">OUR</span> best interests. Here's what you're demanding:
              </p>
              <ul className="demand-list">
                {[
                  'An immediate reduction in the migration intake.',
                  'A full review of broken, unsustainable migration policy.',
                  'A system run in the interests of Australians first.',
                ].map((t) => (
                  <li key={t}><img className="star" src={A + 'favicon-navy.png'} alt="" />{t}</li>
                ))}
              </ul>
            </div>

            <div ref={petitionRef} style={{ position: 'sticky', top: '120px' }}>
              <div className="goal-block">
                <div className="goal-row">
                  <div className="goal-now">{fmt(count)} <span>signatures</span></div>
                  <div className="goal-target">{fmt(GOAL)} goal</div>
                </div>
                <div className="goal-bar"><div className="goal-fill" style={{ width: pct(count) + '%' }} /></div>
              </div>
              {signed ? (
                <Card accent="navy" elevated>
                  <Badge tone="success">Signed</Badge>
                  <h3 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', margin: '14px 0 8px' }}>Thank you for standing up.</h3>
                  <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--ink-700)', margin: '0 0 16px' }}>
                    You're one of <strong style={{ color: 'var(--navy-700)' }}>{fmt(count)}</strong> Australians demanding fair migration.
                    We've opened your <strong>local impact map</strong> — see what's happening in your suburb.
                  </p>
                  <Button variant="solid" fullWidth onClick={() => document.getElementById('map').scrollIntoView({ behavior: 'smooth' })}>View my local impact ↓</Button>
                  <div style={{ height: '8px' }} />
                  <Button variant="donate" fullWidth href="#donate">Chip in to the campaign</Button>
                </Card>
              ) : (
                <PetitionForm
                  title="Sign the petition"
                  blurb="Add your name, then see your suburb's migration impact instantly."
                  onSign={onSign}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Map on a dark stage ---------------- */
  function MapSection({ registerApi, onSign }) {
    return (
      <section id="map" className="section section--dark">
        <div className="container container--wide">
          <div className="section-head map-head">
            <Eyebrow variant="light">Local impact map</Eyebrow>
            <h2 className="h2-display">How much is <span style={{ color: 'var(--coral-400)' }}>your</span> postcode absorbing?</h2>
            <p className="map-lead">
              Migration is decided in Canberra — but it lands on your street. Enter your postcode for suburb-level
              intensity, year-on-year change and how your area ranks against the nation.
            </p>
          </div>
          <div className="map-stage">
            <PostcodeTool registerApi={registerApi} onSign={onSign} />
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Manifesto demand ---------------- */
  function Demand({ onSign }) {
    return (
      <section className="section">
        <div className="container">
          <div className="manifesto">
            <Eyebrow>Our demand to Canberra</Eyebrow>
            <img className="star" src={A + 'favicon-navy.png'} alt="" style={{ display: 'block', marginTop: 26 }} />
            <p className="demand-quote">
              We demand an <span className="r">immediate overhaul</span> of Australia's migration system.
              The current system is <span className="n">broken</span>, unsustainable and putting an unfair strain on Australians.
            </p>
            <Button variant="primary" size="lg" onClick={onSign}>Add your name</Button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Donate ---------------- */
  function Donate() {
    const tiers = [
      { amt: '$25', note: 'Reach 500 more voters' },
      { amt: '$50', note: 'Fund a day of digital ads', featured: true },
      { amt: '$100', note: 'Power our research desk' },
    ];
    const [sel, setSel] = useState(1);
    const [recurring, setRecurring] = useState(false);
    return (
      <section id="donate" className="section section--tint">
        <div className="container" style={{ maxWidth: '780px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Eyebrow variant="navy">Chip in</Eyebrow></div>
          <h2 className="h2-display" style={{ marginTop: '16px' }}>This campaign runs on Australians like you.</h2>
          <p className="body-p" style={{ fontSize: '17px', margin: '18px auto 0', maxWidth: '56ch' }}>
            We take no money from government or big party machines. Every dollar puts the case for fair migration in front of more voters.
          </p>
          <div className="tier-grid">
            {tiers.map((t, i) => (
              <button key={t.amt} onClick={() => setSel(i)} className={'tier' + (sel === i ? ' tier-on' : '')}>
                {t.featured && <span className="tier-tag">Most chosen</span>}
                <span className="tier-amt">{t.amt}</span>
                <span className="tier-note">{t.note}</span>
              </button>
            ))}
          </div>
          <label style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', margin: '24px 0', fontSize: '15px', fontWeight: 600, color: 'var(--ink-700)', cursor: 'pointer' }}>
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--navy-700)' }} />
            Make it monthly — sustained pressure works
          </label>
          <div>
            <Button variant="donate" size="lg">Donate {tiers[sel].amt}{recurring ? '/mo' : ''} securely</Button>
            <p style={{ fontSize: '13px', color: 'var(--ink-400)', margin: '14px 0 0', fontWeight: 600 }}>Secure payment via Stripe · Authorised by Fair Migration, Australia</p>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Footer ---------------- */
  function Footer({ onSign }) {
    return (
      <React.Fragment>
        <div className="foot-cta">
          <div className="container foot-cta-inner">
            <h2>Australia's future is worth a signature.</h2>
            <Button variant="primary" size="lg" onClick={onSign}>Sign the petition</Button>
          </div>
        </div>
        <footer className="footer">
          <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src={A + 'logo-full.png'} alt="Fair Migration" style={{ height: '52px' }} />
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              <a href="#problem">The problem</a>
              <a href="#map">Impact map</a>
              <a href="#donate">Donate</a>
              <a href="#">Privacy Policy</a>
            </nav>
            <div className="social" style={{ fontSize: '13px', color: 'var(--ink-500)', fontWeight: 600 }}>
              <a href="#">Twitter</a><a href="#">Facebook</a><a href="#">Instagram</a><a href="#">YouTube</a>
            </div>
          </div>
          <div className="container" style={{ marginTop: '24px', fontSize: '12px', color: 'var(--ink-400)' }}>
            &copy; 2026 Fair Migration. All rights reserved. · Map figures shown are sample data for demonstration.
          </div>
        </footer>
      </React.Fragment>
    );
  }

  /* ---------------- App ---------------- */
  function App() {
    const [count, setCount] = useState(48217);
    const [signed, setSigned] = useState(false);
    const petitionRef = useRef(null);
    const gisApi = useRef(null);

    useEffect(() => {
      const id = setInterval(() => setCount((c) => c + (Math.random() < 0.6 ? 1 : 0)), 4200);
      return () => clearInterval(id);
    }, []);

    const scrollToPetition = () => {
      const el = petitionRef.current;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
    };
    const scrollToMap = () => document.getElementById('map').scrollIntoView({ behavior: 'smooth' });

    const handleSign = (data) => {
      setCount((c) => c + 1);
      setSigned(true);
      const pc = ((data && data.postcode) || '').replace(/\D/g, '').slice(0, 4);
      setTimeout(() => {
        if (pc && pc.length === 4 && gisApi.current) {
          gisApi.current.showPostcode(pc);
          setTimeout(() => document.getElementById('map').scrollIntoView({ behavior: 'smooth' }), 120);
        }
      }, 350);
    };

    return (
      <div>
        <TopBar count={count} onSign={scrollToPetition} />
        <Hero count={count} onSign={scrollToPetition} onMap={scrollToMap} />
        <Problem />
        <PetitionBlock petitionRef={petitionRef} count={count} signed={signed} onSign={handleSign} />
        <MapSection registerApi={(api) => { gisApi.current = api; }} onSign={scrollToPetition} />
        <Demand onSign={scrollToPetition} />
        <Donate />
        <Footer onSign={scrollToPetition} />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
