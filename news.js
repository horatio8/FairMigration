/* Fair Migration — News: latest videos, coverage and campaign updates. */
(function () {
  const {
    useState,
    useEffect
  } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const {
    useLiveCount,
    SiteNav,
    PageHead,
    Footer,
    Eyebrow,
    CFG
  } = F;
  const {
    Input,
    Button
  } = DS;
  const API = CFG.apiBase || '';

  /* Real coverage only — add items here as they land. Never invent headlines. */
  const PRESS = [];
  function Videos() {
    const [videos, setVideos] = useState(null);
    useEffect(() => {
      let live = true;
      fetch(API + '/api/youtube').then(r => r.ok ? r.json() : null).then(j => {
        if (live) setVideos(j && j.videos || []);
      }).catch(() => {
        if (live) setVideos([]);
      });
      return () => {
        live = false;
      };
    }, []);
    if (videos === null) return /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "Loading the latest videos…");
    if (!videos.length) {
      return /*#__PURE__*/React.createElement("p", {
        className: "body-p"
      }, "New videos will appear here as we publish them. In the meantime, the campaign ads we’re running are on the ", /*#__PURE__*/React.createElement("a", {
        href: "donate.html"
      }, "donate page"), ".");
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "news-videos"
    }, videos.slice(0, 6).map(v => /*#__PURE__*/React.createElement("a", {
      className: "news-video",
      key: v.id,
      href: v.url,
      target: "_blank",
      rel: "noopener"
    }, /*#__PURE__*/React.createElement("div", {
      className: "news-video-thumb"
    }, /*#__PURE__*/React.createElement("img", {
      src: v.thumbnail,
      alt: "",
      loading: "lazy"
    }), /*#__PURE__*/React.createElement("span", {
      className: "news-video-play",
      "aria-hidden": "true"
    }, "▶")), /*#__PURE__*/React.createElement("h3", null, v.title), v.published && /*#__PURE__*/React.createElement("time", null, new Date(v.published).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })))));
  }
  function Newsletter() {
    const [email, setEmail] = useState('');
    const [first, setFirst] = useState('');
    const [last, setLast] = useState('');
    const [state, setState] = useState('idle');
    const submit = async e => {
      e.preventDefault();
      // First and last name are not optional politeness: Campaign Nucleus drops
      // any entry missing them, so an incomplete sign-up would vanish silently.
      if (!first.trim() || !last.trim()) {
        setState('bad');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setState('bad');
        return;
      }
      setState('busy');
      try {
        const r = await fetch(API + '/api/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            kind: 'newsletter',
            first_name: first.trim(),
            last_name: last.trim(),
            email: email.trim()
          })
        });
        setState(r.ok ? 'done' : 'bad');
      } catch (e2) {
        setState('bad');
      }
    };
    if (state === 'done') {
      return /*#__PURE__*/React.createElement("p", {
        className: "news-news-done"
      }, "You’re on the list. We’ll send you campaign updates — nothing else, unsubscribe anytime.");
    }
    return /*#__PURE__*/React.createElement("form", {
      className: "news-signup",
      onSubmit: submit,
      noValidate: true
    }, /*#__PURE__*/React.createElement("div", {
      className: "pform-grid2"
    }, /*#__PURE__*/React.createElement(Input, {
      label: "First name *",
      name: "nlFirst",
      placeholder: "Jane",
      value: first,
      onChange: e => {
        setFirst(e.target.value);
        if (state === 'bad') setState('idle');
      },
      invalid: state === 'bad' && !first.trim()
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Last name *",
      name: "nlLast",
      placeholder: "Citizen",
      value: last,
      onChange: e => {
        setLast(e.target.value);
        if (state === 'bad') setState('idle');
      },
      invalid: state === 'bad' && !last.trim()
    })), /*#__PURE__*/React.createElement(Input, {
      label: "Email *",
      type: "email",
      name: "nlEmail",
      placeholder: "jane@example.com",
      value: email,
      onChange: e => {
        setEmail(e.target.value);
        if (state === 'bad') setState('idle');
      },
      invalid: state === 'bad' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
      hint: state === 'bad' ? 'Please give your name and a valid email address' : undefined
    }), /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true,
      disabled: state === 'busy'
    }, state === 'busy' ? 'One moment…' : 'Keep me updated'));
  }
  function Page() {
    const [count] = useLiveCount();
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "news",
      count: count
    }), /*#__PURE__*/React.createElement(PageHead, {
      eyebrow: "News",
      title: "What the campaign is doing.",
      lead: "Videos, coverage and updates from the fight for a migration system that puts Australians first."
    }), /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head"
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "Latest video"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "Straight from the campaign.")), /*#__PURE__*/React.createElement(Videos, null))), /*#__PURE__*/React.createElement("section", {
      className: "section section--tint"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head"
    }, /*#__PURE__*/React.createElement(Eyebrow, null, "In the media"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "Coverage.")), PRESS.length ? /*#__PURE__*/React.createElement("ul", {
      className: "news-press"
    }, PRESS.map((p, i) => /*#__PURE__*/React.createElement("li", {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "news-press-outlet"
    }, p.outlet), /*#__PURE__*/React.createElement("a", {
      href: p.url
    }, p.headline)))) : /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "Coverage will be listed here as it runs. Journalists — everything you need is on the ", /*#__PURE__*/React.createElement("a", {
      href: "media.html"
    }, "media page"), "."))), /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container news-signup-wrap"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Stay across it"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display",
      style: {
        fontSize: 'clamp(26px,3vw,38px)'
      }
    }, "Get campaign updates."), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "We’ll tell you when the numbers move, when we put the petition in front of Canberra, and when we need you.")), /*#__PURE__*/React.createElement(Newsletter, null))), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();
