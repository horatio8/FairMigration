/* Fair Migration — Volunteer sign-up. */
(function () {
  const {
    useState
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
  const HELP = ['Share the petition with my network', 'Hand out flyers in my area', 'Make phone calls from home', 'Help at a stall or event', 'Offer a skill (design, video, data, legal)'];
  function VolunteerForm() {
    const [d, setD] = useState({
      firstName: '',
      lastName: '',
      email: '',
      mobile: '',
      postcode: ''
    });
    const [help, setHelp] = useState([]);
    const [err, setErr] = useState({});
    const [state, setState] = useState('idle');
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
    const toggle = h => setHelp(s => s.includes(h) ? s.filter(x => x !== h) : s.concat(h));
    const submit = async e => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      // CN drops entries with no surname, so this cannot be optional.
      if (!d.lastName.trim()) n.lastName = 'Required';
      if (!d.email.trim()) n.email = 'Required';else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n);
      if (Object.keys(n).length) return;
      setState('busy');
      try {
        const r = await fetch(API + '/api/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            kind: 'volunteer',
            first_name: d.firstName.trim(),
            last_name: d.lastName.trim(),
            email: d.email.trim(),
            mobile: d.mobile.trim(),
            postcode: d.postcode.trim(),
            message: help.length ? 'Can help with: ' + help.join('; ') : 'Volunteer sign-up'
          })
        });
        setState(r.ok ? 'done' : 'error');
      } catch (e2) {
        setState('error');
      }
    };
    if (state === 'done') {
      return /*#__PURE__*/React.createElement("div", {
        className: "pform",
        style: {
          maxWidth: '520px'
        }
      }, /*#__PURE__*/React.createElement("h2", {
        style: {
          marginTop: 0
        }
      }, "Welcome aboard."), /*#__PURE__*/React.createElement("p", {
        className: "body-p"
      }, "We’ll be in touch with something concrete you can do — soon, and not too often. In the meantime the fastest thing that helps is ", /*#__PURE__*/React.createElement("a", {
        href: "petition.html"
      }, "adding your name"), " and sending it to five mates."));
    }
    return /*#__PURE__*/React.createElement("form", {
      className: "pform",
      onSubmit: submit,
      noValidate: true,
      style: {
        maxWidth: '520px'
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
    }), /*#__PURE__*/React.createElement("fieldset", {
      className: "vol-help"
    }, /*#__PURE__*/React.createElement("legend", null, "How can you help?"), HELP.map(h => /*#__PURE__*/React.createElement("label", {
      className: "vol-help-opt",
      key: h
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: help.includes(h),
      onChange: () => toggle(h)
    }), /*#__PURE__*/React.createElement("span", null, h)))), state === 'error' && /*#__PURE__*/React.createElement("p", {
      className: "pform-fine",
      style: {
        color: 'var(--red-600)'
      }
    }, "Something went wrong — please try again."), /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true,
      disabled: state === 'busy'
    }, state === 'busy' ? 'Signing you up…' : 'Count me in ›'), /*#__PURE__*/React.createElement("p", {
      className: "pform-fine"
    }, /*#__PURE__*/React.createElement("span", {
      className: "req"
    }, "*"), " Required. We keep your details private — never sold or shared."));
  }
  function Page() {
    const [count] = useLiveCount();
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "volunteer",
      count: count
    }), /*#__PURE__*/React.createElement(PageHead, {
      eyebrow: "Volunteer",
      title: "Give us an hour. We’ll make it count.",
      lead: "This campaign runs on ordinary Australians doing small things in their own suburb. Tell us what you can do and we’ll put it to work."
    }), /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container vol-grid"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Why it matters"), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display",
      style: {
        fontSize: 'clamp(26px,3vw,38px)'
      }
    }, "They have staff. We have you."), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "The other side has lobbyists, consultants and a communications budget. We have Australians who are done being told the strain on their rent, their hospital and their kids’ school is imaginary."), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "You don’t need experience and you don’t need to be political. You need a postcode and an hour.")), /*#__PURE__*/React.createElement(VolunteerForm, null))), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();
