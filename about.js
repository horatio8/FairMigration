/* Fair Migration — About page (generic, privacy-first) */
(function () {
  const F = window.FM;
  const {
    useLiveCount,
    SiteNav,
    PageHead,
    Demand,
    Footer,
    Star
  } = F;
  function Page() {
    const [count] = useLiveCount();
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "about",
      count: count
    }), /*#__PURE__*/React.createElement(PageHead, {
      eyebrow: "About us",
      title: "Ordinary Australians who love their country.",
      lead: "Fair Migration is a grassroots movement of everyday patriots who believe Australia should put its own people first."
    }), /*#__PURE__*/React.createElement("section", {
      className: "section"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container",
      style: {
        maxWidth: '760px'
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "lead-p",
      style: {
        marginTop: 0
      }
    }, "We're patriots who care about Australia. We come from every state, every walk of life and every background — but we share one belief: that our housing, our healthcare and our infrastructure should serve the Australians who built them."), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "We're not a political party and we're not backed by any government. We're mums and dads, tradies and teachers, farmers and small-business owners who have watched mass migration drive up rents, stretch hospitals and gridlock the places we call home — and decided to do something about it."), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "This campaign is powered by people like you: a signature, a share, a small donation. Every dollar goes to keeping the pressure on Canberra until our leaders listen."))), /*#__PURE__*/React.createElement("section", {
      className: "section section--tint"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container",
      style: {
        maxWidth: '760px'
      }
    }, /*#__PURE__*/React.createElement(Star, {
      size: 40,
      className: "star",
      style: {
        display: 'block',
        marginBottom: 18
      }
    }), /*#__PURE__*/React.createElement("h2", {
      style: {
        marginTop: 0
      }
    }, "Why we keep our names private"), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "Standing up for a fair migration system shouldn't cost you your livelihood — but for too many Australians who speak out, it does. We keep our identities private to protect our supporters, our families and our businesses from being targeted, harassed or punished for holding a mainstream view that our leaders would rather silence."), /*#__PURE__*/React.createElement("p", {
      className: "body-p"
    }, "Privacy is how we stay safe and keep this movement growing. It lets Australians add their name and back the cause without fear. Your details are never sold or shared — we use them only to keep you updated on the campaign and to show Canberra how many of us there are."))), /*#__PURE__*/React.createElement(Demand, null), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();