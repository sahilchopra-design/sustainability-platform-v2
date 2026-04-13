import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── theme ──────────────────────────────────────────────────────── */
const T = {
  bg:       '#f8f7f4',
  surface:  '#ffffff',
  surfaceAlt:'#f4f3f0',
  border:   'rgba(27,58,92,0.08)',
  borderMed:'rgba(27,58,92,0.16)',
  text:     '#1b2c3e',
  textSub:  '#4a5e70',
  textMute: '#8a9aaa',
  gold:     '#b8922a',
  goldLight:'#f5e9c8',
  navy:     '#1b3a5c',
  green:    '#16a34a',
  font:     "'DM Sans', system-ui, -apple-system, sans-serif",
  mono:     "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
};

/* ─── sprint badge colours ───────────────────────────────────────── */
const SPRINT_COLORS = {
  'ADM':   ['#475569','#f1f5f9'],
  'ICE':   ['#b8922a','#fef9ec'],
  'E':     ['#4a7faa','#eef4f9'],
  'EP-CY': ['#2563eb','#eff6ff'],
  'EP-CZ': ['#7c3aed','#f5f3ff'],
  'EP-DA': ['#059669','#ecfdf5'],
  'EP-DB': ['#991b1b','#fef2f2'],
  'EP-DC': ['#065f46','#ecfdf5'],
  'EP-DD': ['#1e3a5f','#eff3f8'],
  'EP-DE': ['#92400e','#fffbeb'],
  'EP-DF': ['#1d4ed8','#eff6ff'],
  'EP-DG': ['#166534','#f0fdf4'],
  'EP-DH': ['#7e22ce','#faf5ff'],
  'EP-DI': ['#c2410c','#fff7ed'],
  'EP-DJ': ['#0e7490','#ecfeff'],
  'EP-DK': ['#374151','#f9fafb'],
  'EP-DL': ['#4d7c0f','#f7fee7'],
  'EP-DM': ['#1e40af','#eff6ff'],
  'EP-DN': ['#6b21a8','#faf5ff'],
  'EP-DO': ['#b45309','#fffbeb'],
  'EP-DP': ['#be185d','#fdf2f8'],
  'EP-DQ': ['#065f46','#ecfdf5'],
  'EP-B':  ['#5a9aaa','#eef6f7'],
  'EP-A':  ['#5a8a6a','#eef5f0'],
  'EP-':   ['#6a7a8a','#f0f2f4'],
};

function sprintColor(code) {
  if (!code) return ['#94a3b8','#f8fafc'];
  const prefixes = Object.keys(SPRINT_COLORS).sort((a,b) => b.length - a.length);
  for (const p of prefixes) if (code.startsWith(p)) return SPRINT_COLORS[p];
  return ['#94a3b8','#f8fafc'];
}

