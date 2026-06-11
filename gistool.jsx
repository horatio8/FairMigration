/* =====================================================================
   Fair Migration — Postcode Impact Map (real ABS data)
   National state cartogram (data-driven averages) → drills into a local
   grid of nearby postcodes. Figures come from window.POSTCODE_DATA
   (ABS Census 2021/2016, Postal Areas). Exported to window.PostcodeTool.
   ===================================================================== */

(function () {
  const { useState, useMemo, useEffect } = React;

  const D = window.POSTCODE_DATA || {};
  const PCS = Object.keys(D);
  // row = [pop2021, ob%, growth%, rentInc%, rent$, income$, migIdx, growthIdx, rentIdx]
  const F = { pop: 0, ob: 1, growth: 2, rentInc: 3, rent: 4, income: 5, migIdx: 6, growthIdx: 7, rentIdx: 8 };

  /* ---------- heat colour scale (low green → amber → high red) ---------- */
  const STOPS = [
    [0, [31, 122, 77]], [0.28, [127, 160, 60]], [0.5, [219, 158, 32]],
    [0.72, [200, 92, 38]], [1, [162, 1, 0]],
  ];
  function heat(v) {
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

  /* ---------- data layers → ABS index columns ---------- */
  const LAYERS = [
    { id: 'mig', label: 'Migration intensity', short: 'Migration index', idx: F.migIdx,
      raw: F.ob, rawLabel: 'Overseas-born share', rawUnit: '%', source: 'ABS Census 2021 — overseas-born share (proxy)' },
    { id: 'growth', label: 'Population growth', short: 'Growth index', idx: F.growthIdx,
      raw: F.growth, rawLabel: 'Population growth 2016–21', rawUnit: '%', source: 'ABS Census 2016 & 2021' },
    { id: 'rent', label: 'Rental stress', short: 'Rent-stress index', idx: F.rentIdx,
      raw: F.rentInc, rawLabel: 'Rent-to-income', rawUnit: '%', source: 'ABS Census 2021 — rent-to-income' },
  ];

  /* ---------- postcode → state ---------- */
  function stateOf(pc) {
    const n = parseInt(pc, 10) || 0;
    if ((n >= 2600 && n <= 2618) || (n >= 2900 && n <= 2920) || (n >= 200 && n <= 299)) return 'ACT';
    if ((n >= 1000 && n <= 2599) || (n >= 2619 && n <= 2899) || (n >= 2921 && n <= 2999)) return 'NSW';
    if ((n >= 3000 && n <= 3999) || (n >= 8000 && n <= 8999)) return 'VIC';
    if ((n >= 4000 && n <= 4999) || (n >= 9000 && n <= 9999)) return 'QLD';
    if (n >= 5000 && n <= 5999) return 'SA';
    if (n >= 6000 && n <= 6999) return 'WA';
    if (n >= 7000 && n <= 7999) return 'TAS';
    if (n >= 800 && n <= 999) return 'NT';
    return 'NSW';
  }

  /* ---------- precomputed national ranks per index column ---------- */
  const RANK = {};
  function ranksFor(field) {
    if (RANK[field]) return RANK[field];
    const arr = PCS.filter((p) => D[p][field] != null).sort((a, b) => D[b][field] - D[a][field]);
    const map = {}; arr.forEach((p, i) => { map[p] = i + 1; });
    return (RANK[field] = { map, count: arr.length });
  }

  /* ---------- state averages per index column ---------- */
  const SAVG = {};
  function stateAvg(field) {
    if (SAVG[field]) return SAVG[field];
    const sum = {}, cnt = {};
    for (const p of PCS) { const v = D[p][field]; if (v == null) continue; const s = stateOf(p); sum[s] = (sum[s] || 0) + v; cnt[s] = (cnt[s] || 0) + 1; }
    const m = {}; for (const s in sum) m[s] = sum[s] / cnt[s];
    return (SAVG[field] = m);
  }
  function topPostcode(stateCode, field) {
    let best = null, bv = -1;
    for (const p of PCS) { if (stateOf(p) !== stateCode) continue; const v = D[p][field]; if (v != null && v > bv) { bv = v; best = p; } }
    return best;
  }

  /* ---------- nearby postcodes (same state, nearest by number) for the grid ---------- */
  function regionGrid(pc, field) {
    const n = parseInt(pc, 10), st = stateOf(pc);
    let cand = PCS.filter((p) => stateOf(p) === st && D[p][field] != null);
    cand.sort((a, b) => Math.abs(parseInt(a, 10) - n) - Math.abs(parseInt(b, 10) - n));
    let near = cand.slice(0, 25);
    if (near.indexOf(pc) < 0 && D[pc]) { near[near.length - 1] = pc; }
    near.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    return near;
  }

  const STATES = [
    { code: 'WA', name: 'Western Australia', col: 1, row: 2 },
    { code: 'NT', name: 'Northern Territory', col: 2, row: 1 },
    { code: 'SA', name: 'South Australia', col: 2, row: 2 },
    { code: 'QLD', name: 'Queensland', col: 3, row: 1 },
    { code: 'NSW', name: 'New South Wales', col: 3, row: 2 },
    { code: 'ACT', name: 'Aust. Capital Terr.', col: 4, row: 2 },
    { code: 'VIC', name: 'Victoria', col: 3, row: 3 },
    { code: 'TAS', name: 'Tasmania', col: 3, row: 4 },
  ];

  function StateTile({ s, v, onPick }) {
    const [hover, setHover] = useState(false);
    return (
      <button onClick={() => onPick(s)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          gridColumn: s.col, gridRow: s.row, background: heat(v / 100), border: 'none', cursor: 'pointer',
          borderRadius: '6px', color: '#fff', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '6px 4px', minHeight: '64px', position: 'relative',
          boxShadow: hover ? '0 0 0 3px rgba(255,255,255,.85), var(--shadow-md)' : 'var(--shadow-sm)',
          transform: hover ? 'translateY(-2px)' : 'none', transition: 'transform .12s ease, box-shadow .12s ease',
          textShadow: '0 1px 2px rgba(0,0,0,.35)',
        }} title={`${s.name} — average ${Math.round(v)} / 100 · click to drill in`}>
        <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '0.02em' }}>{s.code}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, opacity: 0.95 }}>{Math.round(v)}</span>
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
    if (v == null) return <span style={{ color: 'var(--ink-400)', fontWeight: 700 }}>n/a</span>;
    const up = v >= 0;
    return (
      <span style={{ color: up ? 'var(--red-500)' : 'var(--color-success)', fontWeight: 800, fontSize: '13px', whiteSpace: 'nowrap' }}>
        {up ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
      </span>
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

  function PostcodeGrid({ cells, field, selected, centre, onSelect }) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', aspectRatio: '1 / 1' }}>
        {cells.map((pc) => {
          const v = D[pc][field];
          const isSel = pc === selected, isCentre = pc === centre;
          return (
            <button key={pc} onClick={() => onSelect(pc)}
              style={{
                background: heat((v || 0) / 100), border: 'none', cursor: 'pointer', position: 'relative',
                borderRadius: '4px', padding: '6px 5px', overflow: 'hidden',
                outline: isCentre ? '3px solid #0d3b66' : 'none', outlineOffset: isCentre ? '-3px' : 0,
                boxShadow: isSel ? '0 0 0 3px #fff, 0 0 0 5px #0d3b66' : 'none',
                transition: 'box-shadow .12s ease', textAlign: 'left', display: 'flex', alignItems: 'flex-end', minHeight: 0,
              }} title={`${pc} — ${Math.round(v)} / 100`}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 800, lineHeight: 1.1, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>{pc}</span>
              {isCentre && <span style={{ position: 'absolute', top: 4, right: 5, fontSize: '11px' }} title="Your postcode">★</span>}
            </button>
          );
        })}
      </div>
    );
  }

  function StatPanel({ pc, layer, setLayer, onBackNational, onSign }) {
    const rec = D[pc];
    const idxVal = rec[layer.idx];
    const ranks = ranksFor(layer.idx);
    const rank = ranks.map[pc];
    const rawVal = rec[layer.raw];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Postcode</div>
          <div style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink-900)', marginTop: '2px', lineHeight: 1.1 }}>{pc}</div>
          <div style={{ fontSize: '14px', color: 'var(--ink-500)', fontWeight: 600 }}>{stateOf(pc)} · {rec[F.pop] != null ? rec[F.pop].toLocaleString() + ' residents (2021)' : 'population n/a'}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: 'var(--mist-50)', border: '1px solid var(--line-200)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>{layer.short}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '30px', fontWeight: 900, color: heat((idxVal || 0) / 100), letterSpacing: '-0.02em' }}>{idxVal == null ? '—' : Math.round(idxVal)}</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-400)', fontWeight: 700 }}>/100</span>
            </div>
          </div>
          <div style={{ background: 'var(--mist-50)', border: '1px solid var(--line-200)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>Growth 2016–21</div>
            <div style={{ marginTop: '6px' }}><Yoy v={rec[F.growth]} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Row label={layer.rawLabel} value={rawVal == null ? 'n/a' : rawVal.toFixed(1) + layer.rawUnit} />
          <Row label="Median weekly rent" value={rec[F.rent] == null ? 'n/a' : '$' + rec[F.rent].toLocaleString()} />
          <Row label="Median weekly income" value={rec[F.income] == null ? 'n/a' : '$' + rec[F.income].toLocaleString()} />
          <Row label="National rank" value={rank ? '#' + rank.toLocaleString() + ' of ' + ranks.count.toLocaleString() : 'n/a'} />
          <Row label="Data source" value={layer.source} muted />
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-500)', marginBottom: '8px' }}>Data layer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {LAYERS.map((l) => {
              const on = l.id === layer.id;
              return (
                <button key={l.id} onClick={() => setLayer(l.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', cursor: 'pointer',
                    background: on ? 'var(--navy-50)' : 'var(--white)', border: '1px solid ' + (on ? 'var(--navy-700)' : 'var(--line-200)'),
                    borderRadius: '6px', padding: '9px 12px', fontFamily: 'var(--font-sans)', transition: 'background .12s ease, border-color .12s ease',
                  }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, border: '2px solid ' + (on ? 'var(--navy-700)' : 'var(--line-300)'), background: on ? 'var(--navy-700)' : 'transparent', boxShadow: on ? 'inset 0 0 0 2px #fff' : 'none' }} />
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
            Postcode <strong style={{ color: 'var(--ink-900)' }}>{pc}</strong> sits
            {' '}<strong style={{ color: heat((idxVal || 0) / 100) }}>{idxVal > 66 ? 'far above' : idxVal > 40 ? 'above' : 'near'}</strong>{' '}
            the national average on {layer.label.toLowerCase()}. This is the strain on <span style={{ fontWeight: 800 }}>YOUR</span> community.
          </p>
          <button onClick={onSign} style={{ width: '100%', background: 'var(--red-500)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', padding: '14px 20px', fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-xs)', transition: 'background .15s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-600)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--red-500)'}>
            Demand fair migration → Add your name
          </button>
          <button onClick={onBackNational} style={{ width: '100%', marginTop: '8px', background: 'transparent', color: 'var(--navy-700)', border: '1px solid var(--line-200)', cursor: 'pointer', borderRadius: 'var(--radius-md)', padding: '10px 20px', fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-sans)' }}>← Back to national map</button>
        </div>
      </div>
    );
  }

  /* ---------- the whole tool ---------- */
  function PostcodeTool({ initialPostcode, onSign, registerApi }) {
    const [mode, setMode] = useState('national');
    const [pc, setPc] = useState(initialPostcode && D[initialPostcode] ? initialPostcode : '');
    const [entry, setEntry] = useState('');
    const [layerId, setLayerId] = useState('mig');
    const [sel, setSel] = useState(null);
    const [err, setErr] = useState('');

    const layer = LAYERS.find((l) => l.id === layerId);
    const cells = useMemo(() => (pc && D[pc] ? regionGrid(pc, layer.idx) : []), [pc, layerId]);
    const savg = useMemo(() => stateAvg(layer.idx), [layerId]);

    function go(code) {
      const v = String(code || '').trim();
      if (!/^\d{3,4}$/.test(v)) { setErr('Enter a valid postcode'); return; }
      const key = v.length === 3 ? '0' + v : v;
      if (!D[key]) { setErr('No ABS data for postcode ' + key + ' — try a nearby one'); return; }
      setErr(''); setPc(key); setSel(key); setMode('local');
    }

    useEffect(() => {
      if (registerApi) registerApi({ showPostcode: (code) => { const k = String(code || '').replace(/\D/g, '').slice(0, 4); setEntry(k); go(k); } });
    }, []);

    const active = sel && D[sel] ? sel : pc;

    return (
      <div style={{ background: '#fff', border: '1px solid var(--line-200)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line-200)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', background: 'var(--navy-700)' }}>
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--coral-400)', lineHeight: 1.4, whiteSpace: 'nowrap' }}>Migration Impact Map</div>
            <div style={{ fontSize: '21px', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', marginTop: '4px', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
              {mode === 'national' ? 'See it across Australia' : 'Your local impact'}
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); go(entry); }} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div>
              <input value={entry} onChange={(e) => setEntry(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="Enter postcode"
                style={{ width: '150px', fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 600, padding: '11px 14px', borderRadius: 'var(--radius-md)', border: '1px solid transparent', outline: 'none', boxShadow: 'var(--shadow-xs)' }} />
              {err && <div style={{ color: 'var(--coral-400)', fontSize: '12px', fontWeight: 700, marginTop: '5px', maxWidth: '230px' }}>{err}</div>}
            </div>
            <button type="submit" style={{ background: 'var(--red-500)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)', padding: '11px 18px', fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-xs)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-600)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--red-500)'}>
              {mode === 'national' ? 'View my area' : 'Update'}
            </button>
          </form>
        </div>

        {mode === 'national' || !D[pc] ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '0' }}>
            <div style={{ padding: '28px 26px', borderRight: '1px solid var(--line-200)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '8px', maxWidth: '380px', margin: '0 auto' }}>
                {STATES.map((s) => <StateTile key={s.code} s={s} v={savg[s.code] || 0} onPick={(st) => { const top = topPostcode(st.code, layer.idx); if (top) { setEntry(top); go(top); } }} />)}
              </div>
              <div style={{ maxWidth: '380px', margin: '22px auto 0' }}><Legend /></div>
            </div>
            <div style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink-900)', lineHeight: 1.15 }}>
                Migration isn't abstract. It's <span style={{ color: 'var(--red-500)' }}>your postcode.</span>
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-700)' }}>
                Enter your postcode to see real ABS figures for <strong>your area</strong> — migration intensity,
                population growth and rental stress, ranked against every postcode in Australia. Tap any state for its busiest postcode.
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Real per-postcode figures from the ABS Census', 'Migration, growth and rental-stress layers', 'Ranked against 2,532 postcodes nationwide'].map((t) => (
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
                  {stateOf(pc)} <span style={{ color: 'var(--ink-400)', fontWeight: 700 }}>· near {pc}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-500)', textAlign: 'right' }}>{layer.label}</div>
              </div>
              <PostcodeGrid cells={cells} field={layer.idx} selected={active} centre={pc} onSelect={setSel} />
              <div style={{ marginTop: '16px' }}><Legend /></div>
              <p style={{ margin: '12px 0 0', fontSize: '12px', color: 'var(--ink-400)', fontWeight: 600 }}>
                ★ Your postcode. Tap any tile for its figures. Tiles are nearby postcodes in {stateOf(pc)}. Real ABS Census 2021/2016 data (Postal Areas).
              </p>
            </div>
            <div style={{ padding: '26px' }}>
              <StatPanel pc={active} layer={layer} setLayer={setLayerId}
                onBackNational={() => { setMode('national'); setSel(null); }} onSign={onSign} />
            </div>
          </div>
        )}
      </div>
    );
  }

  window.PostcodeTool = PostcodeTool;
})();
