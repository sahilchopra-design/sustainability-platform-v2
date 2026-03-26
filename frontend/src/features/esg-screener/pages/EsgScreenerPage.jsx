import React, { useState, useMemo } from 'react';
import { GLOBAL_COMPANY_MASTER, GLOBAL_SECTORS, EXCHANGES } from '../../../data/globalCompanyMaster';

// ── Theme ──────────────────────────────────────────────────────────────────────
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb',
  teal: '#0d9488', indigo: '#4f46e5', purple: '#7c3aed',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const SECTOR_COLORS = {
  'Energy': '#dc2626', 'Materials': '#d97706', 'Industrials': '#ca8a04',
  'Financials': '#2563eb', 'Information Technology': '#7c3aed',
  'Health Care': '#0d9488', 'Consumer Discretionary': '#ea580c',
  'Consumer Staples': '#16a34a', 'Utilities': '#0891b2',
  'Real Estate': '#c026d3', 'Communication Services': '#4f46e5',
};

const T_RISK_ORDER = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Very Low': 0 };

const DEFAULT_NEG = {
  thermalCoal: false, fossilFuel: false, tobacco: false,
  controvWeapons: false, gambling: false, veryHighTRisk: false,
  noGhg: false, noSbti: false,
};

function applyNegativeScreens(company, neg) {
  const reasons = [];
  const tags = company.tags || [];
  const sub = company.subsector || '';
  if (neg.thermalCoal && (tags.includes('Coal-Mining') || tags.includes('Coal-Power') || sub.toLowerCase().includes('coal')))
    reasons.push('Thermal Coal');
  if (neg.fossilFuel && company.sector === 'Energy' && (sub.includes('E&P') || sub.toLowerCase().includes('mining') || sub.toLowerCase().includes('exploration')))
    reasons.push('Fossil Fuel Extraction');
  if (neg.tobacco && sub.toLowerCase().includes('tobacco'))
    reasons.push('Tobacco');
  if (neg.controvWeapons && tags.includes('Controversial-Weapons'))
    reasons.push('Controversial Weapons');
  if (neg.gambling && sub.toLowerCase().includes('gambling'))
    reasons.push('Gambling');
  if (neg.veryHighTRisk && company.transition_risk === 'Very High')
    reasons.push('Very High T-Risk');
  if (neg.noGhg && !company.ghg_reporting_year)
    reasons.push('No GHG Reporting');
  if (neg.noSbti && !company.sbti_committed && !company.carbon_neutral_target_year)
    reasons.push('No SBTi/Net Zero');
  return reasons;
}

