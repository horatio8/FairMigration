/* Fair Migration — Sign the Petition page */
(function () {
  const { useState, useEffect } = React;
  const F = window.FM;
  const { useLiveCount, markSigned, isSigned, safeGet, clean4, SiteNav, PageHead, SignatureBar, PetitionSection, Footer } = F;

  function Page() {
    const [count, setCount] = useLiveCount();
    const [signed, setSigned] = useState(isSigned());
    const [pc, setPc] = useState(safeGet('fm_pc') || '');
    // Land visitors straight on the signature block so signing is one glance away.
    useEffect(() => {
      if (signed) return undefined;
      const t = setTimeout(() => {
        const el = document.getElementById('sign');
        if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 88; window.scrollTo({ top: y, behavior: 'smooth' }); }
      }, 350);
      return () => clearTimeout(t);
    }, []);
    const onSign = (data) => {
      markSigned(data); setSigned(true); setCount((c) => c + 1); setPc(clean4(data.postcode));
      try {
        const el = document.getElementById('petition');
        if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      } catch (e) {}
    };
    return (
      <div>
        <SiteNav active="petition" count={count} />
        <PageHead
          eyebrow="Sign the petition"
          title="Add your name."
          lead="It takes ten seconds. Then see exactly what migration is doing to your suburb." />
        <SignatureBar count={count} />
        <PetitionSection count={count} signed={signed} pc={pc} onSign={onSign} />
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
