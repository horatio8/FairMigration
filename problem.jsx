/* Fair Migration — The Problem page (now includes the local impact map beneath) */
(function () {
  const { useRef, useEffect } = React;
  const F = window.FM;
  const { useLiveCount, clean4, safeGet, SiteNav, PageHead, Problem, MapStage, Demand, Footer } = F;

  function Page() {
    const [count] = useLiveCount();
    const api = useRef(null);
    useEffect(() => {
      const q = new URLSearchParams(window.location.search).get('pc');
      const pc = clean4(q || safeGet('fm_pc') || '');
      if (pc.length === 4 && api.current) api.current.showPostcode(pc);
      // deep-link straight to the map section (e.g. from the nav or /map redirect)
      if (window.location.hash === '#map') {
        setTimeout(() => {
          const el = document.getElementById('map');
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'smooth' });
        }, 380);
      }
    }, []);
    return (
      <div>
        <SiteNav active="problem" count={count} />
        <PageHead
          eyebrow="The problem"
          title="Mass migration is breaking what Australians rely on."
          lead="For years our leaders drove radical migration intakes. The strain shows up in housing, healthcare and infrastructure — and everyday Australians feel all three." />
        <Problem bare />
        <MapStage registerApi={(a) => { api.current = a; }} onSign={() => { window.location.href = 'petition.html'; }} />
        <Demand />
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