/* ─── keyboard shortcut ──────────────────────────────────────────── */
function useCtrlK(cb) {
  useEffect(() => {
    const h = e => { if ((e.ctrlKey||e.metaKey) && e.key === 'k') { e.preventDefault(); cb(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [cb]);
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */
export default function ModuleNavigatorPage({ navGroups = [] }) {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [query, setQuery]       = useState('');
  const [domain, setDomain]     = useState('ALL');
  const [view, setView]         = useState('grid');   // grid | list | compact
  const [sort, setSort]         = useState('default');// default | alpha | code
  const [recent, setRecent]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('_nav_recent') || '[]'); } catch { return []; }
  });

  useCtrlK(useCallback(() => searchRef.current?.focus(), []));

  /* flatten all items */
  const allItems = useMemo(() =>
    navGroups.flatMap(g => g.items.map(item => ({
      ...item, group: g.label, gIcon: g.icon, gColor: g.color,
    }))),
  [navGroups]);

  const total = allItems.length;

  /* filtered list */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = domain === 'ALL' ? allItems : allItems.filter(i => i.group === domain);
    if (q) list = list.filter(i =>
      i.label.toLowerCase().includes(q) ||
      (i.code||'').toLowerCase().includes(q) ||
      (i.badge||'').toLowerCase().includes(q) ||
      i.group.toLowerCase().includes(q) ||
      i.path.toLowerCase().includes(q)
    );
    if (sort === 'alpha') return [...list].sort((a,b) => a.label.localeCompare(b.label));
    if (sort === 'code')  return [...list].sort((a,b) => (a.code||'').localeCompare(b.code||''));
    return list;
  }, [allItems, query, domain, sort]);

  /* group for default view */
  const grouped = useMemo(() => {
    if (domain !== 'ALL' || query || sort !== 'default') return null;
    const map = new Map();
    filtered.forEach(item => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push(item);
    });
    return Array.from(map.entries()).map(([g, items]) => {
      const meta = navGroups.find(ng => ng.label === g);
      return { g, items, icon: meta?.icon||'📦', color: meta?.color||T.navy };
    });
  }, [filtered, domain, query, sort, navGroups]);

  const recentItems = useMemo(() =>
    recent.slice(0,6).map(p => allItems.find(i => i.path === p)).filter(Boolean),
  [recent, allItems]);

  function goTo(path) {
    setRecent(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 20);
      try { localStorage.setItem('_nav_recent', JSON.stringify(next)); } catch {}
      return next;
    });
    navigate(path);
  }

  /* ── render ─────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100%', paddingBottom: 40 }}>

      {/* ── compact top bar ───────────────────────────────────────── */}
      <div style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: '12px 20px 10px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>

        {/* title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>🗺</span>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy, letterSpacing: 1 }}>
              MODULE NAVIGATOR
            </div>
            <div style={{ fontSize: 11, color: T.textMute, marginTop: 1 }}>
              {total} modules · {navGroups.length} domains · click any card to open
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {/* view toggle */}
            {[['grid','⊞'],['list','☰'],['compact','▦']].map(([v,icon]) => (
              <button key={v} onClick={() => setView(v)} title={v} style={{
                width: 30, height: 30, border: `1px solid ${view===v ? T.navy : T.border}`,
                background: view===v ? T.navy : T.surface,
                color: view===v ? '#fff' : T.textMute,
                borderRadius: 5, cursor: 'pointer', fontSize: 13,
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>{icon}</button>
            ))}
            <select value={sort} onChange={e=>setSort(e.target.value)} style={{
              height: 30, padding: '0 8px', borderRadius: 5,
              border: `1px solid ${T.border}`, background: T.surface,
              fontSize: 11, color: T.textSub, fontFamily: T.font, cursor: 'pointer',
            }}>
              <option value="default">Default order</option>
              <option value="alpha">A → Z</option>
              <option value="code">By code</option>
            </select>
          </div>
        </div>

        {/* search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, opacity:0.4 }}>🔍</span>
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, code, badge, domain or path…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 80px 8px 34px',
              border: `1.5px solid ${query ? T.navy : T.border}`,
              borderRadius: 7, background: query ? T.surface : T.surfaceAlt,
              fontSize: 13, fontFamily: T.font, color: T.text,
              outline: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = T.navy}
            onBlur={e => e.target.style.borderColor = query ? T.navy : T.border}
          />
          {query
            ? <button onClick={() => setQuery('')} style={{
                position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer',
                color: T.textMute, fontSize:16, padding:'0 4px', lineHeight:1,
              }}>×</button>
            : <kbd style={{
                position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                fontFamily:T.mono, fontSize:9, color:T.textMute,
                background:T.surfaceAlt, border:`1px solid ${T.border}`,
                padding:'2px 6px', borderRadius:3,
              }}>Ctrl+K</kbd>
          }
        </div>

        {/* domain filter chips — scrollable row */}
        <div style={{
          display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2,
          scrollbarWidth: 'none',
        }}>
          {['ALL', ...navGroups.map(g => g.label)].map(g => {
            const meta = navGroups.find(ng => ng.label === g);
            const count = g === 'ALL' ? total : allItems.filter(i => i.group === g).length;
            const active = domain === g;
            return (
              <button key={g} onClick={() => setDomain(g)} style={{
                flexShrink: 0,
                padding: '4px 10px', borderRadius: 20,
                border: `1px solid ${active ? (meta?.color||T.navy) : T.border}`,
                background: active ? (meta?.color||T.navy) : T.surface,
                color: active ? '#fff' : T.textSub,
                fontSize: 11, fontFamily: T.font, cursor: 'pointer',
                fontWeight: active ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 4,
                whiteSpace: 'nowrap',
                transition: 'all 0.12s',
              }}>
                {meta && <span style={{fontSize:11}}>{meta.icon}</span>}
                <span>{g === 'ALL' ? `All ${total}` : `${g.replace(/ & /g,'/')} ${count}`}</span>
              </button>
            );
          })}
        </div>

        {/* result count when filtering */}
        {(query || domain !== 'ALL') && (
          <div style={{ fontSize: 11, color: T.textMute, fontFamily: T.mono }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {query && <> · "<span style={{color:T.navy}}>{query}</span>"</>}
            {domain !== 'ALL' && <> · {domain}</>}
            <button onClick={() => { setQuery(''); setDomain('ALL'); }} style={{
              marginLeft: 10, fontSize: 10, color: T.gold, background:'none',
              border:`1px solid ${T.goldLight}`, borderRadius:3, padding:'1px 7px',
              cursor:'pointer', fontFamily: T.font,
            }}>clear</button>
          </div>
        )}
      </div>

      {/* ── content ──────────────────────────────────────────────── */}
      <div style={{ padding: '14px 20px' }}>

        {/* no results */}
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'50px 20px', color:T.textMute }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14 }}>No modules match <strong>"{query}"</strong></div>
            <button onClick={() => { setQuery(''); setDomain('ALL'); }} style={{
              marginTop: 14, padding:'7px 18px', borderRadius:6,
              background: T.navy, color:'#fff', border:'none',
              fontSize: 12, fontFamily: T.font, cursor:'pointer',
            }}>Clear filters</button>
          </div>
        )}

        {/* recent strip */}
        {!query && domain === 'ALL' && recentItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <GroupHeader icon="🕐" label="Recently Visited" count={recentItems.length} color={T.gold} />
            <ItemGrid items={recentItems} view={view} onGo={goTo} isRecent />
          </div>
        )}

        {/* grouped (default ALL) */}
        {grouped && filtered.length > 0 && grouped.map(({ g, items, icon, color }) => (
          <div key={g} style={{ marginBottom: 22 }}>
            <GroupHeader icon={icon} label={g} count={items.length} color={color} />
            <ItemGrid items={items} view={view} onGo={goTo} />
          </div>
        ))}

        {/* flat (filtered/sorted) */}
        {!grouped && filtered.length > 0 && (
          <ItemGrid items={filtered} view={view} onGo={goTo} showGroup />
        )}

      </div>
    </div>
  );
}

