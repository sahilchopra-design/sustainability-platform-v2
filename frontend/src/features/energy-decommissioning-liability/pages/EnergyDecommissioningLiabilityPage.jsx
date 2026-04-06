import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const ASSETS = [
  { name:'Blackrock Coal Station', type:'Coal Plant', country:'Australia', est_cost_mn:320, provision_mn:180, retirement:2030, bond_required:true },
  { name:'Shandong Coal Station', type:'Coal Plant', country:'China', est_cost_mn:480, provision_mn:120, retirement:2032, bond_required:false },
  { name:'South Africa Coal Plant', type:'Coal Plant', country:'South Africa', est_cost_mn:650, provision_mn:95, retirement:2029, bond_required:true },
  { name:'Polish Brown Coal', type:'Coal Plant', country:'Poland', est_cost_mn:420, provision_mn:85, retirement:2031, bond_required:true },
  { name:'Vietnam Coal II', type:'Coal Plant', country:'Vietnam', est_cost_mn:180, provision_mn:45, retirement:2045, bond_required:false },
  { name:'Appalachian Coal Mine', type:'Mine', country:'USA', est_cost_mn:95, provision_mn:60, retirement:2028, bond_required:true },
  { name:'Alberta Oil Sands', type:'Mine', country:'Canada', est_cost_mn:2400, provision_mn:850, retirement:2038, bond_required:true },
  { name:'Darwin Refinery', type:'Refinery', country:'Australia', est_cost_mn:280, provision_mn:110, retirement:2035, bond_required:true },
  { name:'Bass Strait Refinery', type:'Refinery', country:'Australia', est_cost_mn:240, provision_mn:90, retirement:2033, bond_required:true },
  { name:'Kuwait Oil Refinery', type:'Refinery', country:'Kuwait', est_cost_mn:350, provision_mn:150, retirement:2040, bond_required:false },
  { name:'Riverview Gas CCGT', type:'Gas Plant', country:'USA', est_cost_mn:85, provision_mn:55, retirement:2045, bond_required:true },
  { name:'Jakarta Gas Turbine', type:'Gas Plant', country:'Indonesia', est_cost_mn:60, provision_mn:20, retirement:2040, bond_required:false },
  { name:'North Sea Gas Platform', type:'Platform', country:'UK', est_cost_mn:890, provision_mn:420, retirement:2036, bond_required:true },
  { name:'Permian Basin Pipeline', type:'Pipeline', country:'USA', est_cost_mn:180, provision_mn:80, retirement:2050, bond_required:true },
  { name:'Caspian Gas Field', type:'Pipeline', country:'Kazakhstan', est_cost_mn:220, provision_mn:65, retirement:2046, bond_required:false },
  { name:'Gulf LNG Terminal', type:'LNG Terminal', country:'Qatar', est_cost_mn:450, provision_mn:280, retirement:2055, bond_required:false },
  { name:'Mozambique LNG', type:'LNG Terminal', country:'Mozambique', est_cost_mn:380, provision_mn:120, retirement:2060, bond_required:false },
  { name:'Rhine Nuclear Plant', type:'Nuclear', country:'France', est_cost_mn:1800, provision_mn:1200, retirement:2040, bond_required:true },
  { name:'Ontario Nuclear Station', type:'Nuclear', country:'Canada', est_cost_mn:1400, provision_mn:980, retirement:2043, bond_required:true },
];

const NGFS_SCENARIOS = [
  { scenario: 'Net Zero 2050', retirement_accel: -5, cost_mult: 1.15, label: 'Orderly' },
  { scenario: 'Below 2C', retirement_accel: -3, cost_mult: 1.08, label: 'Orderly' },
  { scenario: 'NDCs', retirement_accel: 0, cost_mult: 1.0, label: 'Current' },
  { scenario: 'Delayed Transition', retirement_accel: -8, cost_mult: 1.25, label: 'Disorderly' },
  { scenario: 'Divergent', retirement_accel: -4, cost_mult: 1.12, label: 'Disorderly' },
];

