import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// EntityAutocomplete
// Reusable, drop-in counterparty/company name input backed by the platform's
// GLEIF-sourced golden-record cache + live GLEIF fuzzycompletions API.
//
// Live data (all keyless, upstream api.gleif.org unless noted):
//   GET /api/v1/gleif/typeahead?q=...&limit=15        — name mode, debounced-as-you-type
//   GET /api/v1/gleif/resolve-by-isin/{isin}           — isinMode, also upserts local cache server-side
//   GET /api/v1/gleif/resolve-by-bic/{bic}             — bicMode
//   GET /api/v1/gleif/entity/{lei}                     — full record fetch on suggestion select
//
// Degrades gracefully: any failed call (network/404) falls back to a plain
// text input with no suggestions and a small "GLEIF lookup unavailable" note.
// Manual typing/entry is never blocked.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const DEBOUNCE_MS = 300;
const MIN_NAME_CHARS = 2;
const ISIN_LEN = 12;
const BIC_LENS = [8, 11];

const wrapStyle = { position: 'relative', width: '100%' };
const inputBaseStyle = {
  border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 13,
  fontFamily: T.font, color: T.navy, background: '#fff', width: '100%', boxSizing: 'border-box',
};
const dropdownStyle = {
  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff',
  border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: '0 6px 18px rgba(27,58,92,0.14)',
  zIndex: 50, maxHeight: 260, overflowY: 'auto',
};
const suggestionStyle = (active) => ({
  padding: '8px 12px', cursor: 'pointer', fontSize: 12.5, color: T.slate,
  background: active ? '#eef2ff' : '#fff', borderBottom: `1px solid ${T.border}`,
});
const chipStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6, padding: '4px 10px',
  background: '#dcfce7', color: '#166534', borderRadius: 12, fontSize: 11, fontWeight: 700, fontFamily: T.mono,
};
const noteStyle = { fontSize: 10.5, color: T.sub, marginTop: 4, fontStyle: 'italic' };

/**
 * @param {string} value - controlled text value
 * @param {(text: string) => void} onChange - fired on every keystroke
 * @param {(entity: object) => void} [onResolve] - fired once a suggestion/code is resolved to a full
 *   entity record: { lei, legal_name, jurisdiction, entity_status, legal_form, registration_status, ... }
 * @param {string} [placeholder]
 * @param {boolean} [isinMode] - treat input as a full ISIN lookup instead of name typeahead
 * @param {boolean} [bicMode] - treat input as a full BIC lookup instead of name typeahead
 * @param {boolean} [disabled]
 */
