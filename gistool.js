"use strict";

(function () {
  const {
    useState,
    useMemo,
    useEffect
  } = React;
  const D = window.POSTCODE_DATA || {};
  const EXCL = window.POSTCODE_EXCLUDED || {};
  const PCS = Object.keys(D);
  const F = {
    loc: 0,
    state: 1,
    lat: 2,
    lng: 3,
    pop: 4,
    ob: 5,
    growth: 6,
    ann: 7,
    rentInc: 8,
    rent: 9,
    income: 10,
    migIdx: 11,
    growthIdx: 12,
    rentIdx: 13,
    allLoc: 14
  };
  const STOPS = [[0, [31, 122, 77]], [0.28, [127, 160, 60]], [0.5, [219, 158, 32]], [0.72, [200, 92, 38]], [1, [162, 1, 0]]];
  function heat(v) {
    v = Math.max(0, Math.min(1, v));
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const [v0, c0] = STOPS[i - 1],
          [v1, c1] = STOPS[i];
        const t = (v - v0) / (v1 - v0);
        const c = c0.map((x, k) => Math.round(x + (c1[k] - x) * t));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
      }
    }
    return 'rgb(162,1,0)';
  }
  const LAYERS = [{
    id: 'mig',
    label: 'Migration intensity',
    short: 'Migration index',
    idx: F.migIdx,
    raw: F.ob,
    rawLabel: 'Overseas-born share',
    rawUnit: '%',
    source: 'ABS Census 2021 — overseas-born share (proxy)'
  }, {
    id: 'growth',
    label: 'Population growth',
    short: 'Growth index',
    idx: F.growthIdx,
    raw: F.growth,
    rawLabel: 'Population growth 2016–21',
    rawUnit: '%',
    source: 'ABS Census 2016 & 2021'
  }, {
    id: 'rent',
    label: 'Rental stress',
    short: 'Rent-stress index',
    idx: F.rentIdx,
    raw: F.rentInc,
    rawLabel: 'Rent-to-income',
    rawUnit: '%',
    source: 'ABS Census 2021 — rent-to-income'
  }];
  const stateOf = pc => D[pc] ? D[pc][F.state] : null;
  const RANK = {};
  function ranksFor(field) {
    if (RANK[field]) return RANK[field];
    const arr = PCS.filter(p => D[p][field] != null).sort((a, b) => D[b][field] - D[a][field]);
    const map = {};
    arr.forEach((p, i) => {
      map[p] = i + 1;
    });
    return RANK[field] = {
      map,
      count: arr.length
    };
  }
  const SAVG = {};
  function stateAvg(field) {
    if (SAVG[field]) return SAVG[field];
    const sum = {},
      cnt = {};
    for (const p of PCS) {
      const v = D[p][field];
      if (v == null) continue;
      const s = D[p][F.state];
      sum[s] = (sum[s] || 0) + v;
      cnt[s] = (cnt[s] || 0) + 1;
    }
    const m = {};
    for (const s in sum) m[s] = sum[s] / cnt[s];
    return SAVG[field] = m;
  }
  function topPostcode(stateCode, field) {
    let best = null,
      bv = -1;
    for (const p of PCS) {
      if (D[p][F.state] !== stateCode) continue;
      const v = D[p][field];
      if (v != null && v > bv) {
        bv = v;
        best = p;
      }
    }
    return best;
  }
  function nearbyGrid(pc) {
    const a = D[pc];
    if (!a || a[F.lat] == null) return [pc];
    const la = a[F.lat],
      lo = a[F.lng],
      cosl = Math.cos(la * Math.PI / 180);
    const arr = PCS.filter(p => D[p][F.lat] != null).map(p => {
      const dx = (D[p][F.lng] - lo) * cosl,
        dy = D[p][F.lat] - la;
      return [p, dx * dx + dy * dy];
    });
    arr.sort((x, y) => x[1] - y[1]);
    let near = arr.slice(0, 25).map(x => x[0]);
    near.sort((x, y) => D[y][F.lat] - D[x][F.lat]);
    const out = [];
    for (let i = 0; i < near.length; i += 5) out.push(...near.slice(i, i + 5).sort((x, y) => D[x][F.lng] - D[y][F.lng]));
    return out;
  }
  const STATES = [{
    code: 'WA',
    name: 'Western Australia',
    col: 1,
    row: 2
  }, {
    code: 'NT',
    name: 'Northern Territory',
    col: 2,
    row: 1
  }, {
    code: 'SA',
    name: 'South Australia',
    col: 2,
    row: 2
  }, {
    code: 'QLD',
    name: 'Queensland',
    col: 3,
    row: 1
  }, {
    code: 'NSW',
    name: 'New South Wales',
    col: 3,
    row: 2
  }, {
    code: 'ACT',
    name: 'Aust. Capital Terr.',
    col: 4,
    row: 2
  }, {
    code: 'VIC',
    name: 'Victoria',
    col: 3,
    row: 3
  }, {
    code: 'TAS',
    name: 'Tasmania',
    col: 3,
    row: 4
  }];
  function StateTile({
    s,
    v,
    onPick
  }) {
    const [hover, setHover] = useState(false);
    return React.createElement("button", {
      onClick: () => onPick(s),
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: {
        gridColumn: s.col,
        gridRow: s.row,
        background: heat(v / 100),
        border: 'none',
        cursor: 'pointer',
        borderRadius: '6px',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 4px',
        minHeight: '64px',
        position: 'relative',
        boxShadow: hover ? '0 0 0 3px rgba(255,255,255,.85), var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'transform .12s ease, box-shadow .12s ease',
        textShadow: '0 1px 2px rgba(0,0,0,.35)'
      },
      title: `${s.name} — average ${Math.round(v)} / 100 · click to drill in`
    }, React.createElement("span", {
      style: {
        fontSize: '17px',
        fontWeight: 900,
        letterSpacing: '0.02em'
      }
    }, s.code), React.createElement("span", {
      style: {
        fontSize: '12px',
        fontWeight: 700,
        opacity: 0.95
      }
    }, Math.round(v)));
  }
  function Legend() {
    const grad = `linear-gradient(90deg, ${heat(0)}, ${heat(0.28)}, ${heat(0.5)}, ${heat(0.72)}, ${heat(1)})`;
    return React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
        color: 'var(--ink-500)',
        fontWeight: 600
      }
    }, React.createElement("span", null, "Lower"), React.createElement("span", {
      style: {
        flex: 1,
        height: '8px',
        borderRadius: '999px',
        background: grad,
        minWidth: '120px'
      }
    }), React.createElement("span", null, "Higher"));
  }
  function Trend({
    v,
    label
  }) {
    if (v == null) return React.createElement("span", {
      style: {
        color: 'var(--ink-400)',
        fontWeight: 700
      }
    }, "n/a");
    const up = v >= 0;
    return React.createElement("span", {
      style: {
        color: up ? 'var(--red-500)' : 'var(--color-success)',
        fontWeight: 800,
        fontSize: '13px',
        whiteSpace: 'nowrap'
      }
    }, up ? '▲' : '▼', " ", Math.abs(v).toFixed(up && label ? 2 : 1), "%", label ? ' ' + label : '');
  }
  function Row({
    label,
    value,
    muted
  }) {
    return React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '12px',
        fontSize: '14px',
        borderBottom: '1px dashed var(--line-200)',
        paddingBottom: '8px'
      }
    }, React.createElement("span", {
      style: {
        color: 'var(--ink-500)',
        fontWeight: 600
      }
    }, label), React.createElement("span", {
      style: {
        color: muted ? 'var(--ink-500)' : 'var(--ink-900)',
        fontWeight: muted ? 600 : 800,
        textAlign: 'right'
      }
    }, value));
  }
  function PostcodeGrid({
    cells,
    field,
    selected,
    centre,
    onSelect
  }) {
    return React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '6px',
        aspectRatio: '1 / 1'
      }
    }, cells.map(pc => {
      const v = D[pc][field];
      const isSel = pc === selected,
        isCentre = pc === centre;
      return React.createElement("button", {
        key: pc,
        onClick: () => onSelect(pc),
        style: {
          background: heat((v || 0) / 100),
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          borderRadius: '4px',
          padding: '6px 5px',
          overflow: 'hidden',
          outline: isCentre ? '3px solid #0d3b66' : 'none',
          outlineOffset: isCentre ? '-3px' : 0,
          boxShadow: isSel ? '0 0 0 3px #fff, 0 0 0 5px #0d3b66' : 'none',
          transition: 'box-shadow .12s ease',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'flex-end',
          minHeight: 0
        },
        title: `${D[pc][F.loc]} ${pc} — ${Math.round(v)} / 100`
      }, React.createElement("span", {
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: '10.5px',
          fontWeight: 700,
          lineHeight: 1.05,
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,.55)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }
      }, D[pc][F.loc]), isCentre && React.createElement("span", {
        style: {
          position: 'absolute',
          top: 4,
          right: 5,
          fontSize: '11px'
        },
        title: "Your postcode"
      }, "\u2605"));
    }));
  }
  function StatPanel({
    pc,
    layer,
    setLayer,
    onBackNational,
    onSign
  }) {
    const rec = D[pc];
    const idxVal = rec[layer.idx];
    const ranks = ranksFor(layer.idx);
    const rank = ranks.map[pc];
    const rawVal = rec[layer.raw];
    const allLoc = rec[F.allLoc];
    return React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }
    }, React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)'
      }
    }, "Your area"), React.createElement("div", {
      style: {
        fontSize: '26px',
        fontWeight: 900,
        letterSpacing: '-0.02em',
        color: 'var(--ink-900)',
        marginTop: '2px',
        lineHeight: 1.12
      }
    }, rec[F.loc]), React.createElement("div", {
      style: {
        fontSize: '14px',
        color: 'var(--ink-500)',
        fontWeight: 600
      }
    }, pc, " \xB7 ", rec[F.state], rec[F.pop] != null ? ' · ' + rec[F.pop].toLocaleString() + ' residents (2021)' : ''), allLoc && allLoc !== rec[F.loc] && React.createElement("div", {
      style: {
        fontSize: '12px',
        color: 'var(--ink-400)',
        fontWeight: 600,
        marginTop: '4px',
        lineHeight: 1.4
      }
    }, "Covers: ", allLoc)), React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
      }
    }, React.createElement("div", {
      style: {
        background: 'var(--mist-50)',
        border: '1px solid var(--line-200)',
        borderRadius: '8px',
        padding: '12px 14px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)'
      }
    }, layer.short), React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px'
      }
    }, React.createElement("span", {
      style: {
        fontSize: '30px',
        fontWeight: 900,
        color: heat((idxVal || 0) / 100),
        letterSpacing: '-0.02em'
      }
    }, idxVal == null ? '—' : Math.round(idxVal)), React.createElement("span", {
      style: {
        fontSize: '13px',
        color: 'var(--ink-400)',
        fontWeight: 700
      }
    }, "/100"))), React.createElement("div", {
      style: {
        background: 'var(--mist-50)',
        border: '1px solid var(--line-200)',
        borderRadius: '8px',
        padding: '12px 14px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)'
      }
    }, "Growth / yr"), React.createElement("div", {
      style: {
        marginTop: '6px'
      }
    }, React.createElement(Trend, {
      v: rec[F.ann]
    })))), React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, React.createElement(Row, {
      label: layer.rawLabel,
      value: rawVal == null ? 'n/a' : rawVal.toFixed(1) + layer.rawUnit
    }), React.createElement(Row, {
      label: "Population growth 2016\u201321",
      value: rec[F.growth] == null ? 'n/a' : (rec[F.growth] >= 0 ? '+' : '') + rec[F.growth].toFixed(1) + '%'
    }), React.createElement(Row, {
      label: "Median weekly rent",
      value: rec[F.rent] == null ? 'n/a' : '$' + rec[F.rent].toLocaleString()
    }), React.createElement(Row, {
      label: "Median weekly income",
      value: rec[F.income] == null ? 'n/a' : '$' + rec[F.income].toLocaleString()
    }), React.createElement(Row, {
      label: "National rank",
      value: rank ? '#' + rank.toLocaleString() + ' of ' + ranks.count.toLocaleString() : 'n/a'
    }), React.createElement(Row, {
      label: "Data source",
      value: layer.source,
      muted: true
    })), React.createElement("div", {
      style: {
        borderTop: '1px solid var(--line-200)',
        paddingTop: '16px'
      }
    }, React.createElement("p", {
      style: {
        margin: 0,
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--ink-700)'
      }
    }, React.createElement("strong", {
      style: {
        color: 'var(--ink-900)'
      }
    }, rec[F.loc]), " sits", ' ', React.createElement("strong", {
      style: {
        color: heat((idxVal || 0) / 100)
      }
    }, idxVal > 66 ? 'far above' : idxVal > 40 ? 'above' : 'near'), ' ', "the national average on ", layer.label.toLowerCase(), ". This is the strain on ", React.createElement("span", {
      style: {
        fontWeight: 800
      }
    }, "YOUR"), " community.")));
  }
  function LayerBar({
    layerId,
    setLayer
  }) {
    return React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        padding: '16px 26px',
        borderBottom: '1px solid var(--line-200)',
        background: 'var(--mist-50)'
      }
    }, LAYERS.map(l => {
      const on = l.id === layerId;
      return React.createElement("button", {
        key: l.id,
        onClick: () => setLayer(l.id),
        style: {
          cursor: 'pointer',
          textAlign: 'center',
          borderRadius: '10px',
          padding: '13px 8px',
          fontFamily: 'var(--font-sans)',
          border: '2px solid ' + (on ? 'var(--navy-700)' : 'var(--line-200)'),
          background: on ? 'var(--navy-700)' : 'var(--white)',
          color: on ? '#fff' : 'var(--ink-900)',
          transition: 'all .12s ease',
          boxShadow: on ? 'var(--shadow-sm)' : 'none'
        }
      }, React.createElement("div", {
        style: {
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '-0.01em'
        }
      }, l.label), React.createElement("div", {
        style: {
          fontSize: '11px',
          fontWeight: 600,
          marginTop: '3px',
          color: on ? 'rgba(255,255,255,.75)' : 'var(--ink-500)'
        }
      }, l.short));
    }));
  }
  function Rankings({
    field,
    layer,
    onPick,
    activePc
  }) {
    const top = useMemo(() => PCS.filter(p => D[p][field] != null).sort((a, b) => D[b][field] - D[a][field]).slice(0, 25), [field]);
    return React.createElement("div", {
      style: {
        padding: '22px 26px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: '15px',
        fontWeight: 800,
        color: 'var(--ink-900)'
      }
    }, "Australia's highest ", layer.label.toLowerCase(), " suburbs"), React.createElement("div", {
      style: {
        fontSize: '12px',
        color: 'var(--ink-500)',
        fontWeight: 600,
        margin: '2px 0 14px'
      }
    }, "Ranked by ", layer.short, " \xB7 tap a row to open it on the map"), React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }
    }, top.map((p, i) => {
      const v = D[p][field];
      return React.createElement("button", {
        key: p,
        onClick: () => onPick(p),
        style: {
          display: 'grid',
          gridTemplateColumns: '30px 1fr 56px 38px',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left',
          cursor: 'pointer',
          background: p === activePc ? 'var(--navy-50)' : 'var(--white)',
          border: '1px solid var(--line-200)',
          borderRadius: '8px',
          padding: '9px 12px',
          fontFamily: 'var(--font-sans)'
        }
      }, React.createElement("span", {
        style: {
          fontSize: '14px',
          fontWeight: 900,
          color: 'var(--ink-400)'
        }
      }, i + 1), React.createElement("span", {
        style: {
          minWidth: 0,
          overflow: 'hidden'
        }
      }, React.createElement("span", {
        style: {
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--ink-900)'
        }
      }, D[p][F.loc]), ' ', React.createElement("span", {
        style: {
          fontSize: '12px',
          color: 'var(--ink-400)',
          fontWeight: 600
        }
      }, p, " \xB7 ", D[p][F.state])), React.createElement("span", {
        style: {
          height: '8px',
          borderRadius: '999px',
          background: 'var(--mist-100)',
          overflow: 'hidden'
        }
      }, React.createElement("span", {
        style: {
          display: 'block',
          height: '100%',
          width: Math.round(v) + '%',
          background: heat(v / 100)
        }
      })), React.createElement("span", {
        style: {
          fontSize: '15px',
          fontWeight: 900,
          color: heat(v / 100),
          textAlign: 'right'
        }
      }, Math.round(v)));
    })));
  }
  function PostcodeTool({
    initialPostcode,
    onSign,
    registerApi
  }) {
    const [mode, setMode] = useState('national');
    const [view, setView] = useState('map');
    const [pc, setPc] = useState(initialPostcode && D[initialPostcode] ? initialPostcode : '');
    const [entry, setEntry] = useState('');
    const [layerId, setLayerId] = useState('mig');
    const [sel, setSel] = useState(null);
    const [err, setErr] = useState('');
    const layer = LAYERS.find(l => l.id === layerId);
    const cells = useMemo(() => pc && D[pc] ? nearbyGrid(pc) : [], [pc]);
    const savg = useMemo(() => stateAvg(layer.idx), [layerId]);
    function go(code) {
      const v = String(code || '').trim();
      if (!/^\d{3,4}$/.test(v)) {
        setErr('Enter a valid postcode');
        return;
      }
      const key = v.length === 3 ? '0' + v : v;
      if (D[key]) {
        setErr('');
        setPc(key);
        setSel(key);
        setMode('local');
        return;
      }
      if (EXCL[key]) {
        const e = EXCL[key];
        setErr(`${key}${e[1] ? ' (' + e[1] + ')' : ''} isn’t reportable — ${e[3]}`);
        return;
      }
      setErr('No ABS data for postcode ' + key + ' — try a nearby one');
    }
    useEffect(() => {
      if (registerApi) registerApi({
        showPostcode: code => {
          const k = String(code || '').replace(/\D/g, '').slice(0, 4);
          setEntry(k);
          go(k);
        }
      });
    }, []);
    const active = sel && D[sel] ? sel : pc;
    return React.createElement("div", {
      style: {
        background: '#fff',
        border: '1px solid var(--line-200)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }
    }, React.createElement("div", {
      style: {
        padding: '22px 26px',
        borderBottom: '1px solid var(--line-200)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--navy-700)'
      }
    }, React.createElement("div", {
      style: {
        minWidth: '200px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--coral-400)',
        lineHeight: 1.4,
        whiteSpace: 'nowrap'
      }
    }, "Migration Impact Map"), React.createElement("div", {
      style: {
        fontSize: '21px',
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '-0.01em',
        marginTop: '4px',
        lineHeight: 1.15,
        whiteSpace: 'nowrap'
      }
    }, mode === 'national' ? 'See it across Australia' : 'Your local impact')), React.createElement("form", {
      onSubmit: e => {
        e.preventDefault();
        go(entry);
      },
      style: {
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }
    }, React.createElement("div", null, React.createElement("input", {
      value: entry,
      onChange: e => setEntry(e.target.value.replace(/\D/g, '').slice(0, 4)),
      inputMode: "numeric",
      placeholder: "Enter postcode",
      style: {
        width: '150px',
        fontFamily: 'var(--font-sans)',
        fontSize: '16px',
        fontWeight: 600,
        padding: '11px 14px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid transparent',
        outline: 'none',
        boxShadow: 'var(--shadow-xs)'
      }
    }), err && React.createElement("div", {
      style: {
        color: 'var(--coral-400)',
        fontSize: '12px',
        fontWeight: 700,
        marginTop: '5px',
        maxWidth: '230px',
        lineHeight: 1.4
      }
    }, err)), React.createElement("button", {
      type: "submit",
      style: {
        background: 'var(--red-500)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        padding: '11px 18px',
        fontSize: '15px',
        fontWeight: 800,
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--shadow-xs)'
      },
      onMouseEnter: e => e.currentTarget.style.background = 'var(--red-600)',
      onMouseLeave: e => e.currentTarget.style.background = 'var(--red-500)'
    }, mode === 'national' ? 'View my area' : 'Update'))), React.createElement(LayerBar, {
      layerId: layerId,
      setLayer: setLayerId
    }), React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 26px',
        borderBottom: '1px solid var(--line-200)'
      }
    }, React.createElement("div", {
      style: {
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--ink-500)'
      }
    }, view === 'rank' ? 'Ranked suburbs' : mode === 'local' && D[pc] ? D[pc][F.loc] + ' · ' + pc : 'Explore across Australia'), React.createElement("div", {
      style: {
        display: 'inline-flex',
        background: 'var(--mist-100)',
        borderRadius: '999px',
        padding: '3px'
      }
    }, [['map', 'Map'], ['rank', 'Rankings']].map(it => React.createElement("button", {
      key: it[0],
      onClick: () => setView(it[0]),
      style: {
        border: 'none',
        cursor: 'pointer',
        borderRadius: '999px',
        padding: '6px 16px',
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        fontWeight: 800,
        background: view === it[0] ? 'var(--navy-700)' : 'transparent',
        color: view === it[0] ? '#fff' : 'var(--ink-500)',
        transition: 'all .12s ease'
      }
    }, it[1])))), view === 'rank' ? React.createElement(Rankings, {
      field: layer.idx,
      layer: layer,
      activePc: active,
      onPick: p => {
        setEntry(p);
        go(p);
        setView('map');
      }
    }) : mode === 'national' || !D[pc] ? React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr',
        gap: '0'
      }
    }, React.createElement("div", {
      style: {
        padding: '28px 26px',
        borderRight: '1px solid var(--line-200)'
      }
    }, React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        gap: '8px',
        maxWidth: '380px',
        margin: '0 auto'
      }
    }, STATES.map(s => React.createElement(StateTile, {
      key: s.code,
      s: s,
      v: savg[s.code] || 0,
      onPick: st => {
        const top = topPostcode(st.code, layer.idx);
        if (top) {
          setEntry(top);
          go(top);
        }
      }
    }))), React.createElement("div", {
      style: {
        maxWidth: '380px',
        margin: '22px auto 0'
      }
    }, React.createElement(Legend, null))), React.createElement("div", {
      style: {
        padding: '28px 26px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }
    }, React.createElement("h3", {
      style: {
        margin: '0 0 12px',
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '-0.02em',
        color: 'var(--ink-900)',
        lineHeight: 1.15
      }
    }, "Migration isn't abstract. It's ", React.createElement("span", {
      style: {
        color: 'var(--red-500)'
      }
    }, "your suburb.")), React.createElement("p", {
      style: {
        margin: '0 0 16px',
        fontSize: '15px',
        lineHeight: 1.65,
        color: 'var(--ink-700)'
      }
    }, "Enter your postcode to see real ABS figures for ", React.createElement("strong", null, "your area"), " \u2014 migration intensity, population growth and rental stress, ranked against every postcode in Australia. Tap any state for its busiest postcode."), React.createElement("ul", {
      style: {
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }
    }, ['Real per-postcode figures from the ABS Census', 'Migration, growth and rental-stress layers', 'Ranked against 2,532 postcodes nationwide'].map(t => React.createElement("li", {
      key: t,
      style: {
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        fontSize: '14px',
        color: 'var(--ink-700)',
        fontWeight: 600
      }
    }, React.createElement("span", {
      style: {
        color: 'var(--red-500)',
        fontWeight: 900
      }
    }, "\u203A"), t))))) : React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: '0'
      }
    }, React.createElement("div", {
      style: {
        padding: '26px',
        borderRight: '1px solid var(--line-200)'
      }
    }, React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px'
      }
    }, React.createElement("div", {
      style: {
        fontSize: '15px',
        fontWeight: 800,
        color: 'var(--ink-900)',
        whiteSpace: 'nowrap'
      }
    }, D[pc][F.loc], " ", React.createElement("span", {
      style: {
        color: 'var(--ink-400)',
        fontWeight: 700
      }
    }, "\xB7 ", pc)), React.createElement("div", {
      style: {
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--ink-500)',
        textAlign: 'right'
      }
    }, layer.label)), React.createElement(PostcodeGrid, {
      cells: cells,
      field: layer.idx,
      selected: active,
      centre: pc,
      onSelect: setSel
    }), React.createElement("div", {
      style: {
        marginTop: '16px'
      }
    }, React.createElement(Legend, null)), React.createElement("p", {
      style: {
        margin: '12px 0 0',
        fontSize: '12px',
        color: 'var(--ink-400)',
        fontWeight: 600
      }
    }, "\u2605 Your postcode. Tap any tile for its figures. Tiles are the nearest suburbs/postcodes by location. Real ABS Census 2021/2016 data (Postal Areas).")), React.createElement("div", {
      style: {
        padding: '26px'
      }
    }, React.createElement(StatPanel, {
      pc: active,
      layer: layer,
      setLayer: setLayerId,
      onBackNational: () => {
        setMode('national');
        setSel(null);
      },
      onSign: onSign
    }))), React.createElement("div", {
      style: {
        padding: '18px 26px',
        borderTop: '1px solid var(--line-200)',
        background: 'var(--mist-50)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }
    }, React.createElement("div", {
      style: {
        fontSize: '14px',
        fontWeight: 700,
        color: 'var(--ink-900)',
        maxWidth: '46ch'
      }
    }, "Migration is reshaping your community. ", React.createElement("span", {
      style: {
        color: 'var(--ink-500)',
        fontWeight: 600
      }
    }, "Demand a system that puts Australians first.")), React.createElement("div", {
      style: {
        display: 'flex',
        gap: '10px',
        flexShrink: 0
      }
    }, mode === 'local' && D[pc] && view === 'map' && React.createElement("button", {
      onClick: () => {
        setMode('national');
        setSel(null);
      },
      style: {
        background: 'transparent',
        color: 'var(--navy-700)',
        border: '1px solid var(--line-200)',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        fontSize: '14px',
        fontWeight: 700,
        fontFamily: 'var(--font-sans)'
      }
    }, "\u2190 National"), React.createElement("button", {
      onClick: onSign,
      style: {
        background: 'var(--red-500)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        padding: '12px 22px',
        fontSize: '15px',
        fontWeight: 800,
        fontFamily: 'var(--font-sans)',
        boxShadow: 'var(--shadow-xs)',
        whiteSpace: 'nowrap',
        transition: 'background .15s ease'
      },
      onMouseEnter: e => e.currentTarget.style.background = 'var(--red-600)',
      onMouseLeave: e => e.currentTarget.style.background = 'var(--red-500)'
    }, "Demand fair migration \u2192 Add your name"))));
  }
  window.PostcodeTool = PostcodeTool;
})();