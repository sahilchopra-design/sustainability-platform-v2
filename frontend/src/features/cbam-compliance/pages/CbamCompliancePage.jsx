import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const tip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 11 };

const CBAM_SECTORS = [
  { sector: 'Steel & Iron',   cnCodes: 13, defaultEF: 1.85, euETS: 62.4, importVol: 2840, certCost: 177.4, countries: ['China', 'India', 'Turkey', 'Ukraine', 'Russia'], phase: 'Full', color: '#475569' },
  { sector: 'Aluminium',      cnCodes: 6,  defaultEF: 6.70, euETS: 62.4, importVol: 890,  certCost: 418.1, countries: ['China', 'Russia', 'Norway', 'India', 'Bahrain'],  phase: 'Full', color: '#6d28d9' },
  { sector: 'Cement',         cnCodes: 2,  defaultEF: 0.83, euETS: 62.4, importVol: 380,  certCost: 51.8,  countries: ['Turkey', 'Belarus', 'Ukraine', 'Norway'],           phase: 'Full', color: '#92400e' },
  { sector: 'Fertilisers',    cnCodes: 5,  defaultEF: 3.20, euETS: 62.4, importVol: 510,  certCost: 199.7, countries: ['Russia', 'Egypt', 'Algeria', 'Trinidad', 'Qatar'],   phase: 'Full', color: '#065f46' },
  { sector: 'Electricity',    cnCodes: 1,  defaultEF: 0.46, euETS: 62.4, importVol: 420,  certCost: 28.7,  countries: ['Norway', 'Switzerland', 'Ukraine', 'Belarus'],        phase: 'Full', color: T.gold },
  { sector: 'Hydrogen',       cnCodes: 1,  defaultEF: 11.0, euETS: 62.4, importVol: 12,   certCost: 686.4, countries: ['Morocco', 'Chile', 'Saudi Arabia', 'Australia'],      phase: 'Full', color: '#0891b2' },
];

const IMPORTERS = [
  { name: 'EuroCorp Metals GmbH',     sector: 'Steel & Iron', annualImport: 42000, origin: 'India', embeddedEF: 2.1, euETS: 62.4, certRequired: 5512, certCost: 344000, compliance: 'Partial' },
  { name: 'Alco Aluminium SA',        sector: 'Aluminium',    annualImport: 8500,  origin: 'China', embeddedEF: 8.4, euETS: 62.4, certRequired: 35700, certCost: 2228000, compliance: 'At Risk' },
  { name: 'CemEu Holdings',           sector: 'Cement',       annualImport: 65000, origin: 'Turkey', embeddedEF: 0.91, euETS: 62.4, certRequired: 29750, certCost: 1856000, compliance: 'Compliant' },
  { name: 'AgriChem Netherlands BV',  sector: 'Fertilisers',  annualImport: 12000, origin: 'Russia', embeddedEF: 3.8, euETS: 62.4, certRequired: 22800, certCost: 1422000, compliance: 'Non-Compliant' },
  { name: 'HydroGen Partners Ltd',    sector: 'Hydrogen',     annualImport: 450,   origin: 'Morocco', embeddedEF: 9.2, euETS: 62.4, certRequired: 2070, certCost: 129000, compliance: 'Compliant' },
];

const QUARTERLY_CALENDAR = [
  { quarter: 'Q1 2026', period: 'Jan–Mar 2026', declaration: '31 Jan 2027', purchases: 'Jan–Mar 2026', carbonPriceEst: 62.4, status: 'Current' },
  { quarter: 'Q2 2026', period: 'Apr–Jun 2026', declaration: '30 Apr 2027', purchases: 'Apr–Jun 2026', carbonPriceEst: 65.0, status: 'Upcoming' },
  { quarter: 'Q3 2026', period: 'Jul–Sep 2026', declaration: '31 Jul 2027', purchases: 'Jul–Sep 2026', carbonPriceEst: 67.5, status: 'Future' },
  { quarter: 'Q4 2026', period: 'Oct–Dec 2026', declaration: '31 Oct 2027', purchases: 'Oct–Dec 2026', carbonPriceEst: 70.0, status: 'Future' },
];