const JURISDICTIONS = [
  { country: 'Australia', bond: true, regulation: 'EPBC Act s.261+', coverage: 'Full decom bond required for mining & offshore' },
  { country: 'USA', bond: true, regulation: 'SMCRA / BSEE 30 CFR 250', coverage: 'Surety bonds for mines; P&A bonds for offshore platforms' },
  { country: 'UK', bond: true, regulation: 'OSPAR / Energy Act 2008', coverage: 'Decommissioning Security Agreement mandatory for offshore' },
  { country: 'Canada', bond: true, regulation: 'AER Directive 006 / CEPA', coverage: 'Licensee Liability Rating; ARO provisions mandatory' },
  { country: 'France', bond: true, regulation: 'ASN Nuclear Safety', coverage: 'Nuclear decommissioning funds regulated by ASN' },
  { country: 'Poland', bond: true, regulation: 'EU Industrial Emissions Directive', coverage: 'Mine closure plans with financial guarantees' },
  { country: 'South Africa', bond: true, regulation: 'MPRDA s.41', coverage: 'Financial provision for mine rehabilitation' },
  { country: 'China', bond: false, regulation: 'Evolving / Partial', coverage: 'No mandatory decommissioning bond system yet' },
  { country: 'Kuwait', bond: false, regulation: 'KPC Internal', coverage: 'State-owned; internal provisions only' },
  { country: 'Indonesia', bond: false, regulation: 'PP 78/2010', coverage: 'Post-mining plan required but enforcement limited' },
];

const TABS = ['Liability Overview','Asset-Level Provisions','Funding Gap','Regulatory Requirements','Stranded Asset Link','Write-Down Scenarios'];

