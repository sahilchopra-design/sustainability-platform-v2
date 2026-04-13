import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* ─── theme (inline, no import) ─────────────────────────────────── */
const T = {
  bg:       '#f8f7f4',
  surface:  '#ffffff',
  surfaceAlt: '#f4f3f0',
  border:   'rgba(27,58,92,0.08)',
  borderMed:'rgba(27,58,92,0.14)',
  text:     '#1b2c3e',
  textSub:  '#4a5e70',
  textMute: '#8a9aaa',
  gold:     '#b8922a',
  goldLight:'#f5e9c8',
  navy:     '#1b3a5c',
  accent:   '#2563eb',
  accentBg: '#eff6ff',
  green:    '#16a34a',
  greenBg:  '#f0fdf4',
  red:      '#dc2626',
  amber:    '#d97706',
  amberBg:  '#fffbeb',
  mono:     "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  font:     "'DM Sans', system-ui, -apple-system, sans-serif",
};

/* ─── sprint metadata ────────────────────────────────────────────── */
const SPRINT_META = {
  'E': { label: 'Core', color: '#4a7faa', bg: '#eef4f9' },
  'EP-A': { label: 'Sprt A', color: '#5a9aaa', bg: '#eef6f7' },
  'EP-B': { label: 'Sprt B', color: '#5a8a6a', bg: '#eef5f0' },
  'EP-C': { label: 'Sprt C', color: '#7ba67d', bg: '#f0f5f0' },
  'EP-D': { label: 'Admin', color: '#8a7a5a', bg: '#f4f2ec' },
  'ICE':  { label: 'ICE Hub', color: '#b8922a', bg: '#fdf5e4' },
  'EP-BB':{ label: 'Sprt BB', color: '#6b5aaa', bg: '#f2f0fa' },
  'EP-BC':{ label: 'Sprt BC', color: '#aa5a7a', bg: '#faf0f4' },
  'EP-BD':{ label: 'Sprt BD', color: '#aa7a5a', bg: '#faf4ee' },
  'EP-BE':{ label: 'Sprt BE', color: '#5aaa7a', bg: '#eef8f2' },
  'EP-BF':{ label: 'Sprt BF', color: '#7a5aaa', bg: '#f4f0fa' },
  'EP-BG':{ label: 'Sprt BG', color: '#5a7aaa', bg: '#eef2f8' },
  'EP-BH':{ label: 'Sprt BH', color: '#aa5a5a', bg: '#faf0f0' },
  'EP-BI':{ label: 'Sprt BI', color: '#5aaa5a', bg: '#f0f8f0' },
  'EP-BJ':{ label: 'Sprt BJ', color: '#aaaa5a', bg: '#f8f8ee' },
  'EP-BK':{ label: 'Sprt BK', color: '#5aaaaa', bg: '#eef8f8' },
  'EP-BL':{ label: 'Sprt BL', color: '#aa5aaa', bg: '#f8eef8' },
  'EP-BM':{ label: 'Sprt BM', color: '#6a8a5a', bg: '#f0f4ee' },
  'EP-BN':{ label: 'Sprt BN', color: '#8a6a5a', bg: '#f4f0ee' },
  'EP-BO':{ label: 'Sprt BO', color: '#5a6a8a', bg: '#eef0f4' },
  'EP-BP':{ label: 'Sprt BP', color: '#8a5a6a', bg: '#f4eef0' },
  'EP-BQ':{ label: 'Sprt BQ', color: '#6a5a8a', bg: '#f0eef4' },
  'EP-BR':{ label: 'Sprt BR', color: '#5a8a8a', bg: '#eef4f4' },
  'EP-BS':{ label: 'Sprt BS', color: '#8a8a5a', bg: '#f4f4ee' },
  'EP-BT':{ label: 'Sprt BT', color: '#4a6a8a', bg: '#ecf0f4' },
  'EP-BU':{ label: 'Sprt BU', color: '#8a4a6a', bg: '#f4ecf0' },
  'EP-BV':{ label: 'Sprt BV', color: '#6a8a4a', bg: '#f0f4ec' },
  'EP-BW':{ label: 'Sprt BW', color: '#4a8a6a', bg: '#ecf4f0' },
  'EP-CY':{ label: 'Sprt CY', color: '#2563eb', bg: '#eff6ff' },
  'EP-CZ':{ label: 'Sprt CZ', color: '#7c3aed', bg: '#f5f3ff' },
  'EP-DA':{ label: 'Sprt DA', color: '#059669', bg: '#ecfdf5' },
  'EP-DB':{ label: 'Sprt DB', color: '#991b1b', bg: '#fef2f2' },
  'EP-DC':{ label: 'Sprt DC', color: '#065f46', bg: '#ecfdf5' },
  'EP-DD':{ label: 'Sprt DD', color: '#1e3a5f', bg: '#eff3f8' },
  'EP-DE':{ label: 'Sprt DE', color: '#92400e', bg: '#fffbeb' },
  'EP-DF':{ label: 'Sprt DF', color: '#1d4ed8', bg: '#eff6ff' },
  'EP-DG':{ label: 'Sprt DG', color: '#166534', bg: '#f0fdf4' },
  'EP-DH':{ label: 'Sprt DH', color: '#7e22ce', bg: '#faf5ff' },
  'EP-DI':{ label: 'Sprt DI', color: '#c2410c', bg: '#fff7ed' },
  'EP-DJ':{ label: 'Sprt DJ', color: '#0e7490', bg: '#ecfeff' },
  'EP-DK':{ label: 'Sprt DK', color: '#374151', bg: '#f9fafb' },
  'EP-DL':{ label: 'Sprt DL', color: '#4d7c0f', bg: '#f7fee7' },
  'EP-DM':{ label: 'Sprt DM', color: '#1e40af', bg: '#eff6ff' },
  'EP-DN':{ label: 'Sprt DN', color: '#6b21a8', bg: '#faf5ff' },
  'EP-DO':{ label: 'Sprt DO', color: '#b45309', bg: '#fffbeb' },
  'EP-DP':{ label: 'Sprt DP', color: '#be185d', bg: '#fdf2f8' },
  'EP-DQ':{ label: 'Sprt DQ', color: '#065f46', bg: '#ecfdf5' },
};

