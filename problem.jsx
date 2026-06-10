/* Fair Migration — The Problem page */
(function () {
  const F = window.FM;
  const { useLiveCount, SiteNav, PageHead, Problem, Demand, Footer } = F;

  function Page() {
    const [count] = useLiveCount();
    return (
      <div>
        <SiteNav active="problem" count={count} />
        <PageHead
          eyebrow="The problem"
          title="Mass migration is breaking what Australians rely on."
          lead="For years our leaders drove radical migration intakes. The strain shows up in housing, healthcare and infrastructure — and everyday Australians feel all three." />
        <Problem bare />
        <Demand />
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
