import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const TYPES = ['Producer','Converter','Recycler','Brand','Retailer'];
const COUNTRIES = ['USA','Germany','China','Japan','UK','France','Netherlands','South Korea','India','Brazil','Italy','Sweden'];
const REG_RISK_TIERS = ['Low','Medium','High'];

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

const COMPANIES = Array.from({ length: 80 }, (_, i) => {
  const type = TYPES[Math.floor(sr(i * 7) * TYPES.length)];
  const country = COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];
  const regulatoryRisk = Math.round(1 + sr(i * 5) * 9);
  const regTier = regulatoryRisk <= 3 ? 'Low' : regulatoryRisk <= 6 ? 'Medium' : 'High';
  const transitionScore = Math.round(20 + sr(i * 13) * 75);
  return {
    id: i + 1,
    name: `${['PlastiCorp','PolyPack','EcoPlastic','CircuPoly','GreenPack','ResinCo','BioPoly','PackTech','PlasticSol','WrapGroup'][i % 10]} ${['AG','Inc','NV','Ltd','SA','GmbH','Corp','BV','PLC','SE'][Math.floor(sr(i * 17) * 10)]}`,
    type, country, regulatoryRisk, regTier, transitionScore,
    plasticProduction: Math.round(10 + sr(i * 3) * 990),
    recycledContent: Math.round(5 + sr(i * 19) * 60),
    singleUsePlastic: Math.round(10 + sr(i * 23) * 70),
    plasticTax: Math.round(sr(i * 29) > 0.3 ? 100 + sr(i * 31) * 400 : 0),
    extendedProducerResponsibility: sr(i * 37) > 0.35,
    oceanPlasticExposure: +(1 + sr(i * 41) * 9).toFixed(1),
    recyclingCapex: Math.round(5 + sr(i * 43) * 295),
    circularTarget2030: Math.round(20 + sr(i * 47) * 75),
    plasticCredits: Math.round(sr(i * 53) > 0.4 ? 1 + sr(i * 59) * 49 : 0),
  };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, fontFamily: T.fontMono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Company Overview','Production Profile','Recycled Content','Single-Use Risk','EPR Compliance','Ocean Plastic Exposure','Regulatory Risk','Transition Scoring'];

export default function PlasticsPollutionFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [regFilter, setRegFilter] = useState('All');
  const [plasticTax, setPlasticTax] = useState(200);
  const [recycledTarget, setRecycledTarget] = useState(30);

  const filtered = useMemo(() => COMPANIES.filter(c =>
    (typeFilter === 'All' || c.type === typeFilter) &&
    (countryFilter === 'All' || c.country === countryFilter) &&
    (regFilter === 'All' || c.regTier === regFilter)
  ), [typeFilter, countryFilter, regFilter]);

  const n = Math.max(1, filtered.length);
  const totalProduction = filtered.reduce((s, c) => s + c.plasticProduction, 0);
  const avgRecycled = (filtered.reduce((s, c) => s + c.recycledContent, 0) / n).toFixed(1);
  const avgRegRisk = (filtered.reduce((s, c) => s + c.regulatoryRisk, 0) / n).toFixed(1);
  const avgTransition = (filtered.reduce((s, c) => s + c.transitionScore, 0) / n).toFixed(1);

  const taxExposure = ((filtered.reduce((s, c) => s + c.plasticTax * c.plasticProduction, 0)) / 1e6).toFixed(0);
  const gapToTarget = filtered.filter(c => c.recycledContent < recycledTarget).length;

  const typeBarData = TYPES.map(t => {
    const cs = filtered.filter(c => c.type === t);
    return { type: t, prod: cs.reduce((s, c) => s + c.plasticProduction, 0) };
  }).filter(d => d.prod > 0);

  const countryRiskData = COUNTRIES.map(cn => {
    const cs = filtered.filter(c => c.country === cn);
    return { country: cn.substring(0, 6), risk: cs.length ? +(cs.reduce((s, c) => s + c.regulatoryRisk, 0) / cs.length).toFixed(1) : 0 };
  }).filter(d => d.risk > 0).sort((a, b) => b.risk - a.risk).slice(0, 8);

  const scatterData = filtered.map(c => ({ x: c.recycledContent, y: c.transitionScore, name: c.name }));

  const typeEPRData = TYPES.map(t => {
    const cs = filtered.filter(c => c.type === t);
    return { type: t, pct: cs.length ? Math.round((cs.filter(c => c.extendedProducerResponsibility).length / cs.length) * 100) : 0 };
  }).filter(d => d.pct > 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.textPri }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🔬</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Plastics Pollution Finance</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: T.fontMono }}>EP-DL3 · 80 Companies · Plastics Sector Risk & Transition Analytics</div>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '12px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Type', typeFilter, setTypeFilter, ['All', ...TYPES]],
          ['Country', countryFilter, setCountryFilter, ['All', ...COUNTRIES]],
          ['Reg. Risk', regFilter, setRegFilter, ['All', ...REG_RISK_TIERS]],
        ].map(([label, val, setter, opts]) => (
          <label key={label} style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}:
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 6px', background: T.bg }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Plastic Tax ${plasticTax}/t:
          <input type="range" min={0} max={800} value={plasticTax} onChange={e => setPlasticTax(+e.target.value)} style={{ width: 80 }} />
        </label>
        <label style={{ fontSize: 12, color: T.textSec, display: 'flex', alignItems: 'center', gap: 6 }}>
          Recycled Target {recycledTarget}%:
          <input type="range" min={10} max={80} value={recycledTarget} onChange={e => setRecycledTarget(+e.target.value)} style={{ width: 80 }} />
        </label>
        <span style={{ fontSize: 11, color: T.textSec, marginLeft: 'auto' }}>{filtered.length} companies</span>
      </div>

      <div style={{ padding: '20px 32px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total Plastic Production" value={`${(totalProduction / 1000).toFixed(0)}M kt/yr`} sub={`Tax exposure: $${taxExposure}M`} color={T.red} />
        <KpiCard label="Avg Recycled Content" value={`${avgRecycled}%`} sub={`${gapToTarget} co. below ${recycledTarget}% target`} color={T.green} />
        <KpiCard label="Avg Regulatory Risk" value={`${avgRegRisk}/10`} sub={`${filtered.filter(c => c.regTier === 'High').length} high-risk`} color={T.orange} />
        <KpiCard label="Avg Transition Score" value={`${avgTransition}/100`} sub={`${filtered.filter(c => c.transitionScore >= 70).length} advanced`} color={T.teal} />
      </div>

      <div style={{ padding: '0 32px', display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent',
            border: 'none', borderBottom: tab === i ? `2px solid ${T.red}` : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {tab === 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Company','Type','Country','Reg Risk','Transition','Production(kt)','Recycled%','SUP%','EPR','Ocean Exp'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 40).map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                    <td style={{ padding: '7px 10px' }}>{c.type}</td>
                    <td style={{ padding: '7px 10px' }}>{c.country}</td>
                    <td style={{ padding: '7px 10px' }}>
                      <span style={{ background: c.regTier === 'High' ? '#fee2e2' : c.regTier === 'Medium' ? '#fef9c3' : '#dcfce7', color: c.regTier === 'High' ? T.red : c.regTier === 'Medium' ? T.amber : T.green, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{c.regTier}</span>
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.transitionScore >= 70 ? T.green : c.transitionScore >= 45 ? T.amber : T.red }}>{c.transitionScore}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{c.plasticProduction}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.recycledContent >= recycledTarget ? T.green : T.red }}>{c.recycledContent}%</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.singleUsePlastic >= 50 ? T.red : T.amber }}>{c.singleUsePlastic}%</td>
                    <td style={{ padding: '7px 10px' }}>{c.extendedProducerResponsibility ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : <span style={{ color: T.red }}>✗</span>}</td>
                    <td style={{ padding: '7px 10px', fontFamily: T.fontMono, color: c.oceanPlasticExposure >= 7 ? T.red : c.oceanPlasticExposure >= 4 ? T.amber : T.green }}>{c.oceanPlasticExposure}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Plastic Production by Type (kt/yr)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v} kt`, 'Production']} />
                  <Bar dataKey="prod" fill={T.red} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Top 12 Producers (kt/yr)</div>
              {[...filtered].sort((a, b) => b.plasticProduction - a.plasticProduction).slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.red }}>{c.plasticProduction} kt</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Recycled Content vs Transition Score</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Recycled Content" tick={{ fontSize: 10 }} label={{ value: 'Recycled Content (%)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis dataKey="y" name="Transition Score" tick={{ fontSize: 10 }} label={{ value: 'Transition Score', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [v, n === 'x' ? 'Recycled %' : 'Transition Score']} />
                  <Scatter data={scatterData.slice(0, 50)} fill={T.green} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Recycled Content Leaders</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>Target: {recycledTarget}% · {gapToTarget} companies below target</div>
              {[...filtered].sort((a, b) => b.recycledContent - a.recycledContent).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: c.recycledContent >= recycledTarget ? T.green : T.amber }}>{c.recycledContent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Highest Single-Use Plastic % (top 15)</div>
              {[...filtered].sort((a, b) => b.singleUsePlastic - a.singleUsePlastic).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: c.singleUsePlastic >= 60 ? T.red : T.amber, fontWeight: 700 }}>{c.singleUsePlastic}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>SUP Distribution Summary</div>
              {['< 20%','20–40%','40–60%','> 60%'].map((bucket, bi) => {
                const ranges = [[0,20],[20,40],[40,60],[60,100]];
                const [lo, hi] = ranges[bi];
                const cnt = filtered.filter(c => c.singleUsePlastic >= lo && c.singleUsePlastic < hi).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                const clr = [T.green, T.amber, T.orange, T.red][bi];
                return (
                  <div key={bucket} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: clr }}>{bucket} SUP</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{cnt} companies</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 8 }}>
                      <div style={{ background: clr, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>EPR Compliance by Sector Type (%)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={typeEPRData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}%`, 'EPR Compliance']} />
                  <Bar dataKey="pct" fill={T.blue} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>EPR Status Summary</div>
              {[['Compliant', filtered.filter(c => c.extendedProducerResponsibility).length, T.green],
                ['Non-Compliant', filtered.filter(c => !c.extendedProducerResponsibility).length, T.red]
              ].map(([label, cnt, clr]) => (
                <div key={label} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: clr }}>{label}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, color: clr }}>{cnt} ({(cnt / n * 100).toFixed(0)}%)</span>
                  </div>
                  <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}>
                    <div style={{ background: clr, width: `${(cnt / n) * 100}%`, height: '100%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: 12, background: T.sub, borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>EPR schemes reduce producer liability and fund recycling infrastructure. Companies without EPR face increasing regulatory fines under EU and national frameworks.</div>
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Highest Ocean Plastic Exposure (top 15)</div>
              {[...filtered].sort((a, b) => b.oceanPlasticExposure - a.oceanPlasticExposure).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: c.oceanPlasticExposure >= 7 ? T.red : c.oceanPlasticExposure >= 4 ? T.amber : T.green, fontWeight: 700 }}>{c.oceanPlasticExposure}/10</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Ocean Exposure Distribution</div>
              {[['Critical (7–10)', 7, 10, T.red], ['Medium (4–6.9)', 4, 7, T.amber], ['Low (0–3.9)', 0, 4, T.green]].map(([label, lo, hi, clr]) => {
                const cnt = filtered.filter(c => c.oceanPlasticExposure >= lo && c.oceanPlasticExposure < hi).length;
                const pct = n > 0 ? (cnt / n) * 100 : 0;
                return (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: clr }}>{label}</span>
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>{cnt} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ background: T.borderL, borderRadius: 4, height: 10 }}>
                      <div style={{ background: clr, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Regulatory Risk by Country</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryRiskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="country" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${v}/10`, 'Avg Reg. Risk']} />
                  <Bar dataKey="risk" fill={T.orange} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>High Risk Companies</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Plastic tax: ${plasticTax}/t · Tax exposure: ${taxExposure}M</div>
              {filtered.filter(c => c.regTier === 'High').slice(0, 12).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.red }}>{c.regulatoryRisk}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Transition Score Leaders</div>
              {[...filtered].sort((a, b) => b.transitionScore - a.transitionScore).slice(0, 15).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>{c.type} · {c.country}</div>
                  </div>
                  <span style={{ fontFamily: T.fontMono, fontSize: 13, color: c.transitionScore >= 70 ? T.green : T.amber, fontWeight: 700 }}>{c.transitionScore}/100</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, padding: 20, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Transition KPIs</div>
              {[
                { label: 'Avg Transition Score', val: `${avgTransition}/100`, clr: T.teal },
                { label: 'Avg 2030 Circular Target', val: `${(filtered.reduce((s, c) => s + c.circularTarget2030, 0) / n).toFixed(0)}%`, clr: T.green },
                { label: 'Total Recycling Capex', val: `$${filtered.reduce((s, c) => s + c.recyclingCapex, 0).toLocaleString()}M`, clr: T.indigo },
                { label: 'Plastic Credits Issued', val: `${filtered.reduce((s, c) => s + c.plasticCredits, 0)} kt/yr`, clr: T.blue },
                { label: 'EPR Compliance Rate', val: `${((filtered.filter(c => c.extendedProducerResponsibility).length / n) * 100).toFixed(0)}%`, clr: T.sage },
                { label: 'High Transition Score (>70)', val: `${filtered.filter(c => c.transitionScore >= 70).length}`, clr: T.green },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: T.fontMono, color: item.clr }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
