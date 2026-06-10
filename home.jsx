/* Fair Migration — Home page */
(function () {
  const { useState } = React;
  const F = window.FM;
  const { useLiveCount, markSigned, safeGet, clean4, SiteNav, Hero, SignatureBar, Problem, PetitionSection, Demand, Footer } = F;

  function Home() {
    const [count, setCount] = useLiveCount();
    const [signed, setSigned] = useState(safeGet('fm_signed') === '1');
    const [pc, setPc] = useState(safeGet('fm_pc') || '');
    const onSign = (data) => {
      markSigned(data); setSigned(true); setCount((c) => c + 1); setPc(clean4(data.postcode));
    };
    return (
      <div>
        <SiteNav active="home" count={count} />
        <Hero count={count} />
        <SignatureBar count={count} />
        <Problem />
        <PetitionSection count={count} signed={signed} pc={pc} onSign={onSign} />
        <Demand />
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Home />);
})();
