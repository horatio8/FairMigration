/* Fair Migration — Donate page */
(function () {
  const { useEffect, useRef } = React;
  const F = window.FM;
  const { useLiveCount, SiteNav, DonateBlock, Footer } = F;

  // Self-hosted ad creatives (compressed from the launch set) — muted autoplay loops.
  const AD_VIDEOS = ['ad-1', 'ad-2', 'ad-3', 'ad-4', 'ad-5', 'ad-6', 'ad-7', 'ad-8', 'ad-9', 'ad-10'];

  function AdVideos() {
    const gridRef = useRef(null);
    useEffect(() => {
      const vids = gridRef.current ? Array.from(gridRef.current.querySelectorAll('video')) : [];
      if (!('IntersectionObserver' in window)) { vids.forEach((v) => v.play().catch(() => {})); return undefined; }
      // only play videos while they're on screen — keeps 10 clips off the main thread
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { const v = e.target; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); });
      }, { threshold: 0.35 });
      vids.forEach((v) => io.observe(v));
      return () => io.disconnect();
    }, []);
    return (
      <section className="section section--tint ad-videos">
        <div className="container container--wide">
          <div className="section-head" style={{ margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><F.Eyebrow>Your money at work</F.Eyebrow></div>
            <h2 className="h2-display">The ads your donation puts in front of Australians.</h2>
            <p className="lead-p">This is the work — the real campaign creative we run to cut through and tell Australians the truth about immigration.</p>
          </div>
          <div className="ad-videos-grid" ref={gridRef}>
            {AD_VIDEOS.map((f, i) => (
              <div className="ad-video" key={f}>
                <video muted loop playsInline preload="metadata" aria-label={'Fair Migration ad ' + (i + 1)}>
                  <source src={'assets/' + f + '.webm'} type="video/webm" />
                  <source src={'assets/' + f + '.mp4'} type="video/mp4" />
                </video>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function Page() {
    const [count] = useLiveCount();
    // On the post-donation upsell view, keep it focused — no ad gallery.
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const isUpsell = !!(params.get('upsell') || params.get('cs'));
    return (
      <div>
        <SiteNav active="donate" count={count} />
        <DonateBlock />
        {!isUpsell && <AdVideos />}
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