export default function EntityAutocomplete({
  value, onChange, onResolve, placeholder, isinMode = false, bicMode = false, disabled = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(null);
  const [degraded, setDegraded] = useState(false);
  const [note, setNote] = useState(null);

  const debounceRef = useRef(null);
  const reqIdRef = useRef(0);
  const containerRef = useRef(null);

  const mode = isinMode ? 'isin' : bicMode ? 'bic' : 'name';

  // Close the dropdown on outside click (keyboard Escape handled separately below).
  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const applyResolved = useCallback((raw, fallbackName) => {
    const normalized = {
      ...raw,
      lei: raw.lei,
      legal_name: raw.legal_name || raw.name || fallbackName,
      jurisdiction: raw.jurisdiction || raw.legal_jurisdiction || null,
      entity_status: raw.entity_status || null,
      legal_form: raw.legal_form || null,
      registration_status: raw.registration_status || raw.entity_status || null,
    };
    setResolved(normalized);
    setSuggestions([]);
    setOpen(false);
    setNote(null);
    if (onChange) onChange(normalized.legal_name);
    if (onResolve) onResolve(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, onResolve]);

  const fetchTypeahead = useCallback(async (q) => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const { data } = await axios.get('/api/v1/gleif/typeahead', { params: { q, limit: 15 }, timeout: 8000 });
      if (reqId !== reqIdRef.current) return; // stale response — a newer keystroke has already fired
      const results = data?.results || [];
      setSuggestions(results);
      setOpen(results.length > 0);
      setHighlighted(-1);
      setDegraded(false);
      setNote(results.length === 0 ? null : null);
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setSuggestions([]);
      setOpen(false);
      setDegraded(true);
      setNote('GLEIF lookup unavailable — type the name manually.');
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, []);

  const fetchCodeResolve = useCallback(async (code) => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const path = mode === 'isin' ? `/api/v1/gleif/resolve-by-isin/${code}` : `/api/v1/gleif/resolve-by-bic/${code}`;
      const { data } = await axios.get(path, { timeout: 8000 });
      if (reqId !== reqIdRef.current) return;
      setDegraded(false);
      if (data && data.lei) {
        applyResolved(data, code);
      } else {
        setSuggestions([]); setOpen(false);
        setNote(`No entity found for this ${mode === 'isin' ? 'ISIN' : 'BIC'}.`);
      }
    } catch (e) {
      if (reqId !== reqIdRef.current) return;
      setSuggestions([]);
      setOpen(false);
      if (e?.response?.status === 404) {
        setDegraded(false);
        setNote(`No entity found for this ${mode === 'isin' ? 'ISIN' : 'BIC'}.`);
      } else {
        setDegraded(true);
        setNote('GLEIF lookup unavailable — enter/edit manually.');
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [mode, applyResolved]);

  // Debounced live lookup as the user types. Skipped entirely once a
  // suggestion has already been resolved (chip shown) until the user clears it.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (resolved) { setSuggestions([]); setOpen(false); return undefined; }
    const text = (value || '').trim();

    if (mode === 'name') {
      if (text.length < MIN_NAME_CHARS) { setSuggestions([]); setOpen(false); return undefined; }
      debounceRef.current = setTimeout(() => fetchTypeahead(text), DEBOUNCE_MS);
    } else {
      const norm = text.toUpperCase().replace(/\s+/g, '');
      const readyLen = mode === 'isin' ? norm.length === ISIN_LEN : BIC_LENS.includes(norm.length);
      if (!readyLen) { setSuggestions([]); setOpen(false); return undefined; }
      debounceRef.current = setTimeout(() => fetchCodeResolve(norm), DEBOUNCE_MS);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, mode, resolved, fetchTypeahead, fetchCodeResolve]);

  const selectSuggestion = useCallback(async (s) => {
    setOpen(false);
    setResolving(true);
    setNote(null);
    try {
      const { data } = await axios.get(`/api/v1/gleif/entity/${s.lei}`, { timeout: 8000 });
      const full = data?.entity || data || {};
      applyResolved({ ...full, lei: full.lei || s.lei, name: full.name || s.value }, s.value);
    } catch (e) {
      // Full-record fetch failed — resolve with what typeahead already gave us
      // rather than blocking the user; downstream just gets a thinner record.
      applyResolved({ lei: s.lei, name: s.value, entity_status: s.entity_status_hint }, s.value);
      setNote('Loaded partial GLEIF data (full record lookup failed).');
    } finally {
      setResolving(false);
    }
  }, [applyResolved]);

  const clearResolved = () => {
    setResolved(null);
    setNote(null);
    setDegraded(false);
    if (onChange) onChange('');
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (highlighted >= 0 && highlighted < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  const defaultPlaceholder = mode === 'isin' ? 'ISIN (e.g. DE0007236101)…'
    : mode === 'bic' ? 'BIC (e.g. DEUTDEFF)…'
    : 'Company / counterparty name…';

  return (
    <div ref={containerRef} style={wrapStyle}>
      <input
        style={inputBaseStyle}
        value={value || ''}
        disabled={disabled || resolving}
        placeholder={placeholder || defaultPlaceholder}
        onChange={(e) => {
          if (resolved) setResolved(null); // typing again after a resolve starts a fresh search
          if (onChange) onChange(e.target.value);
        }}
        onFocus={() => { if (suggestions.length > 0 && !resolved) setOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {(loading || resolving) && (
        <div style={{ position: 'absolute', right: 10, top: 9, fontSize: 11, color: T.sub }}>…</div>
      )}

      {open && suggestions.length > 0 && (
        <div style={dropdownStyle}>
          {suggestions.map((s, i) => (
            <div
              key={`${s.lei || s.value}-${i}`}
              style={suggestionStyle(i === highlighted)}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => selectSuggestion(s)}
            >
              <div style={{ fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.sub, fontFamily: T.mono }}>
                {s.lei ? `LEI: ${s.lei}` : ''}{s.entity_status_hint ? ` · ${s.entity_status_hint}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved && (
        <div style={chipStyle}>
          resolved via GLEIF · LEI: {resolved.lei}
          <button
            onClick={clearResolved}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700, fontSize: 12, padding: 0, lineHeight: 1 }}
            title="Clear and search again"
          >
            ✕
          </button>
        </div>
      )}

      {!resolved && note && (
        <div style={noteStyle}>{degraded ? '⚠ ' : ''}{note}</div>
      )}
    </div>
  );
}
