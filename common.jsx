/* =====================================================================
   Fair Migration — shared module (window.FM)
   Header (with pink Sign button), footer, signature bar, the petition
   form (first/last/email/mobile/postcode) and content sections, all
   reused across the multi-page site.
   ===================================================================== */

(function () {
  const { useState, useEffect, useRef } = React;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { Button, Card, Badge, Input } = DS;
  const A = 'assets/';
  const GOAL = 75000;

  const fmt = (n) => n.toLocaleString();
  const pct = (n) => Math.min(100, (n / GOAL) * 100);
  const clean4 = (s) => String(s || '').replace(/\D/g, '').slice(0, 4);

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function markSigned(data) {
    safeSet('fm_signed', '1');
    if (data && data.postcode) safeSet('fm_pc', clean4(data.postcode));
  }

  /* live, drifting signature count (shared starting point across pages) */
  function useLiveCount() {
    const [count, setCount] = useState(48217 + (safeGet('fm_signed') === '1' ? 1 : 0));
    useEffect(() => {
      const id = setInterval(() => setCount((c) => c + (Math.random() < 0.6 ? 1 : 0)), 4200);
      return () => clearInterval(id);
    }, []);
    return [count, setCount];
  }

  function Eyebrow({ children, variant }) {
    return <div className={'eyebrow' + (variant ? ' eyebrow--' + variant : '')}>{children}</div>;
  }

  /* 7-point Commonwealth star — the brand's recurring graphic device */
  function Star({ size = 42, color = 'var(--navy-700)', className, style }) {
    const cx = 50, cy = 50, R = 49, r = 21, N = 7, pts = [];
    for (let i = 0; i < N * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = (Math.PI / N) * i - Math.PI / 2;
      pts.push((cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2));
    }
    return (
      <svg className={className} style={style} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <polygon points={pts.join(' ')} fill={color} />
      </svg>
    );
  }

  /* ---------------- sticky top: utility bar + custom header ---------------- */
  function SiteNav({ active, count }) {
    const [open, setOpen] = useState(false);
    const link = (key, href, label) => (
      <a className={'navlink' + (active === key ? ' is-active' : '')} href={href} onClick={() => setOpen(false)}>{label}</a>
    );
    return (
      <div className="site-top">
        <div className="util-bar">
          <div className="util-inner">
            <span className="util-count">
              <img className="tick-star" src={A + 'favicon-white.png'} alt="" style={{ width: 14, height: 14 }} />
              <b>{fmt(count != null ? count : 48217)}</b>&nbsp;Australians have signed ·{' '}
              <a href="petition.html">Add your name</a>
            </span>
          </div>
        </div>
        <header className="site-nav">
          <a className="site-nav-brand" href="index.html"><img src={A + 'logo-full.png'} alt="Fair Migration" /></a>
          <button className="site-nav-burger" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              {open ? <g><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></g>
                    : <g><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></g>}
            </svg>
          </button>
          <nav className={'site-nav-links' + (open ? ' is-open' : '')}>
            {link('problem', 'problem.html', 'The problem')}
            {link('map', 'map.html', 'Impact map')}
            <a className="btn-sign" href="petition.html">Sign</a>
            <Button variant="donate" size="sm" href="donate.html">Donate</Button>
          </nav>
        </header>
      </div>
    );
  }

  /* ---------------- Hero ---------------- */
  function Hero({ count }) {
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
              <Button variant="primary" size="lg" href="petition.html">Sign the petition</Button>
              <Button variant="solid" size="lg" href="map.html">See your suburb →</Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Signature bar ---------------- */
  function SignatureBar({ count }) {
    const p = pct(count);
    const remaining = Math.max(0, GOAL - count);
    const milestones = [25000, 50000, GOAL];
    return (
      <section className="sigbar" aria-label="Petition signature count">
        <div className="container container--wide sigbar-inner">
          <div className="sigbar-count">
            <Star size={44} className="sigbar-star" />
            <div>
              <div className="sigbar-num">{fmt(count)}</div>
              <div className="sigbar-label">Australians have signed</div>
            </div>
          </div>
          <div className="sigbar-progress">
            <div className="sigbar-track">
              <div className="sigbar-fill" style={{ width: p + '%' }} />
              {milestones.map((m) => <span key={m} className="sigbar-tick" style={{ left: pct(m) + '%' }} />)}
              <span className="sigbar-bubble" style={{ left: p + '%' }}>{Math.round(p)}%</span>
            </div>
            <div className="sigbar-meta">
              <span><b>{fmt(remaining)}</b> more to reach our goal of {fmt(GOAL)}</span>
              <span className="sigbar-live"><span className="sigbar-dot" /> Updating live</span>
            </div>
          </div>
          <Button variant="primary" size="lg" href="petition.html">Add your name</Button>
        </div>
      </section>
    );
  }

  /* ---------------- The problem ---------------- */
  function Problem({ bare }) {
    const items = [
      { idx: '01', stat: '+39%', h: 'Housing', p: 'Rents have surged at record pace while a generation is locked out of ever owning a home. Demand far outstrips what we can build.' },
      { idx: '02', stat: 'Strained', h: 'Healthcare', p: 'Emergency departments overflow and bulk-billing is in freefall. Our hospitals were never resourced for intake at this scale.' },
      { idx: '03', stat: 'Gridlock', h: 'Infrastructure', p: 'Roads, trains and schools are buckling. Public services are being asked to stretch across far more people than they were built for.' },
    ];
    return (
      <section id="problem" className="section">
        <div className="container container--wide">
          {!bare && (
            <div className="section-head">
              <Eyebrow>The problem</Eyebrow>
              <h2 className="h2-display">For years, our leaders drove radical migration intakes. <span style={{ color: 'var(--red-500)' }}>Everyday Australians were left to suffer.</span></h2>
              <p className="lead-p">Our Government <span className="caps">MUST</span> put Australians first. The strain shows up in three places — and you feel all three.</p>
            </div>
          )}
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

  /* ---------------- Petition form (first/last/email/mobile/postcode) ---------------- */
  function PetitionForm({ onSign, cta = 'Sign the petition' }) {
    const [d, setD] = useState({ firstName: '', lastName: '', email: '', mobile: '', postcode: '' });
    const [err, setErr] = useState({});
    const set = (k) => (e) => {
      const v = e.target.value;
      setD((s) => ({ ...s, [k]: v }));
      if (err[k]) setErr((s) => ({ ...s, [k]: undefined }));
    };
    const submit = (e) => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.lastName.trim()) n.lastName = 'Required';
      if (!d.email.trim()) n.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n);
      if (Object.keys(n).length) return;
      onSign && onSign(d);
    };
    return (
      <form className="pform" onSubmit={submit} noValidate>
        <div className="pform-grid2">
          <Input label="First name *" name="firstName" placeholder="Jane" value={d.firstName}
            onChange={set('firstName')} invalid={!!err.firstName} hint={err.firstName} autoComplete="given-name" />
          <Input label="Last name *" name="lastName" placeholder="Citizen" value={d.lastName}
            onChange={set('lastName')} invalid={!!err.lastName} hint={err.lastName} autoComplete="family-name" />
        </div>
        <Input label="Email *" type="email" name="email" placeholder="jane@example.com" value={d.email}
          onChange={set('email')} invalid={!!err.email} hint={err.email} autoComplete="email" />
        <Input label="Mobile phone" type="tel" name="mobile" placeholder="0400 000 000" value={d.mobile}
          onChange={set('mobile')} autoComplete="tel" />
        <Input label="Postcode" name="postcode" placeholder="2000" value={d.postcode}
          onChange={set('postcode')} inputMode="numeric" maxLength={4} autoComplete="postal-code" />
        <Button type="submit" variant="primary" size="lg" fullWidth>{cta}</Button>
        <p className="pform-fine"><span className="req">*</span> Required. We'll send you campaign updates — unsubscribe anytime.</p>
      </form>
    );
  }

  function ThanksCard({ count, pc }) {
    const mapHref = 'map.html' + (pc ? ('?pc=' + pc) : '');
    return (
      <Card accent="navy" elevated>
        <Badge tone="success">Signed</Badge>
        <h3 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', margin: '14px 0 8px' }}>Thank you for standing up.</h3>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--ink-700)', margin: '0 0 16px' }}>
          You're one of <strong style={{ color: 'var(--navy-700)' }}>{fmt(count)}</strong> Australians demanding fair migration.
          {pc ? ' We’ve pinned your local impact map — see what’s happening in your suburb.' : ''}
        </p>
        <Button variant="solid" fullWidth href={mapHref}>View my local impact →</Button>
        <div style={{ height: '8px' }} />
        <Button variant="donate" fullWidth href="donate.html">Chip in to the campaign</Button>
      </Card>
    );
  }

  /* ---------------- Petition section (argument + goal + form) ---------------- */
  function PetitionSection({ count, signed, pc, onSign }) {
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
                  <li key={t}><Star size={18} className="star" />{t}</li>
                ))}
              </ul>
            </div>
            <div style={{ position: 'sticky', top: '120px' }}>
              <div className="goal-block">
                <div className="goal-row">
                  <div className="goal-now">{fmt(count)} <span>signatures</span></div>
                  <div className="goal-target">{fmt(GOAL)} goal</div>
                </div>
                <div className="goal-bar"><div className="goal-fill" style={{ width: pct(count) + '%' }} /></div>
              </div>
              {signed ? <ThanksCard count={count} pc={pc} /> : <PetitionForm onSign={onSign} />}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Map on a dark stage ---------------- */
  function MapStage({ registerApi, onSign }) {
    const Tool = window.PostcodeTool;
    return (
      <section id="map" className="section section--dark">
        <div className="container container--wide">
          <div className="section-head map-head">
            <Eyebrow variant="light">Local impact map</Eyebrow>
            <h2 className="h2-display">How much is <span style={{ color: 'var(--coral-400)' }}>your</span> postcode absorbing?</h2>
            <p className="map-lead">
              Migration is decided in Canberra — but it lands on your street. Enter your postcode for real ABS
              figures on migration intensity, population growth and rental stress — and how your area ranks against the nation.
            </p>
          </div>
          <div className="map-stage">
            {Tool ? <Tool registerApi={registerApi} onSign={onSign} /> : null}
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Manifesto demand ---------------- */
  function Demand() {
    return (
      <section className="section">
        <div className="container">
          <div className="manifesto">
            <Eyebrow>Our demand to Canberra</Eyebrow>
            <Star size={40} className="star" style={{ display: 'block', marginTop: 26 }} />
            <p className="demand-quote">
              We demand an <span className="r">immediate overhaul</span> of Australia's migration system.
              The current system is <span className="n">broken</span>, unsustainable and putting an unfair strain on Australians.
            </p>
            <Button variant="primary" size="lg" href="petition.html">Add your name</Button>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Donate ---------------- */
  function DonateBlock() {
    const tiers = [
      { amt: '$25', note: 'Reach 500 more voters' },
      { amt: '$50', note: 'Fund a day of digital ads', featured: true },
      { amt: '$100', note: 'Power our research desk' },
    ];
    const [sel, setSel] = useState(1);
    const [recurring, setRecurring] = useState(false);
    return (
      <section id="donate" className="section">
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
            <p style={{ fontSize: '13px', color: 'var(--ink-400)', margin: '14px 0 0', fontWeight: 600 }}>Secure payment via Stripe</p>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Page header (interior pages) ---------------- */
  function PageHead({ eyebrow, title, lead, dark }) {
    return (
      <section className={'page-head' + (dark ? ' page-head--dark' : '')}>
        <div className="container">
          <Eyebrow variant={dark ? 'light' : undefined}>{eyebrow}</Eyebrow>
          <h1>{title}</h1>
          {lead && <p className="lead-p">{lead}</p>}
        </div>
      </section>
    );
  }

  /* ---------------- Footer ---------------- */
  function Footer() {
    return (
      <React.Fragment>
        <div className="foot-cta">
          <div className="container foot-cta-inner">
            <h2>Australia's future is worth a signature.</h2>
            <Button variant="primary" size="lg" href="petition.html">Sign the petition</Button>
          </div>
        </div>
        <footer className="footer">
          <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="index.html"><img src={A + 'logo-full.png'} alt="Fair Migration" style={{ height: '52px' }} /></a>
            <nav style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', flexWrap: 'wrap' }}>
              <a href="problem.html">The problem</a>
              <a href="map.html">Impact map</a>
              <a href="petition.html">Sign</a>
              <a href="donate.html">Donate</a>
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

  window.FM = {
    A, GOAL, fmt, pct, clean4, safeGet, safeSet, markSigned, useLiveCount,
    Eyebrow, Star, SiteNav, Hero, SignatureBar, Problem, PetitionForm, PetitionSection,
    MapStage, Demand, DonateBlock, PageHead, Footer,
  };
})();
