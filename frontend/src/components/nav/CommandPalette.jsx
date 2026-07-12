import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// NAV_GROUPS/ALL_ITEMS live in navGroups.js (not App.js) specifically so this
// file and App.js don't import each other — App.js mounts <CommandPalette>,
// so importing the data from App.js directly caused a circular-import TDZ crash.
import { NAV_GROUPS, ALL_ITEMS } from '../../navGroups';

/* ═══════════════════════════════════════════════════════════════════
   Shared institutional theme tokens — mirrors App.js's own `T` object.
   Duplicated locally (rather than imported) so this file has zero
   build-time coupling to App.js beyond the NAV_GROUPS/ALL_ITEMS data.
   ═══════════════════════════════════════════════════════════════════ */
const T = {
  surface: '#ffffff', surfaceAlt: '#f7f9fc', surfaceH: '#eef1f6',
  border: '#e3e8ef', borderL: '#cfd6e0',
  navy: '#1b3a5c', navyD: '#12273d', navyL: '#2c5a8c', ink: '#1a2433',
  gold: '#c5a96a', goldL: '#d8c391', goldD: '#8a6f2e',
  accent: '#2563a8', accentL: '#3b7bc4',
  text: '#1a2433', textSec: '#566373', textMut: '#8a94a3',
  card: '0 1px 2px rgba(16,24,40,0.04), 0 0 0 1px rgba(16,24,40,0.05)',
  cardH: '0 10px 28px -6px rgba(16,24,40,0.14), 0 0 0 1px rgba(16,24,40,0.06)',
  rSm: 6, rMd: 8, rLg: 12,
  font: "'DM Sans', 'SF Pro Display', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
};

// Flat list of every navigable module. Falls back to deriving it from
// NAV_GROUPS, and finally to an empty array — a missing App.js export must
// never crash the shell, it should just yield zero search results.
const SOURCE_ITEMS = Array.isArray(ALL_ITEMS)
  ? ALL_ITEMS
  : (Array.isArray(NAV_GROUPS) ? NAV_GROUPS.flatMap(g => (g && g.items) || []) : []);

/* ── module-level pub/sub: lets a <CommandPaletteTrigger/> rendered
   anywhere (e.g. HeaderBar) open the <CommandPalette/> singleton mounted
   anywhere else (e.g. near the app root), with zero prop drilling and
   without either component needing to know about the other's location. ── */
const _openListeners = new Set();
function requestOpenPalette() {
  _openListeners.forEach(fn => { try { fn(); } catch { /* ignore listener errors */ } });
}

/* ── sector lookup: fetched once per page-load, cached at module scope so
   repeated opens of the palette never re-fetch (GET is PUBLIC, no auth). ── */
let _sectorsCache = null;
let _sectorsPromise = null;
function loadSectors() {
  if (_sectorsCache) return Promise.resolve(_sectorsCache);
  if (_sectorsPromise) return _sectorsPromise;
  _sectorsPromise = axios.get('/api/v1/module-nav/sectors')
    .then(res => {
      const data = res && res.data;
      _sectorsCache = (data && data.module_sectors) ? data : { module_sectors: {}, sector_order: [] };
      return _sectorsCache;
    })
    .catch(() => {
      _sectorsCache = { module_sectors: {}, sector_order: [] };
      return _sectorsCache;
    })
    .finally(() => { _sectorsPromise = null; });
  return _sectorsPromise;
}

// Fire-and-forget recent-visit tracking. Never blocks navigation, never
// surfaces an error to the user (auth may be absent in dev/401 case).
function recordRecent(modulePath) {
  if (!modulePath) return;
  axios.post('/api/v1/module-nav/recents', { module_path: modulePath }).catch(() => {});
}

/* ═══════════════════════════════════════════════════════════════════
   Fuzzy match — dependency-free: exact substring beats subsequence;
   earlier / tighter matches score higher. No external fuzzy-search lib.
   Exported so it can be unit-exercised independently of the component.
   ═══════════════════════════════════════════════════════════════════ */
const NO_MATCH = null;

export function subsequenceScore(query, text) {
  if (!text) return NO_MATCH;
  const q = String(query).toLowerCase();
  const t = String(text).toLowerCase();
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx !== -1) return 1000 - idx * 2 - Math.min(t.length, 50);
  let ti = 0, qi = 0, firstMatch = -1, gaps = 0;
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) {
      if (firstMatch === -1) firstMatch = ti;
      qi++;
    } else if (firstMatch !== -1) {
      gaps++;
    }
    ti++;
  }
  if (qi < q.length) return NO_MATCH; // not all query chars found in order
  return 300 - gaps * 3 - firstMatch;
}

export function scoreItem(query, item) {
  if (!item) return NO_MATCH;
  const ls = subsequenceScore(query, item.label);
  const bs = subsequenceScore(query, item.badge);
  const cs = subsequenceScore(query, item.code);
  const candidates = [];
  if (ls !== NO_MATCH) candidates.push(ls);
  if (bs !== NO_MATCH) candidates.push(bs - 150);
  if (cs !== NO_MATCH) candidates.push(cs - 100);
  if (!candidates.length) return NO_MATCH;
  return Math.max(...candidates);
}

/* ═══════════════════════════════════════════════════════════════════
   Trigger pill — "Search or jump to... ⌘K"
   ═══════════════════════════════════════════════════════════════════ */
