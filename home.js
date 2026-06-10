"use strict";

(function () {
  const {
    useState
  } = React;
  const F = window.FM;
  const {
    useLiveCount,
    markSigned,
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
    const [signed, setSigned] = useState(safeGet('fm_signed') === '1');
    const [pc, setPc] = useState(safeGet('fm_pc') || '');
    const onSign = data => {
      markSigned(data);
      setSigned(true);
      setCount(c => c + 1);
      setPc(clean4(data.postcode));
    };
    return React.createElement("div", null, React.createElement(SiteNav, {
      active: "home",
      count: count
    }), React.createElement(Hero, {
      count: count
    }), React.createElement(SignatureBar, {
      count: count
    }), React.createElement(Problem, null), React.createElement(PetitionSection, {
      count: count,
      signed: signed,
      pc: pc,
      onSign: onSign
    }), React.createElement(Demand, null), React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Home, null));
})();