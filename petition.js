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
    PageHead,
    SignatureBar,
    PetitionSection,
    Footer
  } = F;
  function Page() {
    const [count, setCount] = useLiveCount();
    const [signed, setSigned] = useState(safeGet('fm_signed') === '1');
    const [pc, setPc] = useState(safeGet('fm_pc') || '');
    const onSign = data => {
      markSigned(data);
      setSigned(true);
      setCount(c => c + 1);
      setPc(clean4(data.postcode));
      try {
        const el = document.getElementById('petition');
        if (el) window.scrollTo({
          top: el.offsetTop - 80,
          behavior: 'smooth'
        });
      } catch (e) {}
    };
    return React.createElement("div", null, React.createElement(SiteNav, {
      active: "petition",
      count: count
    }), React.createElement(PageHead, {
      eyebrow: "Sign the petition",
      title: "Add your name.",
      lead: "It takes ten seconds. Then see exactly what migration is doing to your suburb."
    }), React.createElement(SignatureBar, {
      count: count
    }), React.createElement(PetitionSection, {
      count: count,
      signed: signed,
      pc: pc,
      onSign: onSign
    }), React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Page, null));
})();