/* Fair Migration — News: latest videos, coverage and campaign updates. */
(function () {
  const { useState, useEffect } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { useLiveCount, SiteNav, PageHead, Footer, Eyebrow, CFG } = F;
  const { Input, Button } = DS;
  const API = CFG.apiBase || '';

  /* Real coverage only — add items here as they land. Never invent headlines. */
  const PRESS = [];

  function Videos() {
    const [videos, setVideos] = useState(null);
    useEffect(() => {
      let live = true;
      fetch(API + '/api/youtube').then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (live) setVideos((j && j.videos) || []); })
        .catch(() => { if (live) setVideos([]); });
      return () => { live = false; };
    }, []);
    if (videos === null) return <p className="body-p">Loading the latest videos…</p>;
    if (!videos.length) {
      return <p className="body-p">New videos will appear here as we publish them. In the meantime, the campaign ads we&rsquo;re running are on the <a href="donate.html">donate page</a>.</p>;
    }
    return (
      <div className="news-videos">
        {videos.slice(0, 6).map((v) => (
          <a className="news-video" key={v.id} href={v.url} target="_blank" rel="noopener">
            <div className="news-video-thumb"><img src={v.thumbnail} alt="" loading="lazy" /><span className="news-video-play" aria-hidden="true">▶</span></div>
            <h3>{v.title}</h3>
            {v.published && <time>{new Date(v.published).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</time>}
          </a>
        ))}
      </div>
    );
  }

  function Newsletter() {
    const [email, setEmail] = useState('');
    const [first, setFirst] = useState('');
    const [last, setLast] = useState('');
    const [state, setState] = useState('idle');
    const submit = async (e) => {
      e.preventDefault();
      // First and last name are not optional politeness: Campaign Nucleus drops
      // any entry missing them, so an incomplete sign-up would vanish silently.
      if (!first.trim() || !last.trim()) { setState('bad'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setState('bad'); return; }
      setState('busy');
      try {
        const r = await fetch(API + '/api/join', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'newsletter', first_name: first.trim(), last_name: last.trim(), email: email.trim() }),
        });
        setState(r.ok ? 'done' : 'bad');
      } catch (e2) { setState('bad'); }
    };
    if (state === 'done') {
      return <p className="news-news-done">You&rsquo;re on the list. We&rsquo;ll send you campaign updates — nothing else, unsubscribe anytime.</p>;
    }
    return (
      <form className="news-signup" onSubmit={submit} noValidate>
        <div className="pform-grid2">
          <Input label="First name *" name="nlFirst" placeholder="Jane" value={first}
            onChange={(e) => { setFirst(e.target.value); if (state === 'bad') setState('idle'); }} invalid={state === 'bad' && !first.trim()} />
          <Input label="Last name *" name="nlLast" placeholder="Citizen" value={last}
            onChange={(e) => { setLast(e.target.value); if (state === 'bad') setState('idle'); }} invalid={state === 'bad' && !last.trim()} />
        </div>
        <Input label="Email *" type="email" name="nlEmail" placeholder="jane@example.com" value={email}
          onChange={(e) => { setEmail(e.target.value); if (state === 'bad') setState('idle'); }}
          invalid={state === 'bad' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
          hint={state === 'bad' ? 'Please give your name and a valid email address' : undefined} />
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={state === 'busy'}>
          {state === 'busy' ? 'One moment…' : 'Keep me updated'}
        </Button>
      </form>
    );
  }

  function Page() {
    const [count] = useLiveCount();
    return (
      <div>
        <SiteNav active="news" count={count} />
        <PageHead eyebrow="News" title="What the campaign is doing."
          lead="Videos, coverage and updates from the fight for a migration system that puts Australians first." />

        <section className="section">
          <div className="container container--wide">
            <div className="section-head"><Eyebrow>Latest video</Eyebrow><h2 className="h2-display">Straight from the campaign.</h2></div>
            <Videos />
          </div>
        </section>

        <section className="section section--tint">
          <div className="container container--wide">
            <div className="section-head"><Eyebrow>In the media</Eyebrow><h2 className="h2-display">Coverage.</h2></div>
            {PRESS.length ? (
              <ul className="news-press">
                {PRESS.map((p, i) => (
                  <li key={i}><span className="news-press-outlet">{p.outlet}</span><a href={p.url}>{p.headline}</a></li>
                ))}
              </ul>
            ) : (
              <p className="body-p">Coverage will be listed here as it runs. Journalists — everything you need is on the <a href="media.html">media page</a>.</p>
            )}
          </div>
        </section>

        <section className="section">
          <div className="container news-signup-wrap">
            <div>
              <Eyebrow>Stay across it</Eyebrow>
              <h2 className="h2-display" style={{ fontSize: 'clamp(26px,3vw,38px)' }}>Get campaign updates.</h2>
              <p className="body-p">We&rsquo;ll tell you when the numbers move, when we put the petition in front of Canberra, and when we need you.</p>
            </div>
            <Newsletter />
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
