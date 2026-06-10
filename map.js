"use strict";

(function () {
  const {
    useRef,
    useEffect
  } = React;
  const F = window.FM;
  const {
    useLiveCount,
    clean4,
    safeGet,
    SiteNav,
    MapStage,
    Footer
  } = F;
  function Page() {
    const [count] = useLiveCount();
    const api = useRef(null);
    useEffect(() => {
      const q = new URLSearchParams(window.location.search).get('pc');
      const pc = clean4(q || safeGet('fm_pc') || '');
      if (pc.length === 4 && api.current) api.current.showPostcode(pc);
    }, []);
    return React.createElement("div", null, React.createElement(SiteNav, {
      active: "map",
      count: count
    }), React.createElement(MapStage, {
      registerApi: a => {
        api.current = a;
      },
      onSign: () => {
        window.location.href = 'petition.html';
      }
    }), React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Page, null));
})();