"use strict";

(function () {
  const {
    useState,
    useMemo,
    useRef,
    useEffect
  } = React;
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function seedFrom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
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
  const METROS = {
    '2000': {
      city: 'Sydney',
      suburb: 'Sydney CBD',
      state: 'NSW',
      pool: ['Haymarket', 'Ultimo', 'Pyrmont', 'Surry Hills', 'Chippendale', 'Glebe', 'Redfern', 'Darlinghurst', 'Woolloomooloo', 'Millers Point', 'The Rocks', 'Barangaroo', 'Zetland', 'Waterloo', 'Newtown', 'Erskineville', 'Alexandria', 'Camperdown', 'Forest Lodge', 'Rosebery', 'Eveleigh', 'Kensington', 'Mascot', 'Botany']
    },
    '3000': {
      city: 'Melbourne',
      suburb: 'Melbourne CBD',
      state: 'VIC',
      pool: ['Carlton', 'Docklands', 'Southbank', 'North Melbourne', 'East Melbourne', 'Fitzroy', 'Richmond', 'South Yarra', 'Collingwood', 'Abbotsford', 'Brunswick', 'Footscray', 'Kensington', 'Flemington', 'Parkville', 'West Melbourne', 'Cremorne', 'Prahran', 'St Kilda', 'Port Melbourne', 'South Melbourne', 'Albert Park', 'Carlton North', 'Fitzroy North']
    },
    '4000': {
      city: 'Brisbane',
      suburb: 'Brisbane City',
      state: 'QLD',
      pool: ['Spring Hill', 'Petrie Terrace', 'Fortitude Valley', 'Kangaroo Point', 'South Brisbane', 'West End', 'Milton', 'Paddington', 'New Farm', 'Teneriffe', 'Bowen Hills', 'Newstead', 'Woolloongabba', 'East Brisbane', 'Highgate Hill', 'Red Hill', 'Kelvin Grove', 'Herston', 'Auchenflower', 'Toowong', 'Dutton Park', 'Annerley', 'Greenslopes', 'Coorparoo']
    },
    '5000': {
      city: 'Adelaide',
      suburb: 'Adelaide',
      state: 'SA',
      pool: ['North Adelaide', 'Kent Town', 'Hackney', 'Parkside', 'Unley', 'Norwood', 'Wayville', 'Goodwood', 'Eastwood', 'Frewville', 'Hindmarsh', 'Bowden', 'Brompton', 'Thebarton', 'Mile End', 'Prospect', 'Walkerville', 'Stepney', 'College Park', 'Gilberton', 'Medindie', 'Fitzroy', 'Ovingham', 'Kilkenny']
    },
    '6000': {
      city: 'Perth',
      suburb: 'Perth CBD',
      state: 'WA',
      pool: ['Northbridge', 'West Perth', 'East Perth', 'Highgate', 'Leederville', 'Subiaco', 'Mount Lawley', 'North Perth', 'Maylands', 'Burswood', 'Victoria Park', 'South Perth', 'Como', 'Nedlands', 'Crawley', 'West Leederville', 'Wembley', 'Glendalough', 'Joondanna', 'Mount Hawthorn', 'Bayswater', 'Bentley', 'Cloverdale', 'Belmont']
    },
    '2600': {
      city: 'Canberra',
      suburb: 'Canberra',
      state: 'ACT',
      pool: ['Barton', 'Forrest', 'Kingston', 'Griffith', 'Deakin', 'Yarralumla', 'Acton', 'Turner', 'Braddon', 'Reid', 'Campbell', 'Ainslie', 'Dickson', 'Lyneham', 'O\u2019Connor', 'Watson', 'Hackett', 'Downer', 'Fyshwick', 'Narrabundah', 'Red Hill', 'Manuka', 'Civic', 'Parkes']
    }
  };
  const GENERIC = ['Riverside', 'Parkdale', 'Hillcrest', 'Westfield', 'Eastgate', 'Springvale', 'Brookfield', 'Greenfield', 'Fairview', 'Lakeside', 'Highbury', 'Woodvale', 'Northgate', 'Sunnybank', 'Glenwood', 'Bayswater', 'Ashfield', 'Kingsford', 'Wentworth', 'Carrington', 'Belmore', 'Granville', 'Ashwood', 'Oakleigh'];
  function metroFor(pc) {
    if (METROS[pc]) return METROS[pc];
    const n = parseInt(pc, 10) || 0;
    if (n >= 2000 && n < 2600) return METROS['2000'];
    if (n >= 2600 && n < 3000) return METROS['2600'];
    if (n >= 3000 && n < 4000) return METROS['3000'];
    if (n >= 4000 && n < 5000) return METROS['4000'];
    if (n >= 5000 && n < 6000) return METROS['5000'];
    if (n >= 6000 && n < 7000) return METROS['6000'];
    return {
      city: 'your region',
      suburb: 'Your suburb',
      state: 'AUS',
      pool: GENERIC
    };
  }
  const LAYERS = [{
    id: 'nom',
    label: 'Net overseas migration',
    source: 'Dept. of Home Affairs',
    unit: 'new arrivals / yr',
    bias: 0.0
  }, {
    id: 'growth',
    label: 'Population growth rate',
    source: 'ABS Census',
    unit: 'YoY growth',
    bias: 0.12
  }, {
    id: 'rental',
    label: 'Rental stress index',
    source: 'Fair Migration analysis',
    unit: 'stress score',
    bias: -0.06
  }];
  function buildArea(pc, layerId) {
    const m = metroFor(pc);
    const rnd = mulberry32(seedFrom(pc + ':' + layerId));
    const layer = LAYERS.find(l => l.id === layerId);
    const N = 5;
    const cells = [];
    const names = [m.suburb, ...m.pool];
    let ni = 1;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const isCentre = r === 2 && c === 2;
        const dist = Math.abs(r - 2) + Math.abs(c - 2);
        let v = 0.86 - dist * 0.09 + (rnd() - 0.5) * 0.42 + layer.bias;
        v = Math.max(0.05, Math.min(0.99, v));
        const name = isCentre ? m.suburb : names[ni++ % names.length];
        const yoy = +((v - 0.4) * 18 + (rnd() - 0.5) * 6).toFixed(1);
        const arrivals = Math.round(180 + v * 5200 + rnd() * 600);
        cells.push({
          r,
          c,
          name,
          v,
          yoy,
          arrivals,
          isCentre
        });
      }
    }
    const centre = cells.find(x => x.isCentre);
    return {
      meta: m,
      layer,
      cells,
      centre
    };
  }
  const STATES = [{
    code: 'WA',
    name: 'Western Australia',
    col: 1,
    row: 2,
    v: 0.62,
    pc: '6000'
  }, {
    code: 'NT',
    name: 'Northern Territory',
    col: 2,
    row: 1,
    v: 0.34,
    pc: '0800'
  }, {
    code: 'SA',
    name: 'South Australia',
    col: 2,
    row: 2,
    v: 0.55,
    pc: '5000'
  }, {
    code: 'QLD',
    name: 'Queensland',
    col: 3,
    row: 1,
    v: 0.78,
    pc: '4000'
  }, {
    code: 'NSW',
    name: 'New South Wales',
    col: 3,
    row: 2,
    v: 0.95,
    pc: '2000'
  }, {
    code: 'ACT',
    name: 'Aust. Capital Terr.',
    col: 4,
    row: 2,
    v: 0.71,
    pc: '2600'
  }, {
    code: 'VIC',
    name: 'Victoria',
    col: 3,
    row: 3,
    v: 0.92,
    pc: '3000'
  }, {
    code: 'TAS',
    name: 'Tasmania',
    col: 3,
    row: 4,
    v: 0.41,
    pc: '7000'
  }];
  function StateTile({
    s,
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
        background: heat(s.v),
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
      title: `${s.name} — click to drill in`
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
    }, Math.round(s.v * 100)));
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
  function Yoy({
    v
  }) {
    const up = v >= 0;
    return React.createElement("span", {
      style: {
        color: up ? 'var(--red-500)' : 'var(--color-success)',
        fontWeight: 800,
        fontSize: '13px',
        whiteSpace: 'nowrap'
      }
    }, up ? '▲' : '▼', " ", Math.abs(v).toFixed(1), "%");
  }
  function SuburbGrid({
    area,
    selected,
    onSelect
  }) {
    return React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '6px',
        aspectRatio: '1 / 1'
      }
    }, area.cells.map((cell, i) => {
      const isSel = selected && selected.r === cell.r && selected.c === cell.c;
      return React.createElement("button", {
        key: i,
        onClick: () => onSelect(cell),
        style: {
          background: heat(cell.v),
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          borderRadius: '4px',
          padding: '6px 5px',
          overflow: 'hidden',
          outline: cell.isCentre ? '3px solid #0d3b66' : 'none',
          outlineOffset: cell.isCentre ? '-3px' : 0,
          boxShadow: isSel ? '0 0 0 3px #fff, 0 0 0 5px #0d3b66' : 'none',
          transition: 'box-shadow .12s ease',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'flex-end',
          minHeight: 0
        },
        title: `${cell.name} — ${Math.round(cell.v * 100)} / 100`
      }, React.createElement("span", {
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: '10.5px',
          fontWeight: 700,
          lineHeight: 1.1,
          color: '#fff',
          textShadow: '0 1px 2px rgba(0,0,0,.5)'
        }
      }, cell.name), cell.isCentre && React.createElement("span", {
        style: {
          position: 'absolute',
          top: 4,
          right: 5,
          fontSize: '11px'
        },
        title: "Your suburb"
      }, "\u2605"));
    }));
  }
  function StatPanel({
    area,
    sel,
    layerId,
    setLayer,
    onBackNational,
    onSign
  }) {
    const cell = sel || area.centre;
    const pct = Math.round(cell.v * 100);
    const rank = Math.max(1, Math.round((1 - cell.v) * 670) + 1);
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
    }, cell.isCentre ? 'Your suburb' : 'Selected suburb'), React.createElement("div", {
      style: {
        fontSize: '26px',
        fontWeight: 900,
        letterSpacing: '-0.02em',
        color: 'var(--ink-900)',
        marginTop: '2px',
        lineHeight: 1.1
      }
    }, cell.name), React.createElement("div", {
      style: {
        fontSize: '14px',
        color: 'var(--ink-500)',
        fontWeight: 600
      }
    }, area.meta.city, " \xB7 ", area.meta.state)), React.createElement("div", {
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
    }, "Intensity"), React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '6px'
      }
    }, React.createElement("span", {
      style: {
        fontSize: '30px',
        fontWeight: 900,
        color: heat(cell.v),
        letterSpacing: '-0.02em'
      }
    }, pct), React.createElement("span", {
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
    }, "Year on year"), React.createElement("div", {
      style: {
        marginTop: '6px'
      }
    }, React.createElement(Yoy, {
      v: cell.yoy
    })))), React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, React.createElement(Row, {
      label: area.layer.label,
      value: cell.arrivals.toLocaleString() + ' ' + area.layer.unit.replace(' / yr', '/yr')
    }), React.createElement(Row, {
      label: "National rank",
      value: '#' + rank + ' of 673 LGAs'
    }), React.createElement(Row, {
      label: "Data source",
      value: area.layer.source,
      muted: true
    })), React.createElement("div", null, React.createElement("div", {
      style: {
        fontSize: '12px',
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-500)',
        marginBottom: '8px'
      }
    }, "Data layer"), React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }
    }, LAYERS.map(l => {
      const on = l.id === layerId;
      return React.createElement("button", {
        key: l.id,
        onClick: () => setLayer(l.id),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'left',
          cursor: 'pointer',
          background: on ? 'var(--navy-50)' : 'var(--white)',
          border: '1px solid ' + (on ? 'var(--navy-700)' : 'var(--line-200)'),
          borderRadius: '6px',
          padding: '9px 12px',
          fontFamily: 'var(--font-sans)',
          transition: 'background .12s ease, border-color .12s ease'
        }
      }, React.createElement("span", {
        style: {
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          flexShrink: 0,
          border: '2px solid ' + (on ? 'var(--navy-700)' : 'var(--line-300)'),
          background: on ? 'var(--navy-700)' : 'transparent',
          boxShadow: on ? 'inset 0 0 0 2px #fff' : 'none'
        }
      }), React.createElement("span", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          minWidth: 0
        }
      }, React.createElement("span", {
        style: {
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--ink-900)',
          lineHeight: 1.25
        }
      }, l.label), React.createElement("span", {
        style: {
          fontSize: '12px',
          color: 'var(--ink-500)',
          fontWeight: 600,
          lineHeight: 1.2
        }
      }, l.source)));
    }))), React.createElement("div", {
      style: {
        borderTop: '1px solid var(--line-200)',
        paddingTop: '16px'
      }
    }, React.createElement("p", {
      style: {
        margin: '0 0 12px',
        fontSize: '14px',
        lineHeight: 1.6,
        color: 'var(--ink-700)'
      }
    }, React.createElement("strong", {
      style: {
        color: 'var(--ink-900)'
      }
    }, cell.name), " is absorbing migration", ' ', React.createElement("strong", {
      style: {
        color: heat(cell.v)
      }
    }, pct > 66 ? 'far above' : pct > 40 ? 'above' : 'near'), ' ', "the national average. This is the strain on ", React.createElement("span", {
      style: {
        fontWeight: 800
      }
    }, "YOUR"), " community."), React.createElement("button", {
      onClick: onSign,
      style: {
        width: '100%',
        background: 'var(--red-500)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        fontSize: '16px',
        fontWeight: 800,
        fontFamily: 'var(--font-sans)',
        boxShadow: 'var(--shadow-xs)',
        transition: 'background .15s ease'
      },
      onMouseEnter: e => e.currentTarget.style.background = 'var(--red-600)',
      onMouseLeave: e => e.currentTarget.style.background = 'var(--red-500)'
    }, "Demand fair migration \u2192 Add your name"), React.createElement("button", {
      onClick: onBackNational,
      style: {
        width: '100%',
        marginTop: '8px',
        background: 'transparent',
        color: 'var(--navy-700)',
        border: '1px solid var(--line-200)',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 700,
        fontFamily: 'var(--font-sans)'
      }
    }, "\u2190 Back to national map")));
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
  function PostcodeTool({
    initialPostcode,
    onSign,
    registerApi
  }) {
    const [mode, setMode] = useState('national');
    const [pc, setPc] = useState(initialPostcode || '');
    const [entry, setEntry] = useState('');
    const [layerId, setLayerId] = useState('nom');
    const [sel, setSel] = useState(null);
    const [err, setErr] = useState('');
    const area = useMemo(() => pc ? buildArea(pc, layerId) : null, [pc, layerId]);
    function go(code) {
      const v = String(code).trim();
      if (!/^\d{4}$/.test(v)) {
        setErr('Enter a valid 4-digit postcode');
        return;
      }
      setErr('');
      setPc(v);
      setSel(null);
      setMode('local');
    }
    useEffect(() => {
      if (registerApi) registerApi({
        showPostcode: code => {
          setEntry(code || '');
          go(code);
        }
      });
    }, []);
    const cell = sel || area && area.centre;
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
        marginTop: '5px'
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
    }, mode === 'national' ? 'View my area' : 'Update'))), mode === 'national' || !area ? React.createElement("div", {
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
      onPick: st => {
        setEntry(st.pc);
        go(st.pc);
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
    }, "your street.")), React.createElement("p", {
      style: {
        margin: '0 0 16px',
        fontSize: '15px',
        lineHeight: 1.65,
        color: 'var(--ink-700)'
      }
    }, "Enter your postcode to reveal how much migration ", React.createElement("strong", null, "your own suburb"), " is absorbing \u2014 and how fast it's climbing year on year. Tap any state to drill in."), React.createElement("ul", {
      style: {
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }
    }, ['Suburb-level intensity, colour-coded', 'Year-over-year change indicators', 'Switch between official data layers'].map(t => React.createElement("li", {
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
    }, area.meta.city, " ", React.createElement("span", {
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
    }, area.layer.label)), React.createElement(SuburbGrid, {
      area: area,
      selected: cell,
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
    }, "\u2605 Your suburb. Tap any tile for its figures. Sample data shown for demonstration \u2014 live ABS & Home Affairs layers to be connected.")), React.createElement("div", {
      style: {
        padding: '26px'
      }
    }, React.createElement(StatPanel, {
      area: area,
      sel: sel,
      layerId: layerId,
      setLayer: setLayerId,
      onBackNational: () => {
        setMode('national');
        setSel(null);
      },
      onSign: onSign
    }))));
  }
  window.PostcodeTool = PostcodeTool;
})();