/* ─── GroupHeader ────────────────────────────────────────────────── */
function GroupHeader({ icon, label, count, color }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8, marginBottom:8,
      paddingBottom:7, borderBottom:`1px solid ${T.border}`,
    }}>
      <span style={{ fontSize:14 }}>{icon}</span>
      <span style={{ fontSize:12, fontWeight:700, color: color||T.navy }}>{label}</span>
      <span style={{
        fontSize:10, fontFamily:T.mono, color:T.textMute,
        background:T.surfaceAlt, padding:'1px 7px', borderRadius:10,
        border:`1px solid ${T.border}`,
      }}>{count}</span>
    </div>
  );
}

/* ─── ItemGrid — switches between view modes ─────────────────────── */
function ItemGrid({ items, view, onGo, showGroup, isRecent }) {
  if (view === 'compact') return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:4 }}>
      {items.map(i => <CompactTile key={i.path} item={i} onGo={onGo} />)}
    </div>
  );
  if (view === 'list') return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      {items.map(i => <ListRow key={i.path} item={i} onGo={onGo} showGroup={showGroup} />)}
    </div>
  );
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))', gap:8 }}>
      {items.map(i => <GridCard key={i.path} item={i} onGo={onGo} showGroup={showGroup} isRecent={isRecent} />)}
    </div>
  );
}

