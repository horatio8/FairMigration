/* Fair Migration — Impact Map page */
(function () {
  const { useRef, useEffect } = React;
  const F = window.FM;
  const { useLiveCount, clean4, safeGet, SiteNav, MapStage, Footer } = F;

  function Page() {
    const [count] = useLiveCount();
    const api = useRef(null);
    useEffect(() => {
      const q = new URLSearchParams(window.location.search).get('pc');
      const pc = clean4(q || safeGet('fm_pc') || '');
      if (pc.length === 4 && api.current) api.current.showPostcode(pc);
    }, []);
    return (
      <div>
        <SiteNav active="map" count={count} />
        <MapStage registerApi={(a) => { api.current = a; }} onSign={() => { window.location.href = 'petition.html'; }} />
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
