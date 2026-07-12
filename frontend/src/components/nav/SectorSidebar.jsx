import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
// NAV_GROUPS/ALL_ITEMS live in navGroups.js (not App.js) specifically so this
// file and App.js don't import each other — App.js renders <SectorSidebar>,
// so importing the data from App.js directly caused a circular-import TDZ crash.
import { NAV_GROUPS, ALL_ITEMS } from '../../navGroups';

/* ═══════════════════════════════════════════════════════════════════
   Shared institutional theme tokens — mirrors App.js's own `T` object
   and the color values the original Sidebar used inline, so this is a
   visual drop-in, not a redesign.
   ═══════════════════════════════════════════════════════════════════ */
const T = {
  navy: '#1b3a5c', navyD: '#12273d',
  gold: '#c5a96a', goldL: '#d8c391',
  sageL: '#7ba67d',
  font: "'DM Sans', 'SF Pro Display', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
};

// Cohesive cool→warm categorical ramp for sector chips (mirrors PASTEL in
// App.js — duplicated locally since PASTEL isn't exported).
const SECTOR_COLORS = ['#3d6ea8', '#4d8a93', '#4f8a68', '#7d9a4e', '#a8843c', '#c5a96a', '#7b6ca8'];

const SAFE_NAV_GROUPS = Array.isArray(NAV_GROUPS) ? NAV_GROUPS : [];
const SAFE_ALL_ITEMS = Array.isArray(ALL_ITEMS) ? ALL_ITEMS : SAFE_NAV_GROUPS.flatMap(g => (g && g.items) || []);

const norm = (p) => (p || '').replace(/^\//, '');

function matchesSearch(item, q) {
  if (!q) return true;
  return (item.label || '').toLowerCase().includes(q)
    || (item.badge || '').toLowerCase().includes(q)
    || (item.code || '').toLowerCase().includes(q);
}

function findItemByPath(path) {
  const key = norm(path);
  return SAFE_ALL_ITEMS.find(i => norm(i.path) === key) || { path: path && path.startsWith('/') ? path : `/${key}`, label: key || path, badge: '', code: '' };
}

/* ═══════════════════════════════════════════════════════════════════
   Star toggle button — outlined vs filled, optimistic add/remove.
   ═══════════════════════════════════════════════════════════════════ */
function StarButton({ isFav, onToggle }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(); }}
      title={isFav ? 'Remove from pinned' : 'Pin to sidebar'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        fontSize: 11, lineHeight: 1, flexShrink: 0,
        color: isFav ? T.gold : 'rgba(255,255,255,0.25)',
      }}
    >{isFav ? '★' : '☆'}</button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   One module row — shared by Pinned / Recent / sector (and fallback
   flat-group) lists so styling stays identical across all of them.
   ═══════════════════════════════════════════════════════════════════ */
