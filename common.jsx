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
  const GOAL = 50000;          // near-term target
  const ULTIMATE_GOAL = 1000000; // the million-signature ambition

  const fmt = (n) => n.toLocaleString();
  const pct = (n) => Math.min(100, (n / GOAL) * 100);
  const clean4 = (s) => String(s || '').replace(/\D/g, '').slice(0, 4);

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function markSigned(data) {
    safeSet('fm_signed', '1');
    if (data && data.postcode) safeSet('fm_pc', clean4(data.postcode));
  }

  /* ---------- config (override per-site by setting window.FM_CONFIG before this script) ---------- */
  const CFG = Object.assign({
    origin: 'https://fairmigration.vote',
    petitionSlug: 'fair-migration',
    stripePaymentLink: '',     // paste the Stripe Payment Link URL to enable real donations
    // Placeholder shown for the split-second before the real count loads. The real
    // number (actual signatures + the SIGNATURE_BASE_OFFSET buffer set in Vercel)
    // comes from /api/signature-count; this only avoids a flash of an empty value.
    signatureFallback: 1800,
  }, window.FM_CONFIG || {});

  /* ---------- attribution capture (sessionStorage) + share-click beacon ---------- */
  const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'fbclid', 'gclid', 'ttclid', 'li_fat_id', 'msclkid', 'twclid', 'sccid',
    'ad_id', 'adset_id', 'campaign_id', 'placement', 'ref'];
  function getAttr() { try { return JSON.parse(sessionStorage.getItem('ff_attr') || '{}'); } catch (e) { return {}; } }
  function captureAttribution() {
    try {
      const url = new URL(window.location.href);
      const store = getAttr();
      let changed = false;
      ATTR_KEYS.forEach((k) => { const v = url.searchParams.get(k); if (v && !store[k]) { store[k] = v; changed = true; } });
      const fbp = (document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/) || [])[1];
      if (fbp && !store.fbp) { store.fbp = fbp; changed = true; }
      if (!store.landing_url) { store.landing_url = window.location.href; store.landing_referrer = document.referrer; store.landing_at = new Date().toISOString(); changed = true; }
      if (changed) sessionStorage.setItem('ff_attr', JSON.stringify(store));
      return store;
    } catch (e) { return {}; }
  }
  function shareClickBeacon() {
    const a = getAttr(); const ref = a.ref;
    if (!ref) return;
    const key = 'ff_ref_click_fired_' + ref;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) {}
    try {
      fetch('/api/share-click', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, source_url: window.location.href, fbclid: a.fbclid }), keepalive: true });
    } catch (e) {}
  }

  /* ---------- shared petition submit: POST to the first-party API, then UI ---------- */
  async function signPetition(data) {
    try { localStorage.setItem('ff_last_petition_url', window.location.href); } catch (e) {}
    const a = getAttr();
    const body = Object.assign({}, data, {
      fbclid: a.fbclid, fbp: a.fbp, ref: a.ref,
      utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign,
      utm_term: a.utm_term, utm_content: a.utm_content,
      content_name: document.title, source_url: window.location.href, landing_url: a.landing_url,
      campaign: CFG.petitionSlug,
    });
    let result = null;
    try {
      const r = await fetch('/api/petition-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) result = await r.json();
    } catch (e) {}
    if (result && result.success) {
      try {
        localStorage.setItem('ff_referral_code', result.referral_code);
        localStorage.setItem('ff_contact_id', result.contact_id);
        if (data.firstName) localStorage.setItem('ff_first_name', data.firstName);
        if (data.email) localStorage.setItem('ff_email', data.email);
      } catch (e) {}
      if (window.fbq) { try { window.fbq('track', 'Lead', { content_name: body.content_name }, { eventID: result.meta_event_id }); } catch (e) {} }
    }
    return result;
  }

  /* ---------- Stripe: tag a donate URL with the petition slug at click time ---------- */
  function appendClientRef(url, slug) {
    if (!url || !slug) return url;
    try { const u = new URL(url); u.searchParams.set('client_reference_id', String(slug)); return u.toString(); } catch (e) { return url; }
  }

  /* Real signature count: actual signatures + the SIGNATURE_BASE_OFFSET buffer,
     served by /api/signature-count. No artificial drift — the number only moves
     as real people sign. Seeds from a cached/last value to avoid a load flash,
     then refreshes periodically so it stays live. */
  function useLiveCount() {
    const cached = parseInt(safeGet('fm_sig_count') || '0', 10);
    const seed = (cached > 0 ? cached : CFG.signatureFallback) + (safeGet('fm_signed') === '1' ? 1 : 0);
    const [count, setCount] = useState(seed);
    useEffect(() => {
      let live = true;
      const load = () => fetch('/api/signature-count')
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (live && j && typeof j.count === 'number') { setCount(j.count); safeSet('fm_sig_count', String(j.count)); } })
        .catch(() => {});
      load();
      const id = setInterval(load, 30000); // re-read the real count; never fabricate
      return () => { live = false; clearInterval(id); };
    }, []);
    return [count, setCount];
  }

  /* ---------------- server-side Stripe checkout (falls back to Payment Link) ---------------- */
  async function donateCheckout({ amount, frequency }) {
    const a = getAttr();
    const uc = a.utm_content;
    const sms_variant = uc === 'ben' ? 'A' : uc === 'issue' ? 'B' : undefined;
    // Meta funnel: signal checkout intent (Purchase fires later, deduped on the Stripe session id)
    if (window.fbq) {
      try {
        window.fbq('track', 'InitiateCheckout', {
          value: Number(amount) || 0, currency: 'AUD', content_name: 'FairMigration',
          content_category: frequency === 'monthly' ? 'monthly' : 'oneoff',
        });
      } catch (e) {}
    }
    const body = {
      amount, frequency, email: safeGet('ff_email') || undefined,
      slug: CFG.petitionSlug, ref: a.ref || safeGet('ff_referral_code') || undefined,
      contact_id: safeGet('ff_contact_id') || undefined, sms_variant,
      utm_source: a.utm_source, utm_medium: a.utm_medium, utm_campaign: a.utm_campaign, utm_term: a.utm_term, utm_content: a.utm_content,
    };
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j && j.url) { window.location.href = j.url; return; }
    } catch (e) {}
    if (CFG.stripePaymentLink) { window.location.href = appendClientRef(CFG.stripePaymentLink, CFG.petitionSlug); }
    else { window.alert('Donations are being connected — please check back shortly.'); }
  }

  // fire an abandoned-form partial once per identity per page
  let _partialFired = false;
  function firePartial(form, data) {
    if (_partialFired) return; _partialFired = true;
    try {
      fetch('/api/partial', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ form }, data)), keepalive: true });
    } catch (e) {}
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

  /* line icons (Lucide-style, 2px stroke) for the problem cards */
  function SvgIcon({ name }) {
    const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const icons = {
      home: <g {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></g>,
      pulse: <g {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></g>,
      layers: <g {...p}><path d="M12 2 2 7l10 5 10-5-10-5z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></g>,
      access: <g {...p}><circle cx="16" cy="4" r="1" /><path d="m18 19 1-7-6 1" /><path d="m5 8 3-3 5.5 3-2.36 3.5" /><path d="M4.24 14.5a5 5 0 0 0 6.88 6" /><path d="M13.76 17.5a5 5 0 0 0-6.88-6" /></g>,
    };
    return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">{icons[name] || null}</svg>;
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
              <b>{fmt(count != null ? count : CFG.signatureFallback)}</b>&nbsp;Australians have signed ·{' '}
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
            {link('problem', 'problem.html', 'Our Migration Problem')}
            {link('map', 'map.html', "Your suburb's migration")}
            <a className="btn-sign" href="petition.html">Sign the petition ›</a>
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
            <div className="hero-text">
              <Eyebrow variant="light">A campaign for everyday Australians</Eyebrow>
              <h1 className="display">Australians don't have to live like this.</h1>
              <p className="hero-redline">Put Australians first.</p>
              <p className="hero-lead">
                Mass migration has reached a critical tipping point — and they're trying to hide what it's doing to everyday Australians.
                It's <span className="caps">your</span> rent, <span className="caps"> your</span> hospital queue and <span className="caps"> your</span> taxes paying the price.
              </p>
              <div className="hero-cta">
                <Button variant="primary" size="lg" href="petition.html">Sign the petition</Button>
                <Button variant="solid" size="lg" href="map.html">See your suburb →</Button>
              </div>
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
    return (
      <section className="sigbar" aria-label="Petition signature count">
        <div className="sigbar-goal">
          <div className="container container--wide">
            <div className="sigbar-goal-flag"><Star size={15} color="#fff" /> Our goal</div>
            <div className="sigbar-goal-num">1 million</div>
            <div className="sigbar-goal-word">signatures</div>
            <p className="sigbar-goal-sub">To <b>force Albanese to act</b> on the immigration crisis.</p>
          </div>
        </div>
        <div className="container container--wide sigbar-inner">
          <div className="sigbar-count">
            <Star size={44} className="sigbar-star" />
            <div>
              <div className="sigbar-num">{fmt(count)}</div>
              <div className="sigbar-label">have signed so far</div>
            </div>
          </div>
          <div className="sigbar-progress">
            <div className="sigbar-track">
              <div className="sigbar-fill" style={{ width: p + '%' }} />
              <span className="sigbar-bubble" style={{ left: p + '%' }}>{Math.round(p)}%</span>
            </div>
            <div className="sigbar-meta">
              <span><b>{fmt(remaining)}</b> more to our first milestone of {fmt(GOAL)}</span>
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
      { idx: '01', icon: 'home', img: 'problem-housing.jpg', stat: '+39%', h: 'Housing', p: 'Rents have surged at record pace while a generation is locked out of ever owning a home. Demand far outstrips what we can build.' },
      { idx: '02', icon: 'pulse', img: 'problem-healthcare.jpg', stat: 'Strained', h: 'Healthcare', p: 'Emergency departments overflow and bulk-billing is in freefall. Our hospitals were never resourced for intake at this scale.' },
      { idx: '03', icon: 'layers', img: 'problem-infrastructure.jpg', stat: 'Gridlock', h: 'Infrastructure', p: 'Roads, trains and schools are buckling. Public services are being asked to stretch across far more people than they were built for.' },
      { idx: '04', icon: 'access', img: 'problem-ndis.jpg', stat: 'Uncapped', h: 'Disability (NDIS)', p: 'Non-citizens are drawing on the NDIS — a scheme it was never costed for. A safety net built for Australians is being stretched to breaking point.' },
    ];
    return (
      <section id="problem" className="section">
        <div className="container container--wide">
          {!bare && (
            <div className="section-head">
              <Eyebrow>Our migration problem</Eyebrow>
              <h2 className="h2-display">They're trying to hide <span style={{ color: 'var(--red-500)' }}>the devastation mass migration is causing everyday Australians.</span></h2>
              <p className="lead-p">The damage is real — and they'd rather you didn't see it. Mass migration lands hardest on the things you rely on: <strong>housing, healthcare, infrastructure</strong>, and now <strong>disability support</strong>.</p>
            </div>
          )}
          <div className="pressures">
            {items.map((it) => (
              <div className="pressure" key={it.idx}>
                <div className="pressure-media">
                  <img src={A + it.img} alt={it.h} loading="lazy" />
                  <span className="pressure-ic"><SvgIcon name={it.icon} /></span>
                  <span className="pressure-idx">{it.idx}</span>
                </div>
                <div className="pressure-body">
                  <div className="pressure-stat">{it.stat}</div>
                  <div className="pressure-h">{it.h}</div>
                  <p className="pressure-p">{it.p}</p>
                </div>
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
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => {
      const v = e.target.value;
      setD((s) => ({ ...s, [k]: v }));
      if (err[k]) setErr((s) => ({ ...s, [k]: undefined }));
    };
    const submit = async (e) => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.lastName.trim()) n.lastName = 'Required';
      if (!d.email.trim()) n.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n);
      if (Object.keys(n).length) return;
      // POST to the first-party API (mapped to API field names); UI proceeds even if it fails.
      setBusy(true);
      let result = null;
      try {
        result = await signPetition({ first_name: d.firstName.trim(), last_name: d.lastName.trim(),
          email: d.email.trim(), mobile: d.mobile.trim(), postcode: d.postcode.trim(), firstName: d.firstName.trim() });
      } catch (e2) {}
      setBusy(false);
      if (onSign) onSign(d, result);
      try { window.dispatchEvent(new CustomEvent('petition-signed', { detail: { first: d.firstName.trim() } })); } catch (e2) {}
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
          onChange={set('email')} invalid={!!err.email} hint={err.email} autoComplete="email"
          onBlur={() => { if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) firePartial('petition', { email: d.email.trim(), first_name: d.firstName.trim(), last_name: d.lastName.trim(), mobile: d.mobile.trim(), postcode: d.postcode.trim() }); }} />
        <Input label="Mobile phone" type="tel" name="mobile" placeholder="0400 000 000" value={d.mobile}
          onChange={set('mobile')} autoComplete="tel" />
        <Input label="Postcode" name="postcode" placeholder="2000" value={d.postcode}
          onChange={set('postcode')} inputMode="numeric" maxLength={4} autoComplete="postal-code" />
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>{busy ? 'Signing…' : cta}</Button>
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
        <Button variant="primary" fullWidth href="share.html">Share with friends →</Button>
        <div style={{ height: '8px' }} />
        <Button variant="donate" fullWidth href="donate.html">Chip in to the campaign</Button>
      </Card>
    );
  }

  /* ---------------- Petition section (argument + goal + form) ---------------- */
  function CheckIcon() {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  const DEMANDS = [
    { h: 'An immediate reduction in the migration intake', p: 'Bring numbers back to a level our housing, hospitals and infrastructure can actually sustain.' },
    { h: 'A full review of a broken system', p: 'An honest, independent audit of a migration policy that has been left unchecked for years.' },
    { h: 'Australians first — always', p: 'A system run in the interests of the Australians who built this country and pay for its services.' },
  ];

  const WHY_POINTS = [
    { img: 'why-housing.jpg', h: "A roof over your family's head", p: 'Runaway demand has pushed home ownership out of reach and rents to record highs. Australians should be able to afford to live in their own country.' },
    { img: 'why-services.jpg', h: "The services you've paid for", p: "You've funded our hospitals, roads and schools your whole working life — they should serve you first, not buckle under numbers they were never built for." },
    { img: 'why-wages.jpg', h: 'Wages that keep up with life', p: 'An endless supply of cheap overseas labour holds down the pay of working Australians. Fair migration means a fair go at work.' },
    { img: 'why-voice.jpg', h: "A say in your country's future", p: 'Australians were never asked whether they wanted record migration. It is time our leaders listened to the people they serve.' },
  ];

  function PetitionSection({ count, signed, pc, onSign }) {
    return (
      <section id="petition" className="section section--tint">
        <div className="container">
          <div className="section-head" style={{ margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><Eyebrow variant="navy">Add your name</Eyebrow></div>
            <h2 className="h2-display">Sign the petition</h2>
          </div>
          <div className="petition-grid">
            <div className="petition-copy">
              <blockquote className="petition-quote">
                <div className="petition-quote-head">
                  <span className="pq-star"><Star size={17} color="#fff" /></span>
                  <span className="pq-label">Our petition to Canberra</span>
                </div>
                <p className="petition-quote-lead">We call for an immediate overhaul of Australia's migration policies:</p>
                <ol className="demand-list">
                  {DEMANDS.map((d, i) => (
                    <li className="demand-item" key={i}>
                      <span className="demand-num">{i + 1}</span>
                      <div className="demand-body"><h4>{d.h}</h4><p>{d.p}</p></div>
                    </li>
                  ))}
                </ol>
              </blockquote>
              <div className="why-fair">
                <h3 className="why-fair-title">Why Australians deserve fair migration</h3>
                <p className="why-fair-intro">This isn't about shutting the door — it's about ensuring a fair go for everyday Australians.</p>
                <ul className="why-list">
                  {WHY_POINTS.map((w, i) => (
                    <li className="why-item" key={i}>
                      <div className="why-thumb"><img src={A + w.img} alt="" loading="lazy" /><span className="why-ic"><CheckIcon /></span></div>
                      <div className="why-text"><h4>{w.h}</h4><p>{w.p}</p></div>
                    </li>
                  ))}
                </ul>
              </div>
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

  /* ---------------- Donate: split layout + amount grid ---------------- */
  const DONATE_AMOUNTS = [35, 65, 135, 265, 550, 1500];
  function suggestedMonthly(oneoff) { return Math.max(5, Math.round((oneoff * 0.2) / 5) * 5); }

  function DonateBlock() {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const upsell = params.get('upsell') || params.get('cs');
    if (upsell) return <MonthlyUpsell sessionId={upsell} />;

    const [freq, setFreq] = useState('oneoff');
    const [sel, setSel] = useState(65);
    const [other, setOther] = useState(false);
    const [custom, setCustom] = useState('');
    const [busy, setBusy] = useState(false);
    const go = (amount) => { if (amount >= 2 && !busy) { setBusy(true); donateCheckout({ amount, frequency: freq }); } };

    return (
      <section id="donate" className="donate-hero">
        <div className="container container--wide donate-grid">
          <div className="donate-msg">
            <Eyebrow variant="light">Donate</Eyebrow>
            <h1 className="donate-head">They spend <span className="donate-billions">billions</span> selling the immigration crisis. Only you can help beat it.</h1>
            <p className="donate-copy">
              Fair Migration is funded by Australians — not corporations, not the big party machines. Every dollar
              puts the truth about immigration in front of more voters: ads, research, and organising on the ground.
            </p>
            <ul className="donate-impact">
              <li><span className="donate-impact-amt">$35</span><span>puts our message in front of <b>50 Australians</b>.</span></li>
              <li><span className="donate-impact-amt">$65</span><span>gets <b>50 Australians</b> mail they can't ignore.</span></li>
              <li><span className="donate-impact-amt">$135</span><span>reaches <b>500 Australians</b> who have no idea what's happening.</span></li>
              <li><span className="donate-impact-amt">$265</span><span>connects with a <b>whole block of voters</b>.</span></li>
              <li><span className="donate-impact-amt">$550</span><span>puts a <b>newspaper ad</b> in front of critical communities.</span></li>
              <li><span className="donate-impact-amt">$1,500</span><span>reaches <b>5,000 Australians</b> with the truth about immigration.</span></li>
            </ul>
            <p className="donate-trust">Stripe-secured · All amounts in AUD · Not tax-deductible</p>
          </div>

          <div className="donate-card">
            <div className="donate-toggle" role="tablist">
              <button role="tab" aria-selected={freq === 'oneoff'} className={freq === 'oneoff' ? 'is-on' : ''} onClick={() => setFreq('oneoff')}>One-off</button>
              <button role="tab" aria-selected={freq === 'monthly'} className={freq === 'monthly' ? 'is-on' : ''} onClick={() => setFreq('monthly')}>Monthly</button>
            </div>
            <div className="donate-amts">
              {DONATE_AMOUNTS.map((a) => (
                <button key={a} className={'donate-amt' + (!other && sel === a ? ' is-on' : '')} disabled={busy}
                  onClick={() => { setOther(false); setSel(a); go(a); }}>${a}{freq === 'monthly' ? <span className="donate-per">/mo</span> : null}</button>
              ))}
              <button className={'donate-amt donate-amt--other' + (other ? ' is-on' : '')} onClick={() => setOther(true)}>Other</button>
            </div>
            {other && (
              <div className="donate-custom">
                <span className="donate-custom-sign">$</span>
                <input type="number" min="2" inputMode="numeric" placeholder="Amount" value={custom}
                  onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') go(Number(custom)); }} />
                <Button variant="donate" onClick={() => go(Number(custom))} disabled={busy}>Give{freq === 'monthly' ? ' monthly' : ''} →</Button>
              </div>
            )}
            <p className="donate-cardnote">{busy ? 'Taking you to secure checkout…' : 'Stripe-secured · All amounts in AUD · Not tax-deductible.'}</p>
          </div>
        </div>
      </section>
    );
  }

  /* ---------------- Post-donation monthly upsell ---------------- */
  function MonthlyUpsell({ sessionId }) {
    const [amt, setAmt] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
      let live = true;
      fetch('/api/checkout?session_id=' + encodeURIComponent(sessionId)).then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (live && j && j.session) setAmt(Math.round((j.session.amount_total || 0) / 100)); }).catch(() => {});
      return () => { live = false; };
    }, []);
    const monthly = amt ? suggestedMonthly(amt) : 10;
    const upgrade = () => { if (busy) return; setBusy(true); donateCheckout({ amount: monthly, frequency: 'monthly' }); };
    return (
      <section className="upsell">
        <div className="container" style={{ maxWidth: '720px' }}>
          <p className="upsell-thanks">Thank you{amt ? ' — $' + amt + ' received' : ''}. Your receipt is on its way.</p>
          <h1 className="upsell-head">{amt ? '$' + amt + ' helps today.' : 'Thank you.'} <span className="upsell-red">${monthly} a month keeps the pressure on.</span></h1>
          <p className="upsell-sub">One-off gifts keep the lights on. Monthly backing changes what we can do:</p>
          <ul className="upsell-list">
            <li><b>We can plan ahead.</b> Ads, research and polling are booked months out — steady funding lets us commit before the Government moves.</li>
            <li><b>They can't wait us out.</b> A predictable, reliable base is the one thing a delay-and-outlast strategy can't beat.</li>
            <li><b>Small monthly beats big once.</b> A year of ${monthly}/month puts more pressure on Canberra than most one-off gifts — without you feeling it.</li>
          </ul>
          <Button variant="donate" size="lg" fullWidth onClick={upgrade} disabled={busy}>{busy ? 'One moment…' : 'Make it $' + monthly + '/month'}</Button>
          <p className="upsell-fine">Cancel anytime with one email. Receipted monthly.</p>
          <a className="upsell-skip" href="share.html">No thanks — I'll share the petition with my mates instead →</a>
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

  /* ---------------- Social-proof activity popup ----------------
     Live "someone just signed / donated" toast. Real events (petition-signed /
     donation-completed CustomEvents) take priority; a curated sample pool keeps
     it alive on quiet pages. Renders nothing on /donate and /share. */
  const SP_NAMES = ['Sarah', 'Mason', 'Emma', 'Michael', 'Olivia', 'Liam', 'Chloe', 'Noah', 'Ava', 'Jack',
    'Mia', 'William', 'Grace', 'Thomas', 'Ruby', 'Ethan', 'Sophie', 'Lucas', 'Charlotte', 'Henry',
    'Isla', 'Oliver', 'Amelia', 'Harry', 'Zoe', 'Daniel', 'Hannah', 'Lachlan', 'Ella', 'Cooper'];
  const SP_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
  const SP_AMOUNTS = [50, 75, 100, 150, 200];
  const spRand = (a) => a[Math.floor(Math.random() * a.length)];

  function SocialProofPopup() {
    const [item, setItem] = useState(null);
    const [phase, setPhase] = useState('out');
    const timers = useRef({});
    const suppressed = typeof window !== 'undefined' && /^\/(donate|share)(\/|$|\.)/.test(window.location.pathname);

    useEffect(() => {
      if (suppressed) return undefined;
      const t = timers.current;
      const hide = () => { setPhase('out'); t.unmount = setTimeout(() => setItem(null), 360); };
      const show = (next) => { clearTimeout(t.hide); clearTimeout(t.unmount); setItem(next); setPhase('in'); t.hide = setTimeout(hide, 9000); };
      const idle = () => {
        if (Math.random() >= 0.75) return show({ kind: 'donation', name: spRand(SP_NAMES), state: spRand(SP_STATES), amount: spRand(SP_AMOUNTS), href: 'donate.html' });
        return show({ kind: 'petition', name: spRand(SP_NAMES), state: spRand(SP_STATES), href: 'petition.html' });
      };
      const onSigned = (e) => show({ kind: 'petition', name: (e.detail && e.detail.first) || spRand(SP_NAMES), state: spRand(SP_STATES), href: 'petition.html' });
      const onDonated = (e) => { const a = e.detail && e.detail.amount; if (a == null || a >= 50) show({ kind: 'donation', name: (e.detail && e.detail.first) || spRand(SP_NAMES), state: spRand(SP_STATES), amount: a || spRand(SP_AMOUNTS), href: 'donate.html' }); };
      window.addEventListener('petition-signed', onSigned);
      window.addEventListener('donation-completed', onDonated);
      t.first = setTimeout(() => { if (!document.hidden) idle(); }, 8000);
      t.iv = setInterval(() => { if (!document.hidden) idle(); }, 60000);
      // expose so the /share purchase handler could fire one elsewhere if wanted
      return () => {
        window.removeEventListener('petition-signed', onSigned);
        window.removeEventListener('donation-completed', onDonated);
        Object.values(t).forEach((x) => { clearTimeout(x); clearInterval(x); });
      };
    }, [suppressed]);

    if (suppressed || !item) return null;
    const isPet = item.kind === 'petition';
    const text = isPet
      ? `${item.name} from ${item.state} just signed the petition.`
      : `${item.name} from ${item.state} just donated $${item.amount} to Fair Migration.`;
    const cta = isPet ? 'Add your name today' : 'Chip in today';
    const dismiss = (e) => { e.preventDefault(); e.stopPropagation(); setPhase('out'); timers.current.unmount = setTimeout(() => setItem(null), 360); };
    return (
      <a className={'ff-sp ff-sp--' + item.kind + ' ff-sp--' + phase} href={item.href} aria-label={text}>
        <span className="ff-sp-icon" aria-hidden="true">{isPet ? <Star size={16} color="#fff" /> : '♥'}</span>
        <span className="ff-sp-body">
          <span className="ff-sp-text">{text}</span>
          <span className="ff-sp-cta">{cta} →</span>
        </span>
        <button className="ff-sp-close" aria-label="Dismiss" onClick={dismiss}>×</button>
      </a>
    );
  }

  /* ---------------- Footer ---------------- */
  function Footer() {
    return (
      <React.Fragment>
        <SocialProofPopup />
        <div className="foot-cta">
          <div className="container foot-cta-inner">
            <h2>Australia's future is on the line.</h2>
            <Button variant="primary" size="lg" href="petition.html">Sign today ›</Button>
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
              <a href="about.html">About</a>
              <a href="contact.html">Contact</a>
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
    A, GOAL, CFG, fmt, pct, clean4, safeGet, safeSet, markSigned, useLiveCount,
    getAttr, captureAttribution, signPetition, appendClientRef,
    Eyebrow, Star, SiteNav, Hero, SignatureBar, Problem, PetitionForm, PetitionSection,
    MapStage, Demand, DonateBlock, PageHead, Footer,
  };

  // Run once per page load (browser only): persist attribution + fire the ?ref= beacon.
  if (typeof window !== 'undefined' && window.document) {
    captureAttribution();
    shareClickBeacon();
  }
})();
