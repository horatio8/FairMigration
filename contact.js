/* Fair Migration — Contact Us page. Posts to /api/contact, which pushes to the
   Campaign Nucleus contact receiver (first_name/last_name/email/phone/message). */
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
    Footer
  } = F;
  const {
    Input,
    Button
  } = DS;
  function ContactForm() {
    const [d, setD] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: ''
    });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
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
      if (!d.email.trim()) n.email = 'Required';else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      if (!d.message.trim()) n.message = 'Please add a message';
      setErr(n);
      if (Object.keys(n).length) return;
      setBusy(true);
      try {
        const r = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            first_name: d.firstName.trim(),
            last_name: d.lastName.trim(),
            email: d.email.trim(),
            phone: d.phone.trim(),
            message: d.message.trim()
          })
        });
        const j = await r.json();
        if (j && j.success) {
          setDone(true);
          return;
        }
      } catch (e2) {}
      setBusy(false);
      setErr({
        message: 'Something went wrong — please try again.'
      });
    };
    if (done) {
      return /*#__PURE__*/React.createElement("div", {
        className: "pform",
        style: {
          maxWidth: '520px'
        }
      }, /*#__PURE__*/React.createElement("h2", {
        style: {
          marginTop: 0
        }
      }, "Thank you — message received."), /*#__PURE__*/React.createElement("p", {
        className: "body-p",
        style: {
          marginBottom: 0
        }
      }, "We've got your message and one of the team will be in touch. In the meantime, the best way to help is to ", /*#__PURE__*/React.createElement("a", {
        href: "petition.html"
      }, "add your name to the petition"), "."));
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
      label: "Last name",
      name: "lastName",
      placeholder: "Citizen",
      value: d.lastName,
      onChange: set('lastName')
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
      label: "Phone",
      type: "tel",
      name: "phone",
      placeholder: "0400 000 000",
      value: d.phone,
      onChange: set('phone')
    }), /*#__PURE__*/React.createElement(Input, {
      label: "Message *",
      name: "message",
      multiline: true,
      rows: 5,
      placeholder: "How can we help?",
      value: d.message,
      onChange: set('message'),
      invalid: !!err.message,
      hint: err.message,
      maxLength: 250
    }), /*#__PURE__*/React.createElement("p", {
      className: "pform-fine"
    }, "We keep your details private — never sold or shared. Max 250 characters."), /*#__PURE__*/React.createElement(Button, {
      type: "submit",
      variant: "primary",
      size: "lg",
      fullWidth: true,
      disabled: busy
    }, busy ? 'Sending…' : 'Send message'));
  }
  function Page() {
    const [count] = useLiveCount();
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "contact",
      count: count
    }), /*#__PURE__*/React.createElement(PageHead, {
      eyebrow: "Contact us",
      title: "Get in touch.",
      lead: "Questions, media enquiries or want to help the campaign? Send us a message and we'll get back to you."
    }), /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement(ContactForm, null))), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();