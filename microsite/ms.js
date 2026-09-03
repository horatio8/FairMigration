/* Fair Migration — microsite landing (single-page sign funnel).
   Reuses the main site's brand + components via window.FM; posts to the main API. */
(function () {
  const {
    useState
  } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const {
    useLiveCount,
    markSigned,
    isSigned,
    safeGet,
    clean4,
    Eyebrow,
    SiteNav,
    SignatureBar,
    PetitionSection,
    Demand,
    Footer
  } = F;
  const {
    Button
  } = DS;
  function Hero() {
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
      href: "#sign"
    }, "Add your signature ›"))))));
  }
  function Page() {
    const [count, setCount] = useLiveCount();
    const [signed, setSigned] = useState(isSigned());
    const [pc, setPc] = useState(safeGet('fm_pc') || '');
    const onSign = data => {
      markSigned(data);
      setSigned(true);
      setCount(c => c + 1);
      setPc(clean4(data.postcode));
    };
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      minimal: true,
      count: count
    }), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(SignatureBar, {
      count: count
    }), /*#__PURE__*/React.createElement(PetitionSection, {
      count: count,
      signed: signed,
      pc: pc,
      onSign: onSign
    }), /*#__PURE__*/React.createElement(Demand, null), /*#__PURE__*/React.createElement(Footer, {
      minimal: true
    }));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();