/* Fair Migration — /share thank-you + referral page.
   Three states: polling (post-donation), ask_identity (unknown), ready (share). */

(function () {
  const {
    useState,
    useEffect,
    useRef
  } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const {
    SiteNav,
    Footer,
    PageHead,
    Star,
    useLiveCount,
    CFG,
    safeGet
  } = F;
  const {
    Input,
    Button
  } = DS;
  const PLATFORMS = [{
    id: 'facebook',
    label: 'Share on Facebook',
    bg: '#1877F2'
  }, {
    id: 'x',
    label: 'Post on X',
    bg: '#000000'
  }, {
    id: 'linkedin',
    label: 'Share on LinkedIn',
    bg: '#0A66C2'
  }, {
    id: 'whatsapp',
    label: 'Send on WhatsApp',
    bg: '#25D366'
  }, {
    id: 'email',
    label: 'Share by email',
    bg: '#C9A227'
  }, {
    id: 'copy',
    label: 'Copy link',
    bg: '#4B5563'
  }];
  function shareUrlFor(code) {
    return CFG.origin + '/petition?ref=' + encodeURIComponent(code);
  }
  function shareText(count) {
    return 'I just signed the Fair Migration petition — ' + (count || 'thousands of') + ' Australians are demanding our government put Australians first. Add your name:';
  }
  function getShared() {
    try {
      return JSON.parse(localStorage.getItem('ff_shared_platforms') || '[]');
    } catch (e) {
      return [];
    }
  }

  // browser Purchase — same event_id the Stripe webhook used (stripe_<session_id>) so Meta dedups
  function firePixelPurchase(sessionId) {
    if (!window.fbq || !sessionId) return;
    const key = 'ff_pixel_purchase_' + sessionId;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch (e) {}
    fetch('/api/checkout?session_id=' + encodeURIComponent(sessionId)).then(r => r.ok ? r.json() : null).then(j => {
      const s = j && j.session;
      if (!s || !s.paid) return;
      try {
        sessionStorage.setItem(key, '1');
      } catch (e) {}
      try {
        window.fbq('track', 'Purchase', {
          value: (s.amount_total || 0) / 100,
          currency: (s.currency || 'aud').toUpperCase()
        }, {
          eventID: 'stripe_' + sessionId
        });
      } catch (e) {}
    }).catch(() => {});
  }
  function ShareButtons({
    code,
    count
  }) {
    const url = shareUrlFor(code);
    const text = shareText(count);
    const [used, setUsed] = useState(getShared());
    const [copied, setCopied] = useState(false);
    function record(platform) {
      try {
        fetch('/api/share-issued', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            referral_code: code,
            platform,
            share_url: url
          }),
          keepalive: true
        });
      } catch (e) {}
      const next = Array.from(new Set(used.concat(platform)));
      setUsed(next);
      try {
        localStorage.setItem('ff_shared_platforms', JSON.stringify(next));
      } catch (e) {}
    }
    function open(platform) {
      record(platform);
      const u = encodeURIComponent(url),
        t = encodeURIComponent(text);
      let href = '';
      if (platform === 'facebook') href = 'https://www.facebook.com/sharer/sharer.php?u=' + u;else if (platform === 'x') href = 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t;else if (platform === 'linkedin') href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + u;else if (platform === 'whatsapp') href = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url);else if (platform === 'email') href = 'mailto:?subject=' + encodeURIComponent('Sign the Fair Migration petition') + '&body=' + encodeURIComponent(text + '\n\n' + url);
      if (platform === 'copy') {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          window.prompt('Copy your link:', url);
        });
        return;
      }
      window.open(href, '_blank', 'noopener');
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "share-btns"
    }, PLATFORMS.map(p => /*#__PURE__*/React.createElement("button", {
      key: p.id,
      className: 'share-btn' + (used.includes(p.id) ? ' is-used' : ''),
      style: {
        background: p.bg
      },
      onClick: () => open(p.id)
    }, /*#__PURE__*/React.createElement("span", null, p.id === 'copy' && copied ? 'Copied!' : p.label), used.includes(p.id) && /*#__PURE__*/React.createElement("span", {
      className: "share-tick"
    }, "✓"))));
  }
  function AskIdentity({
    onReady
  }) {
    const [d, setD] = useState({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      postcode: ''
    });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const set = k => e => {
      const v = e.target.value;
      setD(s => ({
        ...s,
        [k]: v
      }));
      if (err[k]) setErr(s => ({
        ...s,
        [k]: undefined
      }));
    };
    const submit = async e => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.lastName.trim()) n.lastName = 'Required';
      if (!d.email.trim()) n.email = 'Required';else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n);
      if (Object.keys(n).length) return;
      setBusy(true);
      try {
        const r = await fetch('/api/share-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            first_name: d.firstName.trim(),
            last_name: d.lastName.trim(),
            email: d.email.trim(),
            mobile: d.mobile.trim(),
            postcode: d.postcode.trim()
          })
        });
        const j = await r.json();
        if (j && j.success) {
          try {
            localStorage.setItem('ff_referral_code', j.referral_code);
            localStorage.setItem('ff_first_name', j.first_name || d.firstName);
          } catch (e2) {}
          onReady({
            referral_code: j.referral_code,
            first_name: j.first_name || d.firstName
          });
          return;
        }
      } catch (e3) {}
      setBusy(false);
      setErr({
        email: 'Something went wrong — please try again'
      });
    };
    return /*#__PURE__*/React.createElement("form", {
      className: "pform",
      onSubmit: submit,
      noValidate: true,
      style: {
        maxWidth: '460px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "pform-grid2"
    }, /*#__PURE__*/React.createElement(Input, {
      label: "First name *",
      name: "firstName",
      placeholder: "Jane",
      value: d.firstName,
      onChange: set('firstName'),
      invalid: !!err.firstName,
      hint: err.firstName
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Last name *",
      name: "lastName",
      placeholder: "Citizen",
      value: d.lastName,
      onChange: set('lastName'),
      invalid: !!err.lastName,
      hint: err.lastName
    })), /*#__PURE__*/React.createElement(Input, {
      label: "Email *",
      type: "email",
      name: "email",
      placeholder: "jane@example.com",
      value: d.email,
      onChange: set('email'),
      invalid: !!err.email,
      hint: err.email
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Mobile phone",
      type: "tel",
      name: "mobile",
      placeholder: "0400 000 000",
      value: d.mobile,
      onChange: set('mobile')
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Postcode",
      name: "postcode",
      placeholder: "2000",
      value: d.postcode,
      onChange: set('postcode'),
      inputMode: "numeric",
      maxLength: 4
    }), /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true,
      disabled: busy
    }, busy ? 'One moment…' : 'Get my share link'));
  }
  function ShareApp() {
    const [count] = useLiveCount();
    const [state, setState] = useState('loading');
    const [ctx, setCtx] = useState(null); // { referral_code, first_name }
    const pollRef = useRef(0);
    function ready(c) {
      setCtx(c);
      setState('ready');
    }
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      const emailParam = params.get('email');
      const localCode = safeGet('ff_referral_code');
      if (sessionId) {
        firePixelPurchase(sessionId);
        setState('polling');
        const tick = () => {
          pollRef.current += 1;
          fetch('/api/share-context?session_id=' + encodeURIComponent(sessionId)).then(r => r.ok ? r.json() : Promise.reject()).then(j => ready({
            referral_code: j.referral_code,
            first_name: j.first_name
          })).catch(() => {
            if (pollRef.current >= 15) setState('ask');else setTimeout(tick, 2000);
          });
        };
        tick();
        return;
      }
      if (localCode) {
        ready({
          referral_code: localCode,
          first_name: safeGet('ff_first_name') || ''
        });
        return;
      }
      if (emailParam) {
        fetch('/api/share-context?email=' + encodeURIComponent(emailParam)).then(r => r.ok ? r.json() : Promise.reject()).then(j => ready({
          referral_code: j.referral_code,
          first_name: j.first_name
        })).catch(() => setState('ask'));
        return;
      }
      setState('ask');
    }, []);
    const first = ctx && ctx.first_name ? ctx.first_name : 'friend';
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "share",
      count: count
    }), /*#__PURE__*/React.createElement(PageHead, {
      eyebrow: "Thank you",
      title: state === 'ready' ? 'Thank you, ' + first + '.' : 'Thank you for standing up.',
      lead: "Every share brings more Australians to the cause. Send your link — the petition you signed becomes their landing page."
    }), /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container",
      style: {
        maxWidth: '620px'
      }
    }, state === 'loading' && /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "Loading…"), state === 'polling' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "lead-p",
      style: {
        marginTop: 0
      }
    }, "Confirming your donation…"), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "This takes a few seconds while we finalise your receipt. Your share link will appear automatically."), /*#__PURE__*/React.createElement("div", {
      className: "share-spinner"
    })), state === 'ask' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "body-p",
      style: {
        marginTop: 0
      }
    }, "Pop your details in and we'll generate your personal share link — every person who signs through it is credited to you."), /*#__PURE__*/React.createElement(AskIdentity, {
      onReady: ready
    })), state === 'ready' && ctx && ctx.referral_code && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "body-p",
      style: {
        marginTop: 0
      }
    }, "Share your personal link. Sign-throughs and donations from people you bring in are tracked back to you."), /*#__PURE__*/React.createElement("div", {
      className: "share-link"
    }, /*#__PURE__*/React.createElement("code", null, shareUrlFor(ctx.referral_code))), /*#__PURE__*/React.createElement(ShareButtons, {
      code: ctx.referral_code,
      count: count.toLocaleString()
    })))), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(ShareApp, null));
})();