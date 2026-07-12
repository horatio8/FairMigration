/* Fair Migration — Donate page */
(function () {
  const F = window.FM;
  const {
    useLiveCount,
    SiteNav,
    DonateBlock,
    Footer
  } = F;

  // Facebook/Instagram ad creatives we run — embedded from Google Drive.
  const AD_VIDEOS = [{
    id: '1RkrmAR8kr_AUuI72_QD8imwygl0fJz6A',
    t: 'Launch 1'
  }, {
    id: '16AV_SKnOVcPQfdblWLb-dbaBdxqlRo88',
    t: 'Launch 2'
  }, {
    id: '1BHXMXyzWlxSI6-sQnFsn-Tb7Djo87bD7',
    t: 'Launch 3'
  }, {
    id: '1CwQTangMOw-Dcbo8oi1PAdJ-m6vmqJ7M',
    t: 'Launch 4'
  }, {
    id: '12xo1P5b72JGXMiSz71Q1M_enHS9U_pnP',
    t: 'Launch 5'
  }, {
    id: '1ObqY8QbLOpRddk7AT2XfeiBGVi4eCUNF',
    t: 'Launch 6'
  }, {
    id: '1G28aEB0TE9K15ewZDHS-lvNxGoypKVOf',
    t: 'Launch 7'
  }, {
    id: '1KUbVz1OVDeQ8Kt8IAxnRDE4Z1B8seg8x',
    t: 'Launch 8'
  }, {
    id: '1SvOcGWErF1nNoUbUpj7Od2asrezNszOT',
    t: 'Launch 9'
  }, {
    id: '132NXs-TCiy054xfsGejzdpnRzX8ZhuD_',
    t: 'Launch 10'
  }];
  function AdVideos() {
    return /*#__PURE__*/React.createElement("section", {
      className: "section section--tint ad-videos"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container container--wide"
    }, /*#__PURE__*/React.createElement("div", {
      className: "section-head",
      style: {
        margin: '0 auto',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(F.Eyebrow, null, "Your money at work")), /*#__PURE__*/React.createElement("h2", {
      className: "h2-display"
    }, "The ads your donation puts in front of Australians."), /*#__PURE__*/React.createElement("p", {
      className: "lead-p"
    }, "This is the work — the real campaign creative we run to cut through and tell Australians the truth about immigration.")), /*#__PURE__*/React.createElement("div", {
      className: "ad-videos-grid"
    }, AD_VIDEOS.map(v => /*#__PURE__*/React.createElement("div", {
      className: "ad-video",
      key: v.id
    }, /*#__PURE__*/React.createElement("iframe", {
      src: 'https://drive.google.com/file/d/' + v.id + '/preview',
      title: v.t,
      allow: "autoplay",
      allowFullScreen: true,
      loading: "lazy"
    }))))));
  }
  function Page() {
    const [count] = useLiveCount();
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteNav, {
      active: "donate",
      count: count
    }), /*#__PURE__*/React.createElement(DonateBlock, null), /*#__PURE__*/React.createElement(AdVideos, null), /*#__PURE__*/React.createElement(Footer, null));
  }
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Page, null));
})();