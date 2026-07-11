/* Fair Migration — Contact Us page. Posts to /api/contact, which pushes to the
   Campaign Nucleus contact receiver (first_name/last_name/email/phone/message). */
(function () {
  const { useState } = React;
  const F = window.FM;
  const DS = window.FairMigrationDesignSystem_e28435;
  const { useLiveCount, SiteNav, PageHead, Footer } = F;
  const { Input, Button } = DS;

  function ContactForm() {
    const [d, setD] = useState({ firstName: '', lastName: '', email: '', phone: '', message: '' });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const set = (k) => (e) => { const v = e.target.value; setD((s) => ({ ...s, [k]: v })); if (err[k]) setErr((s) => ({ ...s, [k]: undefined })); };

    const submit = async (e) => {
      e.preventDefault();
      const n = {};
      if (!d.firstName.trim()) n.firstName = 'Required';
      if (!d.email.trim()) n.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) n.email = 'Enter a valid email address';
      if (!d.message.trim()) n.message = 'Please add a message';
      setErr(n); if (Object.keys(n).length) return;
      setBusy(true);
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name: d.firstName.trim(), last_name: d.lastName.trim(), email: d.email.trim(), phone: d.phone.trim(), message: d.message.trim() }) });
        const j = await r.json();
        if (j && j.success) { setDone(true); return; }
      } catch (e2) {}
      setBusy(false); setErr({ message: 'Something went wrong — please try again.' });
    };

    if (done) {
      return (
        <div className="pform" style={{ maxWidth: '520px' }}>
          <h2 style={{ marginTop: 0 }}>Thank you — message received.</h2>
          <p className="body-p" style={{ marginBottom: 0 }}>
            We've got your message and one of the team will be in touch. In the meantime, the best way
            to help is to <a href="petition.html">add your name to the petition</a>.
          </p>
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
        <Input label="Phone" type="tel" name="phone" placeholder="0400 000 000" value={d.phone} onChange={set('phone')} />
        <Input label="Message *" name="message" multiline rows={5} placeholder="How can we help?" value={d.message} onChange={set('message')} invalid={!!err.message} hint={err.message} maxLength={250} />
        <p className="pform-fine">We keep your details private — never sold or shared. Max 250 characters.</p>
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={busy}>{busy ? 'Sending…' : 'Send message'}</Button>
      </form>
    );
  }

  function Page() {
    const [count] = useLiveCount();
    return (
      <div>
        <SiteNav active="contact" count={count} />
        <PageHead
          eyebrow="Contact us"
          title="Get in touch."
          lead="Questions, media enquiries or want to help the campaign? Send us a message and we'll get back to you." />
        <section className="section">
          <div className="container">
            <ContactForm />
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
