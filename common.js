"use strict";

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
  const GOAL = 75000;
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
  function useLiveCount() {
    const [count, setCount] = useState(48217 + (safeGet('fm_signed') === '1' ? 1 : 0));
    useEffect(() => {
      const id = setInterval(() => setCount(c => c + (Math.random() < 0.6 ? 1 : 0)), 4200);
      return () => clearInterval(id);
    }, []);
    return [count, setCount];
  }
  function Eyebrow({
    children,
    variant
  }) {
    return React.createElement("div", {
      className: 'eyebrow' + (variant ? ' eyebrow--' + variant : '')
    }, children);
  }
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
    return React.createElement("svg", {
      className: className,
      style: style,
      width: size,
      height: size,
      viewBox: "0 0 100 100",
      "aria-hidden": "true"
    }, React.createElement("polygon", {
      points: pts.join(' '),
      fill: color
    }));
  }
  function SiteNav({
    active,
    count
  }) {
    const [open, setOpen] = useState(false);
    const link = (key, href, label) => React.createElement("a", {
      className: 'navlink' + (active === key ? ' is-active' : ''),
      href: href,
      onClick: () => setOpen(false)
    }, label);
    return React.createElement("div", {
      className: "site-top"
    }, React.createElement("div", {
      className: "util-bar"
    }, React.createElement("div", {
      className: "util-inner"
    }, React.createElement("span", {
      className: "util-hide util-dim"
    }, "Authorised by Fair Migration \xB7 Australia"), React.createElement("span", {
      className: "util-count"
    }, React.createElement("img", {
      className: "tick-star",
      src: A + 'favicon-white.png',
      alt: "",
      style: {
        width: 14,
        height: 14
      }
    }), React.createElement("b", null, fmt(count != null ? count : 48217)), "\xA0Australians have signed \xB7", ' ', React.createElement("a", {
      href: "petition.html"
    }, "Add your name")))), React.createElement("header", {
      className: "site-nav"
    }, React.createElement("a", {
      className: "site-nav-brand",
      href: "index.html"
    }, React.createElement("img", {
      src: A + 'logo-full.png',
      alt: "Fair Migration"
    })), React.createElement("button", {
      className: "site-nav-burger",
      "aria-label": "Toggle menu",
      "aria-expanded": open,
      onClick: () => setOpen(o => !o)
    }, React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.2",
      strokeLinecap: "round"
    }, open ? React.createElement("g", null, React.createElement("line", {
      x1: "5",
      y1: "5",
      x2: "19",
      y2: "19"
    }), React.createElement("line", {
      x1: "19",
      y1: "5",
      x2: "5",
      y2: "19"
    })) : React.createElement("g", null, React.createElement("line", {
      x1: "3",
      y1: "7",
      x2: "21",
      y2: "7"
    }), React.createElement("line", {
      x1: "3",
      y1: "12",
      x2: "21",
      y2: "12"
    }), React.createElement("line", {
      x1: "3",
      y1: "17",
      x2: "21",
      y2: "17"
    })))), React.createElement("nav", {
      className: 'site-nav-links' + (open ? ' is-open' : '')
    }, link('problem', 'problem.html', 'The problem'), link('map', 'map.html', 'Impact map'), React.createElement("a", {
      className: "btn-sign",
      href: "petition.html"
    }, "Sign"), React.createElement(Button, {
      variant: "donate",
      size: "sm",
      href: "donate.html"
    }, "Donate"))));
  }
  function Hero({
    count
  }) {
    return React.createElement("section", {
      className: "hero"
    }, React.createElement("div", {
      className: "hero-left"
    }, React.createElement("div", {
      className: "hero-inner"
    }, React.createElement(Eyebrow, {
      variant: "light"
    }, "A campaign for everyday Australians"), React.createElement("h1", {
      className: "display"
    }, "Australians don't have to live like this."), React.createElement("p", {
      className: "hero-lead"
    }, "Australia's migration system has reached a critical tipping point \u2014 and it's ", React.createElement("span", {
      className: "caps"
    }, "your"), " rent,", React.createElement("span", {
      className: "caps"
    }, " your"), " hospital queue and ", React.createElement("span", {
      className: "caps"
    }, " your"), " commute paying the price."), React.createElement("div", {
      className: "hero-cta"
    }, React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Sign the petition"), React.createElement(Button, {
      variant: "solid",
      size: "lg",
      href: "map.html"
    }, "See your suburb \u2192")))));
  }
  function SignatureBar({
    count
  }) {
    const p = pct(count);
    const remaining = Math.max(0, GOAL - count);
    const milestones = [25000, 50000, GOAL];
    return React.createElement("section", {
      className: "sigbar",
      "aria-label": "Petition signature count"
    }, React.createElement("div", {
      className: "container container--wide sigbar-inner"
    }, React.createElement("div", {
      className: "sigbar-count"
    }, React.createElement(Star, {
      size: 44,
      className: "sigbar-star"
    }), React.createElement("div", null, React.createElement("div", {
      className: "sigbar-num"
    }, fmt(count)), React.createElement("div", {
      className: "sigbar-label"
    }, "Australians have signed"))), React.createElement("div", {
      className: "sigbar-progress"
    }, React.createElement("div", {
      className: "sigbar-track"
    }, React.createElement("div", {
      className: "sigbar-fill",
      style: {
        width: p + '%'
      }
    }), milestones.map(m => React.createElement("span", {
      key: m,
      className: "sigbar-tick",
      style: {
        left: pct(m) + '%'
      }
    })), React.createElement("span", {
      className: "sigbar-bubble",
      style: {
        left: p + '%'
      }
    }, Math.round(p), "%")), React.createElement("div", {
      className: "sigbar-meta"
    }, React.createElement("span", null, React.createElement("b", null, fmt(remaining)), " more to reach our goal of ", fmt(GOAL)), React.createElement("span", {
      className: "sigbar-live"
    }, React.createElement("span", {
      className: "sigbar-dot"
    }), " Updating live"))), React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Add your name")));
  }
  function Problem({
    bare
  }) {
    const items = [{
      idx: '01',
      stat: '+39%',
      h: 'Housing',
      p: 'Rents have surged at record pace while a generation is locked out of ever owning a home. Demand far outstrips what we can build.'
    }, {
      idx: '02',
      stat: 'Strained',
      h: 'Healthcare',
      p: 'Emergency departments overflow and bulk-billing is in freefall. Our hospitals were never resourced for intake at this scale.'
    }, {
      idx: '03',
      stat: 'Gridlock',
      h: 'Infrastructure',
      p: 'Roads, trains and schools are buckling. Public services are being asked to stretch across far more people than they were built for.'
    }];
    return React.createElement("section", {
      id: "problem",
      className: "section"
    }, React.createElement("div", {
      className: "container container--wide"
    }, !bare && React.createElement("div", {
      className: "section-head"
    }, React.createElement(Eyebrow, null, "The problem"), React.createElement("h2", {
      className: "h2-display"
    }, "For years, our leaders drove radical migration intakes. ", React.createElement("span", {
      style: {
        color: 'var(--red-500)'
      }
    }, "Everyday Australians were left to suffer.")), React.createElement("p", {
      className: "lead-p"
    }, "Our Government ", React.createElement("span", {
      className: "caps"
    }, "MUST"), " put Australians first. The strain shows up in three places \u2014 and you feel all three.")), React.createElement("div", {
      className: "pressures"
    }, items.map(it => React.createElement("div", {
      className: "pressure",
      key: it.idx
    }, React.createElement("div", {
      className: "pressure-idx"
    }, it.idx), React.createElement("div", {
      className: "pressure-stat"
    }, it.stat), React.createElement("div", {
      className: "pressure-h"
    }, it.h), React.createElement("p", {
      className: "pressure-p"
    }, it.p))))));
  }
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
    const submit = e => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.lastName.trim()) n.lastName = 'Required';
      if (!d.email.trim()) n.email = 'Required';else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n);
      if (Object.keys(n).length) return;
      onSign && onSign(d);
    };
    return React.createElement("form", {
      className: "pform",
      onSubmit: submit,
      noValidate: true
    }, React.createElement("div", {
      className: "pform-grid2"
    }, React.createElement(Input, {
      label: "First name *",
      name: "firstName",
      placeholder: "Jane",
      value: d.firstName,
      onChange: set('firstName'),
      invalid: !!err.firstName,
      hint: err.firstName,
      autoComplete: "given-name"
    }), React.createElement(Input, {
      label: "Last name *",
      name: "lastName",
      placeholder: "Citizen",
      value: d.lastName,
      onChange: set('lastName'),
      invalid: !!err.lastName,
      hint: err.lastName,
      autoComplete: "family-name"
    })), React.createElement(Input, {
      label: "Email *",
      type: "email",
      name: "email",
      placeholder: "jane@example.com",
      value: d.email,
      onChange: set('email'),
      invalid: !!err.email,
      hint: err.email,
      autoComplete: "email"
    }), React.createElement(Input, {
      label: "Mobile phone",
      type: "tel",
      name: "mobile",
      placeholder: "0400 000 000",
      value: d.mobile,
      onChange: set('mobile'),
      autoComplete: "tel"
    }), React.createElement(Input, {
      label: "Postcode",
      name: "postcode",
      placeholder: "2000",
      value: d.postcode,
      onChange: set('postcode'),
      inputMode: "numeric",
      maxLength: 4,
      autoComplete: "postal-code"
    }), React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true
    }, cta), React.createElement("p", {
      className: "pform-fine"
    }, React.createElement("span", {
      className: "req"
    }, "*"), " Required. We'll send you campaign updates \u2014 unsubscribe anytime."));
  }
  function ThanksCard({
    count,
    pc
  }) {
    const mapHref = 'map.html' + (pc ? '?pc=' + pc : '');
    return React.createElement(Card, {
      accent: "navy",
      elevated: true
    }, React.createElement(Badge, {
      tone: "success"
    }, "Signed"), React.createElement("h3", {
      style: {
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '-0.02em',
        margin: '14px 0 8px'
      }
    }, "Thank you for standing up."), React.createElement("p", {
      style: {
        fontSize: '15px',
        lineHeight: 1.6,
        color: 'var(--ink-700)',
        margin: '0 0 16px'
      }
    }, "You're one of ", React.createElement("strong", {
      style: {
        color: 'var(--navy-700)'
      }
    }, fmt(count)), " Australians demanding fair migration.", pc ? ' We’ve pinned your local impact map — see what’s happening in your suburb.' : ''), React.createElement(Button, {
      variant: "solid",
      fullWidth: true,
      href: mapHref
    }, "View my local impact \u2192"), React.createElement("div", {
      style: {
        height: '8px'
      }
    }), React.createElement(Button, {
      variant: "donate",
      fullWidth: true,
      href: "donate.html"
    }, "Chip in to the campaign"));
  }
  function PetitionSection({
    count,
    signed,
    pc,
    onSign
  }) {
    return React.createElement("section", {
      id: "petition",
      className: "section section--tint"
    }, React.createElement("div", {
      className: "container"
    }, React.createElement("div", {
      className: "section-head"
    }, React.createElement(Eyebrow, {
      variant: "navy"
    }, "Add your name"), React.createElement("h2", {
      className: "h2-display"
    }, "Sign the petition. Then see what it's doing to ", React.createElement("span", {
      style: {
        color: 'var(--red-500)'
      }
    }, "your"), " suburb.")), React.createElement("div", {
      className: "petition-grid"
    }, React.createElement("div", null, React.createElement("p", {
      className: "body-p",
      style: {
        fontSize: '17px',
        marginTop: '4px'
      }
    }, "We are calling for an immediate overhaul of Australia's migration policies \u2014 so that migration is done in ", React.createElement("span", {
      className: "caps"
    }, "OUR"), " best interests. Here's what you're demanding:"), React.createElement("ul", {
      className: "demand-list"
    }, ['An immediate reduction in the migration intake.', 'A full review of broken, unsustainable migration policy.', 'A system run in the interests of Australians first.'].map(t => React.createElement("li", {
      key: t
    }, React.createElement(Star, {
      size: 18,
      className: "star"
    }), t)))), React.createElement("div", {
      style: {
        position: 'sticky',
        top: '120px'
      }
    }, React.createElement("div", {
      className: "goal-block"
    }, React.createElement("div", {
      className: "goal-row"
    }, React.createElement("div", {
      className: "goal-now"
    }, fmt(count), " ", React.createElement("span", null, "signatures")), React.createElement("div", {
      className: "goal-target"
    }, fmt(GOAL), " goal")), React.createElement("div", {
      className: "goal-bar"
    }, React.createElement("div", {
      className: "goal-fill",
      style: {
        width: pct(count) + '%'
      }
    }))), signed ? React.createElement(ThanksCard, {
      count: count,
      pc: pc
    }) : React.createElement(PetitionForm, {
      onSign: onSign
    })))));
  }
  function MapStage({
    registerApi,
    onSign
  }) {
    const Tool = window.PostcodeTool;
    return React.createElement("section", {
      id: "map",
      className: "section section--dark"
    }, React.createElement("div", {
      className: "container container--wide"
    }, React.createElement("div", {
      className: "section-head map-head"
    }, React.createElement(Eyebrow, {
      variant: "light"
    }, "Local impact map"), React.createElement("h2", {
      className: "h2-display"
    }, "How much is ", React.createElement("span", {
      style: {
        color: 'var(--coral-400)'
      }
    }, "your"), " postcode absorbing?"), React.createElement("p", {
      className: "map-lead"
    }, "Migration is decided in Canberra \u2014 but it lands on your street. Enter your postcode for suburb-level intensity, year-on-year change and how your area ranks against the nation.")), React.createElement("div", {
      className: "map-stage"
    }, Tool ? React.createElement(Tool, {
      registerApi: registerApi,
      onSign: onSign
    }) : null)));
  }
  function Demand() {
    return React.createElement("section", {
      className: "section"
    }, React.createElement("div", {
      className: "container"
    }, React.createElement("div", {
      className: "manifesto"
    }, React.createElement(Eyebrow, null, "Our demand to Canberra"), React.createElement(Star, {
      size: 40,
      className: "star",
      style: {
        display: 'block',
        marginTop: 26
      }
    }), React.createElement("p", {
      className: "demand-quote"
    }, "We demand an ", React.createElement("span", {
      className: "r"
    }, "immediate overhaul"), " of Australia's migration system. The current system is ", React.createElement("span", {
      className: "n"
    }, "broken"), ", unsustainable and putting an unfair strain on Australians."), React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Add your name"))));
  }
  function DonateBlock() {
    const tiers = [{
      amt: '$25',
      note: 'Reach 500 more voters'
    }, {
      amt: '$50',
      note: 'Fund a day of digital ads',
      featured: true
    }, {
      amt: '$100',
      note: 'Power our research desk'
    }];
    const [sel, setSel] = useState(1);
    const [recurring, setRecurring] = useState(false);
    return React.createElement("section", {
      id: "donate",
      className: "section"
    }, React.createElement("div", {
      className: "container",
      style: {
        maxWidth: '780px',
        textAlign: 'center'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, React.createElement(Eyebrow, {
      variant: "navy"
    }, "Chip in")), React.createElement("h2", {
      className: "h2-display",
      style: {
        marginTop: '16px'
      }
    }, "This campaign runs on Australians like you."), React.createElement("p", {
      className: "body-p",
      style: {
        fontSize: '17px',
        margin: '18px auto 0',
        maxWidth: '56ch'
      }
    }, "We take no money from government or big party machines. Every dollar puts the case for fair migration in front of more voters."), React.createElement("div", {
      className: "tier-grid"
    }, tiers.map((t, i) => React.createElement("button", {
      key: t.amt,
      onClick: () => setSel(i),
      className: 'tier' + (sel === i ? ' tier-on' : '')
    }, t.featured && React.createElement("span", {
      className: "tier-tag"
    }, "Most chosen"), React.createElement("span", {
      className: "tier-amt"
    }, t.amt), React.createElement("span", {
      className: "tier-note"
    }, t.note)))), React.createElement("label", {
      style: {
        display: 'inline-flex',
        gap: '10px',
        alignItems: 'center',
        margin: '24px 0',
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--ink-700)',
        cursor: 'pointer'
      }
    }, React.createElement("input", {
      type: "checkbox",
      checked: recurring,
      onChange: e => setRecurring(e.target.checked),
      style: {
        width: '18px',
        height: '18px',
        accentColor: 'var(--navy-700)'
      }
    }), "Make it monthly \u2014 sustained pressure works"), React.createElement("div", null, React.createElement(Button, {
      variant: "donate",
      size: "lg"
    }, "Donate ", tiers[sel].amt, recurring ? '/mo' : '', " securely"), React.createElement("p", {
      style: {
        fontSize: '13px',
        color: 'var(--ink-400)',
        margin: '14px 0 0',
        fontWeight: 600
      }
    }, "Secure payment via Stripe \xB7 Authorised by Fair Migration, Australia"))));
  }
  function PageHead({
    eyebrow,
    title,
    lead,
    dark
  }) {
    return React.createElement("section", {
      className: 'page-head' + (dark ? ' page-head--dark' : '')
    }, React.createElement("div", {
      className: "container"
    }, React.createElement(Eyebrow, {
      variant: dark ? 'light' : undefined
    }, eyebrow), React.createElement("h1", null, title), lead && React.createElement("p", {
      className: "lead-p"
    }, lead)));
  }
  function Footer() {
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: "foot-cta"
    }, React.createElement("div", {
      className: "container foot-cta-inner"
    }, React.createElement("h2", null, "Australia's future is worth a signature."), React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Sign the petition"))), React.createElement("footer", {
      className: "footer"
    }, React.createElement("div", {
      className: "container",
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, React.createElement("a", {
      href: "index.html"
    }, React.createElement("img", {
      src: A + 'logo-full.png',
      alt: "Fair Migration",
      style: {
        height: '52px'
      }
    })), React.createElement("nav", {
      style: {
        display: 'flex',
        gap: '24px',
        fontSize: '14px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        flexWrap: 'wrap'
      }
    }, React.createElement("a", {
      href: "problem.html"
    }, "The problem"), React.createElement("a", {
      href: "map.html"
    }, "Impact map"), React.createElement("a", {
      href: "petition.html"
    }, "Sign"), React.createElement("a", {
      href: "donate.html"
    }, "Donate"), React.createElement("a", {
      href: "#"
    }, "Privacy Policy")), React.createElement("div", {
      className: "social",
      style: {
        fontSize: '13px',
        color: 'var(--ink-500)',
        fontWeight: 600
      }
    }, React.createElement("a", {
      href: "#"
    }, "Twitter"), React.createElement("a", {
      href: "#"
    }, "Facebook"), React.createElement("a", {
      href: "#"
    }, "Instagram"), React.createElement("a", {
      href: "#"
    }, "YouTube"))), React.createElement("div", {
      className: "container",
      style: {
        marginTop: '24px',
        fontSize: '12px',
        color: 'var(--ink-400)'
      }
    }, "\xA9 2026 Fair Migration. All rights reserved. \xB7 Map figures shown are sample data for demonstration.")));
  }
  window.FM = {
    A,
    GOAL,
    fmt,
    pct,
    clean4,
    safeGet,
    safeSet,
    markSigned,
    useLiveCount,
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
})();