function ModuleRow({ item, isActive, isFav, onToggleFav }) {
  return (
    <NavLink to={item.path} style={{
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
      padding: '6px 8px 6px 26px', borderRadius: 7, marginTop: 1, textDecoration: 'none',
      background: isActive ? 'rgba(197,169,106,0.16)' : 'transparent',
      transition: 'background 0.12s',
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.045)'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {isActive && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 3, height: 14, borderRadius: 3, background: T.gold }} />}
      <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? T.goldL : 'rgba(255,255,255,0.56)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>
      <StarButton isFav={isFav} onToggle={onToggleFav} />
      <span style={{ fontSize: 8, fontFamily: T.mono, fontWeight: 600, color: isActive ? 'rgba(216,195,145,0.8)' : 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{item.code}</span>
    </NavLink>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Collapsible group block — used for Pinned, Recent, each sector, and
   (in fallback mode) each raw NAV_GROUPS domain.
   ═══════════════════════════════════════════════════════════════════ */
function GroupBlock({ label, icon, count, color, isOpen, onToggle, isActive, children }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div onClick={onToggle} style={{
        padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        borderRadius: 7, userSelect: 'none',
        background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
        <span style={{ fontSize: 12, width: 16, textAlign: 'center', filter: isActive ? 'none' : 'saturate(0.85)', color: color || undefined }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.62)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', fontWeight: 600, minWidth: 16, textAlign: 'right' }}>{count}</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform 0.16s cubic-bezier(0.22,1,0.36,1)', marginLeft: 2 }}>▾</span>
      </div>
      {isOpen && <div style={{ paddingLeft: 4 }}>{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SectorSidebar — drop-in replacement for App.js's `Sidebar` function.
   Same props: { search, setSearch, sidebarOpen }.
   ═══════════════════════════════════════════════════════════════════ */
export default function SectorSidebar({ search, setSearch, sidebarOpen }) {
  const location = useLocation();
  const { canAccess } = useAuth();
  const [collapsed, setCollapsed] = useState({});
  const toggle = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  // ── sectors: PUBLIC endpoint, drives the re-grouping. status tracks
  // loading/ready/error so we know when to fall back to the flat groups. ──
  const [sectorsState, setSectorsState] = useState({ status: 'loading', module_sectors: {}, sector_order: [] });
  useEffect(() => {
    let cancelled = false;
    axios.get('/api/v1/module-nav/sectors')
      .then(res => {
        if (cancelled) return;
        const data = res && res.data;
        if (data && data.module_sectors && Array.isArray(data.sector_order)) {
          setSectorsState({ status: 'ready', module_sectors: data.module_sectors, sector_order: data.sector_order });
        } else {
          setSectorsState({ status: 'error', module_sectors: {}, sector_order: [] });
        }
      })
      .catch(() => { if (!cancelled) setSectorsState({ status: 'error', module_sectors: {}, sector_order: [] }); });
    return () => { cancelled = true; };
  }, []);

  // ── favorites (requires auth; 401 -> empty, no error banner) ──
  const [favorites, setFavorites] = useState(new Set());
  useEffect(() => {
    let cancelled = false;
    axios.get('/api/v1/module-nav/favorites')
      .then(res => {
        if (cancelled) return;
        const favs = (res && res.data && Array.isArray(res.data.favorites)) ? res.data.favorites : [];
        setFavorites(new Set(favs.map(f => norm(f.module_path))));
      })
      .catch(() => { if (!cancelled) setFavorites(new Set()); });
    return () => { cancelled = true; };
  }, []);

  // ── recents (requires auth; 401 -> empty, no error banner) ──
  const [recents, setRecents] = useState([]);
  useEffect(() => {
    let cancelled = false;
    axios.get('/api/v1/module-nav/recents', { params: { limit: 8 } })
      .then(res => {
        if (cancelled) return;
        const rec = (res && res.data && Array.isArray(res.data.recents)) ? res.data.recents : [];
        setRecents(rec);
      })
      .catch(() => { if (!cancelled) setRecents([]); });
    return () => { cancelled = true; };
  }, []);

  const toggleFavorite = useCallback((item) => {
    const key = norm(item.path);
    const wasFav = favorites.has(key);
    // optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(key); else next.add(key);
      return next;
    });
    const revert = () => setFavorites(prev => {
      const next = new Set(prev);
      if (wasFav) next.add(key); else next.delete(key);
      return next;
    });
    const req = wasFav
      ? axios.delete(`/api/v1/module-nav/favorites/${key}`)
      : axios.post('/api/v1/module-nav/favorites', { module_path: item.path });
    req.catch(revert);
  }, [favorites]);

  // ── accessible items (auth-gated), same rule as the original Sidebar ──
  const accessibleGroups = useMemo(() => (
    SAFE_NAV_GROUPS.map(g => ({ ...g, items: (g.items || []).filter(i => canAccess(i.path)) }))
      .filter(g => g.items.length > 0)
  ), [canAccess]);

  const q = (search || '').toLowerCase();

  // ── sector-derived groups (only meaningful once sectorsState is ready) ──
  const sectorGroups = useMemo(() => {
    if (sectorsState.status !== 'ready') return [];
    const map = new Map();
    const order = sectorsState.sector_order.slice();
    for (const g of accessibleGroups) {
      for (const item of g.items) {
        const moduleId = norm(item.path);
        const sector = sectorsState.module_sectors[moduleId] || 'Other';
        if (!map.has(sector)) map.set(sector, []);
        map.get(sector).push(item);
        if (!order.includes(sector)) order.push(sector);
      }
    }
    return order.filter(s => map.has(s)).map((sector, idx) => ({
      label: sector, items: map.get(sector), color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
    }));
  }, [sectorsState, accessibleGroups]);

  const filteredSectorGroups = useMemo(() => (
    sectorGroups.map(g => ({ ...g, items: g.items.filter(i => matchesSearch(i, q)) })).filter(g => g.items.length > 0)
  ), [sectorGroups, q]);

  const filteredFlatGroups = useMemo(() => (
    accessibleGroups.map(g => ({ ...g, items: g.items.filter(i => matchesSearch(i, q)) })).filter(g => g.items.length > 0)
  ), [accessibleGroups, q]);

  const usingSectors = sectorsState.status === 'ready';
  const displayGroups = usingSectors ? filteredSectorGroups : filteredFlatGroups;
  const resultCount = displayGroups.reduce((a, g) => a + g.items.length, 0);

  // Pinned/Recent are hidden while actively searching (search targets the
  // full module list) and hidden entirely when empty/unauthenticated.
  const pinnedItems = useMemo(() => (
    search ? [] : Array.from(favorites).map(findItemByPath).filter(i => canAccess(i.path))
  ), [favorites, search, canAccess]);

  const recentItems = useMemo(() => (
    search ? [] : recents.map(r => findItemByPath(r.module_path)).filter(i => canAccess(i.path))
  ), [recents, search, canAccess]);

  if (!sidebarOpen) return null;

  return (
    <nav style={{
      width: 252, background: T.navy, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${T.navyD}`, height: '100%', overflow: 'hidden',
    }}>
      {/* Search */}
      <div style={{ padding: '10px 10px 6px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>⌕</span>
          <input type="text" placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px 7px 26px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#e0dcd4', fontSize: 11, outline: 'none', fontFamily: T.font, boxSizing: 'border-box', transition: 'border-color 0.15s, background 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
          />
        </div>
        {search && <div style={{ fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', padding: '4px 2px 0', letterSpacing: '0.04em' }}>{resultCount} results</div>}
      </div>

      {/* Nav Groups */}
      <div className="a2-scroll-dark" style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 12px' }}>
        {pinnedItems.length > 0 && (
          <GroupBlock
            label="Pinned" icon="📌" count={pinnedItems.length}
            isOpen={!collapsed.__pinned} onToggle={() => toggle('__pinned')}
            isActive={pinnedItems.some(i => i.path === location.pathname)}
          >
            {pinnedItems.map(item => (
              <ModuleRow key={`pinned-${item.path}`} item={item} isActive={location.pathname === item.path}
                isFav={favorites.has(norm(item.path))} onToggleFav={() => toggleFavorite(item)} />
            ))}
          </GroupBlock>
        )}

        {recentItems.length > 0 && (
          <GroupBlock
            label="Recent" icon="🕘" count={recentItems.length}
            isOpen={!collapsed.__recent} onToggle={() => toggle('__recent')}
            isActive={recentItems.some(i => i.path === location.pathname)}
          >
            {recentItems.map(item => (
              <ModuleRow key={`recent-${item.path}`} item={item} isActive={location.pathname === item.path}
                isFav={favorites.has(norm(item.path))} onToggleFav={() => toggleFavorite(item)} />
            ))}
          </GroupBlock>
        )}

        {displayGroups.map(group => {
          const isGroupActive = group.items.some(i => i.path === location.pathname);
          return (
            <GroupBlock
              key={group.label} label={group.label}
              icon={usingSectors ? '◆' : group.icon} color={usingSectors ? group.color : undefined}
              count={group.items.length}
              isOpen={!collapsed[group.label]} onToggle={() => toggle(group.label)}
              isActive={isGroupActive}
            >
              {group.items.map(item => (
                <ModuleRow key={item.code || item.path} item={item} isActive={location.pathname === item.path}
                  isFav={favorites.has(norm(item.path))} onToggleFav={() => toggleFavorite(item)} />
              ))}
            </GroupBlock>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>{SAFE_ALL_ITEMS.length} MOD · {SAFE_NAV_GROUPS.length} DOM · 10 REG</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.sageL, boxShadow: `0 0 4px ${T.sageL}` }} />
          <span style={{ fontSize: 8, fontFamily: T.mono, color: T.sageL, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
      </div>
    </nav>
  );
}
