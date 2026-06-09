/* =====================================================================
   Fair Migration — Postcode GIS heat-map tool
   National state cartogram  →  drills into a local suburb heat-grid.
   Colour-coded migration intensity, YoY change, toggleable data layers.
   Mock data only (deterministic from postcode). Exported to window.
   ===================================================================== */

(function () {
  const { useState, useMemo, useRef, useEffect } = React;

  /* ---------- deterministic RNG ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFrom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ---------- heat colour scale (low green → amber → high red) ---------- */
  const STOPS = [
    [0,   [31, 122, 77]],    // forest green
    [0.28,[127, 160, 60]],   // yellow-green
    [0.5, [219, 158, 32]],   // amber
    [0.72,[200, 92, 38]],    // orange
    [1,   [162, 1, 0]],      // brand red
  ];
  function heat(v) { // v 0..1
    v = Math.max(0, Math.min(1, v));
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const [v0, c0] = STOPS[i - 1], [v1, c1] = STOPS[i];
        const t = (v - v0) / (v1 - v0);
        const c = c0.map((x, k) => Math.round(x + (c1[k] - x) * t));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
      }
    }
    return 'rgb(162,1,0)';
  }

  /* ---------- metros: real suburb pools keyed by postcode prefix ---------- */
  const METROS = {
    '2000': { city: 'Sydney', suburb: 'Sydney CBD', state: 'NSW',
      pool: ['Haymarket','Ultimo','Pyrmont','Surry Hills','Chippendale','Glebe','Redfern','Darlinghurst','Woolloomooloo','Millers Point','The Rocks','Barangaroo','Zetland','Waterloo','Newtown','Erskineville','Alexandria','Camperdown','Forest Lodge','Rosebery','Eveleigh','Kensington','Mascot','Botany'] },
    '3000': { city: 'Melbourne', suburb: 'Melbourne CBD', state: 'VIC',
      pool: ['Carlton','Docklands','Southbank','North Melbourne','East Melbourne','Fitzroy','Richmond','South Yarra','Collingwood','Abbotsford','Brunswick','Footscray','Kensington','Flemington','Parkville','West Melbourne','Cremorne','Prahran','St Kilda','Port Melbourne','South Melbourne','Albert Park','Carlton North','Fitzroy North'] },
    '4000': { city: 'Brisbane', suburb: 'Brisbane City', state: 'QLD',
      pool: ['Spring Hill','Petrie Terrace','Fortitude Valley','Kangaroo Point','South Brisbane','West End','Milton','Paddington','New Farm','Teneriffe','Bowen Hills','Newstead','Woolloongabba','East Brisbane','Highgate Hill','Red Hill','Kelvin Grove','Herston','Auchenflower','Toowong','Dutton Park','Annerley','Greenslopes','Coorparoo'] },
    '5000': { city: 'Adelaide', suburb: 'Adelaide', state: 'SA',
      pool: ['North Adelaide','Kent Town','Hackney','Parkside','Unley','Norwood','Wayville','Goodwood','Eastwood','Frewville','Hindmarsh','Bowden','Brompton','Thebarton','Mile End','Prospect','Walkerville','Stepney','College Park','Gilberton','Medindie','Fitzroy','Ovingham','Kilkenny'] },
    '6000': { city: 'Perth', suburb: 'Perth CBD', state: 'WA',
      pool: ['Northbridge','West Perth','East Perth','Highgate','Leederville','Subiaco','Mount Lawley','North Perth','Maylands','Burswood','Victoria Park','South Perth','Como','Nedlands','Crawley','West Leederville','Wembley','Glendalough','Joondanna','Mount Hawthorn','Bayswater','Bentley','Cloverdale','Belmont'] },
    '2600': { city: 'Canberra', suburb: 'Canberra', state: 'ACT',
      pool: ['Barton','Forrest','Kingston','Griffith','Deakin','Yarralumla','Acton','Turner','Braddon','Reid','Campbell','Ainslie','Dickson','Lyneham','O\u2019Connor','Watson','Hackett','Downer','Fyshwick','Narrabundah','Red Hill','Manuka','Civic','Parkes'] },
  };
  const GENERIC = ['Riverside','Parkdale','Hillcrest','Westfield','Eastgate','Springvale','Brookfield','Greenfield','Fairview','Lakeside','Highbury','Woodvale','Northgate','Sunnybank','Glenwood','Bayswater','Ashfield','Kingsford','Wentworth','Carrington','Belmore','Granville','Ashwood','Oakleigh'];

  function metroFor(pc) {
    if (METROS[pc]) return METROS[pc];
    const n = parseInt(pc, 10) || 0;
    if (n >= 2000 && n < 2600) return METROS['2000'];
    if (n >= 2600 && n < 3000) return METROS['2600'];
    if (n >= 3000 && n < 4000) return METROS['3000'];
    if (n >= 4000 && n < 5000) return METROS['4000'];
    if (n >= 5000 && n < 6000) return METROS['5000'];
    if (n >= 6000 && n < 7000) return METROS['6000'];
    return { city: 'your region', suburb: 'Your suburb', state: 'AUS', pool: GENERIC };
  }

  /* ---------- data layers ---------- */
  const LAYERS = [
    { id: 'nom', label: 'Net overseas migration', source: 'Dept. of Home Affairs', unit: 'new arrivals / yr', bias: 0.0 },
    { id: 'growth', label: 'Population growth rate', source: 'ABS Census', unit: 'YoY growth', bias: 0.12 },
    { id: 'rental', label: 'Rental stress index', source: 'Fair Migration analysis', unit: 'stress score', bias: -0.06 },
  ];

  /* ---------- build a local 5×5 suburb grid for a postcode + layer ---------- */
  function buildArea(pc, layerId) {
    const m = metroFor(pc);
    const rnd = mulberry32(seedFrom(pc + ':' + layerId));
    const layer = LAYERS.find((l) => l.id === layerId);
    const N = 5;
    const cells = [];
    const names = [m.suburb, ...m.pool];
    let ni = 1;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const isCentre = r === 2 && c === 2;
        const dist = Math.abs(r - 2) + Math.abs(c - 2);
        // intensity: high near centre (urban core), with noise + layer bias
        let v = 0.86 - dist * 0.09 + (rnd() - 0.5) * 0.42 + layer.bias;
        v = Math.max(0.05, Math.min(0.99, v));
        const name = isCentre ? m.suburb : (names[ni++ % names.length]);
        const yoy = +( (v - 0.4) * 18 + (rnd() - 0.5) * 6 ).toFixed(1);
        const arrivals = Math.round(180 + v * 5200 + rnd() * 600);
        cells.push({ r, c, name, v, yoy, arrivals, isCentre });
      }
    }
    const centre = cells.find((x) => x.isCentre);
    return { meta: m, layer, cells, centre };
  }

  /* ---------- national state cartogram ---------- */
  const STATES = [
    { code: 'WA',  name: 'Western Australia',  col: 1, row: 2, v: 0.62, pc: '6000' },
    { code: 'NT',  name: 'Northern Territory', col: 2, row: 1, v: 0.34, pc: '0800' },
    { code: 'SA',  name: 'South Australia',    col: 2, row: 2, v: 0.55, pc: '5000' },
    { code: 'QLD', name: 'Queensland',         col: 3, row: 1, v: 0.78, pc: '4000' },
    { code: 'NSW', name: 'New South Wales',    col: 3, row: 2, v: 0.95, pc: '2000' },
    { code: 'ACT', name: 'Aust. Capital Terr.',col: 4, row: 2, v: 0.71, pc: '2600' },
    { code: 'VIC', name: 'Victoria',           col: 3, row: 3, v: 0.92, pc: '3000' },
    { code: 'TAS', name: 'Tasmania',           col: 3, row: 4, v: 0.41, pc: '7000' },
  ];

  function StateTile({ s, onPick }) {
    const [hover, setHover] = useState(false);
    return (
      <button
        onClick={() => onPick(s)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          gridColumn: s.col, gridRow: s.row,
          background: heat(s.v), border: 'none', cursor: 'pointer',
          borderRadius: '6px', color: '#fff', fontFamily: 'var(--font-sans)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '6px 4px', minHeight: '64px', position: 'relative',
          boxShadow: hover ? '0 0 0 3px rgba(255,255,255,.85), var(--shadow-md)' : 'var(--shadow-sm)',
          transform: hover ? 'translateY(-2px)' : 'none', transition: 'transform .12s ease, box-shadow .12s ease',
          textShadow: '0 1px 2px rgba(0,0,0,.35)',
        }}
        title={`${s.name} — click to drill in`}
      >
        <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '0.02em' }}>{s.code}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, opacity: 0.95 }}>{Math.round(s.v * 100)}</span>
      </button>
    );
  }

  function Legend() {
    const grad = `linear-gradient(90deg, ${heat(0)}, ${heat(0.28)}, ${heat(0.5)}, ${heat(0.72)}, ${heat(1)})`;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--ink-500)', fontWeight: 600 }}>
        <span>Lower</span>
        <span style={{ flex: 1, height: '8px', borderRadius: '999px', background: grad, minWidth: '120px' }} />
        <span>Higher</span>
      </div>
    );
  }

  function Yoy({ v }) {
    const up = v >= 0;
    return (
      <span style={{ color: up ? 'var(--red-500)' : 'var(--color-success)', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap' }}>
        {up ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
      </span>
    );
  }

  /* ---------- the local suburb heat-grid ---------- */
  function SuburbGrid({ area, selected, onSelect }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', aspectRatio: '1 / 1' }}>
        {area.cells.map((cell, i) => {
          const isSel = selected && selected.r === cell.r && selected.c === cell.c;
          return (
            <button
              key={i}
              onClick={() => onSelect(cell)}
              style={{
                background: heat(cell.v), border: 'none', cursor: 'pointer', position: 'relative',
                borderRadius: '4px', padding: '6px 5px', overflow: 'hidden',
                outline: cell.isCentre ? '3px solid #0d3b66' : 'none', outlineOffset: cell.isCentre ? '-3px' : 0,
                boxShadow: isSel ? '0 0 0 3px #fff, 0 0 0 5px #0d3b66' : 'none',
                transition: 'box-shadow .12s ease', textAlign: 'left',
                display: 'flex', alignItems: 'flex-end', minHeight: 0,
              }}
              title={`${cell.name} — ${Math.round(cell.v * 100)} / 100`}
            >
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '10.5px', fontWeight: 700, lineHeight: 1.1,
                color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.5)',
              }}>{cell.name}</span>
              {cell.isCentre && (
                <span style={{ position: 'absolute', top: 4, right: 5, fontSize: '11px' }} title="Your suburb">★</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* ---------- the stat read-out panel ---------- */
  function StatPanel({ area, sel, layerId, setLayer, onBackNational, onSign }) {
    const cell = sel || area.centre;
    const pct = Math.round(cell.v * 100);
    const rank = Math.max(1, Math.round((1 - cell.v) * 670) + 1); // of ~670 LGAs
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
            {cell.isCentre ? 'Your suburb' : 'Selected suburb'}
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink-900)', marginTop: '2px', lineHeight: 1.1 }}>
            {cell.name}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--ink-500)', fontWeight: 600 }}>{area.meta.city} · {area.meta.state}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: 'var(--mist-50)', border: '1px solid var(--line-200)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Intensity</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '30px', fontWeight: 900, color: heat(cell.v), letterSpacing: '-0.02em' }}>{pct}</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-400)', fontWeight: 700 }}>/100</span>
            </div>
          </div>
          <div style={{ background: 'var(--mist-50)', border: '1px solid var(--line-200)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Year on year</div>
            <div style={{ marginTop: '6px' }}><Yoy v={cell.yoy} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Row label={area.layer.label} value={cell.arrivals.toLocaleString() + ' ' + area.layer.unit.replace(' / yr','/yr')} />
          <Row label="National rank" value={'#' + rank + ' of 673 LGAs'} />
          <Row label="Data source" value={area.layer.source} muted />
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: '8px' }}>Data layer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {LAYERS.map((l) => {
              const on = l.id === layerId;
              return (
                <button key={l.id} onClick={() => setLayer(l.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer',
                    background: on ? 'var(--navy-50)' : 'var(--white)',
                    border: '1px solid ' + (on ? 'var(--navy-700)' : 'var(--line-200)'),
                    borderRadius: '6px', padding: '9px 12px', fontFamily: 'var(--font-sans)',
                    transition: 'background .12s ease, border-color .12s ease',
                  }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
                    border: '2px solid ' + (on ? 'var(--navy-700)' : 'var(--line-300)'),
                    background: on ? 'var(--navy-700)' : 'transparent', boxShadow: on ? 'inset 0 0 0 2px #fff' : 'none' }} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-900)', lineHeight: 1.25 }}>{l.label}</span>
                    <span style={{ fontSize: '12px', color: 'var(--ink-500)', fontWeight: 600, lineHeight: 1.2 }}>{l.source}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line-200)', paddingTop: '16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '14px', lineHeight: 1.6, color: 'var(--ink-700)' }}>
            <strong style={{ color: 'var(--ink-900)' }}>{cell.name}</strong> is absorbing migration
            {' '}<strong style={{ color: heat(cell.v) }}>{pct > 66 ? 'far above' : pct > 40 ? 'above' : 'near'}</strong>{' '}
            the national average. This is the strain on <span style={{ fontWeight: 800 }}>YOUR</span> community.
          </p>
          <button onClick={onSign} style={{
            width: '100%', background: 'var(--red-500)', color: '#fff', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--radius-md)', padding: '14px 20px', fontSize: '16px', fontWeight: 800,
            fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-xs)', transition: 'background .15s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-600)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--red-500)'}>
            Demand fair migration → Add your name
          </button>
          <button onClick={onBackNational} style={{
            width: '100%', marginTop: '8px', background: 'transparent', color: 'var(--navy-700)',
            border: '1px solid var(--line-200)', cursor: 'pointer', borderRadius: 'var(--radius-md)',
            padding: '10px 20px', fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-sans)',
          }}>← Back to national map</button>
        </div>
      </div>
    );
  }

  function Row({ label, value, muted }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', fontSize: '14px', borderBottom: '1px dashed var(--line-200)', paddingBottom: '8px' }}>
        <span style={{ color: 'var(--ink-500)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: muted ? 'var(--ink-500)' : 'var(--ink-900)', fontWeight: muted ? 600 : 800, textAlign: 'right' }}>{value}</span>
      </div>
    );
  }

  /* ---------- the whole tool ---------- */
  function PostcodeTool({ initialPostcode, onSign, registerApi }) {
    const [mode, setMode] = useState('national'); // 'national' | 'local'
    const [pc, setPc] = useState(initialPostcode || '');
    const [entry, setEntry] = useState('');
    const [layerId, setLayerId] = useState('nom');
    const [sel, setSel] = useState(null);
    const [err, setErr] = useState('');

    const area = useMemo(() => (pc ? buildArea(pc, layerId) : null), [pc, layerId]);

    function go(code) {
      const v = String(code).trim();
      if (!/^\d{4}$/.test(v)) { setErr('Enter a valid 4-digit postcode'); return; }
      setErr(''); setPc(v); setSel(null); setMode('local');
    }

    // allow the petition form to push the signatory's postcode in
    useEffect(() => {
      if (registerApi) registerApi({ showPostcode: (code) => { setEntry(code || ''); go(code); } });
    }, []);

    const cell = sel || (area && area.centre);

    return (
      <div style={{ background: '#fff', border: '1px solid var(--line-200)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        {/* tool header / search bar */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line-200)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', background: 'var(--navy-700)' }}>
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--coral-400)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>Migration Impact Map</div>
            <div style={{ fontSize: '21px', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', marginTop: '4px', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
              {mode === 'national' ? 'See it across Australia' : 'Your local impact'}
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); go(entry); }} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div>
              <input
                value={entry}
                onChange={(e) => setEntry(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric" placeholder="Enter postcode"
                style={{
                  width: '150px', fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 600,
                  padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid transparent',
                  outline: 'none', boxShadow: 'var(--shadow-xs)',
                }} />
              {err && <div style={{ color: 'var(--coral-400)', fontSize: '12px', fontWeight: 700, marginTop: '5px' }}>{err}</div>}
            </div>
            <button type="submit" style={{
              background: 'var(--red-500)', color: '#fff', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-md)', padding: '11px 18px', fontSize: '15px', fontWeight: 800,
              fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-xs)',
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-600)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--red-500)'}>
              {mode === 'national' ? 'View my area' : 'Update'}
            </button>
          </form>
        </div>

        {/* body */}
        {mode === 'national' || !area ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0' }}>
            <div style={{ padding: '28px 26px', borderRight: '1px solid var(--line-200)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '8px', maxWidth: '380px', margin: '0 auto' }}>
                {STATES.map((s) => <StateTile key={s.code} s={s} onPick={(st) => { setEntry(st.pc); go(st.pc); }} />)}
              </div>
              <div style={{ maxWidth: '380px', margin: '22px auto 0' }}><Legend /></div>
            </div>
            <div style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink-900)', lineHeight: 1.15 }}>
                Migration isn't abstract. It's <span style={{ color: 'var(--red-500)' }}>your street.</span>
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-700)' }}>
                Enter your postcode to reveal how much migration <strong>your own suburb</strong> is absorbing —
                and how fast it's climbing year on year. Tap any state to drill in.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Suburb-level intensity, colour-coded','Year-over-year change indicators','Switch between official data layers'].map((t) => (
                  <li key={t} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: 'var(--ink-700)', fontWeight: 600 }}>
                    <span style={{ color: 'var(--red-500)', fontWeight: 900 }}>›</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '0' }}>
            <div style={{ padding: '26px', borderRight: '1px solid var(--line-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-900)', whiteSpace: 'nowrap' }}>
                  {area.meta.city} <span style={{ color: 'var(--ink-400)', fontWeight: 700 }}>· {pc}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-500)', textAlign: 'right' }}>{area.layer.label}</div>
              </div>
              <SuburbGrid area={area} selected={cell} onSelect={setSel} />
              <div style={{ marginTop: '16px' }}><Legend /></div>
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--ink-400)', fontWeight: 600 }}>
                ★ Your suburb. Tap any tile for its figures. Sample data shown for demonstration — live ABS &amp; Home Affairs layers to be connected.
              </p>
            </div>
            <div style={{ padding: '26px' }}>
              <StatPanel area={area} sel={sel} layerId={layerId} setLayer={setLayerId}
                onBackNational={() => { setMode('national'); setSel(null); }} onSign={onSign} />
            </div>
          </div>
        )}
      </div>
    );
  }

  window.PostcodeTool = PostcodeTool;
})();
