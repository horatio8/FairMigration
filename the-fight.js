/* Fair Migration — The Fight: what we're fighting for and how we win. */
(function () {
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const {
    useLiveCount,
    SiteNav,
    PageHead,
    Footer,
    Eyebrow,
    Star,
    CFG
  } = F;
  const {
    Button
  } = DS;
  const PANELS = [{
    kicker: 'The demand',
    title: 'Cut the intake',
    body: 'Bring migration back to a level our housing, hospitals and infrastructure can actually carry. Not a pause. A permanent, honest number.'
  }, {
    kicker: 'The demand',
    title: 'Open the books',
    body: 'An independent audit of a migration program that has run for years without one. Australians deserve to see what was decided, and who it was decided for.'
  }, {
    kicker: 'The demand',
    title: 'Australians first',
    body: 'A system run in the interests of the people who built this country and pay for its services — not corporate lobbyists chasing cheap labour.'
  }];
  const STEPS = [{
    n: '01',
    h: 'Build the number',
    p: 'Every signature is a name Canberra has to answer to. A million of them is a mandate they cannot spin, bury or wait out.'
  }, {
    n: '02',
    h: 'Put it in front of them',
    p: 'We take the petition, the data and your suburb’s numbers directly to MPs — and to the voters in the seats that decide elections.'
  }, {
    n: '03',
    h: 'Make it an election issue',
    p: 'Ads, research and organising in the marginal seats, so no candidate can face a voter without a straight answer on migration.'
  }];
  function Page() {
    const [count] = useLiveCount();
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "fight",
      count: count
    }), /*#__PURE__*/React.createElement(PageHead, {
      eyebrow: "The fight",
      title: "They are betting you will get tired before they do.",
      lead: "Fair Migration exists to make that bet fail. Here is exactly what we are demanding, and how we intend to win it."
    }), /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head"
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "What we demand"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "Three things. No hedging.")), /*#__PURE__*/React.createElement("div", {
      className: "fight-panels"
    }, PANELS.map((p, i) => /*#__PURE__*/React.createElement("a", {
      className: "fight-panel",
      href: CFG.signHref || 'petition.html',
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "fight-panel-kicker"
    }, p.kicker), /*#__PURE__*/React.createElement("h3", {
      className: "fight-panel-title"
    }, p.title), /*#__PURE__*/React.createElement("p", null, p.body), /*#__PURE__*/React.createElement("span", {
      className: "fight-panel-cta"
    }, "Sign the petition ", /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "→"))))))), /*#__PURE__*/React.createElement("section", {
      className: "section section--tint"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head"
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "How we win"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "A campaign they cannot ignore.")), /*#__PURE__*/React.createElement("ol", {
      className: "fight-steps"
    }, STEPS.map(s => /*#__PURE__*/React.createElement("li", {
      className: "fight-step",
      key: s.n
    }, /*#__PURE__*/React.createElement("span", {
      className: "fight-step-n"
    }, s.n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, s.h), /*#__PURE__*/React.createElement("p", null, s.p))))))), /*#__PURE__*/React.createElement("section", {
      className: "fight-cta"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container fight-cta-inner"
    }, /*#__PURE__*/React.createElement(Star, {
      size: 38,
      color: "#fff",
      style: {
        display: 'block',
        margin: '0 auto 18px'
      }
    }), /*#__PURE__*/React.createElement("h2", null, "Australia’s future is on the line."), /*#__PURE__*/React.createElement("p", null, "It takes ten seconds to add your name. It takes a million of us to force a government to move."), /*#__PURE__*/React.createElement("div", {
      className: "fight-cta-buttons"
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      href: "petition.html"
    }, "Add your signature ›"), /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      size: "lg",
      href: "donate.html"
    }, "Fund the fight")))), /*#__PURE__*/React.createElement(Footer, {
      hideCta: true
    }));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();
