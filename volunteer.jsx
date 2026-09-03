/* Fair Migration — Volunteer sign-up. */
(function () {
  const { useState } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { useLiveCount, SiteNav, PageHead, Footer, Eyebrow, CFG } = F;
  const { Input, Button } = DS;
  const API = CFG.apiBase || '';

  const HELP = [
    'Share the petition with my network',
    'Hand out flyers in my area',
    'Make phone calls from home',
    'Help at a stall or event',
    'Offer a skill (design, video, data, legal)',
  ];

  function VolunteerForm() {
    const [d, setD] = useState({ firstName: '', lastName: '', email: '', mobile: '', postcode: '' });
    const [help, setHelp] = useState([]);
    const [err, setErr] = useState({});
    const [state, setState] = useState('idle');
    const set = (k) => (e) => { const v = e.target.value; setD((s) => ({ ...s, [k]: v })); if (err[k]) setErr((s) => ({ ...s, [k]: undefined })); };
    const toggle = (h) => setHelp((s) => (s.includes(h) ? s.filter((x) => x !== h) : s.concat(h)));

    const submit = async (e) => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.email.trim()) n.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      setErr(n); if (Object.keys(n).length) return;
      setState('busy');
      try {
        const r = await fetch(API + '/api/join', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'volunteer', first_name: d.firstName.trim(), last_name: d.lastName.trim(),
            email: d.email.trim(), mobile: d.mobile.trim(), postcode: d.postcode.trim(),
            message: help.length ? 'Can help with: ' + help.join('; ') : 'Volunteer sign-up',
          }),
        });
        setState(r.ok ? 'done' : 'error');
      } catch (e2) { setState('error'); }
    };

    if (state === 'done') {
      return (
        <div className="pform" style={{ maxWidth: '520px' }}>
          <h2 style={{ marginTop: 0 }}>Welcome aboard.</h2>
          <p className="body-p">We&rsquo;ll be in touch with something concrete you can do — soon, and not too often.
            In the meantime the fastest thing that helps is <a href="petition.html">adding your name</a> and sending it to five mates.</p>
        </div>
      );
    }
    return (
      <form className="pform" onSubmit={submit} noValidate style={{ maxWidth: '520px' }}>
        <div className="pform-grid2">
          <Input label="First name *" name="firstName" placeholder="Jane" value={d.firstName} onChange={set('firstName')} invalid={!!err.firstName} hint={err.firstName} />
          <Input label="Last name" name="lastName" placeholder="Citizen" value={d.lastName} onChange={set('lastName')} />
        </div>
        <Input label="Email *" type="email" name="email" placeholder="jane@example.com" value={d.email} onChange={set('email')} invalid={!!err.email} hint={err.email} />
        <Input label="Mobile phone" type="tel" name="mobile" placeholder="0400 000 000" value={d.mobile} onChange={set('mobile')} />
        <Input label="Postcode" name="postcode" placeholder="2000" value={d.postcode} onChange={set('postcode')} inputMode="numeric" maxLength={4} />
        <fieldset className="vol-help">
          <legend>How can you help?</legend>
          {HELP.map((h) => (
            <label className="vol-help-opt" key={h}>
              <input type="checkbox" checked={help.includes(h)} onChange={() => toggle(h)} />
              <span>{h}</span>
            </label>
          ))}
        </fieldset>
        {state === 'error' && <p className="pform-fine" style={{ color: 'var(--red-600)' }}>Something went wrong — please try again.</p>}
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={state === 'busy'}>{state === 'busy' ? 'Signing you up…' : 'Count me in ›'}</Button>
        <p className="pform-fine"><span className="req">*</span> Required. We keep your details private — never sold or shared.</p>
      </form>
    );
  }

  function Page() {
    const [count] = useLiveCount();
    return (
      <div>
        <SiteNav active="volunteer" count={count} />
        <PageHead eyebrow="Volunteer" title="Give us an hour. We&rsquo;ll make it count."
          lead="This campaign runs on ordinary Australians doing small things in their own suburb. Tell us what you can do and we&rsquo;ll put it to work." />
        <section className="section">
          <div className="container vol-grid">
            <div>
              <Eyebrow>Why it matters</Eyebrow>
              <h2 className="h2-display" style={{ fontSize: 'clamp(26px,3vw,38px)' }}>They have staff. We have you.</h2>
              <p className="body-p">The other side has lobbyists, consultants and a communications budget. We have Australians who are done being
                told the strain on their rent, their hospital and their kids&rsquo; school is imaginary.</p>
              <p className="body-p">You don&rsquo;t need experience and you don&rsquo;t need to be political. You need a postcode and an hour.</p>
            </div>
            <VolunteerForm />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
