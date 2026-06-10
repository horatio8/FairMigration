/* Fair Migration — Donate page */
(function () {
  const F = window.FM;
  const { useLiveCount, SiteNav, DonateBlock, Footer } = F;

  function Page() {
    const [count] = useLiveCount();
    return (
      <div>
        <SiteNav active="donate" count={count} />
        <DonateBlock />
        <Footer />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
})();
