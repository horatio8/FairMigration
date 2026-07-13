/* Fair Migration — Home page */
(function () {
  const {
    useState
  } = React;
  const F = window.FM;
  const {
    useLiveCount,
    markSigned,
    isSigned,
    safeGet,
    clean4,
    SiteNav,
    Hero,
    SignatureBar,
    Problem,
    PetitionSection,
    Demand,
    Footer
  } = F;
  function Home() {
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
      active: "home",
      count: count
    }), /*#__PURE__*/React.createElement(Hero, {
      count: count
    }), /*#__PURE__*/React.createElement(SignatureBar, {
      count: count
    }), /*#__PURE__*/React.createElement(Problem, null), /*#__PURE__*/React.createElement(PetitionSection, {
      count: count,
      signed: signed,
      pc: pc,
      onSign: onSign
    }), /*#__PURE__*/React.createElement(Demand, null), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Home, null));
})();