export default function EsgScreenerPage() {
  const [negScreens, setNegScreens] = useState(DEFAULT_NEG);
  const [posScreen, setPosScreen] = useState('None');
  const [maxTRisk, setMaxTRisk] = useState('Any');
  const [minDqs, setMinDqs] = useState(1);
  const [maxGhgIntensity, setMaxGhgIntensity] = useState('');
  const [selectedExchanges, setSelectedExchanges] = useState([]);
  const [appliedConfig, setAppliedConfig] = useState(null);
  const [search, setSearch] = useState('');
  const [showOnlyFails, setShowOnlyFails] = useState(false);

  const handleApply = () => {
    setAppliedConfig({ negScreens: { ...negScreens }, posScreen, maxTRisk, minDqs, maxGhgIntensity: maxGhgIntensity !== '' ? parseFloat(maxGhgIntensity) : null, selectedExchanges: [...selectedExchanges] });
  };

  const screenedResults = useMemo(() => {
    if (!appliedConfig) return GLOBAL_COMPANY_MASTER.map(c => ({ ...c, pass: true, reasons: [] }));
    const { negScreens: neg, posScreen: pos, maxTRisk: mtr, minDqs: mdqs, maxGhgIntensity: mgi, selectedExchanges: selEx } = appliedConfig;

    // Compute top 30% DQS per sector for best-in-class
    const sectorDqsThresholds = {};
    if (pos === 'Best-in-Class') {
      const bySector = {};
      GLOBAL_COMPANY_MASTER.forEach(c => {
        if (!bySector[c.sector]) bySector[c.sector] = [];
        if (c.dqs_score != null) bySector[c.sector].push(c.dqs_score);
      });
      Object.keys(bySector).forEach(sec => {
        const scores = bySector[sec].sort((a, b) => b - a);
        sectorDqsThresholds[sec] = scores[Math.floor(scores.length * 0.3)] || 0;
      });
    }

    return GLOBAL_COMPANY_MASTER.map(c => {
      const reasons = applyNegativeScreens(c, neg);

      // Threshold checks
      if (mtr !== 'Any') {
        const allowed = { 'High or below': 3, 'Medium or below': 2, 'Low or below': 1 };
        const threshold = allowed[mtr];
        if ((T_RISK_ORDER[c.transition_risk] || 0) > threshold) reasons.push('T-Risk > Max');
      }
      if (c.dqs_score != null && c.dqs_score < mdqs) reasons.push('DQS Below Min');
      if (mgi != null && c.ghg_intensity != null && c.ghg_intensity > mgi) reasons.push('GHG Intensity > Max');

      // Exchange filter
      if (selEx.length > 0) {
        const cEx = c._displayExchange || c.exchange || '';
        const exObj = EXCHANGES.find(e => e.companies.some(x => x === c));
        const cExId = exObj ? exObj.id : '';
        if (!selEx.includes(cExId)) reasons.push('Exchange Excluded');
      }

      // Positive screen (must pass pos screen OR no pos screen)
      let posPass = true;
      if (pos === 'Best-in-Class') {
        const threshold = sectorDqsThresholds[c.sector] || 0;
        if ((c.dqs_score || 0) < threshold) posPass = false;
      } else if (pos === 'SBTi Only') {
        if (!c.sbti_committed) posPass = false;
      } else if (pos === 'Low T-Risk Only') {
        if (c.transition_risk !== 'Low' && c.transition_risk !== 'Very Low') posPass = false;
      }
      if (!posPass) reasons.push('Fails Positive Screen');

      return { ...c, pass: reasons.length === 0, reasons };
    });
  }, [appliedConfig]);

  const displayRows = useMemo(() => {
    let rows = screenedResults;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(c => (c.name || '').toLowerCase().includes(q) || (c.ticker || '').toLowerCase().includes(q));
    }
    if (showOnlyFails) rows = rows.filter(r => !r.pass);
    return [...rows].sort((a, b) => (b.pass ? 1 : 0) - (a.pass ? 1 : 0) || (a.name || '').localeCompare(b.name || ''));
  }, [screenedResults, search, showOnlyFails]);

  const passCount = useMemo(() => screenedResults.filter(r => r.pass).length, [screenedResults]);
  const failCount = screenedResults.length - passCount;

  const exclusionBreakdown = useMemo(() => {
    const counts = {};
    screenedResults.forEach(r => r.reasons.forEach(reason => { counts[reason] = (counts[reason] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [screenedResults]);

  const toggleExchange = (id) => setSelectedExchanges(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const sBtn = (active, label, onClick, color = T.navy) => (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 6, border: `1.5px solid ${active ? color : T.border}`,
      background: active ? color : T.card, color: active ? '#fff' : T.text,
      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  );

  const negLabels = [
    ['thermalCoal', 'Thermal Coal (>5% rev)'], ['fossilFuel', 'Fossil Fuel Extraction'],
    ['tobacco', 'Tobacco'], ['controvWeapons', 'Controversial Weapons'],
    ['gambling', 'Gambling'], ['veryHighTRisk', 'Very High Transition Risk'],
    ['noGhg', 'No GHG Reporting'], ['noSbti', 'No SBTi / Net Zero'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.navy }}>ESG Screening Engine</h1>
          <span style={{ fontSize: 11, color: T.sub, fontWeight: 500 }}>EP-F2</span>
          {['UNGP', 'ILO Core', 'OECD MNE', 'EU Exclusion List'].map(b => (
            <span key={b} style={{ padding: '3px 10px', borderRadius: 20, background: T.navy, color: '#fff', fontSize: 11, fontWeight: 600 }}>{b}</span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: T.sub }}>Apply negative/positive screens and threshold filters across {GLOBAL_COMPANY_MASTER.length.toLocaleString()} companies globally.</p>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* LEFT PANEL */}
        <div style={{ width: 350, flexShrink: 0 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.navy }}>Screen Configuration</h3>

            {/* Negative Screens */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Negative Screens (Exclusion)</div>
              {negLabels.map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={negScreens[key]} onChange={e => setNegScreens(p => ({ ...p, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: T.red, cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: T.text }}>{label}</span>
                </label>
              ))}
            </div>

            {/* Positive Screens */}
            <div style={{ marginBottom: 18, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Positive Screens (Inclusion)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['None', 'Best-in-Class', 'SBTi Only', 'Low T-Risk Only'].map(opt => (
                  <button key={opt} onClick={() => setPosScreen(opt)} style={{
                    padding: '5px 11px', borderRadius: 6, border: `1.5px solid ${posScreen === opt ? T.sage : T.border}`,
                    background: posScreen === opt ? T.sage : T.card, color: posScreen === opt ? '#fff' : T.text,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>{opt}</button>
                ))}
              </div>
            </div>

            {/* Thresholds */}
            <div style={{ marginBottom: 18, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Thresholds</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Max Transition Risk</label>
                <select value={maxTRisk} onChange={e => setMaxTRisk(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, color: T.text, background: T.card }}>
                  {['Any', 'High or below', 'Medium or below', 'Low or below'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Min DQS Quality: <span style={{ color: T.navy, fontWeight: 700 }}>{minDqs}</span></label>
                <input type="range" min={1} max={5} step={1} value={minDqs} onChange={e => setMinDqs(Number(e.target.value))}
                  style={{ width: '100%', accentColor: T.navy }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.sub }}>
                  <span>1 (Low)</span><span>5 (High)</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.sub, fontWeight: 600, display: 'block', marginBottom: 4 }}>Max GHG Intensity (tCO2e/rev)</label>
                <input type="number" value={maxGhgIntensity} onChange={e => setMaxGhgIntensity(e.target.value)} placeholder="No limit"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, color: T.text, background: T.card, boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Exchange Filter */}
            <div style={{ marginBottom: 18, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Universe Filter — Exchange</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EXCHANGES.map(ex => {
                  const active = selectedExchanges.includes(ex.id);
                  return (
                    <button key={ex.id} onClick={() => toggleExchange(ex.id)} style={{
                      padding: '4px 9px', borderRadius: 6, border: `1.5px solid ${active ? ex.color : T.border}`,
                      background: active ? ex.color : T.card, color: active ? '#fff' : T.text,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>{ex.flag} {ex.id}</button>
                  );
                })}
              </div>
              {selectedExchanges.length > 0 && (
                <button onClick={() => setSelectedExchanges([])} style={{ marginTop: 8, fontSize: 11, color: T.sub, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
              )}
            </div>

            {/* Apply Button */}
            <button onClick={handleApply} style={{ width: '100%', padding: '11px', borderRadius: 8, background: T.navy, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '0.02em' }}>
              Apply Screens
            </button>

            {/* Screening Summary */}
            {appliedConfig && (
              <div style={{ marginTop: 16, padding: 14, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Screening Summary</div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: 1, textAlign: 'center', background: '#dcfce7', borderRadius: 6, padding: '8px 4px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{passCount.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>PASS</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', background: '#fee2e2', borderRadius: 6, padding: '8px 4px' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.red }}>{failCount.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>FAIL</div>
                  </div>
                </div>
                {exclusionBreakdown.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Exclusion Reasons</div>
                    {exclusionBreakdown.map(([reason, count]) => (
                      <div key={reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T.text }}>{reason}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.red, background: '#fee2e2', padding: '1px 7px', borderRadius: 10 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CENTER/RIGHT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* KPI Cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
            {[
              { label: 'Total Universe', value: screenedResults.length.toLocaleString(), color: T.navy, bg: '#eff6ff' },
              { label: 'Passed', value: passCount.toLocaleString(), color: T.green, bg: '#dcfce7' },
              { label: 'Failed', value: `${failCount.toLocaleString()} (${screenedResults.length > 0 ? ((failCount / screenedResults.length) * 100).toFixed(1) : 0}% fail)`, color: T.red, bg: '#fee2e2' },
            ].map(k => (
              <div key={k.label} style={{ flex: 1, background: k.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => {
                const headers = 'Company,Ticker,Exchange,Sector,T-Risk,DQS,GHG Intensity,Status,Reasons';
                const rows = displayRows.map(r => `"${r.name}","${r.ticker || ''}","${r._displayExchange || r.exchange || ''}","${r.sector || ''}","${r.transition_risk || ''}","${r.dqs_score || ''}","${r.ghg_intensity || ''}","${r.pass ? 'PASS' : 'FAIL'}","${r.reasons.join('; ')}"`);
                const csv = [headers, ...rows].join('\n');
                const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                a.download = 'esg_screening_report.csv'; a.click();
              }} style={{ padding: '10px 16px', borderRadius: 8, background: T.teal, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Export CSV
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or ticker..."
              style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text, background: T.card }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text, whiteSpace: 'nowrap', cursor: 'pointer' }}>
              <input type="checkbox" checked={showOnlyFails} onChange={e => setShowOnlyFails(e.target.checked)} style={{ accentColor: T.red }} />
              Show fails only
            </label>
          </div>

          {/* Results Table */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.navy, position: 'sticky', top: 0, zIndex: 2 }}>
                    {['Company', 'Exchange', 'Sector', 'T-Risk', 'DQS', 'GHG Int.', 'Status', 'Reason'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.slice(0, 200).map((c, i) => {
                    const sColor = SECTOR_COLORS[c.sector] || T.sub;
                    const trColor = { 'Very High': T.red, 'High': T.amber, 'Medium': '#ca8a04', 'Low': T.green, 'Very Low': T.teal }[c.transition_risk] || T.sub;
                    return (
                      <tr key={`${c.id || c.ticker}-${i}`} style={{ background: i % 2 === 0 ? T.card : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '9px 12px', fontWeight: 600, color: T.text, maxWidth: 180 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || c.shortName}</div>
                          <div style={{ fontSize: 10, color: T.sub }}>{c.ticker}</div>
                        </td>
                        <td style={{ padding: '9px 12px', color: T.sub }}>{c._displayExchange || c.exchange || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sColor, flexShrink: 0 }} />
                            <span style={{ color: T.text, whiteSpace: 'nowrap' }}>{c.sector || '—'}</span>
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, background: `${trColor}22`, color: trColor, fontWeight: 700, fontSize: 11 }}>{c.transition_risk || '—'}</span>
                        </td>
                        <td style={{ padding: '9px 12px', color: T.text, fontWeight: 600 }}>{c.dqs_score != null ? c.dqs_score.toFixed(1) : '—'}</td>
                        <td style={{ padding: '9px 12px', color: T.text }}>{c.ghg_intensity != null ? c.ghg_intensity.toFixed(1) : '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.pass ? '#dcfce7' : '#fee2e2', color: c.pass ? T.green : T.red, whiteSpace: 'nowrap' }}>
                            {c.pass ? '✓ PASS' : '✗ FAIL'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', maxWidth: 200 }}>
                          {c.reasons.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {c.reasons.slice(0, 2).map(r => (
                                <span key={r} style={{ padding: '1px 6px', borderRadius: 8, background: '#fff3cd', color: '#92400e', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{r}</span>
                              ))}
                              {c.reasons.length > 2 && <span style={{ fontSize: 10, color: T.sub }}>+{c.reasons.length - 2}</span>}
                            </div>
                          ) : <span style={{ color: T.sub, fontSize: 11 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {displayRows.length > 200 && (
                <div style={{ padding: '10px 16px', fontSize: 12, color: T.sub, borderTop: `1px solid ${T.border}`, background: T.bg }}>
                  Showing 200 of {displayRows.length.toLocaleString()} results. Use search or filters to narrow down.
                </div>
              )}
              {displayRows.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: T.sub, fontSize: 13 }}>No companies match current filters.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