const EU_ETS_TREND = Array.from({ length: 24 }, (_, i) => ({
  month: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i % 12]} ${2025 + Math.floor(i / 12)}`,
  price: +(55 + sr(i * 5) * 20 + i * 0.5).toFixed(2),
}));

const TABS = ['Overview', 'Sector Coverage', 'Importer Dashboard', 'Certificate Calculator', 'Quarterly Calendar'];

const STAT = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', borderTop: `3px solid ${color || T.amber}` }}>
    <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function CbamCompliancePage() {
  const [tab, setTab] = useState(0);
  const [selectedSector, setSelectedSector] = useState(null);
  const [importQty, setImportQty] = useState(10000);
  const [ef, setEf] = useState(1.85);
  const [origin, setOrigin] = useState('China');

  const complianceColor = s => ({ Compliant: T.green, Partial: T.amber, 'At Risk': T.amber, 'Non-Compliant': T.red }[s] || T.textMut);

  const calcCerts = useMemo(() => {
    const embedded = (importQty * ef) / 1000;
    const cost = embedded * 62.4;
    return { embedded: embedded.toFixed(0), cost: (cost / 1000).toFixed(0), certs: Math.ceil(embedded) };
  }, [importQty, ef]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: T.font }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#b4530918', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏭</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>CBAM Compliance Engine</h1>
            <span style={{ fontSize: 10, background: '#b4530918', color: '#b45309', padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>EP-AA3</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 13, margin: 0 }}>EU Carbon Border Adjustment Mechanism · Regulation (EU) 2023/956 · Full Implementation Apr 2026 · 6 Sectors</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ label: 'Full Implementation', color: T.red }, { label: 'EU ETS €62.4/t', color: T.amber }, { label: '6 Sectors', color: T.sage }].map(b => (
            <span key={b.label} style={{ fontSize: 10, background: b.color + '18', color: b.color, padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === i ? '#b45309' : T.textSec, borderBottom: tab === i ? '2px solid #b45309' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>{t}</button>
        ))}
      </div>

      {/* TAB 0: OVERVIEW */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            <STAT label="Sectors Covered" value="6" sub="Steel · Al · Cement · Fert · Elec · H₂" color={T.amber} />
            <STAT label="EU ETS Price" value="€62.4/t" sub="CO2 Mar 2026 (ICE)" color={T.red} />
            <STAT label="CN Codes in Scope" value="28" sub="Combined Nomenclature HS codes" color="#b45309" />
            <STAT label="CBAM Full Enforcement" value="1 Apr 2026" sub="Certificates mandatory" color={T.red} />
            <STAT label="EU Imports Covered" value="€169bn" sub="Annual imports in CBAM sectors" color={T.sage} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>CBAM Timeline & Obligations</div>
              {[
                { phase: 'Transitional Phase', period: 'Oct 2023 – Dec 2025', obligation: 'Quarterly reporting of embedded emissions only (no payment)', status: 'Complete', color: T.sage },
                { phase: 'Full Implementation', period: '1 Apr 2026 onwards', obligation: 'CBAM certificates required · Price = EU ETS price · Annual surrender by 31 May', status: 'Active', color: T.red },
                { phase: 'Scope Extension', period: '2026–2030 TBD', obligation: 'Organic chemicals, plastics, polymers under review by Commission', status: 'Planned', color: T.textMut },
              ].map(p => (
                <div key={p.phase} style={{ padding: '12px 14px', borderLeft: `4px solid ${p.color}`, background: p.color + '08', borderRadius: '0 8px 8px 0', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{p.phase}</div>
                    <span style={{ fontSize: 10, background: p.color + '20', color: p.color, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 3 }}>{p.period}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{p.obligation}</div>
                </div>
              ))}
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>EU ETS Price Trend (€/tCO2)</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={EU_ETS_TREND.slice(-12)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textMut }} angle={-30} textAnchor="end" height={50} interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} domain={[40, 100]} />
                  <Tooltip formatter={v => `€${v}/t`} contentStyle={tip} />
                  <Area type="monotone" dataKey="price" stroke="#b45309" fill="#b4530920" name="EU ETS Price" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: '#fef3c710', border: `1px solid ${T.amber}40`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 10 }}>⚠️ CBAM Compliance Obligations — Checklist</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { item: 'Register as CBAM declarant in CBAM Registry', done: true },
                { item: 'Obtain embedded emissions data from non-EU suppliers', done: false },
                { item: 'Calculate embedded emissions per CN code per tonne', done: true },
                { item: 'Purchase CBAM certificates quarterly at EU ETS price', done: false },
                { item: 'Submit annual CBAM declaration by 31 May each year', done: false },
                { item: 'Surrender certificates = tCO2e embedded in imports', done: false },
                { item: 'Deduct carbon already paid in country of origin', done: true },
                { item: 'Retain 3rd-party verified emissions data for 4 years', done: false },
              ].map(c => (
                <div key={c.item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: c.done ? T.sage + '10' : T.red + '08', borderRadius: 8 }}>
                  <span style={{ fontSize: 14, color: c.done ? T.sage : T.red }}>{c.done ? '✅' : '⭕'}</span>
                  <span style={{ fontSize: 12, color: T.textSec }}>{c.item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: SECTOR COVERAGE */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {CBAM_SECTORS.map(s => (
              <div key={s.sector} onClick={() => setSelectedSector(selectedSector?.sector === s.sector ? null : s)} style={{
                background: T.surface, border: `2px solid ${selectedSector?.sector === s.sector ? s.color : T.border}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{s.sector}</div>
                  <span style={{ fontSize: 10, background: s.color + '18', color: s.color, padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>{s.phase}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMut }}>CN Codes</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.cnCodes}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMut }}>Default EF (tCO2/t)</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{s.defaultEF}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMut }}>Import Vol (kt/yr)</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textSec }}>{s.importVol.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textMut }}>Cert Cost (€/t)</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.red }}>€{s.certCost.toFixed(1)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: T.textMut }}>Top origins: {s.countries.slice(0, 3).join(', ')}</div>
              </div>
            ))}
          </div>

          {selectedSector && (
            <div style={{ background: T.surface, border: `2px solid ${selectedSector.color}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
                {selectedSector.sector} — Detailed CBAM Analysis
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Embedded Emissions Calculation</div>
                  <div style={{ background: T.bg, borderRadius: 8, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: T.textSec }}>
                    <div>Default EF = {selectedSector.defaultEF} tCO2e/tonne</div>
                    <div style={{ marginTop: 6 }}>EU ETS Price = €{selectedSector.euETS}/tCO2</div>
                    <div style={{ marginTop: 6, borderTop: `1px solid ${T.border}`, paddingTop: 6, fontWeight: 700, color: T.navy }}>Certificate cost = €{selectedSector.certCost.toFixed(2)}/tonne imported</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Top Exporting Countries</div>
                  {selectedSector.countries.map((c, i) => (
                    <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textSec }}>
                      <span>{c}</span>
                      <span style={{ fontWeight: 600, color: T.navy }}>{(100 - i * 12).toFixed(0)}% has carbon pricing</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORTER DASHBOARD */}
      {tab === 2 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Importer Compliance Dashboard</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f6f4f0' }}>
                  {['Importer', 'Sector', 'Annual Import (t)', 'Origin', 'Embedded EF', 'Certs Required', 'Annual Cost (€)', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IMPORTERS.map((r, i) => (
                  <tr key={r.name} style={{ background: i % 2 === 0 ? T.surface : '#fafaf8', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.navy }}>{r.name}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.sector}</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums' }}>{r.annualImport.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', color: T.textSec }}>{r.origin}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.embeddedEF} tCO2/t</td>
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.certRequired.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.red }}>€{(r.certCost / 1000).toFixed(0)}k</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, background: complianceColor(r.compliance) + '18', color: complianceColor(r.compliance), padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{r.compliance}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Certificate Cost by Sector (€/tonne imported)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CBAM_SECTORS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textMut }} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => `€${v.toFixed(1)}/t`} contentStyle={tip} />
                <Bar dataKey="certCost" name="Certificate cost" radius={[4, 4, 0, 0]}>
                  {CBAM_SECTORS.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICATE CALCULATOR */}
      {tab === 3 && (
        <div style={{ maxWidth: 800 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 20 }}>CBAM Certificate Calculator</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Import Parameters</div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Sector</label>
                <select onChange={e => { const s = CBAM_SECTORS.find(c => c.sector === e.target.value); if (s) setEf(s.defaultEF); }} style={{ width: '100%', marginTop: 6, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font }}>
                  {CBAM_SECTORS.map(s => <option key={s.sector} value={s.sector}>{s.sector}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Annual Import Quantity (tonnes)</label>
                <input type="number" value={importQty} onChange={e => setImportQty(+e.target.value)} style={{ width: '100%', marginTop: 6, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Actual/Default Emission Factor (tCO2e/t)</label>
                <input type="number" value={ef} onChange={e => setEf(+e.target.value)} step="0.01" style={{ width: '100%', marginTop: 6, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec, fontWeight: 600 }}>Country of Origin</label>
                <select value={origin} onChange={e => setOrigin(e.target.value)} style={{ width: '100%', marginTop: 6, padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontFamily: T.font }}>
                  {['China', 'India', 'Turkey', 'Russia', 'Ukraine', 'Morocco', 'Norway', 'USA', 'South Korea'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>CBAM Obligation Summary</div>
              {[
                { label: 'Annual Import Volume', value: `${importQty.toLocaleString()} tonnes` },
                { label: 'Emission Factor', value: `${ef} tCO2e/t` },
                { label: 'Total Embedded Emissions', value: `${calcCerts.embedded} tCO2e`, highlight: true },
                { label: 'CBAM Certificates Required', value: `${calcCerts.certs} certificates`, highlight: true },
                { label: 'EU ETS Reference Price', value: '€62.4 /tCO2' },
                { label: 'Annual CBAM Cost', value: `€${(+calcCerts.cost).toLocaleString()}k`, highlight: true, color: T.red },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.textSec }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: r.highlight ? 700 : 500, color: r.color || (r.highlight ? T.navy : T.textSec) }}>{r.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#b4530910', borderRadius: 8, border: `1px solid #b4530940` }}>
                <div style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>Note: Origin deduction</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>If carbon price already paid in {origin}, deduct equivalent carbon cost from CBAM obligation. UK ETS, Swiss ETS, and some other schemes qualify.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUARTERLY CALENDAR */}
      {tab === 4 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 14 }}>CBAM Quarterly Declaration Calendar 2026</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
            {QUARTERLY_CALENDAR.map(q => (
              <div key={q.quarter} style={{ background: T.surface, border: `2px solid ${q.status === 'Current' ? T.red : T.border}`, borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.navy }}>{q.quarter}</div>
                  <span style={{ fontSize: 10, background: q.status === 'Current' ? T.red + '18' : q.status === 'Upcoming' ? T.amber + '18' : T.border, color: q.status === 'Current' ? T.red : q.status === 'Upcoming' ? T.amber : T.textMut, padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>{q.status}</span>
                </div>
                {[
                  { label: 'Monitoring Period', value: q.period },
                  { label: 'Certificate Purchase Window', value: q.purchases },
                  { label: 'Declaration Deadline', value: q.declaration },
                  { label: 'Estimated EU ETS Price', value: `€${q.carbonPriceEst}/t` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                    <span style={{ color: T.textMut }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: T.navy }}>{r.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Annual CBAM Workflow</div>
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
              {[
                { step: '1', label: 'Monitor', detail: 'Track embedded emissions quarterly by CN code', color: '#0891b2' },
                { step: '2', label: 'Purchase', detail: 'Buy CBAM certificates at EU ETS auction price', color: T.gold },
                { step: '3', label: 'Declare', detail: 'Submit CBAM declaration by 31 May', color: T.amber },
                { step: '4', label: 'Surrender', detail: 'Surrender certs = embedded tCO2e of prior year', color: T.red },
                { step: '5', label: 'Retain', detail: 'Keep verified emissions data for 4 years', color: T.sage },
              ].map((s, i, arr) => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ flex: 1, padding: '14px 16px', background: s.color + '10', borderRadius: 10, border: `1px solid ${s.color}30` }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{s.step}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{s.detail}</div>
                  </div>
                  {i < arr.length - 1 && <div style={{ fontSize: 20, color: T.textMut, padding: '0 6px' }}>→</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
