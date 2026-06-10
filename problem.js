"use strict";

(function () {
  const F = window.FM;
  const {
    useLiveCount,
    SiteNav,
    PageHead,
    Problem,
    Demand,
    Footer
  } = F;
  function Page() {
    const [count] = useLiveCount();
    return React.createElement("div", null, React.createElement(SiteNav, {
      active: "problem",
      count: count
    }), React.createElement(PageHead, {
      eyebrow: "The problem",
      title: "Mass migration is breaking what Australians rely on.",
      lead: "For years our leaders drove radical migration intakes. The strain shows up in housing, healthcare and infrastructure \u2014 and everyday Australians feel all three."
    }), React.createElement(Problem, {
      bare: true
    }), React.createElement(Demand, null), React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Page, null));
})();