export function CommandPaletteTrigger({ onOpen, style }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { requestOpenPalette(); if (onOpen) onOpen(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Open command palette"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 8px 5px 10px', borderRadius: 999,
        background: hover ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
        color: 'rgba(255,255,255,0.55)', fontFamily: T.font, fontSize: 11,
        transition: 'background 0.15s, color 0.15s',
        ...style,
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.7 }}>{'⌕'}</span>
      <span>Search or jump to...</span>
      <span style={{
        fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.goldL,
        background: 'rgba(197,169,106,0.16)', padding: '2px 5px', borderRadius: 4,
        letterSpacing: '0.03em',
      }}>{'⌘K'}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Command Palette modal — mount once anywhere in the tree (e.g. inside
   the top-level App component, alongside <BrowserRouter>). It manages
   its own open/close state, listens globally for Ctrl/Cmd+K, and can
   also be opened via requestOpenPalette() (used by the Trigger above).
   ═══════════════════════════════════════════════════════════════════ */
export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectors, setSectors] = useState(null); // { module_sectors, sector_order } | null
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setIsOpen(true);
    _openListeners.add(handler);
    return () => _openListeners.delete(handler);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      const key = (e.key || '').toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch sectors (cached module-wide) the first time the palette opens.
  useEffect(() => {
    if (!isOpen || sectors) return;
    let cancelled = false;
    loadSectors().then(data => { if (!cancelled) setSectors(data); });
    return () => { cancelled = true; };
  }, [isOpen, sectors]);

  // Reset transient state on each open, and focus the input.
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setActiveIndex(0);
    const id = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 0);
    return () => clearTimeout(id);
  }, [isOpen]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  const close = useCallback(() => setIsOpen(false), []);

  const results = useMemo(() => {
    const items = SOURCE_ITEMS || [];
    if (!query.trim()) return items.slice(0, 30);
    const scored = [];
    for (const item of items) {
      const score = scoreItem(query, item);
      if (score !== NO_MATCH) scored.push({ item, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 30).map(s => s.item);
  }, [query]);

  const sectorFor = useCallback((item) => {
    if (!sectors || !sectors.module_sectors || !item || !item.path) return null;
    const moduleId = item.path.replace(/^\//, '');
    return sectors.module_sectors[moduleId] || null;
  }, [sectors]);

  const handleSelect = useCallback((item) => {
    if (!item) return;
    close();
    recordRecent(item.path);
    navigate(item.path);
  }, [close, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, Math.max(results.length - 1, 0))); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter') { e.preventDefault(); handleSelect(results[activeIndex]); return; }
  }, [results, activeIndex, close, handleSelect]);

  if (!isOpen) return null;

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(10,20,35,0.5)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '12vh 16px 0',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, background: T.surface, borderRadius: T.rLg,
          boxShadow: T.cardH, border: `1px solid ${T.border}`, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: '65vh',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 14, color: T.textMut }}>{'⌕'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to a module..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: T.font,
              color: T.text, background: 'transparent',
            }}
          />
          <span style={{
            fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: T.textMut,
            background: T.surfaceAlt, border: `1px solid ${T.border}`, padding: '2px 6px', borderRadius: 4,
          }}>ESC</span>
        </div>

        {/* Results */}
        <div className="a2-scroll" style={{ overflowY: 'auto', padding: '6px 6px' }}>
          {results.length === 0 && (
            <div style={{ padding: '18px 12px', fontSize: 12, color: T.textMut, fontFamily: T.font, textAlign: 'center' }}>
              No modules match "{query}"
            </div>
          )}
          {results.map((item, i) => {
            const active = i === activeIndex;
            const sector = sectorFor(item);
            return (
              <div
                key={item.path || item.code || i}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
                  cursor: 'pointer', position: 'relative',
                  background: active ? 'rgba(197,169,106,0.12)' : 'transparent',
                }}
              >
                {active && <span style={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, borderRadius: 3, background: T.gold }} />}
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 500, color: active ? T.navy : T.text,
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.label}</span>
                {sector && (
                  <span style={{
                    fontSize: 8, fontFamily: T.mono, fontWeight: 600, color: T.accentL,
                    background: 'rgba(37,99,168,0.08)', padding: '2px 6px', borderRadius: 3, flexShrink: 0,
                  }}>{sector}</span>
                )}
                {item.badge && (
                  <span style={{
                    fontSize: 9, color: T.textMut, flexShrink: 0, maxWidth: 160, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.badge}</span>
                )}
                <span style={{
                  fontSize: 8, fontFamily: T.mono, fontWeight: 700, color: T.goldD,
                  background: 'rgba(197,169,106,0.12)', padding: '2px 6px', borderRadius: 3, flexShrink: 0,
                }}>{item.code}</span>
              </div>
            );
          })}
        </div>

        {/* Footer hints */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px', borderTop: `1px solid ${T.border}`,
          fontSize: 9, fontFamily: T.mono, color: T.textMut, letterSpacing: '0.02em',
        }}>
          <span>{'↑↓'} navigate</span>
          <span>{'↵'} select</span>
          <span>esc close</span>
          <span style={{ marginLeft: 'auto' }}>{SOURCE_ITEMS.length} modules indexed</span>
        </div>
      </div>
    </div>
  );
}
