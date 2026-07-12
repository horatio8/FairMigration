/* Fair Migration — Donate page */
(function () {
  const {
    useEffect,
    useRef
  } = React;
  const F = window.FM;
  const {
    useLiveCount,
    SiteNav,
    DonateBlock,
    Footer
  } = F;

  // Self-hosted ad creatives (compressed from the launch set) — muted autoplay loops.
  const AD_VIDEOS = ['ad-1', 'ad-2', 'ad-3', 'ad-4', 'ad-5', 'ad-6', 'ad-7', 'ad-8', 'ad-9', 'ad-10'];
  function AdVideos() {
    const gridRef = useRef(null);
    useEffect(() => {
      const vids = gridRef.current ? Array.from(gridRef.current.querySelectorAll('video')) : [];
      if (!('IntersectionObserver' in window)) {
        vids.forEach(v => v.play().catch(() => {}));
        return undefined;
      }
      // only play videos while they're on screen — keeps 10 clips off the main thread
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          const v = e.target;
          if (e.isIntersecting) v.play().catch(() => {});else v.pause();
        });
      }, {
        threshold: 0.35
      });
      vids.forEach(v => io.observe(v));
      return () => io.disconnect();
    }, []);
    return /*#__PURE__*/React.createElement("section", {
      className: "section section--tint ad-videos"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head",
      style: {
        margin: '0 auto',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(F.Eyebrow, null, "Your money at work")), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "The ads your donation puts in front of Australians."), /*#__PURE__*/React.createElement("p", {
      className: "lead-p"
    }, "This is the work — the real campaign creative we run to cut through and tell Australians the truth about immigration.")), /*#__PURE__*/React.createElement("div", {
      className: "ad-videos-grid",
      ref: gridRef
    }, AD_VIDEOS.map((f, i) => /*#__PURE__*/React.createElement("div", {
      className: "ad-video",
      key: f
    }, /*#__PURE__*/React.createElement("video", {
      muted: true,
      loop: true,
      playsInline: true,
      preload: "metadata",
      "aria-label": 'Fair Migration ad ' + (i + 1)
    }, /*#__PURE__*/React.createElement("source", {
      src: 'assets/' + f + '.webm',
      type: "video/webm"
    }), /*#__PURE__*/React.createElement("source", {
      src: 'assets/' + f + '.mp4',
      type: "video/mp4"
    })))))));
  }
  function Page() {
    const [count] = useLiveCount();
    // On the post-donation upsell view, keep it focused — no ad gallery.
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const isUpsell = !!(params.get('upsell') || params.get('cs'));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "donate",
      count: count
    }), /*#__PURE__*/React.createElement(DonateBlock, null), !isUpsell && /*#__PURE__*/React.createElement(AdVideos, null), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();