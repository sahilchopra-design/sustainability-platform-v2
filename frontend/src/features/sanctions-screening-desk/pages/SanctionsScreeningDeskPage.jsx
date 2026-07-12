import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import EntityAutocomplete from '../../../components/entity/EntityAutocomplete';

// ─────────────────────────────────────────────────────────────────────────────
// Sanctions & UFLPA Screening Desk
// Screen supplier / counterparty names against the U.S. Consolidated Screening
// List (trade.gov CSL — 12 govt lists) and the DHS UFLPA Entity List.
// Live data: GET /api/v1/sanctions/status , POST /api/v1/sanctions/screen ,
//            GET /api/v1/sanctions/uflpa-list
//   CSL: keyless bulk snapshot by default (keyed search if TRADE_GOV_API_KEY set,
//   else labeled demo seed). UFLPA: hand-authored real extract. Matching logic
//   is documented server-side. Screening aid only — not a compliance determination.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef',
  teal: '#0f766e', green: '#15803d', red: '#b91c1c',
  amber: '#b45309', purple: '#6d28d9', slate: '#334155',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', blue: '#0369a1',
  border: '#e2ded5',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const LS_KEY = 'sanctions_screening_audit_log_v1';

const Badge = ({ mode }) => {
  if (!mode) return <span style={{ background: T.cream, color: T.sub, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Idle</span>;
  const live = mode.startsWith('live');
  const bg = live ? '#dcfce7' : '#fef3c7', fg = live ? '#166534' : '#92400e';
  const label = mode.startsWith('live-keyed') ? '● Live — CSL keyed search'
    : mode.startsWith('live-bulk') ? '● Live — CSL bulk snapshot'
    : '○ Demo — seeded CSL extract';
  return <span style={{ background: bg, color: fg, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{label}</span>;
};

const Kpi = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 19, fontWeight: 700, color, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 18 };
const th = { textAlign: 'left', fontSize: 10.5, color: T.sub, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 8px', borderBottom: `2px solid ${T.border}` };
const td = { fontSize: 12, color: T.slate, padding: '6px 8px', borderBottom: `1px solid ${T.border}`, verticalAlign: 'top' };
const textarea = { border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, fontFamily: T.mono, color: T.navy, background: '#fff', width: '100%', minHeight: 90, boxSizing: 'border-box', resize: 'vertical' };

const confColor = (c) => c >= 1 ? T.red : c >= 0.85 ? '#c2410c' : T.amber;
const confLabel = (c) => c >= 1 ? 'EXACT' : c >= 0.85 ? 'STRONG' : 'POSSIBLE';

export default function SanctionsScreeningDeskPage() {
  const [statusData, setStatusData] = useState(null);
  const [mode, setMode] = useState(null);
  const [input, setInput] = useState('Siemens AG\nHikvision\nXinjiang Production and Construction Corps');
  const [screening, setScreening] = useState(false);
  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);
  const [log, setLog] = useState([]);
  const [uflpaOpen, setUflpaOpen] = useState(false);
  const [uflpa, setUflpa] = useState(null);
  // Optional GLEIF pre-resolution step: canonical legal name gets prepended to
  // the free-text name list below; jurisdiction/LEI shown alongside the
  // matching screening result for context. The plain free-text path (input
  // textarea) remains fully functional for names GLEIF can't resolve.
  const [gleifQuery, setGleifQuery] = useState('');
  const [resolvedEntity, setResolvedEntity] = useState(null);

  useEffect(() => {
    axios.get('/api/v1/sanctions/status').then(({ data }) => setStatusData(data)).catch(() => {});
    try { setLog(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch { /* ignore */ }
  }, []);

  const persistLog = (entries) => { setLog(entries); try { localStorage.setItem(LS_KEY, JSON.stringify(entries.slice(0, 200))); } catch { /* ignore */ } };

  const screen = useCallback(async () => {
    const names = input.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    setScreening(true); setErr(null);
    try {
      const { data } = await axios.post('/api/v1/sanctions/screen', names.length === 1 ? { name: names[0] } : { names });
      setResp(data);
      setMode(data.mode);
      const hits = (data.results || []).reduce((s, r) => s + (r.csl_matches?.length || 0) + (r.uflpa_matches?.length || 0), 0);
      const entry = { at: data.screened_at, count: names.length, hits, mode: data.mode };
      persistLog([entry, ...log]);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message);
      setResp(null);
    } finally { setScreening(false); }
  }, [input, log]);

  const openUflpa = async () => {
    setUflpaOpen((v) => !v);
    if (!uflpa) { try { const { data } = await axios.get('/api/v1/sanctions/uflpa-list'); setUflpa(data); } catch { /* ignore */ } }
  };

  const handleGleifResolve = useCallback((entity) => {
    setResolvedEntity(entity);
    setInput((prev) => {
      const lines = prev.split('\n').map((s) => s.trim()).filter(Boolean);
      if (lines.some((l) => l.toLowerCase() === entity.legal_name.toLowerCase())) return prev;
      return [entity.legal_name, ...lines].join('\n');
    });
    setGleifQuery('');
  }, []);

  const totalHits = (resp?.results || []).reduce((s, r) => s + (r.csl_matches?.length || 0) + (r.uflpa_matches?.length || 0), 0);
  const flaggedNames = (resp?.results || []).filter((r) => (r.csl_matches?.length || 0) + (r.uflpa_matches?.length || 0) > 0).length;

  return (
    <div style={{ fontFamily: T.font, background: T.cream, minHeight: '100vh', padding: '24px 28px', color: T.navy }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Sanctions &amp; UFLPA Screening Desk</h1>
        <Badge mode={mode} />
      </div>
      <p style={{ color: T.sub, fontSize: 13, maxWidth: 920, marginTop: 4 }}>
        Screen suppliers and counterparties against the U.S. Consolidated Screening List (OFAC SDN/SSI/CMIC,
        BIS Entity List, State ISN/DTC and 9 more) plus the DHS UFLPA Entity List for forced-labour exposure.
        This is a screening aid — positive matches require manual review against the authoritative lists.
      </p>
      {statusData && (
        <div style={{ fontSize: 11, color: T.sub, fontFamily: T.mono, marginBottom: 14 }}>
          CSL: {statusData.csl_bulk_download?.split(' — ')[0]} · UFLPA extract: {statusData.uflpa?.extract_size ?? '—'} entities ({statusData.uflpa?.revision_coverage || 'seeded'})
        </div>
      )}

      <div style={card}>
        <div style={{ fontSize: 11.5, color: T.sub, marginBottom: 6 }}>
          Optional: resolve a counterparty via GLEIF first — its canonical legal name is added to the list below.
        </div>
        <EntityAutocomplete
          value={gleifQuery}
          onChange={setGleifQuery}
          onResolve={handleGleifResolve}
          placeholder="Look up counterparty via GLEIF (optional)…"
        />
        {resolvedEntity && (
          <div style={{ marginTop: 8, marginBottom: 4, fontSize: 11, color: T.teal, fontFamily: T.mono }}>
            Resolved: {resolvedEntity.legal_name} · LEI {resolvedEntity.lei} · {resolvedEntity.jurisdiction || 'jurisdiction n/a'} · {resolvedEntity.entity_status || '—'}
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, marginTop: 14 }}>Screen names <span style={{ color: T.sub, fontWeight: 400, fontSize: 12 }}>(one per line, up to 200)</span></div>
        <textarea style={textarea} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Acme Trading Ltd&#10;Another Supplier Co" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
          <button onClick={screen} disabled={screening} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '9px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font }}>
            {screening ? 'Screening…' : 'Screen'}
          </button>
          <button onClick={openUflpa} style={{ background: '#fff', color: T.navy, border: `1px solid ${T.border}`, borderRadius: 6, padding: '9px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
            {uflpaOpen ? 'Hide' : 'View'} UFLPA list
          </button>
        </div>
      </div>

      {err && <div style={{ ...card, borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>{err}</div>}

      {resp && (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
            <Kpi label="Names screened" value={resp.results.length} />
            <Kpi label="Names flagged" value={flaggedNames} color={flaggedNames ? T.red : T.green} />
            <Kpi label="Total matches" value={totalHits} color={totalHits ? T.amber : T.green} />
            <Kpi label="CSL source" value={resp.csl_snapshot_rows ? `${resp.csl_snapshot_rows.toLocaleString()} rows` : 'seed'} sub={resp.csl_snapshot_origin || resp.mode} />
          </div>

          {resp.results.map((r) => {
            const hits = (r.csl_matches?.length || 0) + (r.uflpa_matches?.length || 0);
            return (
              <div key={r.query} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hits ? 4 : 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.query}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: hits ? T.red : T.green, background: hits ? '#fef2f2' : '#f0fdf4', padding: '3px 10px', borderRadius: 12 }}>{hits ? `${hits} match${hits > 1 ? 'es' : ''}` : '✓ No match'}</span>
                </div>
                {resolvedEntity && r.query.toLowerCase() === resolvedEntity.legal_name.toLowerCase() && (
                  <div style={{ fontSize: 10.5, color: T.sub, fontFamily: T.mono, marginBottom: hits ? 10 : 0 }}>
                    GLEIF context: LEI {resolvedEntity.lei} · {resolvedEntity.jurisdiction || 'jurisdiction n/a'} · {resolvedEntity.entity_status || '—'}
                  </div>
                )}
                {hits > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th style={th}>List</th><th style={th}>Matched name</th><th style={th}>Detail</th><th style={{ ...th, textAlign: 'right' }}>Confidence</th></tr></thead>
                    <tbody>
                      {(r.csl_matches || []).map((m, i) => (
                        <tr key={`c${i}`}>
                          <td style={{ ...td, fontFamily: T.mono, fontSize: 10.5 }}>{m.source || m.source_list || 'CSL'}</td>
                          <td style={td}>{m.name || m.matched_name}</td>
                          <td style={{ ...td, fontSize: 11, color: T.sub }}>{[m.programs || m.program, m.country, m.match_type].filter(Boolean).join(' · ')}</td>
                          <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: confColor(m.confidence) }}>{confLabel(m.confidence)} {(m.confidence ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                      {(r.uflpa_matches || []).map((m, i) => (
                        <tr key={`u${i}`}>
                          <td style={{ ...td, fontFamily: T.mono, fontSize: 10.5, color: '#9a3412' }}>UFLPA</td>
                          <td style={td}>{m.matched_name || m.name}</td>
                          <td style={{ ...td, fontSize: 11, color: T.sub }}>{m.listing_basis || m.sector}</td>
                          <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: confColor(m.confidence) }}>{confLabel(m.confidence)} {(m.confidence ?? 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}

          <div style={{ ...card, background: '#fffbeb', borderColor: '#fde68a', fontSize: 11.5, color: '#92400e' }}>{resp.disclaimer}</div>
        </>
      )}

      {uflpaOpen && uflpa && (
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>DHS UFLPA Entity List (seeded real extract)</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>{uflpa.meta?.refresh_note || uflpa.meta?.note}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Entity</th><th style={th}>Rationale / category</th></tr></thead>
            <tbody>
              {(uflpa.entities || []).map((e, i) => (
                <tr key={i}><td style={td}>{e.name}{e.aliases?.length ? <span style={{ color: T.sub, fontSize: 10.5 }}> · {e.aliases.join(', ')}</span> : null}</td><td style={{ ...td, fontSize: 11, color: T.sub }}>{e.listing_basis || e.sector}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {log.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Screening audit log <span style={{ color: T.sub, fontWeight: 400, fontSize: 11 }}>(local browser only)</span></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>When</th><th style={{ ...th, textAlign: 'right' }}>Names</th><th style={{ ...th, textAlign: 'right' }}>Hits</th><th style={th}>Mode</th></tr></thead>
            <tbody>
              {log.slice(0, 20).map((e, i) => (
                <tr key={i}>
                  <td style={{ ...td, fontFamily: T.mono, fontSize: 11 }}>{(e.at || '').replace('T', ' ').slice(0, 19)}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.mono }}>{e.count}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: T.mono, color: e.hits ? T.red : T.green }}>{e.hits}</td>
                  <td style={{ ...td, fontFamily: T.mono, fontSize: 10.5 }}>{e.mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
