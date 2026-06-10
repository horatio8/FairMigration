"use strict";

(function () {
  const {
    useState,
    useRef,
    useEffect
  } = React;
  const DS = window.FairMigrationDesignSystem_e28435;
  const {
    SiteHeader,
    PetitionForm,
    Card,
    Badge,
    Button
  } = DS;
  const {
    PostcodeTool
  } = window;
  const A = 'assets/';
  const GOAL = 75000;
  const fmt = n => n.toLocaleString();
  const pct = n => Math.min(100, n / GOAL * 100);
  function Eyebrow({
    children,
    variant
  }) {
    const cls = 'eyebrow' + (variant ? ' eyebrow--' + variant : '');
    return React.createElement("div", {
      className: cls
    }, children);
  }
  function TopBar({
    count,
    onSign
  }) {
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
    }), React.createElement("b", null, fmt(count)), "\xA0Australians have signed \xB7", ' ', React.createElement("a", {
      href: "#petition",
      onClick: e => {
        e.preventDefault();
        onSign();
      }
    }, "Add your name")))), React.createElement(SiteHeader, {
      logoSrc: A + 'logo-full.png',
      links: [{
        label: 'The problem',
        href: '#problem'
      }, {
        label: 'Impact map',
        href: '#map'
      }, {
        label: 'Sign',
        href: '#petition'
      }],
      donateHref: "#donate"
    }));
  }
  function Hero({
    count,
    onSign,
    onMap
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
      onClick: onSign
    }, "Sign the petition"), React.createElement(Button, {
      variant: "solid",
      size: "lg",
      onClick: onMap
    }, "See your suburb \u2192")), React.createElement("div", {
      className: "hero-ticker"
    }, React.createElement("img", {
      className: "tick-star",
      src: A + 'favicon-white.png',
      alt: ""
    }), React.createElement("div", null, React.createElement("div", {
      className: "tick-count"
    }, fmt(count)), React.createElement("div", {
      className: "tick-label"
    }, "Australians have signed")), React.createElement("div", {
      className: "progress"
    }, React.createElement("div", {
      className: "progress-fill",
      style: {
        width: pct(count) + '%'
      }
    })), React.createElement("div", {
      className: "goal-label"
    }, fmt(GOAL), " goal")))));
  }
  function Problem() {
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
    }, React.createElement("div", {
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
  function PetitionBlock({
    petitionRef,
    count,
    signed,
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
    }, React.createElement("img", {
      className: "star",
      src: A + 'favicon-navy.png',
      alt: ""
    }), t)))), React.createElement("div", {
      ref: petitionRef,
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
    }))), signed ? React.createElement(Card, {
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
    }, fmt(count)), " Australians demanding fair migration. We've opened your ", React.createElement("strong", null, "local impact map"), " \u2014 see what's happening in your suburb."), React.createElement(Button, {
      variant: "solid",
      fullWidth: true,
      onClick: () => document.getElementById('map').scrollIntoView({
        behavior: 'smooth'
      })
    }, "View my local impact \u2193"), React.createElement("div", {
      style: {
        height: '8px'
      }
    }), React.createElement(Button, {
      variant: "donate",
      fullWidth: true,
      href: "#donate"
    }, "Chip in to the campaign")) : React.createElement(PetitionForm, {
      title: "Sign the petition",
      blurb: "Add your name, then see your suburb's migration impact instantly.",
      onSign: onSign
    })))));
  }
  function MapSection({
    registerApi,
    onSign
  }) {
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
    }, React.createElement(PostcodeTool, {
      registerApi: registerApi,
      onSign: onSign
    }))));
  }
  function Demand({
    onSign
  }) {
    return React.createElement("section", {
      className: "section"
    }, React.createElement("div", {
      className: "container"
    }, React.createElement("div", {
      className: "manifesto"
    }, React.createElement(Eyebrow, null, "Our demand to Canberra"), React.createElement("img", {
      className: "star",
      src: A + 'favicon-navy.png',
      alt: "",
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
      onClick: onSign
    }, "Add your name"))));
  }
  function Donate() {
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
      className: "section section--tint"
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
  function Footer({
    onSign
  }) {
    return React.createElement(React.Fragment, null, React.createElement("div", {
      className: "foot-cta"
    }, React.createElement("div", {
      className: "container foot-cta-inner"
    }, React.createElement("h2", null, "Australia's future is worth a signature."), React.createElement(Button, {
      variant: "primary",
      size: "lg",
      onClick: onSign
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
    }, React.createElement("img", {
      src: A + 'logo-full.png',
      alt: "Fair Migration",
      style: {
        height: '52px'
      }
    }), React.createElement("nav", {
      style: {
        display: 'flex',
        gap: '24px',
        fontSize: '14px',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }
    }, React.createElement("a", {
      href: "#problem"
    }, "The problem"), React.createElement("a", {
      href: "#map"
    }, "Impact map"), React.createElement("a", {
      href: "#donate"
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
  function App() {
    const [count, setCount] = useState(48217);
    const [signed, setSigned] = useState(false);
    const petitionRef = useRef(null);
    const gisApi = useRef(null);
    useEffect(() => {
      const id = setInterval(() => setCount(c => c + (Math.random() < 0.6 ? 1 : 0)), 4200);
      return () => clearInterval(id);
    }, []);
    const scrollToPetition = () => {
      const el = petitionRef.current;
      if (el) window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 120,
        behavior: 'smooth'
      });
    };
    const scrollToMap = () => document.getElementById('map').scrollIntoView({
      behavior: 'smooth'
    });
    const handleSign = data => {
      setCount(c => c + 1);
      setSigned(true);
      const pc = (data && data.postcode || '').replace(/\D/g, '').slice(0, 4);
      setTimeout(() => {
        if (pc && pc.length === 4 && gisApi.current) {
          gisApi.current.showPostcode(pc);
          setTimeout(() => document.getElementById('map').scrollIntoView({
            behavior: 'smooth'
          }), 120);
        }
      }, 350);
    };
    return React.createElement("div", null, React.createElement(TopBar, {
      count: count,
      onSign: scrollToPetition
    }), React.createElement(Hero, {
      count: count,
      onSign: scrollToPetition,
      onMap: scrollToMap
    }), React.createElement(Problem, null), React.createElement(PetitionBlock, {
      petitionRef: petitionRef,
      count: count,
      signed: signed,
      onSign: handleSign
    }), React.createElement(MapSection, {
      registerApi: api => {
        gisApi.current = api;
      },
      onSign: scrollToPetition
    }), React.createElement(Demand, {
      onSign: scrollToPetition
    }), React.createElement(Donate, null), React.createElement(Footer, {
      onSign: scrollToPetition
    }));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));
})();