function getSprintMeta(code) {
  if (!code) return { label: '—', color: T.textMute, bg: T.surfaceAlt };
  for (const prefix of Object.keys(SPRINT_META).sort((a, b) => b.length - a.length)) {
    if (code.startsWith(prefix)) return SPRINT_META[prefix];
  }
  return { label: code, color: T.textMute, bg: T.surfaceAlt };
}

/* ─── keyboard shortcut hook ────────────────────────────────────── */
function useKey(key, cb) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === key) && (e.ctrlKey || e.metaKey)) { e.preventDefault(); cb(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, cb]);
}

/* ════════════════════════════════════════════════════════════════════
   MODULE NAVIGATOR PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function ModuleNavigatorPage({ navGroups = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const [query, setQuery]         = useState('');
  const [activeGroup, setActiveGroup] = useState('ALL');
  const [viewMode, setViewMode]   = useState('grid'); // 'grid' | 'list' | 'compact'
  const [sortBy, setSortBy]       = useState('default'); // 'default' | 'alpha' | 'code'
  const [recentPaths, setRecentPaths] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nav_recent') || '[]'); } catch { return []; }
  });

  /* focus search on Ctrl+K */
  useKey('k', useCallback(() => searchRef.current?.focus(), []));

  /* flatten all items with group metadata */
  const allItems = useMemo(() => navGroups.flatMap(g =>
    g.items.map(item => ({ ...item, group: g.label, groupIcon: g.icon, groupColor: g.color }))
  ), [navGroups]);

  const totalCount = allItems.length;

  /* group labels for filter chips */
  const groupLabels = useMemo(() => ['ALL', ...navGroups.map(g => g.label)], [navGroups]);

  /* filtered + sorted items */
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    let items = allItems;

    if (activeGroup !== 'ALL') {
      items = items.filter(i => i.group === activeGroup);
    }

    if (q) {
      items = items.filter(i =>
        i.label.toLowerCase().includes(q) ||
        (i.code || '').toLowerCase().includes(q) ||
        (i.badge || '').toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q) ||
        i.path.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'alpha') {
      items = [...items].sort((a, b) => a.label.localeCompare(b.label));
    } else if (sortBy === 'code') {
      items = [...items].sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    }

    return items;
  }, [allItems, query, activeGroup, sortBy]);

  /* group filtered items by group label for grouped display */
  const groupedFiltered = useMemo(() => {
    const map = new Map();
    filteredItems.forEach(item => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push(item);
    });
    return Array.from(map.entries()).map(([group, items]) => {
      const g = navGroups.find(ng => ng.label === group);
      return { group, items, icon: g?.icon || '📦', color: g?.color || T.textMute };
    });
  }, [filteredItems, navGroups]);

  /* recent modules */
  const recentItems = useMemo(() =>
    recentPaths.slice(0, 6).map(p => allItems.find(i => i.path === p)).filter(Boolean),
  [recentPaths, allItems]);

  function goTo(path) {
    setRecentPaths(prev => {
      const next = [path, ...prev.filter(p => p !== path)].slice(0, 20);
      try { localStorage.setItem('nav_recent', JSON.stringify(next)); } catch {}
      return next;
    });
    navigate(path);
  }

  const showGrouped = activeGroup === 'ALL' && !query && sortBy === 'default';

  /* ── render ── */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 80px' }}>

      {/* ── top bar ── */}
      <div style={{
        background: T.navy,
        borderBottom: `2px solid ${T.gold}`,
        padding: '20px 32px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: 3, textTransform: 'uppercase' }}>
              A² PLATFORM
            </div>
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ fontFamily: T.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 }}>
              MODULE NAVIGATOR
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              <Stat label="TOTAL" value={totalCount} color={T.gold} />
              <Stat label="DOMAINS" value={navGroups.length} color='#7dd3fc' />
              <Stat label="SHOWN" value={filteredItems.length} color='#86efac' />
            </div>
          </div>

          {/* search */}
          <div style={{ position: 'relative', maxWidth: 680 }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, opacity: 0.5,
            }}>🔍</span>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search modules, codes, badges, domains…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 120px 11px 42px',
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid rgba(255,255,255,0.15)`,
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontFamily: T.font,
                outline: 'none',
                caretColor: T.gold,
              }}
              onFocus={e => e.target.style.borderColor = T.gold}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: 90, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
              >×</button>
            )}
            <kbd style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontFamily: T.mono, fontSize: 10, color: 'rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.08)', padding: '3px 7px', borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>Ctrl+K</kbd>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 32px' }}>

        {/* ── filter bar ── */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {/* group chips — only show first 12 + overflow */}
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {groupLabels.slice(0, 15).map(g => {
              const gData = navGroups.find(ng => ng.label === g);
              const active = activeGroup === g;
              return (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: active ? `1.5px solid ${gData?.color || T.navy}` : `1px solid ${T.border}`,
                  background: active ? (gData?.color || T.navy) : T.surface,
                  color: active ? '#fff' : T.textSub,
                  fontSize: 11,
                  fontFamily: T.font,
                  cursor: 'pointer',
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}>
                  {gData && <span>{gData.icon}</span>}
                  {g === 'ALL' ? `All (${totalCount})` : `${g.split(' ').slice(0, 3).join(' ')} (${allItems.filter(i => i.group === g).length})`}
                </button>
              );
            })}
            {groupLabels.length > 15 && (
              <span style={{ fontSize: 11, color: T.textMute, padding: '5px 4px', alignSelf: 'center' }}>
                +{groupLabels.length - 15} more groups
              </span>
            )}
          </div>

          {/* controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              options={[['default','Default Order'],['alpha','A → Z'],['code','By Code']]}
            />
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {/* ── recent modules ── */}
        {!query && recentItems.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionHeading icon="🕐" label="Recently Visited" count={recentItems.length} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
              {recentItems.map(item => (
                <ModuleCard key={item.path} item={item} onGo={goTo} compact viewMode="grid" isRecent />
              ))}
            </div>
          </div>
        )}

        {/* ── results ── */}
        {query && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMute }}>
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for
            </span>
            <span style={{
              fontFamily: T.mono, fontSize: 11, color: T.navy,
              background: T.goldLight, padding: '2px 8px', borderRadius: 4,
            }}>"{query}"</span>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: T.textMute, fontSize: 14, fontFamily: T.font,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div>No modules match <strong>"{query}"</strong></div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Try a shorter query or different terms</div>
            <button onClick={() => { setQuery(''); setActiveGroup('ALL'); }} style={{
              marginTop: 16, padding: '8px 20px', borderRadius: 6,
              background: T.navy, color: '#fff', border: 'none',
              fontFamily: T.font, fontSize: 12, cursor: 'pointer',
            }}>Clear filters</button>
          </div>
        )}

        {/* ── grouped display (default ALL view) ── */}
        {showGrouped && filteredItems.length > 0 && groupedFiltered.map(({ group, items, icon, color }) => (
          <div key={group} style={{ marginBottom: 32 }}>
            <SectionHeading icon={icon} label={group} count={items.length} color={color} />
            <ModuleGrid items={items} viewMode={viewMode} onGo={goTo} />
          </div>
        ))}

        {/* ── flat display (search or filter active) ── */}
        {!showGrouped && filteredItems.length > 0 && (
          <ModuleGrid items={filteredItems} viewMode={viewMode} onGo={goTo} showGroup />
        )}

      </div>
    </div>
  );
}

/* ─── sub-components ─────────────────────────────────────────────── */

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: T.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectionHeading({ icon, label, count, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
      paddingBottom: 8, borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || T.text }}>{label}</span>
      <span style={{
        fontSize: 10, fontFamily: T.mono, color: T.textMute,
        background: T.surfaceAlt, padding: '2px 7px', borderRadius: 10,
        border: `1px solid ${T.border}`,
      }}>{count}</span>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
      background: T.surface, color: T.textSub, fontSize: 11,
      fontFamily: T.font, cursor: 'pointer', outline: 'none',
    }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function ViewToggle({ viewMode, setViewMode }) {
  const modes = [
    { id: 'grid', icon: '⊞', title: 'Grid' },
    { id: 'list', icon: '☰', title: 'List' },
    { id: 'compact', icon: '≡', title: 'Compact' },
  ];
  return (
    <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
      {modes.map(m => (
        <button key={m.id} onClick={() => setViewMode(m.id)} title={m.title} style={{
          padding: '5px 10px', border: 'none', cursor: 'pointer',
          background: viewMode === m.id ? T.navy : T.surface,
          color: viewMode === m.id ? '#fff' : T.textMute,
          fontSize: 14, lineHeight: 1,
          borderRight: m.id !== 'compact' ? `1px solid ${T.border}` : 'none',
          transition: 'all 0.1s',
        }}>{m.icon}</button>
      ))}
    </div>
  );
}

function ModuleGrid({ items, viewMode, onGo, showGroup = false }) {
  if (viewMode === 'compact') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 4 }}>
        {items.map(item => <CompactRow key={item.path} item={item} onGo={onGo} showGroup={showGroup} />)}
      </div>
    );
  }
  if (viewMode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(item => <ListRow key={item.path} item={item} onGo={onGo} showGroup={showGroup} />)}
      </div>
    );
  }
  // grid
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
      {items.map(item => <ModuleCard key={item.path} item={item} onGo={onGo} viewMode="grid" showGroup={showGroup} />)}
    </div>
  );
}

/* ── grid card ── */
function ModuleCard({ item, onGo, showGroup, isRecent }) {
  const [hov, setHov] = useState(false);
  const sm = getSprintMeta(item.code);
  const badgeParts = (item.badge || '').split('·').map(s => s.trim()).filter(Boolean);

  return (
    <div
      onClick={() => onGo(item.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#fafaf8' : T.surface,
        border: `1px solid ${hov ? T.borderMed : T.border}`,
        borderRadius: 8,
        padding: '13px 14px',
        cursor: 'pointer',
        transition: 'all 0.12s',
        boxShadow: hov ? '0 4px 14px rgba(27,58,92,0.09)' : '0 1px 3px rgba(27,58,92,0.04)',
        transform: hov ? 'translateY(-1px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: item.groupColor || T.navy, borderRadius: '8px 0 0 8px',
        opacity: hov ? 1 : 0.5,
        transition: 'opacity 0.12s',
      }} />

      {/* top row: code badge + navigate arrow */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {item.code && (
            <span style={{
              fontFamily: T.mono, fontSize: 9,
              background: sm.bg, color: sm.color,
              padding: '2px 6px', borderRadius: 4,
              border: `1px solid ${sm.color}22`,
              fontWeight: 600, letterSpacing: 0.5,
            }}>{item.code}</span>
          )}
          {isRecent && (
            <span style={{
              fontFamily: T.mono, fontSize: 9,
              background: T.goldLight, color: T.gold,
              padding: '2px 6px', borderRadius: 4,
            }}>recent</span>
          )}
        </div>
        <span style={{ fontSize: 14, opacity: hov ? 0.9 : 0.3, transition: 'opacity 0.12s' }}>→</span>
      </div>

      {/* module name */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: T.text,
        lineHeight: 1.35, marginBottom: 5,
      }}>{item.label}</div>

      {/* group (if showing flat results) */}
      {showGroup && (
        <div style={{ fontSize: 10, color: item.groupColor || T.textMute, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{item.groupIcon}</span>
          <span>{item.group}</span>
        </div>
      )}

      {/* badges */}
      {badgeParts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {badgeParts.slice(0, 4).map((b, i) => (
            <span key={i} style={{
              fontSize: 9, fontFamily: T.mono,
              background: T.surfaceAlt, color: T.textMute,
              padding: '2px 6px', borderRadius: 3,
              border: `1px solid ${T.border}`,
            }}>{b}</span>
          ))}
          {badgeParts.length > 4 && (
            <span style={{ fontSize: 9, color: T.textMute }}>+{badgeParts.length - 4}</span>
          )}
        </div>
      )}

      {/* path */}
      <div style={{
        marginTop: 8, fontFamily: T.mono, fontSize: 9,
        color: T.textMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{item.path}</div>
    </div>
  );
}

/* ── list row ── */
function ListRow({ item, onGo, showGroup }) {
  const [hov, setHov] = useState(false);
  const sm = getSprintMeta(item.code);
  return (
    <div
      onClick={() => onGo(item.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: hov ? '#fafaf8' : T.surface,
        border: `1px solid ${hov ? T.borderMed : T.border}`,
        borderRadius: 6, cursor: 'pointer',
        transition: 'all 0.1s',
        borderLeft: `3px solid ${item.groupColor || T.navy}`,
      }}
    >
      {item.code && (
        <span style={{
          fontFamily: T.mono, fontSize: 9,
          background: sm.bg, color: sm.color,
          padding: '2px 7px', borderRadius: 4, flexShrink: 0,
          border: `1px solid ${sm.color}22`, fontWeight: 600,
          minWidth: 56, textAlign: 'center',
        }}>{item.code}</span>
      )}
      <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1, minWidth: 0 }}>{item.label}</span>
      {showGroup && (
        <span style={{ fontSize: 10, color: T.textMute, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{item.groupIcon}</span>{item.group.split(' ').slice(0, 3).join(' ')}
        </span>
      )}
      <span style={{
        fontSize: 9, fontFamily: T.mono, color: T.textMute,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: 160, flexShrink: 0,
      }}>{(item.badge || '').split('·')[0].trim()}</span>
      <span style={{ fontSize: 12, opacity: hov ? 0.7 : 0.2, transition: 'opacity 0.1s', flexShrink: 0 }}>→</span>
    </div>
  );
}

/* ── compact row ── */
function CompactRow({ item, onGo, showGroup }) {
  const [hov, setHov] = useState(false);
  const sm = getSprintMeta(item.code);
  return (
    <div
      onClick={() => onGo(item.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${item.label}\n${item.badge || ''}\n${item.path}`}
      style={{
        padding: '6px 10px',
        background: hov ? sm.bg : T.surface,
        border: `1px solid ${hov ? sm.color + '44' : T.border}`,
        borderRadius: 5, cursor: 'pointer',
        transition: 'all 0.1s',
        display: 'flex', alignItems: 'center', gap: 7,
      }}
    >
      {item.code && (
        <span style={{
          fontFamily: T.mono, fontSize: 8, color: sm.color,
          fontWeight: 700, flexShrink: 0, minWidth: 44,
        }}>{item.code}</span>
      )}
      <span style={{
        fontSize: 11, color: T.text, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        flex: 1,
      }}>{item.label}</span>
    </div>
  );
}