/* ─── GridCard ───────────────────────────────────────────────────── */
function GridCard({ item, onGo, showGroup, isRecent }) {
  const [hov, setHov] = useState(false);
  const [c, bg] = sprintColor(item.code);
  const badges = (item.badge||'').split('·').map(s=>s.trim()).filter(Boolean);

  return (
    <div
      onClick={() => onGo(item.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#fafaf8' : T.surface,
        border: `1px solid ${hov ? T.borderMed : T.border}`,
        borderLeft: `3px solid ${item.gColor || T.navy}`,
        borderRadius: 7,
        padding: '11px 13px',
        cursor: 'pointer',
        transition: 'all 0.12s',
        boxShadow: hov ? '0 3px 12px rgba(27,58,92,0.1)' : '0 1px 3px rgba(27,58,92,0.04)',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* code + arrow */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <div style={{ display:'flex', gap:5 }}>
          {item.code && (
            <span style={{
              fontFamily:T.mono, fontSize:9, fontWeight:700,
              color:c, background:bg, padding:'2px 6px',
              borderRadius:3, border:`1px solid ${c}33`,
            }}>{item.code}</span>
          )}
          {isRecent && (
            <span style={{
              fontFamily:T.mono, fontSize:9,
              background:T.goldLight, color:T.gold,
              padding:'2px 6px', borderRadius:3,
            }}>recent</span>
          )}
        </div>
        <span style={{ fontSize:13, color: T.textMute, opacity: hov?1:0.3, transition:'opacity 0.12s' }}>→</span>
      </div>

      {/* label */}
      <div style={{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.3, marginBottom:4 }}>
        {item.label}
      </div>

      {/* group (when flat) */}
      {showGroup && (
        <div style={{ fontSize:10, color:item.gColor||T.textMute, marginBottom:4, display:'flex', alignItems:'center', gap:3 }}>
          <span>{item.gIcon}</span><span>{item.group}</span>
        </div>
      )}

      {/* badges */}
      {badges.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:5 }}>
          {badges.slice(0,3).map((b,i) => (
            <span key={i} style={{
              fontSize:9, fontFamily:T.mono,
              background:T.surfaceAlt, color:T.textMute,
              padding:'2px 5px', borderRadius:3,
              border:`1px solid ${T.border}`,
            }}>{b}</span>
          ))}
          {badges.length > 3 && <span style={{fontSize:9,color:T.textMute}}>+{badges.length-3}</span>}
        </div>
      )}
    </div>
  );
}

/* ─── ListRow ────────────────────────────────────────────────────── */
function ListRow({ item, onGo, showGroup }) {
  const [hov, setHov] = useState(false);
  const [c, bg] = sprintColor(item.code);
  return (
    <div
      onClick={() => onGo(item.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'8px 12px',
        background: hov ? '#fafaf8' : T.surface,
        border:`1px solid ${hov ? T.borderMed : T.border}`,
        borderLeft:`3px solid ${item.gColor||T.navy}`,
        borderRadius:6, cursor:'pointer',
        transition:'all 0.1s',
      }}
    >
      {item.code && (
        <span style={{
          fontFamily:T.mono, fontSize:9, fontWeight:700,
          color:c, background:bg, padding:'2px 7px', borderRadius:3,
          border:`1px solid ${c}33`, flexShrink:0, minWidth:52, textAlign:'center',
        }}>{item.code}</span>
      )}
      <span style={{ fontSize:13, fontWeight:600, color:T.text, flex:1, minWidth:0 }}>{item.label}</span>
      {showGroup && (
        <span style={{ fontSize:10, color:T.textMute, flexShrink:0, display:'flex', alignItems:'center', gap:3 }}>
          <span>{item.gIcon}</span><span style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.group}</span>
        </span>
      )}
      <span style={{
        fontSize:9, fontFamily:T.mono, color:T.textMute,
        maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0,
      }}>{(item.badge||'').split('·')[0].trim()}</span>
      <span style={{ fontSize:13, color:T.textMute, opacity:hov?1:0.25, transition:'opacity 0.1s', flexShrink:0 }}>→</span>
    </div>
  );
}

/* ─── CompactTile ────────────────────────────────────────────────── */
function CompactTile({ item, onGo }) {
  const [hov, setHov] = useState(false);
  const [c, bg] = sprintColor(item.code);
  return (
    <div
      onClick={() => onGo(item.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${item.label}\n${item.badge||''}\n${item.path}`}
      style={{
        padding:'6px 9px',
        background: hov ? bg : T.surface,
        border:`1px solid ${hov ? c+'55' : T.border}`,
        borderRadius:5, cursor:'pointer',
        transition:'all 0.1s',
        display:'flex', alignItems:'center', gap:6,
      }}
    >
      {item.code && (
        <span style={{
          fontFamily:T.mono, fontSize:8, color:c,
          fontWeight:700, flexShrink:0, minWidth:44,
        }}>{item.code}</span>
      )}
      <span style={{
        fontSize:11, color:T.text,
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1,
      }}>{item.label}</span>
    </div>
  );
}
