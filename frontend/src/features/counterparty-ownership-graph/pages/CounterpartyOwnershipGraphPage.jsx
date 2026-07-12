import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import EntityAutocomplete from '../../../components/entity/EntityAutocomplete';

// ─────────────────────────────────────────────────────────────────────────────
// Counterparty Ownership Graph
// LEI lookup → parent chain + direct children (GLEIF RR-CDF relationship data)
// → PCAF-style attribution rollup across the corporate group.
// Live data: GET /api/v1/gleif/search?q= , /entity/{lei} , /ping
//   Upstream: api.gleif.org (free, keyless, CC0 1.0). Ownership tree fields come
//   straight from GLEIF; attribution math is user-entered exposures × documented
//   attribution factors, computed locally. No fabricated data.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const Badge = ({ status }) => {
  if (status === 'live') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>● Live — GLEIF</span>;
  if (status === 'loading') return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>… Checking GLEIF</span>;
  if (status === 'demo') return <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>○ GLEIF unreachable</span>;
  return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 19, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const smallInput = { border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 6px', fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: 90 };
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}` };

const EntityChip = ({ e, tag, onExposure, exposure }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, background: tag === 'self' ? '#eef2ff' : '#fff', marginBottom: 6 }}>
    <span style={{ fontSize: 9.5, fontFamily: T.mono, color: '#fff', background: tag === 'self' ? T.indigo : tag === 'parent' ? T.teal : T.gold, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{tag}</span>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name || '(unnamed)'}</div>
      <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>{e.lei} · {e.jurisdiction || '—'} · {e.entity_status || '—'}</div>
    </div>
    {onExposure && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10.5, color: T.sub }}>$M</span>
        <input style={smallInput} type="number" value={exposure ?? ''} placeholder="0" onChange={(e2) => onExposure(e.lei, e2.target.value)} />
      </div>
    )}
  </div>
);

export default function CounterpartyOwnershipGraphPage() {
  const [pingStatus, setPingStatus] = useState('loading');
  const [query, setQuery] = useState('Siemens');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [entity, setEntity] = useState(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [err, setErr] = useState(null);
  const [exposures, setExposures] = useState({}); // lei -> $M
  const [attrFactor, setAttrFactor] = useState(1.0); // PCAF attribution factor applied to the group rollup

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get('/api/v1/gleif/ping');
        if (alive) setPingStatus(data.reachable ? 'live' : 'demo');
      } catch { if (alive) setPingStatus('demo'); }
    })();
    return () => { alive = false; };
  }, []);

  const doSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setSearching(true); setErr(null);
    try {
      const { data } = await axios.get('/api/v1/gleif/search', { params: { q: query.trim(), limit: 15 } });
      setResults(data.results || []);
      setPingStatus('live');
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message);
      setResults([]); setPingStatus('demo');
    } finally { setSearching(false); }
  }, [query]);

  const loadEntity = useCallback(async (lei) => {
    setLoadingEntity(true); setErr(null);
    try {
      const { data } = await axios.get(`/api/v1/gleif/entity/${lei}`);
      setEntity(data);
      // seed exposure on the searched entity so the rollup shows something
      setExposures((prev) => ({ ...prev, [lei]: prev[lei] ?? 100 }));
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message);
    } finally { setLoadingEntity(false); }
  }, []);

  const setExposure = (lei, v) => setExposures((prev) => ({ ...prev, [lei]: v === '' ? '' : Number(v) }));

  // All entities in the current group view (self + parent chain + children)
  const groupEntities = useMemo(() => {
    if (!entity) return [];
    const list = [{ ...entity.entity, _tag: 'self' }];
    (entity.parent_chain || []).forEach((p) => list.push({ ...p, _tag: 'parent' }));
    (entity.direct_children?.items || []).forEach((c) => list.push({ ...c, _tag: 'child' }));
    // de-dup by lei
    const seen = new Set();
    return list.filter((e) => e.lei && !seen.has(e.lei) && seen.add(e.lei));
  }, [entity]);

  const rollup = useMemo(() => {
    const rows = groupEntities.map((e) => {
      const exp = Number(exposures[e.lei]) || 0;
      const attributed = exp * attrFactor;
      return { lei: e.lei, name: e.name, tag: e._tag, exposure: exp, attributed };
    });
    const total = rows.reduce((s, r) => s + r.attributed, 0);
    return { rows, total };
  }, [groupEntities, exposures, attrFactor]);

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '24px 28px', color: T.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Counterparty Ownership Graph</h1>
        <Badge status={pingStatus} />
      </div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 920, marginTop: 4 }}>
        Search the global LEI system, walk a counterparty's legal-ownership chain up to its ultimate
        parent and down to direct subsidiaries, then roll financed-emissions exposure up the group with a
        PCAF attribution factor. Ownership relationships are GLEIF golden-copy data (CC0); attribution
        math uses your exposures.
      </p>

      <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <EntityAutocomplete
            value={query}
            onChange={setQuery}
            onResolve={(ent) => { setPingStatus('live'); loadEntity(ent.lei); }}
            placeholder="Entity name (e.g. Siemens, HSBC, TotalEnergies)… — live GLEIF suggestions as you type"
          />
        </div>
        <button onClick={doSearch} disabled={searching} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font, whiteSpace: 'nowrap' }}>
          {searching ? 'Searching…' : 'Search LEI'}
        </button>
      </div>

      {err && <div style={{ ...card, borderColor: '#fde68a', background: '#fffbeb', color: '#92400e', fontSize: 12 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.4fr)', gap: 18 }}>
        {/* Search results */}
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Search results {results.length > 0 && <span style={{ color: T.sub, fontWeight: 400, fontSize: 12 }}>({results.length})</span>}</div>
          {results.length === 0 && <div style={{ fontSize: 12, color: T.sub }}>Search for an entity to begin.</div>}
          {results.map((r) => (
            <div key={r.lei} onClick={() => loadEntity(r.lei)} style={{ padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 7, marginBottom: 6, cursor: 'pointer', background: entity?.entity?.lei === r.lei ? '#eef2ff' : '#fff' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
              <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono }}>{r.lei} · {r.jurisdiction || '—'} · {r.entity_status || '—'}</div>
            </div>
          ))}
        </div>

        {/* Ownership tree */}
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Ownership tree {loadingEntity && <span style={{ color: T.sub, fontWeight: 400, fontSize: 12 }}>loading…</span>}</div>
          {!entity && <div style={{ fontSize: 12, color: T.sub }}>Select a search result to load its parent chain and subsidiaries.</div>}
          {entity && (
            <>
              {entity.ultimate_parent && <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginBottom: 4 }}>ULTIMATE PARENT</div>}
              {entity.ultimate_parent && <EntityChip e={entity.ultimate_parent} tag="ultimate" />}
              {entity.parent_chain?.length > 0 && <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, margin: '8px 0 4px' }}>PARENT CHAIN (nearest first)</div>}
              {[...(entity.parent_chain || [])].reverse().map((p, i) => (
                <div key={p.lei} style={{ marginLeft: (entity.parent_chain.length - 1 - i) * 12 }}><EntityChip e={p} tag="parent" /></div>
              ))}
              <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, margin: '8px 0 4px' }}>THIS ENTITY</div>
              <EntityChip e={entity.entity} tag="self" />
              {entity.direct_parent_exception && <div style={{ fontSize: 11, color: T.amber, marginBottom: 6 }}>No direct parent reported — reason: {entity.direct_parent_exception.reason || entity.direct_parent_exception.category}</div>}
              {entity.direct_children?.total > 0 && <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, margin: '8px 0 4px' }}>DIRECT CHILDREN ({entity.direct_children.returned} of {entity.direct_children.total})</div>}
              {(entity.direct_children?.items || []).map((c) => (
                <div key={c.lei} style={{ marginLeft: 12 }}><EntityChip e={c} tag="child" /></div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* PCAF attribution rollup */}
      {entity && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>PCAF group attribution rollup</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: T.sub }}>Attribution factor</span>
              <input style={smallInput} type="number" step="0.05" min="0" max="1" value={attrFactor} onChange={(e) => setAttrFactor(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>
            Enter exposure ($M) per group entity above/here; attributed exposure = exposure × attribution factor
            (PCAF: outstanding ÷ enterprise value, entered here directly). Group total rolls up to the ultimate parent.
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Entity</th><th style={th}>Role</th><th style={{ ...th, textAlign: 'right' }}>Exposure $M</th><th style={{ ...th, textAlign: 'right' }}>Attributed $M</th></tr></thead>
            <tbody>
              {rollup.rows.map((r) => (
                <tr key={r.lei}>
                  <td style={td}>{r.name}</td>
                  <td style={{ ...td, fontFamily: T.mono, textTransform: 'uppercase', fontSize: 10.5 }}>{r.tag}</td>
                  <td style={{ ...td, textAlign: 'right' }}><input style={smallInput} type="number" value={exposures[r.lei] ?? ''} placeholder="0" onChange={(e) => setExposure(r.lei, e.target.value)} /></td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>${r.attributed.toLocaleString('en-US', { maximumFractionDigits: 1 })}M</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...td, fontWeight: 700 }} colSpan={3}>Group total (rolled to ultimate parent)</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontFamily: T.mono, color: T.teal }}>${rollup.total.toLocaleString('en-US', { maximumFractionDigits: 1 })}M</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {entity?.source && <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono }}>{entity.source}</div>}
    </div>
  );
}
