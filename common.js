/* =====================================================================
   Fair Migration — shared module (window.FM)
   Header (with pink Sign button), footer, signature bar, the petition
   form (first/last/email/mobile/postcode) and content sections, all
   reused across the multi-page site.
   ===================================================================== */

(function () {
  const {
    useState,
    useEffect,
    useRef
  } = React;
  const DS = window.FairMigrationDesignSystem_e28435;
  const {
    Button,
    Card,
    Badge,
    Input
  } = DS;
  const A = 'assets/';
  const GOAL = 50000; // near-term target
  const ULTIMATE_GOAL = 1000000; // the million-signature ambition

  const fmt = n => n.toLocaleString();
  const pct = n => Math.min(100, n / GOAL * 100);
  const clean4 = s => String(s || '').replace(/\D/g, '').slice(0, 4);
  function safeGet(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function safeSet(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  }
  function markSigned(data) {
    safeSet('fm_signed', '1');
    if (data && data.postcode) safeSet('fm_pc', clean4(data.postcode));
  }

  /* ---------- config (override per-site by setting window.FM_CONFIG before this script) ---------- */
  const CFG = Object.assign({
    origin: 'https://fairmigration.vote',
    petitionSlug: 'fair-migration',
    stripePaymentLink: '',
    // paste the Stripe Payment Link URL to enable real donations
    // Placeholder shown for the split-second before the real count loads. The real
    // number (actual signatures + the SIGNATURE_BASE_OFFSET buffer set in Vercel)
    // comes from /api/signature-count; this only avoids a flash of an empty value.
    signatureFallback: 1800
  }, window.FM_CONFIG || {});

  /* ---------- attribution capture (sessionStorage) + share-click beacon ---------- */
  const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid', 'li_fat_id', 'msclkid', 'twclid', 'sccid', 'ad_id', 'adset_id', 'campaign_id', 'placement', 'ref'];
  function getAttr() {
    try {
      return JSON.parse(sessionStorage.getItem('ff_attr') || '{}');
    } catch (e) {
      return {};
    }
  }
  function captureAttribution() {
    try {
      const url = new URL(window.location.href);
      const store = getAttr();
      let changed = false;
      ATTR_KEYS.forEach(k => {
        const v = url.searchParams.get(k);
        if (v && !store[k]) {
          store[k] = v;
          changed = true;
        }
      });
      const fbp = (document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/) || [])[1];
      if (fbp && !store.fbp) {
        store.fbp = fbp;
        changed = true;
      }
      if (!store.landing_url) {
        store.landing_url = window.location.href;
        store.landing_referrer = document.referrer;
        store.landing_at = new Date().toISOString();
        changed = true;
      }
      if (changed) sessionStorage.setItem('ff_attr', JSON.stringify(store));
      return store;
    } catch (e) {
      return {};
    }
  }
  function shareClickBeacon() {
    const a = getAttr();
    const ref = a.ref;
    if (!ref) return;
    const key = 'ff_ref_click_fired_' + ref;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    try {
      fetch('/api/share-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref,
          source_url: window.location.href,
          fbclid: a.fbclid
        }),
        keepalive: true
      });
    } catch (e) {}
  }

  /* ---------- shared petition submit: POST to the first-party API, then UI ---------- */
  async function signPetition(data) {
    try {
      localStorage.setItem('ff_last_petition_url', window.location.href);
    } catch (e) {}
    const a = getAttr();
    const body = Object.assign({}, data, {
      fbclid: a.fbclid,
      fbp: a.fbp,
      ref: a.ref,
      utm_source: a.utm_source,
      utm_medium: a.utm_medium,
      utm_campaign: a.utm_campaign,
      utm_term: a.utm_term,
      utm_content: a.utm_content,
      content_name: document.title,
      source_url: window.location.href,
      landing_url: a.landing_url,
      campaign: CFG.petitionSlug
    });
    let result = null;
    try {
      const r = await fetch('/api/petition-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (r.ok) result = await r.json();
    } catch (e) {}
    if (result && result.success) {
      try {
        localStorage.setItem('ff_referral_code', result.referral_code);
        localStorage.setItem('ff_contact_id', result.contact_id);
        if (data.firstName) localStorage.setItem('ff_first_name', data.firstName);
        if (data.email) localStorage.setItem('ff_email', data.email);
      } catch (e) {}
      if (window.fbq) {
        try {
          window.fbq('track', 'Lead', {
            content_name: body.content_name
          }, {
            eventID: result.meta_event_id
          });
        } catch (e) {}
      }
    }
    return result;
  }

  /* ---------- Stripe: tag a donate URL with the petition slug at click time ---------- */
  function appendClientRef(url, slug) {
    if (!url || !slug) return url;
    try {
      const u = new URL(url);
      u.searchParams.set('client_reference_id', String(slug));
      return u.toString();
    } catch (e) {
      return url;
    }
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
      const load = () => fetch('/api/signature-count').then(r => r.ok ? r.json() : null).then(j => {
        if (live && j && typeof j.count === 'number') {
          setCount(j.count);
          safeSet('fm_sig_count', String(j.count));
        }
      }).catch(() => {});
      load();
      const id = setInterval(load, 30000); // re-read the real count; never fabricate
      return () => {
        live = false;
        clearInterval(id);
      };
    }, []);
    return [count, setCount];
  }

  /* ---------------- server-side Stripe checkout (falls back to Payment Link) ---------------- */
  async function donateCheckout({
    amount,
    frequency
  }) {
    const a = getAttr();
    const uc = a.utm_content;
    const sms_variant = uc === 'ben' ? 'A' : uc === 'issue' ? 'B' : undefined;
    // Meta funnel: signal checkout intent (Purchase fires later, deduped on the Stripe session id)
    if (window.fbq) {
      try {
        window.fbq('track', 'InitiateCheckout', {
          value: Number(amount) || 0,
          currency: 'AUD',
          content_name: 'FairMigration',
          content_category: frequency === 'monthly' ? 'monthly' : 'oneoff'
        });
      } catch (e) {}
    }
    const body = {
      amount,
      frequency,
      email: safeGet('ff_email') || undefined,
      slug: CFG.petitionSlug,
      ref: a.ref || safeGet('ff_referral_code') || undefined,
      contact_id: safeGet('ff_contact_id') || undefined,
      sms_variant,
      utm_source: a.utm_source,
      utm_medium: a.utm_medium,
      utm_campaign: a.utm_campaign,
      utm_term: a.utm_term,
      utm_content: a.utm_content
    };
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const j = await r.json();
      if (j && j.url) {
        window.location.href = j.url;
        return;
      }
    } catch (e) {}
    if (CFG.stripePaymentLink) {
      window.location.href = appendClientRef(CFG.stripePaymentLink, CFG.petitionSlug);
    } else {
      window.alert('Donations are being connected — please check back shortly.');
    }
  }

  // fire an abandoned-form partial once per identity per page
  let _partialFired = false;
  function firePartial(form, data) {
    if (_partialFired) return;
    _partialFired = true;
    try {
      fetch('/api/partial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({
          form
        }, data)),
        keepalive: true
      });
    } catch (e) {}
  }
  function Eyebrow({
    children,
    variant
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: 'eyebrow' + (variant ? ' eyebrow--' + variant : '')
    }, children);
  }

  /* 7-point Commonwealth star — the brand's recurring graphic device */
  function Star({
    size = 42,
    color = 'var(--navy-700)',
    className,
    style
  }) {
    const cx = 50,
      cy = 50,
      R = 49,
      r = 21,
      N = 7,
      pts = [];
    for (let i = 0; i < N * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = Math.PI / N * i - Math.PI / 2;
      pts.push((cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2));
    }
    return /*#__PURE__*/React.createElement("svg", {
      className: className,
      style: style,
      width: size,
      height: size,
      viewBox: "0 0 100 100",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("polygon", {
      points: pts.join(' '),
      fill: color
    }));
  }

  /* line icons (Lucide-style, 2px stroke) for the problem cards */
  function SvgIcon({
    name
  }) {
    const p = {
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    };
    const icons = {
      home: /*#__PURE__*/React.createElement("g", p, /*#__PURE__*/React.createElement("path", {
        d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M9 22V12h6v10"
      })),
      pulse: /*#__PURE__*/React.createElement("g", p, /*#__PURE__*/React.createElement("path", {
        d: "M22 12h-4l-3 9L9 3l-3 9H2"
      })),
      layers: /*#__PURE__*/React.createElement("g", p, /*#__PURE__*/React.createElement("path", {
        d: "M12 2 2 7l10 5 10-5-10-5z"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m2 17 10 5 10-5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m2 12 10 5 10-5"
      })),
      access: /*#__PURE__*/React.createElement("g", p, /*#__PURE__*/React.createElement("circle", {
        cx: "16",
        cy: "4",
        r: "1"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m18 19 1-7-6 1"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m5 8 3-3 5.5 3-2.36 3.5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M4.24 14.5a5 5 0 0 0 6.88 6"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M13.76 17.5a5 5 0 0 0-6.88-6"
      }))
    };
    return /*#__PURE__*/React.createElement("svg", {
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      "aria-hidden": "true"
    }, icons[name] || null);
  }

  /* ---------------- sticky top: utility bar + custom header ---------------- */
  function SiteNav({
    active,
    count
  }) {
    const [open, setOpen] = useState(false);
    const link = (key, href, label) => /*#__PURE__*/React.createElement("a", {
      className: 'navlink' + (active === key ? ' is-active' : ''),
      href: href,
      onClick: () => setOpen(false)
    }, label);
    return /*#__PURE__*/React.createElement("div", {
      className: "site-top"
    }, /*#__PURE__*/React.createElement("div", {
      className: "util-bar"
    }, /*#__PURE__*/React.createElement("div", {
      className: "util-inner"
    }, /*#__PURE__*/React.createElement("span", {
      className: "util-count"
    }, /*#__PURE__*/React.createElement("b", null, fmt(count != null ? count : CFG.signatureFallback)), "\xA0Australians have signed ·", ' ', /*#__PURE__*/React.createElement("a", {
      href: "petition.html"
    }, "Add your name")))), /*#__PURE__*/React.createElement("header", {
      className: "site-nav"
    }, /*#__PURE__*/React.createElement("a", {
      className: "site-nav-brand",
      href: "index.html"
    }, /*#__PURE__*/React.createElement("img", {
      src: A + 'logo-full.png',
      alt: "Fair Migration"
    })), /*#__PURE__*/React.createElement("button", {
      className: "site-nav-burger",
      "aria-label": "Toggle menu",
      "aria-expanded": open,
      onClick: () => setOpen(o => !o)
    }, /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.2",
      strokeLinecap: "round"
    }, open ? /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
      x1: "5",
      y1: "5",
      x2: "19",
      y2: "19"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "19",
      y1: "5",
      x2: "5",
      y2: "19"
    })) : /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
      x1: "3",
      y1: "7",
      x2: "21",
      y2: "7"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "3",
      y1: "12",
      x2: "21",
      y2: "12"
    }), /*#__PURE__*/React.createElement("line", {
      x1: "3",
      y1: "17",
      x2: "21",
      y2: "17"
    })))), /*#__PURE__*/React.createElement("nav", {
      className: 'site-nav-links' + (open ? ' is-open' : '')
    }, link('problem', 'problem.html', 'Our Migration Problem'), link('map', 'map.html', "Your suburb's migration"), /*#__PURE__*/React.createElement("a", {
      className: "btn-sign",
      href: "petition.html"
    }, "Sign the petition ›"), /*#__PURE__*/React.createElement(Button, {
      variant: "donate",
      size: "sm",
      href: "donate.html"
    }, "Donate"))));
  }

  /* ---------------- Hero ---------------- */
  function Hero({
    count
  }) {
    return /*#__PURE__*/React.createElement("section", {
      className: "hero"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hero-left"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hero-inner"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hero-text"
    }, /*#__PURE__*/React.createElement(Eyebrow, {
      variant: "light"
    }, "A campaign for everyday Australians"), /*#__PURE__*/React.createElement("h1", {
      className: "display"
    }, "Australians don't have to live like this."), /*#__PURE__*/React.createElement("p", {
      className: "hero-redline"
    }, "Put Australians first."), /*#__PURE__*/React.createElement("p", {
      className: "hero-lead"
    }, "Mass migration has reached a critical tipping point — and they're trying to hide what it's doing to everyday Australians. It's ", /*#__PURE__*/React.createElement("span", {
      className: "caps"
    }, "your"), " rent, ", /*#__PURE__*/React.createElement("span", {
      className: "caps"
    }, " your"), " hospital queue and ", /*#__PURE__*/React.createElement("span", {
      className: "caps"
    }, " your"), " taxes paying the price."), /*#__PURE__*/React.createElement("div", {
      className: "hero-cta"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Sign the petition"), /*#__PURE__*/React.createElement(Button, {
      variant: "solid",
      size: "lg",
      href: "map.html"
    }, "See your suburb →"))))));
  }

  /* ---------------- Signature bar ---------------- */
  function SignatureBar({
    count
  }) {
    const p = pct(count);
    const remaining = Math.max(0, GOAL - count);
    return /*#__PURE__*/React.createElement("section", {
      className: "sigbar",
      "aria-label": "Petition signature count"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide sigbar-inner"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sigbar-count"
    }, /*#__PURE__*/React.createElement(Star, {
      size: 44,
      className: "sigbar-star"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "sigbar-num"
    }, fmt(count)), /*#__PURE__*/React.createElement("div", {
      className: "sigbar-label"
    }, "Australians have signed"))), /*#__PURE__*/React.createElement("div", {
      className: "sigbar-progress"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sigbar-track"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sigbar-fill",
      style: {
        width: p + '%'
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "sigbar-bubble",
      style: {
        left: p + '%'
      }
    }, Math.round(p), "%")), /*#__PURE__*/React.createElement("div", {
      className: "sigbar-meta"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, fmt(remaining)), " more to hit our next goal of ", fmt(GOAL)), /*#__PURE__*/React.createElement("span", {
      className: "sigbar-live"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sigbar-dot"
    }), " Updating live")), /*#__PURE__*/React.createElement("div", {
      className: "sigbar-mission"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sigbar-mission-flag"
    }, /*#__PURE__*/React.createElement(Star, {
      size: 13,
      color: "#fff"
    }), " The mission"), /*#__PURE__*/React.createElement("span", {
      className: "sigbar-mission-num"
    }, fmt(ULTIMATE_GOAL)), /*#__PURE__*/React.createElement("span", {
      className: "sigbar-mission-word"
    }, "signatures"))), /*#__PURE__*/React.createElement("div", {
      className: "sigbar-cta"
    }, /*#__PURE__*/React.createElement("p", {
      className: "sigbar-push"
    }, /*#__PURE__*/React.createElement("b", null, "1 million signatures"), " will force Prime Minister Albanese to address the immigration crisis."), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Add your name"))));
  }

  /* ---------------- The problem ---------------- */
  function Problem({
    bare
  }) {
    const items = [{
      idx: '01',
      icon: 'home',
      img: 'problem-housing.jpg',
      stat: '+39%',
      h: 'Housing',
      p: 'Rents have surged at record pace while a generation is locked out of ever owning a home. Demand far outstrips what we can build.'
    }, {
      idx: '02',
      icon: 'pulse',
      img: 'problem-healthcare.jpg',
      stat: 'Strained',
      h: 'Healthcare',
      p: 'Emergency departments overflow and bulk-billing is in freefall. Our hospitals were never resourced for intake at this scale.'
    }, {
      idx: '03',
      icon: 'layers',
      img: 'problem-infrastructure.jpg',
      stat: 'Gridlock',
      h: 'Infrastructure',
      p: 'Roads, trains and schools are buckling. Public services are being asked to stretch across far more people than they were built for.'
    }, {
      idx: '04',
      icon: 'access',
      img: 'problem-ndis.jpg',
      stat: 'Uncapped',
      h: 'Disability (NDIS)',
      p: 'Non-citizens are drawing on the NDIS — a scheme it was never costed for. A safety net built for Australians is being stretched to breaking point.'
    }];
    return /*#__PURE__*/React.createElement("section", {
      id: "problem",
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, !bare && /*#__PURE__*/React.createElement("div", {
      className: "section-head"
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "Our migration problem"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "They're trying to hide ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--red-500)'
      }
    }, "the devastation mass migration is causing everyday Australians.")), /*#__PURE__*/React.createElement("p", {
      className: "lead-p"
    }, "The damage is real — and they'd rather you didn't see it. Mass migration lands hardest on the things you rely on: ", /*#__PURE__*/React.createElement("strong", null, "housing, healthcare, infrastructure"), ", and now ", /*#__PURE__*/React.createElement("strong", null, "disability support"), ".")), /*#__PURE__*/React.createElement("div", {
      className: "pressures"
    }, items.map(it => /*#__PURE__*/React.createElement("div", {
      className: "pressure",
      key: it.idx
    }, /*#__PURE__*/React.createElement("div", {
      className: "pressure-media"
    }, /*#__PURE__*/React.createElement("img", {
      src: A + it.img,
      alt: it.h,
      loading: "lazy"
    }), /*#__PURE__*/React.createElement("span", {
      className: "pressure-ic"
    }, /*#__PURE__*/React.createElement(SvgIcon, {
      name: it.icon
    })), /*#__PURE__*/React.createElement("span", {
      className: "pressure-idx"
    }, it.idx)), /*#__PURE__*/React.createElement("div", {
      className: "pressure-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pressure-stat"
    }, it.stat), /*#__PURE__*/React.createElement("div", {
      className: "pressure-h"
    }, it.h), /*#__PURE__*/React.createElement("p", {
      className: "pressure-p"
    }, it.p)))))));
  }

  /* ---------------- Petition form (first/last/email/mobile/postcode) ---------------- */
  function PetitionForm({
    onSign,
    cta = 'Sign the petition'
  }) {
    const [d, setD] = useState({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      postcode: ''
    });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const set = k => e => {
      const v = e.target.value;
      setD(s => ({
        ...s,
        [k]: v
      }));
      if (err[k]) setErr(s => ({
        ...s,
        [k]: undefined
      }));
    };
    const submit = async e => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.lastName.trim()) n.lastName = 'Required';
      if (!d.email.trim()) n.email = 'Required';else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n);
      if (Object.keys(n).length) return;
      // POST to the first-party API (mapped to API field names); UI proceeds even if it fails.
      setBusy(true);
      let result = null;
      try {
        result = await signPetition({
          first_name: d.firstName.trim(),
          last_name: d.lastName.trim(),
          email: d.email.trim(),
          mobile: d.mobile.trim(),
          postcode: d.postcode.trim(),
          firstName: d.firstName.trim()
        });
      } catch (e2) {}
      setBusy(false);
      if (onSign) onSign(d, result);
      try {
        window.dispatchEvent(new CustomEvent('petition-signed', {
          detail: {
            first: d.firstName.trim()
          }
        }));
      } catch (e2) {}
    };
    return /*#__PURE__*/React.createElement("form", {
      className: "pform",
      onSubmit: submit,
      noValidate: true
    }, /*#__PURE__*/React.createElement("div", {
      className: "pform-grid2"
    }, /*#__PURE__*/React.createElement(Input, {
      label: "First name *",
      name: "firstName",
      placeholder: "Jane",
      value: d.firstName,
      onChange: set('firstName'),
      invalid: !!err.firstName,
      hint: err.firstName,
      autoComplete: "given-name"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Last name *",
      name: "lastName",
      placeholder: "Citizen",
      value: d.lastName,
      onChange: set('lastName'),
      invalid: !!err.lastName,
      hint: err.lastName,
      autoComplete: "family-name"
    })), /*#__PURE__*/React.createElement(Input, {
      label: "Email *",
      type: "email",
      name: "email",
      placeholder: "jane@example.com",
      value: d.email,
      onChange: set('email'),
      invalid: !!err.email,
      hint: err.email,
      autoComplete: "email",
      onBlur: () => {
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) firePartial('petition', {
          email: d.email.trim(),
          first_name: d.firstName.trim(),
          last_name: d.lastName.trim(),
          mobile: d.mobile.trim(),
          postcode: d.postcode.trim()
        });
      }
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Mobile phone",
      type: "tel",
      name: "mobile",
      placeholder: "0400 000 000",
      value: d.mobile,
      onChange: set('mobile'),
      autoComplete: "tel"
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Postcode",
      name: "postcode",
      placeholder: "2000",
      value: d.postcode,
      onChange: set('postcode'),
      inputMode: "numeric",
      maxLength: 4,
      autoComplete: "postal-code"
    }), /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true,
      disabled: busy
    }, busy ? 'Signing…' : cta), /*#__PURE__*/React.createElement("p", {
      className: "pform-fine"
    }, /*#__PURE__*/React.createElement("span", {
      className: "req"
    }, "*"), " Required. We'll send you campaign updates — unsubscribe anytime."));
  }
  function ThanksCard({
    count,
    pc
  }) {
    const mapHref = 'map.html' + (pc ? '?pc=' + pc : '');
    return /*#__PURE__*/React.createElement(Card, {
      accent: "navy",
      elevated: true
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "success"
    }, "Signed"), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '-0.02em',
        margin: '14px 0 8px'
      }
    }, "Thank you for standing up."), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '15px',
        lineHeight: 1.6,
        color: 'var(--ink-700)',
        margin: '0 0 16px'
      }
    }, "You're one of ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--navy-700)'
      }
    }, fmt(count)), " Australians demanding fair migration.", pc ? ' We’ve pinned your local impact map — see what’s happening in your suburb.' : ''), /*#__PURE__*/React.createElement(Button, {
      variant: "solid",
      fullWidth: true,
      href: mapHref
    }, "View my local impact →"), /*#__PURE__*/React.createElement("div", {
      style: {
        height: '8px'
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      fullWidth: true,
      href: "share.html"
    }, "Share with friends →"), /*#__PURE__*/React.createElement("div", {
      style: {
        height: '8px'
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "donate",
      fullWidth: true,
      href: "donate.html"
    }, "Chip in to the campaign"));
  }

  /* ---------------- Petition section (argument + goal + form) ---------------- */
  function CheckIcon() {
    return /*#__PURE__*/React.createElement("svg", {
      width: "15",
      height: "15",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "3.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M20 6 9 17l-5-5"
    }));
  }
  const DEMANDS = [{
    h: 'An immediate reduction in the migration intake',
    p: 'Bring numbers back to a level our housing, hospitals and infrastructure can actually sustain.'
  }, {
    h: 'A full review of a broken system',
    p: 'An honest, independent audit of a migration policy that has been left unchecked for years.'
  }, {
    h: 'Australians first — always',
    p: 'A system run in the interests of the Australians who built this country and pay for its services.'
  }];
  const WHY_POINTS = [{
    img: 'why-housing.jpg',
    h: "A roof over your family's head",
    p: 'Runaway demand has pushed home ownership out of reach and rents to record highs. Australians should be able to afford to live in their own country.'
  }, {
    img: 'why-services.jpg',
    h: "The services you've paid for",
    p: "You've funded our hospitals, roads and schools your whole working life — they should serve you first, not buckle under numbers they were never built for."
  }, {
    img: 'why-wages.jpg',
    h: 'Wages that keep up with life',
    p: 'An endless supply of cheap overseas labour holds down the pay of working Australians. Fair migration means a fair go at work.'
  }, {
    img: 'why-voice.jpg',
    h: "A say in your country's future",
    p: 'Australians were never asked whether they wanted record migration. It is time our leaders listened to the people they serve.'
  }];
  function PetitionSection({
    count,
    signed,
    pc,
    onSign
  }) {
    return /*#__PURE__*/React.createElement("section", {
      id: "petition",
      className: "section section--tint"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head",
      style: {
        margin: '0 auto',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Eyebrow, {
      variant: "navy"
    }, "Add your name")), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "Sign the petition")), /*#__PURE__*/React.createElement("div", {
      className: "petition-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "petition-copy"
    }, /*#__PURE__*/React.createElement("blockquote", {
      className: "petition-quote"
    }, /*#__PURE__*/React.createElement("div", {
      className: "petition-quote-head"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pq-star"
    }, /*#__PURE__*/React.createElement(Star, {
      size: 17,
      color: "#fff"
    })), /*#__PURE__*/React.createElement("span", {
      className: "pq-label"
    }, "Our petition to Canberra")), /*#__PURE__*/React.createElement("p", {
      className: "petition-quote-lead"
    }, "We call for an immediate overhaul of Australia's migration policies:"), /*#__PURE__*/React.createElement("ol", {
      className: "demand-list"
    }, DEMANDS.map((d, i) => /*#__PURE__*/React.createElement("li", {
      className: "demand-item",
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "demand-num"
    }, i + 1), /*#__PURE__*/React.createElement("div", {
      className: "demand-body"
    }, /*#__PURE__*/React.createElement("h4", null, d.h), /*#__PURE__*/React.createElement("p", null, d.p)))))), /*#__PURE__*/React.createElement("div", {
      className: "why-fair"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "why-fair-title"
    }, "Why Australians deserve fair migration"), /*#__PURE__*/React.createElement("p", {
      className: "why-fair-intro"
    }, "This isn't about shutting the door — it's about ensuring a fair go for everyday Australians."), /*#__PURE__*/React.createElement("ul", {
      className: "why-list"
    }, WHY_POINTS.map((w, i) => /*#__PURE__*/React.createElement("li", {
      className: "why-item",
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      className: "why-thumb"
    }, /*#__PURE__*/React.createElement("img", {
      src: A + w.img,
      alt: "",
      loading: "lazy"
    }), /*#__PURE__*/React.createElement("span", {
      className: "why-ic"
    }, /*#__PURE__*/React.createElement(CheckIcon, null))), /*#__PURE__*/React.createElement("div", {
      className: "why-text"
    }, /*#__PURE__*/React.createElement("h4", null, w.h), /*#__PURE__*/React.createElement("p", null, w.p))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        top: '120px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "goal-block"
    }, /*#__PURE__*/React.createElement("div", {
      className: "goal-row"
    }, /*#__PURE__*/React.createElement("div", {
      className: "goal-now"
    }, fmt(count), " ", /*#__PURE__*/React.createElement("span", null, "signatures")), /*#__PURE__*/React.createElement("div", {
      className: "goal-target"
    }, fmt(GOAL), " goal")), /*#__PURE__*/React.createElement("div", {
      className: "goal-bar"
    }, /*#__PURE__*/React.createElement("div", {
      className: "goal-fill",
      style: {
        width: pct(count) + '%'
      }
    }))), signed ? /*#__PURE__*/React.createElement(ThanksCard, {
      count: count,
      pc: pc
    }) : /*#__PURE__*/React.createElement(PetitionForm, {
      onSign: onSign
    })))));
  }

  /* ---------------- Map on a dark stage ---------------- */
  function MapStage({
    registerApi,
    onSign
  }) {
    const Tool = window.PostcodeTool;
    return /*#__PURE__*/React.createElement("section", {
      id: "map",
      className: "section section--dark"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head map-head"
    }, /*#__PURE__*/React.createElement(Eyebrow, {
      variant: "light"
    }, "Local impact map"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "How much is ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--coral-400)'
      }
    }, "your"), " postcode absorbing?"), /*#__PURE__*/React.createElement("p", {
      className: "map-lead"
    }, "Migration is decided in Canberra — but it lands on your street. Enter your postcode for real ABS figures on migration intensity, population growth and rental stress — and how your area ranks against the nation.")), /*#__PURE__*/React.createElement("div", {
      className: "map-stage"
    }, Tool ? /*#__PURE__*/React.createElement(Tool, {
      registerApi: registerApi,
      onSign: onSign
    }) : null)));
  }

  /* ---------------- Manifesto demand ---------------- */
  function Demand() {
    return /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "manifesto"
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "Our demand to Canberra"), /*#__PURE__*/React.createElement(Star, {
      size: 40,
      className: "star",
      style: {
        display: 'block',
        marginTop: 26
      }
    }), /*#__PURE__*/React.createElement("p", {
      className: "demand-quote"
    }, "We demand an ", /*#__PURE__*/React.createElement("span", {
      className: "r"
    }, "immediate overhaul"), " of Australia's migration system. The current system is ", /*#__PURE__*/React.createElement("span", {
      className: "n"
    }, "broken"), ", unsustainable and putting an unfair strain on Australians."), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Add your name"))));
  }

  /* ---------------- Donate: split layout + amount grid ---------------- */
  const DONATE_AMOUNTS = [35, 65, 135, 265, 550, 1500];
  function suggestedMonthly(oneoff) {
    return Math.max(5, Math.round(oneoff * 0.2 / 5) * 5);
  }
  function DonateBlock() {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const upsell = params.get('upsell') || params.get('cs');
    if (upsell) return /*#__PURE__*/React.createElement(MonthlyUpsell, {
      sessionId: upsell
    });
    const [freq, setFreq] = useState('oneoff');
    const [sel, setSel] = useState(65);
    const [other, setOther] = useState(false);
    const [custom, setCustom] = useState('');
    const [busy, setBusy] = useState(false);
    const go = amount => {
      if (amount >= 2 && !busy) {
        setBusy(true);
        donateCheckout({
          amount,
          frequency: freq
        });
      }
    };
    return /*#__PURE__*/React.createElement("section", {
      id: "donate",
      className: "donate-hero"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide donate-grid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "donate-msg"
    }, /*#__PURE__*/React.createElement(Eyebrow, {
      variant: "light"
    }, "Donate"), /*#__PURE__*/React.createElement("h1", {
      className: "donate-head"
    }, "They spend ", /*#__PURE__*/React.createElement("span", {
      className: "donate-billions"
    }, "billions"), " selling the immigration crisis. Only you can help."), /*#__PURE__*/React.createElement("p", {
      className: "donate-copy"
    }, "Fair Migration is funded by Australians — not corporations, not the big party machines. Every dollar puts the truth about immigration in front of more voters: ads, research, and organising on the ground."), /*#__PURE__*/React.createElement("ul", {
      className: "donate-impact"
    }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "donate-impact-amt"
    }, "$35"), /*#__PURE__*/React.createElement("span", null, "puts our message in front of ", /*#__PURE__*/React.createElement("b", null, "50 Australians"), ".")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "donate-impact-amt"
    }, "$65"), /*#__PURE__*/React.createElement("span", null, "gets ", /*#__PURE__*/React.createElement("b", null, "50 Australians"), " mail they can't ignore.")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "donate-impact-amt"
    }, "$135"), /*#__PURE__*/React.createElement("span", null, "reaches ", /*#__PURE__*/React.createElement("b", null, "500 Australians"), " who have no idea what's happening.")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "donate-impact-amt"
    }, "$265"), /*#__PURE__*/React.createElement("span", null, "connects with a ", /*#__PURE__*/React.createElement("b", null, "whole block of voters"), ".")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "donate-impact-amt"
    }, "$550"), /*#__PURE__*/React.createElement("span", null, "puts a ", /*#__PURE__*/React.createElement("b", null, "newspaper ad"), " in front of critical communities.")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "donate-impact-amt"
    }, "$1,500"), /*#__PURE__*/React.createElement("span", null, "reaches ", /*#__PURE__*/React.createElement("b", null, "5,000 Australians"), " with the truth about immigration."))), /*#__PURE__*/React.createElement("p", {
      className: "donate-trust"
    }, "Stripe-secured · All amounts in AUD · Not tax-deductible")), /*#__PURE__*/React.createElement("div", {
      className: "donate-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "donate-toggle",
      role: "tablist"
    }, /*#__PURE__*/React.createElement("button", {
      role: "tab",
      "aria-selected": freq === 'oneoff',
      className: freq === 'oneoff' ? 'is-on' : '',
      onClick: () => setFreq('oneoff')
    }, "One-off"), /*#__PURE__*/React.createElement("button", {
      role: "tab",
      "aria-selected": freq === 'monthly',
      className: freq === 'monthly' ? 'is-on' : '',
      onClick: () => setFreq('monthly')
    }, "Monthly")), /*#__PURE__*/React.createElement("div", {
      className: "donate-amts"
    }, DONATE_AMOUNTS.map(a => /*#__PURE__*/React.createElement("button", {
      key: a,
      className: 'donate-amt' + (!other && sel === a ? ' is-on' : ''),
      disabled: busy,
      onClick: () => {
        setOther(false);
        setSel(a);
        go(a);
      }
    }, "$", a, freq === 'monthly' ? /*#__PURE__*/React.createElement("span", {
      className: "donate-per"
    }, "/mo") : null)), /*#__PURE__*/React.createElement("button", {
      className: 'donate-amt donate-amt--other' + (other ? ' is-on' : ''),
      onClick: () => setOther(true)
    }, "Other")), other && /*#__PURE__*/React.createElement("div", {
      className: "donate-custom"
    }, /*#__PURE__*/React.createElement("span", {
      className: "donate-custom-sign"
    }, "$"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: "2",
      inputMode: "numeric",
      placeholder: "Amount",
      value: custom,
      onChange: e => setCustom(e.target.value),
      onKeyDown: e => {
        if (e.key === 'Enter') go(Number(custom));
      }
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "donate",
      onClick: () => go(Number(custom)),
      disabled: busy
    }, "Give", freq === 'monthly' ? ' monthly' : '', " →")), /*#__PURE__*/React.createElement("p", {
      className: "donate-cardnote"
    }, busy ? 'Taking you to secure checkout…' : 'Stripe-secured · All amounts in AUD · Not tax-deductible.'))));
  }

  /* ---------------- Post-donation monthly upsell ---------------- */
  function MonthlyUpsell({
    sessionId
  }) {
    const [amt, setAmt] = useState(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => {
      let live = true;
      fetch('/api/checkout?session_id=' + encodeURIComponent(sessionId)).then(r => r.ok ? r.json() : null).then(j => {
        if (live && j && j.session) setAmt(Math.round((j.session.amount_total || 0) / 100));
      }).catch(() => {});
      return () => {
        live = false;
      };
    }, []);
    const monthly = amt ? suggestedMonthly(amt) : 10;
    const upgrade = () => {
      if (busy) return;
      setBusy(true);
      donateCheckout({
        amount: monthly,
        frequency: 'monthly'
      });
    };
    return /*#__PURE__*/React.createElement("section", {
      className: "upsell"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container",
      style: {
        maxWidth: '720px'
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "upsell-thanks"
    }, "Thank you", amt ? ' — $' + amt + ' received' : '', ". Your receipt is on its way."), /*#__PURE__*/React.createElement("h1", {
      className: "upsell-head"
    }, amt ? '$' + amt + ' helps today.' : 'Thank you.', " ", /*#__PURE__*/React.createElement("span", {
      className: "upsell-red"
    }, "$", monthly, " a month keeps the pressure on.")), /*#__PURE__*/React.createElement("p", {
      className: "upsell-sub"
    }, "One-off gifts keep the lights on. Monthly backing changes what we can do:"), /*#__PURE__*/React.createElement("ul", {
      className: "upsell-list"
    }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "We can plan ahead."), " Ads, research and polling are booked months out — steady funding lets us commit before the Government moves."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "They can't wait us out."), " A predictable, reliable base is the one thing a delay-and-outlast strategy can't beat."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Small monthly beats big once."), " A year of $", monthly, "/month puts more pressure on Canberra than most one-off gifts — without you feeling it.")), /*#__PURE__*/React.createElement(Button, {
      variant: "donate",
      size: "lg",
      fullWidth: true,
      onClick: upgrade,
      disabled: busy
    }, busy ? 'One moment…' : 'Make it $' + monthly + '/month'), /*#__PURE__*/React.createElement("p", {
      className: "upsell-fine"
    }, "Cancel anytime with one email. Receipted monthly."), /*#__PURE__*/React.createElement("a", {
      className: "upsell-skip",
      href: "share.html"
    }, "No thanks — I'll share the petition with my mates instead →")));
  }

  /* ---------------- Page header (interior pages) ---------------- */
  function PageHead({
    eyebrow,
    title,
    lead,
    dark
  }) {
    return /*#__PURE__*/React.createElement("section", {
      className: 'page-head' + (dark ? ' page-head--dark' : '')
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement(Eyebrow, {
      variant: dark ? 'light' : undefined
    }, eyebrow), /*#__PURE__*/React.createElement("h1", null, title), lead && /*#__PURE__*/React.createElement("p", {
      className: "lead-p"
    }, lead)));
  }

  /* ---------------- Social-proof activity popup ----------------
     Live "someone just signed / donated" toast. Real events (petition-signed /
     donation-completed CustomEvents) take priority; a curated sample pool keeps
     it alive on quiet pages. Renders nothing on /donate and /share. */
  const SP_NAMES = ['Sarah', 'Mason', 'Emma', 'Michael', 'Olivia', 'Liam', 'Chloe', 'Noah', 'Ava', 'Jack', 'Mia', 'William', 'Grace', 'Thomas', 'Ruby', 'Ethan', 'Sophie', 'Lucas', 'Charlotte', 'Henry', 'Isla', 'Oliver', 'Amelia', 'Harry', 'Zoe', 'Daniel', 'Hannah', 'Lachlan', 'Ella', 'Cooper'];
  const SP_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
  const SP_AMOUNTS = [50, 75, 100, 150, 200];
  const spRand = a => a[Math.floor(Math.random() * a.length)];
  function SocialProofPopup() {
    const [item, setItem] = useState(null);
    const [phase, setPhase] = useState('out');
    const timers = useRef({});
    const suppressed = typeof window !== 'undefined' && /^\/(donate|share)(\/|$|\.)/.test(window.location.pathname);
    useEffect(() => {
      if (suppressed) return undefined;
      const t = timers.current;
      const hide = () => {
        setPhase('out');
        t.unmount = setTimeout(() => setItem(null), 360);
      };
      const show = next => {
        clearTimeout(t.hide);
        clearTimeout(t.unmount);
        setItem(next);
        setPhase('in');
        t.hide = setTimeout(hide, 9000);
      };
      const idle = () => {
        if (Math.random() >= 0.75) return show({
          kind: 'donation',
          name: spRand(SP_NAMES),
          state: spRand(SP_STATES),
          amount: spRand(SP_AMOUNTS),
          href: 'donate.html'
        });
        return show({
          kind: 'petition',
          name: spRand(SP_NAMES),
          state: spRand(SP_STATES),
          href: 'petition.html'
        });
      };
      const onSigned = e => show({
        kind: 'petition',
        name: e.detail && e.detail.first || spRand(SP_NAMES),
        state: spRand(SP_STATES),
        href: 'petition.html'
      });
      const onDonated = e => {
        const a = e.detail && e.detail.amount;
        if (a == null || a >= 50) show({
          kind: 'donation',
          name: e.detail && e.detail.first || spRand(SP_NAMES),
          state: spRand(SP_STATES),
          amount: a || spRand(SP_AMOUNTS),
          href: 'donate.html'
        });
      };
      window.addEventListener('petition-signed', onSigned);
      window.addEventListener('donation-completed', onDonated);
      t.first = setTimeout(() => {
        if (!document.hidden) idle();
      }, 8000);
      t.iv = setInterval(() => {
        if (!document.hidden) idle();
      }, 60000);
      // expose so the /share purchase handler could fire one elsewhere if wanted
      return () => {
        window.removeEventListener('petition-signed', onSigned);
        window.removeEventListener('donation-completed', onDonated);
        Object.values(t).forEach(x => {
          clearTimeout(x);
          clearInterval(x);
        });
      };
    }, [suppressed]);
    if (suppressed || !item) return null;
    const isPet = item.kind === 'petition';
    const text = isPet ? `${item.name} from ${item.state} just signed the petition.` : `${item.name} from ${item.state} just donated $${item.amount} to Fair Migration.`;
    const cta = isPet ? 'Add your name today' : 'Chip in today';
    const dismiss = e => {
      e.preventDefault();
      e.stopPropagation();
      setPhase('out');
      timers.current.unmount = setTimeout(() => setItem(null), 360);
    };
    return /*#__PURE__*/React.createElement("a", {
      className: 'ff-sp ff-sp--' + item.kind + ' ff-sp--' + phase,
      href: item.href,
      "aria-label": text
    }, /*#__PURE__*/React.createElement("span", {
      className: "ff-sp-icon",
      "aria-hidden": "true"
    }, isPet ? /*#__PURE__*/React.createElement(Star, {
      size: 16,
      color: "#fff"
    }) : '♥'), /*#__PURE__*/React.createElement("span", {
      className: "ff-sp-body"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ff-sp-text"
    }, text), /*#__PURE__*/React.createElement("span", {
      className: "ff-sp-cta"
    }, cta, " →")), /*#__PURE__*/React.createElement("button", {
      className: "ff-sp-close",
      "aria-label": "Dismiss",
      onClick: dismiss
    }, "×"));
  }

  /* ---------------- Footer ---------------- */
  function Footer() {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SocialProofPopup, null), /*#__PURE__*/React.createElement("div", {
      className: "foot-cta"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container foot-cta-inner"
    }, /*#__PURE__*/React.createElement("h2", null, "Australia's future is on the line."), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Sign today ›"))), /*#__PURE__*/React.createElement("footer", {
      className: "footer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container",
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "index.html"
    }, /*#__PURE__*/React.createElement("img", {
      src: A + 'logo-full.png',
      alt: "Fair Migration",
      style: {
        height: '52px'
      }
    })), /*#__PURE__*/React.createElement("nav", {
      style: {
        display: 'flex',
        gap: '24px',
        fontSize: '14px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "problem.html"
    }, "The problem"), /*#__PURE__*/React.createElement("a", {
      href: "map.html"
    }, "Impact map"), /*#__PURE__*/React.createElement("a", {
      href: "petition.html"
    }, "Sign"), /*#__PURE__*/React.createElement("a", {
      href: "donate.html"
    }, "Donate"), /*#__PURE__*/React.createElement("a", {
      href: "about.html"
    }, "About"), /*#__PURE__*/React.createElement("a", {
      href: "contact.html"
    }, "Contact"), /*#__PURE__*/React.createElement("a", {
      href: "#"
    }, "Privacy Policy")), /*#__PURE__*/React.createElement("div", {
      className: "social",
      style: {
        fontSize: '13px',
        color: 'var(--ink-500)',
        fontWeight: 600
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "#"
    }, "Twitter"), /*#__PURE__*/React.createElement("a", {
      href: "#"
    }, "Facebook"), /*#__PURE__*/React.createElement("a", {
      href: "#"
    }, "Instagram"), /*#__PURE__*/React.createElement("a", {
      href: "#"
    }, "YouTube"))), /*#__PURE__*/React.createElement("div", {
      className: "container",
      style: {
        marginTop: '24px',
        fontSize: '12px',
        color: 'var(--ink-400)'
      }
    }, "© 2026 Fair Migration. All rights reserved. · Map figures shown are sample data for demonstration.")));
  }
  window.FM = {
    A,
    GOAL,
    CFG,
    fmt,
    pct,
    clean4,
    safeGet,
    safeSet,
    markSigned,
    useLiveCount,
    getAttr,
    captureAttribution,
    signPetition,
    appendClientRef,
    Eyebrow,
    Star,
    SiteNav,
    Hero,
    SignatureBar,
    Problem,
    PetitionForm,
    PetitionSection,
    MapStage,
    Demand,
    DonateBlock,
    PageHead,
    Footer
  };

  // Run once per page load (browser only): persist attribution + fire the ?ref= beacon.
  if (typeof window !== 'undefined' && window.document) {
    captureAttribution();
    shareClickBeacon();
  }
})();