export default function EnergyDecommissioningLiabilityPage() {
  const [tab, setTab] = useState(0);
  const [scenarioIdx, setScenarioIdx] = useState(2);

  const totalEst = ASSETS.reduce((s, a) => s + a.est_cost_mn, 0);
  const totalProv = ASSETS.reduce((s, a) => s + a.provision_mn, 0);
  const gap = totalEst - totalProv;
  const fundingRatio = (totalProv / totalEst * 100).toFixed(1);

  const scenarioData = useMemo(() => {
    return NGFS_SCENARIOS.map(sc => {
      const adjCost = Math.round(totalEst * sc.cost_mult);
      return { ...sc, adj_cost: adjCost, adj_gap: adjCost - totalProv, writedown: adjCost - totalProv };
    });
  }, [totalEst, totalProv]);

  const retirementByDecade = useMemo(() => {
    const dec = {};
    ASSETS.forEach(a => {
      const d = Math.floor(a.retirement / 10) * 10 + 's';
      dec[d] = (dec[d] || { count: 0, cost: 0 });
      dec[d].count += 1;
      dec[d].cost += a.est_cost_mn;
    });
    return Object.entries(dec).sort().map(([decade, v]) => ({ decade, ...v }));
  }, []);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 155px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: T.navy, color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CU5</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Decommissioning & Stranded Asset Liability</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        Asset retirement obligations, funding gaps, regulatory bonds, and NGFS scenario write-down analysis.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: IAS 37 / IFRIC 1 | OSPAR | BSEE | Company ARO disclosures</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Est. Total Liability', `$${(totalEst / 1000).toFixed(1)}B`, `${ASSETS.length} assets`, T.red)}
        {card('Total Provisions', `$${(totalProv / 1000).toFixed(1)}B`, 'Booked ARO', T.blue)}
        {card('Funding Gap', `$${(gap / 1000).toFixed(1)}B`, `${fundingRatio}% funded`, gap > 0 ? T.red : T.green)}
        {card('Bond Required', `${ASSETS.filter(a => a.bond_required).length}`, `of ${ASSETS.length} assets`)}
        {card('Nearest Retirement', `${Math.min(...ASSETS.map(a => a.retirement))}`, 'Appalachian Coal Mine', T.amber)}
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Decommissioning Cost by Retirement Decade</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={retirementByDecade}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="decade" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, name) => [name === 'cost' ? `$${v}M` : v, name === 'cost' ? 'Est. Cost' : 'Assets']} />
              <Legend />
              <Bar dataKey="cost" fill={T.red} name="Est. Cost ($M)" radius={[4,4,0,0]} />
              <Bar dataKey="count" fill={T.blue} name="Asset Count" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
            <strong>Liability concentration:</strong> {(retirementByDecade.find(d => d.decade === '2030s')?.cost ?? null) !== null ? `$${retirementByDecade.find(d => d.decade === '2030s')?.cost}M due in 2030s` : 'N/A'} represents the largest exposure decade.
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Asset-Level Provisions vs Estimated Cost</h3>
          <ResponsiveContainer width="100%" height={480}>
            <BarChart data={[...ASSETS].sort((a,b) => b.est_cost_mn - a.est_cost_mn)} layout="vertical" margin={{ left: 160 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={155} />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Legend />
              <Bar dataKey="est_cost_mn" fill={T.red} name="Estimated Cost ($M)" fillOpacity={0.4} />
              <Bar dataKey="provision_mn" fill={T.green} name="Provision ($M)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Funding Gap Analysis</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Asset','Type','Est. Cost $M','Provision $M','Gap $M','Funded %','Status'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Asset' || h === 'Type' ? 'left' : 'right', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[...ASSETS].sort((a,b) => (b.est_cost_mn - b.provision_mn) - (a.est_cost_mn - a.provision_mn)).map(a => {
                const g = a.est_cost_mn - a.provision_mn;
                const pct = (a.provision_mn / a.est_cost_mn * 100).toFixed(0);
                return (
                  <tr key={a.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '6px 10px' }}>{a.type}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{a.est_cost_mn}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{a.provision_mn}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono, color: g > 0 ? T.red : T.green, fontWeight: 700 }}>{g > 0 ? `(${g})` : '0'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: T.mono }}>{pct}%</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: +pct >= 80 ? '#f0fdf4' : +pct >= 50 ? '#fffbeb' : '#fef2f2', color: +pct >= 80 ? T.green : +pct >= 50 ? T.amber : T.red }}>
                        {+pct >= 80 ? 'ADEQUATE' : +pct >= 50 ? 'PARTIAL' : 'UNDERFUNDED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Decommissioning Bond Requirements by Jurisdiction</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Country','Bond Required','Regulation','Coverage'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {JURISDICTIONS.map(j => (
                <tr key={j.country} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{j.country}</td>
                  <td style={{ padding: '6px 10px' }}>{j.bond ? <span style={{ color: T.green, fontWeight: 700 }}>YES</span> : <span style={{ color: T.red }}>NO</span>}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono, fontSize: 11 }}>{j.regulation}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11 }}>{j.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Stranded Asset Linkage</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 14 }}>
            Connection to EP-CA2 Stranded Asset Analyzer and EP-CK1 Stranded Asset Impairment. Early retirement under transition scenarios
            accelerates decommissioning liability crystallization.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Asset','Current Retire','NZ2050 Retire','Years Accelerated','Stranded Book Value $M'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {ASSETS.filter(a => a.type.includes('Coal') || a.type === 'Mine').map(a => {
                const accel = 5;
                const newRetire = a.retirement - accel;
                return (
                  <tr key={a.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{a.retirement}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, color: T.red, fontWeight: 700 }}>{newRetire}</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono, color: T.red }}>-{accel} yrs</td>
                    <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{Math.round(a.est_cost_mn * 0.6)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 14, padding: 12, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
            <strong>Link to EP-CA2:</strong> Under NZ2050, coal assets retire 5 years early, crystallizing $
            {(ASSETS.filter(a => a.type.includes('Coal') || a.type === 'Mine').reduce((s,a) => s + a.est_cost_mn, 0) / 1000).toFixed(1)}B in decommissioning costs sooner than provisioned.
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Write-Down Scenarios (5 NGFS Pathways)</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {scenarioData.map((sc, i) => (
              <button key={i} onClick={() => setScenarioIdx(i)} style={{
                padding: '6px 14px', borderRadius: 6, border: `1px solid ${scenarioIdx === i ? T.navy : T.border}`,
                background: scenarioIdx === i ? T.navy : T.surface, color: scenarioIdx === i ? '#fff' : T.textSec,
                cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>{sc.scenario}</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Legend />
              <Bar dataKey="adj_cost" fill={T.red} name="Adjusted Liability ($M)" radius={[4,4,0,0]} />
              <Bar dataKey="adj_gap" fill={T.amber} name="Funding Gap ($M)" radius={[4,4,0,0]} />
              <ReferenceLine y={totalProv} stroke={T.green} strokeDasharray="5 5" label={{ value: `Provisions: $${totalProv}M`, fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Selected: {scenarioData[scenarioIdx].scenario}</strong> ({scenarioData[scenarioIdx].label}) —
            Adjusted liability: ${(scenarioData[scenarioIdx].adj_cost / 1000).toFixed(1)}B |
            Gap: ${(scenarioData[scenarioIdx].adj_gap / 1000).toFixed(1)}B |
            Cost multiplier: {scenarioData[scenarioIdx].cost_mult}x |
            Retirement acceleration: {scenarioData[scenarioIdx].retirement_accel} years
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> IAS 37 / IFRIC 1 ARO Standards | OSPAR Convention | BSEE Decommissioning | NGFS Scenarios v4 | Company ARO disclosures.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CU5 v1.0 | Decommissioning Liability</span>
      </div>
    </div>
  );
}
