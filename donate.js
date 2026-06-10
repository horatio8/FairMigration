"use strict";

(function () {
  const F = window.FM;
  const {
    useLiveCount,
    SiteNav,
    DonateBlock,
    Footer
  } = F;
  function Page() {
    const [count] = useLiveCount();
    return React.createElement("div", null, React.createElement(SiteNav, {
      active: "donate",
      count: count
    }), React.createElement(DonateBlock, null), React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Page, null));
})();