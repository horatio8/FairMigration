/* Fair Migration — /share thank-you + referral page.
   Three states: polling (post-donation), ask_identity (unknown), ready (share). */

(function () {
  const { useState, useEffect, useRef } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { SiteNav, Footer, PageHead, Star, useLiveCount, CFG, safeGet } = F;
  const { Input, Button } = DS;
  const API = CFG.apiBase || '';

  const PLATFORMS = [
    { id: 'facebook', label: 'Share on Facebook', bg: '#1877F2' },
    { id: 'x', label: 'Post on X', bg: '#000000' },
    { id: 'linkedin', label: 'Share on LinkedIn', bg: '#0A66C2' },
    { id: 'whatsapp', label: 'Send on WhatsApp', bg: '#25D366' },
    { id: 'email', label: 'Share by email', bg: '#C9A227' },
    { id: 'copy', label: 'Copy link', bg: '#4B5563' },
  ];

  function shareUrlFor(code) { return CFG.origin + (CFG.sharePath || '/petition') + '?ref=' + encodeURIComponent(code); }
  function shareText(count) {
    return 'I just signed the Fair Migration petition — ' + (count || 'thousands of') +
      ' Australians are demanding our government put Australians first. Add your name:';
  }
  function getShared() { try { return JSON.parse(localStorage.getItem('ff_shared_platforms') || '[]'); } catch (e) { return []; } }

  // browser Purchase — same event_id the Stripe webhook used (stripe_<session_id>) so Meta dedups
  function firePixelPurchase(sessionId) {
    if (!window.fbq || !sessionId) return;
    const key = 'ff_pixel_purchase_' + sessionId;
    try { if (sessionStorage.getItem(key)) return; } catch (e) {}
    fetch(API + '/api/checkout?session_id=' + encodeURIComponent(sessionId)).then((r) => (r.ok ? r.json() : null)).then((j) => {
      const s = j && j.session;
      if (!s || !s.paid) return;
      try { sessionStorage.setItem(key, '1'); } catch (e) {}
      try { window.fbq('track', 'Purchase', { value: (s.amount_total || 0) / 100, currency: (s.currency || 'aud').toUpperCase() }, { eventID: 'stripe_' + sessionId }); } catch (e) {}
    }).catch(() => {});
  }

  function ShareButtons({ code, count }) {
    const url = shareUrlFor(code);
    const text = shareText(count);
    const [used, setUsed] = useState(getShared());
    const [copied, setCopied] = useState(false);

    function record(platform) {
      try {
        fetch(API + '/api/share-issued', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referral_code: code, platform, share_url: url }), keepalive: true });
      } catch (e) {}
      const next = Array.from(new Set(used.concat(platform)));
      setUsed(next);
      try { localStorage.setItem('ff_shared_platforms', JSON.stringify(next)); } catch (e) {}
    }
    function open(platform) {
      record(platform);
      const u = encodeURIComponent(url), t = encodeURIComponent(text);
      let href = '';
      if (platform === 'facebook') href = 'https://www.facebook.com/sharer/sharer.php?u=' + u;
      else if (platform === 'x') href = 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t;
      else if (platform === 'linkedin') href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + u;
      else if (platform === 'whatsapp') href = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url);
      else if (platform === 'email') href = 'mailto:?subject=' + encodeURIComponent('Sign the Fair Migration petition') + '&body=' + encodeURIComponent(text + '\n\n' + url);
      if (platform === 'copy') {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => { window.prompt('Copy your link:', url); });
        return;
      }
      window.open(href, '_blank', 'noopener');
    }

    return (
      <div className="share-btns">
        {PLATFORMS.map((p) => (
          <button key={p.id} className={'share-btn' + (used.includes(p.id) ? ' is-used' : '')} style={{ background: p.bg }} onClick={() => open(p.id)}>
            <span>{p.id === 'copy' && copied ? 'Copied!' : p.label}</span>
            {used.includes(p.id) && <span className="share-tick">✓</span>}
          </button>
        ))}
      </div>
    );
  }

  function AskIdentity({ onReady, initial }) {
    const [d, setD] = useState(Object.assign({ firstName: '', lastName: '', email: '', mobile: '', postcode: '' }, initial || {}));
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => { const v = e.target.value; setD((s) => ({ ...s, [k]: v })); if (err[k]) setErr((s) => ({ ...s, [k]: undefined })); };
    const submit = async (e) => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.lastName.trim()) n.lastName = 'Required';
      if (!d.email.trim()) n.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n); if (Object.keys(n).length) return;
      setBusy(true);
      try {
        const r = await fetch(API + '/api/share-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: d.firstName.trim(), last_name: d.lastName.trim(), email: d.email.trim(), mobile: d.mobile.trim(), postcode: d.postcode.trim() }) });
        const j = await r.json();
        if (j && j.success) { try { localStorage.setItem('ff_referral_code', j.referral_code); localStorage.setItem('ff_first_name', j.first_name || d.firstName); localStorage.removeItem('ff_pending_signup'); } catch (e2) {} onReady({ referral_code: j.referral_code, first_name: j.first_name || d.firstName }); return; }
      } catch (e3) {}
      setBusy(false); setErr({ email: 'Something went wrong — please try again' });
    };
    return (
      <form className="pform" onSubmit={submit} noValidate style={{ maxWidth: '460px' }}>
        <div className="pform-grid2">
          <Input label="First name *" name="firstName" placeholder="Jane" value={d.firstName} onChange={set('firstName')} invalid={!!err.firstName} hint={err.firstName} />
          <Input label="Last name *" name="lastName" placeholder="Citizen" value={d.lastName} onChange={set('lastName')} invalid={!!err.lastName} hint={err.lastName} />
        </div>
        <Input label="Email *" type="email" name="email" placeholder="jane@example.com" value={d.email} onChange={set('email')} invalid={!!err.email} hint={err.email} />
        <Input label="Mobile phone" type="tel" name="mobile" placeholder="0400 000 000" value={d.mobile} onChange={set('mobile')} />
        <Input label="Postcode" name="postcode" placeholder="2000" value={d.postcode} onChange={set('postcode')} inputMode="numeric" maxLength={4} />
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>{busy ? 'One moment…' : 'Get my share link'}</Button>
      </form>
    );
  }

  function ShareApp() {
    const [count] = useLiveCount();
    const [state, setState] = useState('loading');
    const [ctx, setCtx] = useState(null); // { referral_code, first_name }
    const [prefill, setPrefill] = useState(null);
    const pollRef = useRef(0);

    function ready(c) {
      setCtx(c);
      setState('ready');
      // Persist so a refresh or a later visit still knows them.
      try {
        if (c && c.referral_code) localStorage.setItem('ff_referral_code', c.referral_code);
        if (c && c.first_name) localStorage.setItem('ff_first_name', c.first_name);
        localStorage.removeItem('ff_pending_signup');
      } catch (e) {}
    }

    /* Someone who just signed but whose sign-up call failed (offline blip, CORS,
       a throttled backend) arrives here with their details stashed rather than a
       code. Mint the code for them instead of making them fill in a form again. */
    function recoverPending(pending) {
      setState('polling');
      fetch(API + '/api/share-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: pending.first_name, last_name: pending.last_name,
          email: pending.email, mobile: pending.mobile, postcode: pending.postcode }) })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => { if (j && j.success && j.referral_code) ready({ referral_code: j.referral_code, first_name: j.first_name || pending.first_name }); else return Promise.reject(); })
        .catch(() => {
          // Last resort: show the form already filled in, so it is one click.
          setPrefill({ firstName: pending.first_name || '', lastName: pending.last_name || '',
            email: pending.email || '', mobile: pending.mobile || '', postcode: pending.postcode || '' });
          setState('ask');
        });
    }

    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const emailParam = params.get('email');
      // ?c= is the code the sign form just handed us — trusted ahead of storage,
      // which can be empty on a cross-origin microsite or in private browsing.
      const urlCode = params.get('c');
      const localCode = safeGet('ff_referral_code');
      let pending = null;
      try {
        pending = JSON.parse(safeGet('ff_pending_signup') || 'null');
        // A day-old record is not this visitor — don't hand them someone else's link.
        if (pending && (!pending.at || Date.now() - pending.at > 24 * 60 * 60 * 1000)) {
          pending = null; localStorage.removeItem('ff_pending_signup');
        }
      } catch (e) {}

      if (sessionId) {
        firePixelPurchase(sessionId);
        setState('polling');
        const tick = () => {
          pollRef.current += 1;
          fetch(API + '/api/share-context?session_id=' + encodeURIComponent(sessionId))
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((j) => ready({ referral_code: j.referral_code, first_name: j.first_name }))
            .catch(() => { if (pollRef.current >= 15) setState('ask'); else setTimeout(tick, 2000); });
        };
        tick();
        return;
      }
      if (urlCode) { ready({ referral_code: urlCode, first_name: safeGet('ff_first_name') || '' }); return; }
      if (localCode) { ready({ referral_code: localCode, first_name: safeGet('ff_first_name') || '' }); return; }
      if (pending && pending.email && pending.first_name && pending.last_name) { recoverPending(pending); return; }
      if (emailParam) {
        fetch(API + '/api/share-context?email=' + encodeURIComponent(emailParam))
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((j) => ready({ referral_code: j.referral_code, first_name: j.first_name }))
          .catch(() => setState('ask'));
        return;
      }
      setState('ask');
    }, []);

    const first = ctx && ctx.first_name ? ctx.first_name : 'friend';

    return (
      <div>
        <SiteNav active="share" count={count} minimal={CFG.minimalChrome} />
        <PageHead eyebrow="Thank you" title={state === 'ready' ? ('Thank you, ' + first + '.') : 'Thank you for standing up.'}
          lead="Every share brings more Australians to the cause. Send your link — the petition you signed becomes their landing page." />
        <section className="section">
          <div className="container" style={{ maxWidth: '620px' }}>
            {state === 'loading' && <p className="body-p">Loading…</p>}
            {state === 'polling' && (
              <div>
                <p className="lead-p" style={{ marginTop: 0 }}>Setting up your share link…</p>
                <p className="body-p">This takes a few seconds. Your link will appear automatically — no need to do anything.</p>
                <div className="share-spinner" />
              </div>
            )}
            {state === 'ask' && (
              <div>
                <p className="body-p" style={{ marginTop: 0 }}>
                  {prefill
                    ? "We couldn't reach the server just now. Check your details and hit the button — your signature is safe, this only generates your share link."
                    : "Pop your details in and we'll generate your personal share link — every person who signs through it is credited to you."}
                </p>
                <AskIdentity onReady={ready} initial={prefill} />
              </div>
            )}
            {state === 'ready' && ctx && ctx.referral_code && (
              <div>
                <p className="body-p" style={{ marginTop: 0 }}>Share your personal link. Sign-throughs and donations from people you bring in are tracked back to you.</p>
                <div className="share-link"><code>{shareUrlFor(ctx.referral_code)}</code></div>
                <ShareButtons code={ctx.referral_code} count={count.toLocaleString()} />
              </div>
            )}
          </div>
        </section>
        <Footer minimal={CFG.minimalChrome} />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<ShareApp />);
})();
