import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent || T.border}`, borderRadius: 8, padding: '16px 20px', background: T.surface }}>
    <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: T.navy, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, orange: { bg: '#ffedd5', text: '#9a3412' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: T.textSec, marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 14, background: T.surface, fontFamily: T.font }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const Inp = ({ label, value, onChange, type = 'number' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: T.textSec, marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 14, background: T.surface, boxSizing: 'border-box', fontFamily: T.font }} />
  </div>
);
const DualInput = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: T.textSec, marginBottom: 4 }}>{label}</div>}
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1 }} />
      <input type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: 70, padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, textAlign: 'center', fontFamily: T.mono }} />
    </div>
  </div>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 20, overflowX: 'auto' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        style={{ padding: '10px 18px', border: 'none', borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
          background: 'none', cursor: 'pointer', fontWeight: active === t ? 700 : 500,
          color: active === t ? T.navy : T.textMut, fontSize: 13, fontFamily: T.font, whiteSpace: 'nowrap' }}>
        {t}
      </button>
    ))}
  </div>
);

const TABS = ['Executive Dashboard', 'Project Pipeline', 'Family Navigator', 'Methodology Library', 'Credit Market Overview', 'Quick Calculator'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];
const FAMILIES = ['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstoves'];
const FAMILY_COLORS = { 'Nature-Based': '#059669', 'Agriculture & Soil': '#84cc16', 'Energy Transition': '#3b82f6', 'Waste & Circular': '#f59e0b', 'Industrial Process': '#8b5cf6', 'Carbon Dioxide Removal': '#06b6d4', 'Community & Cookstoves': '#ec4899' };
const REGISTRIES = ['Verra', 'Gold Standard', 'ACR', 'CAR', 'Puro.earth', 'Isometric'];
const REGIONS = ['Latin America', 'Sub-Saharan Africa', 'Southeast Asia', 'South Asia', 'East Asia', 'North America', 'Europe', 'Oceania'];

const METHODOLOGIES = [
  { code: 'VM0047', name: 'Afforestation/Reforestation', family: 'Nature-Based', cluster: 'REDD+ & Forests', registry: 'Verra', complexity: 'High' },
  { code: 'VM0042', name: 'Improved Forest Management', family: 'Nature-Based', cluster: 'REDD+ & Forests', registry: 'Verra', complexity: 'High' },
  { code: 'VM0009', name: 'Avoided Deforestation (REDD)', family: 'Nature-Based', cluster: 'REDD+ & Forests', registry: 'Verra', complexity: 'Very High' },
  { code: 'VM0033', name: 'Tidal Wetland Conservation', family: 'Nature-Based', cluster: 'Blue Carbon', registry: 'Verra', complexity: 'Very High' },
  { code: 'VM0007', name: 'REDD+ Methodology Framework', family: 'Nature-Based', cluster: 'REDD+ & Forests', registry: 'Verra', complexity: 'Very High' },
  { code: 'ACM0002', name: 'Grid-Connected RE Generation', family: 'Energy Transition', cluster: 'Renewable Energy', registry: 'ACR', complexity: 'Medium' },
  { code: 'AMS-I.D', name: 'Grid-Connected Small-Scale RE', family: 'Energy Transition', cluster: 'Renewable Energy', registry: 'Gold Standard', complexity: 'Low' },
  { code: 'AMS-III.D', name: 'Methane Avoidance Waste', family: 'Waste & Circular', cluster: 'Methane Avoidance', registry: 'Gold Standard', complexity: 'Medium' },
  { code: 'VM0044', name: 'Soil Carbon Quantification', family: 'Agriculture & Soil', cluster: 'Soil Carbon', registry: 'Verra', complexity: 'High' },
  { code: 'VM0017', name: 'Sustainable Agricultural Land', family: 'Agriculture & Soil', cluster: 'Regenerative Ag', registry: 'Verra', complexity: 'Medium' },
  { code: 'GS-CookStove', name: 'Clean Cookstove Programme', family: 'Community & Cookstoves', cluster: 'Household Devices', registry: 'Gold Standard', complexity: 'Low' },
  { code: 'GS-SafeWater', name: 'Safe Drinking Water Supply', family: 'Community & Cookstoves', cluster: 'Safe Water', registry: 'Gold Standard', complexity: 'Low' },
  { code: 'ACM0001', name: 'Flaring/Energy Recovery Landfill', family: 'Waste & Circular', cluster: 'Landfill Gas', registry: 'ACR', complexity: 'Medium' },
  { code: 'VM0046', name: 'Improved Rice Cultivation', family: 'Agriculture & Soil', cluster: 'Rice Methane', registry: 'Verra', complexity: 'Medium' },
  { code: 'Puro-Biochar', name: 'Biochar Carbon Removal', family: 'Carbon Dioxide Removal', cluster: 'Biochar', registry: 'Puro.earth', complexity: 'Medium' },
  { code: 'Puro-BECCS', name: 'BECCS Carbon Removal', family: 'Carbon Dioxide Removal', cluster: 'BECCS', registry: 'Puro.earth', complexity: 'Very High' },
  { code: 'Iso-DAC', name: 'Direct Air Capture', family: 'Carbon Dioxide Removal', cluster: 'DAC', registry: 'Isometric', complexity: 'Very High' },
  { code: 'Iso-GeoCCS', name: 'Geological CO2 Storage', family: 'Carbon Dioxide Removal', cluster: 'Geo-Storage', registry: 'Isometric', complexity: 'Very High' },
  { code: 'ACM0006', name: 'Cement/Clinker Blending', family: 'Industrial Process', cluster: 'Cement & Materials', registry: 'ACR', complexity: 'Medium' },
  { code: 'AM0027', name: 'N2O Destruction (Nitric Acid)', family: 'Industrial Process', cluster: 'Industrial Gas', registry: 'CAR', complexity: 'High' },
];

const genProjects = () => {
  const names = ['Madre de Dios','Kasigau','Cerrado Biome','Mekong Delta','Chitwan Terai','Sierra Gorda','Atlantic Forest','Tumring','Karnataka','Zambezia','Sundarbans','Rimba Raya',
    'Great Rift','Yaeda','Katingan','Southern Cardamom','Cordillera Azul','Mataven','Borneo Peat','Dhaka Clean Cook',
    'Gujarat Solar','Minas Wind','Jiangsu Tidal','Lake Turkana Wind','Sichuan Hydro','Punjab Biogas','Accra Landfill','Cairo Compost',
    'Iowa Soil Carbon','Oregon Biochar','Texas DAC','Appalachian CCS','Quebec Cement','Sumatra Rice','Tamil Nadu Stoves','Congo BECCS',
    'Kenya Safe Water','Rwanda Cookstove','Chile Reforestation','Norway GeoCCS'];
  return names.map((n, i) => {
    const fi = Math.floor(sr(i * 7) * FAMILIES.length);
    const family = FAMILIES[fi];
    const meths = METHODOLOGIES.filter(m => m.family === family);
    const meth = meths[Math.floor(sr(i * 13) * meths.length)] || METHODOLOGIES[0];
    const ri = Math.floor(sr(i * 11) * REGIONS.length);
    return {
      id: `PRJ-${String(i + 1).padStart(3, '0')}`,
      name: n,
      family,
      cluster: meth.cluster,
      methodology: meth.code,
      region: REGIONS[ri],
      registry: meth.registry,
      status: ['Pipeline','Validation','Verified','Issuing'][Math.floor(sr(i * 17) * 4)],
      creditsIssued: Math.round(sr(i * 19) * 900000 + 50000),
      creditsRetired: Math.round(sr(i * 23) * 400000 + 10000),
      creditsAvailable: Math.round(sr(i * 29) * 300000 + 20000),
      vintage: 2018 + Math.floor(sr(i * 31) * 7),
      pricePerCredit: parseFloat((sr(i * 37) * 45 + 3).toFixed(2)),
      coBenefits: Math.round(sr(i * 41) * 5 + 1),
    };
  });
};

const PROJECTS = genProjects();

export default function CcEngineHubPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [searchLib, setSearchLib] = useState('');
  const [calcFamily, setCalcFamily] = useState(FAMILIES[0]);
  const [calcCluster, setCalcCluster] = useState('');
  const [calcMeth, setCalcMeth] = useState('');
  const [calcArea, setCalcArea] = useState(500);
  const [calcPeriod, setCalcPeriod] = useState(10);

  const totals = useMemo(() => {
    const issued = PROJECTS.reduce((s, p) => s + p.creditsIssued, 0);
    const retired = PROJECTS.reduce((s, p) => s + p.creditsRetired, 0);
    const available = PROJECTS.reduce((s, p) => s + p.creditsAvailable, 0);
    const pipeline = PROJECTS.filter(p => p.status === 'Pipeline').length;
    return { issued, retired, available, pipeline };
  }, []);

  const familyChart = useMemo(() => FAMILIES.map(f => {
    const fp = PROJECTS.filter(p => p.family === f);
    return { name: f.replace('& ', '& '), issued: fp.reduce((s, p) => s + p.creditsIssued, 0), retired: fp.reduce((s, p) => s + p.creditsRetired, 0), available: fp.reduce((s, p) => s + p.creditsAvailable, 0) };
  }), []);

  const geoChart = useMemo(() => REGIONS.map((r, i) => ({
    name: r, value: PROJECTS.filter(p => p.region === r).reduce((s, p) => s + p.creditsIssued, 0)
  })), []);

  const recentActivity = useMemo(() => PROJECTS.slice(0, 8).map((p, i) => ({
    ...p, action: ['Issuance', 'Retirement', 'Verification', 'Registration'][i % 4],
    date: `2026-0${3 - Math.floor(i / 3)}-${String(28 - i * 3).padStart(2, '0')}`
  })), []);

  const familyNav = useMemo(() => FAMILIES.map(f => {
    const fp = PROJECTS.filter(p => p.family === f);
    return { family: f, count: fp.length, volume: fp.reduce((s, p) => s + p.creditsIssued, 0), avgPrice: fp.length ? parseFloat((fp.reduce((s, p) => s + p.pricePerCredit, 0) / fp.length).toFixed(2)) : 0 };
  }), []);

  const filteredMethods = useMemo(() => {
    if (!searchLib) return METHODOLOGIES;
    const q = searchLib.toLowerCase();
    return METHODOLOGIES.filter(m => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.family.toLowerCase().includes(q) || m.cluster.toLowerCase().includes(q) || m.registry.toLowerCase().includes(q));
  }, [searchLib]);

  const calcClusters = useMemo(() => [...new Set(METHODOLOGIES.filter(m => m.family === calcFamily).map(m => m.cluster))], [calcFamily]);
  const calcMeths = useMemo(() => METHODOLOGIES.filter(m => m.family === calcFamily && (!calcCluster || m.cluster === calcCluster)), [calcFamily, calcCluster]);

  const calcResult = useMemo(() => {
    const meth = METHODOLOGIES.find(m => m.code === calcMeth);
    if (!meth) return null;
    const area = parseFloat(calcArea) || 500;
    const period = parseFloat(calcPeriod) || 10;
    const familyYield = { 'Nature-Based': 8.5, 'Agriculture & Soil': 3.2, 'Energy Transition': 12.1, 'Waste & Circular': 6.8, 'Industrial Process': 15.4, 'Carbon Dioxide Removal': 2.1, 'Community & Cookstoves': 4.5 };
    const baseYield = familyYield[meth.family] || 5;
    const complexMul = { 'Low': 1.2, 'Medium': 1.0, 'High': 0.85, 'Very High': 0.7 };
    const mul = complexMul[meth.complexity] || 1;
    const annualCredits = Math.round(area * baseYield * mul);
    const totalCredits = annualCredits * period;
    const avgPrice = parseFloat((sr(METHODOLOGIES.indexOf(meth) * 43) * 30 + 5).toFixed(2));
    const totalValue = Math.round(totalCredits * avgPrice);
    return { annualCredits, totalCredits, avgPrice, totalValue, methodology: meth };
  }, [calcMeth, calcArea, calcPeriod]);

  const marketOverview = useMemo(() => {
    const byRegistry = REGISTRIES.map((r, i) => ({
      name: r,
      projects: PROJECTS.filter(p => p.registry === r).length,
      volume: PROJECTS.filter(p => p.registry === r).reduce((s, p) => s + p.creditsIssued, 0),
      avgPrice: parseFloat((sr(i * 53) * 25 + 5).toFixed(2))
    }));
    const vintageVolume = Array.from({ length: 7 }, (_, i) => {
      const yr = 2018 + i;
      const yp = PROJECTS.filter(p => p.vintage === yr);
      return { year: String(yr), issued: yp.reduce((s, p) => s + p.creditsIssued, 0), retired: yp.reduce((s, p) => s + p.creditsRetired, 0) };
    });
    return { byRegistry, vintageVolume };
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Carbon Credit Engine Hub</h1>
          <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.mono, marginTop: 4 }}>EP-BW1 | Unified credit intelligence across 7 project families, 20 methodologies, 40 projects</div>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'Executive Dashboard' && (
          <>
            <Row>
              <KpiCard label="TOTAL CREDITS ISSUED" value={(totals.issued / 1e6).toFixed(2) + 'M'} sub="Across all projects" accent={T.gold} />
              <KpiCard label="CREDITS RETIRED" value={(totals.retired / 1e6).toFixed(2) + 'M'} sub={((totals.retired / totals.issued) * 100).toFixed(1) + '% retirement rate'} />
              <KpiCard label="CREDITS AVAILABLE" value={(totals.available / 1e6).toFixed(2) + 'M'} sub="Active on registries" />
              <KpiCard label="PIPELINE PROJECTS" value={totals.pipeline} sub="Under development" />
            </Row>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 20 }}>
              <Section title="Credits by Project Family">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={familyChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} style={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} style={{ fontSize: 11 }} />
                    <Tooltip formatter={v => (v / 1e6).toFixed(3) + 'M tCO2e'} />
                    <Legend />
                    <Bar dataKey="issued" name="Issued" stackId="a" fill="#059669" />
                    <Bar dataKey="retired" name="Retired" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="available" name="Available" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </Section>

              <Section title="Geographic Distribution">
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie data={geoChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                      {geoChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => (v / 1e6).toFixed(3) + 'M tCO2e'} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>
            </div>

            <Section title="Recent Activity">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Date', 'Project', 'Action', 'Family', 'Credits', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((a, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, fontSize: 12 }}>{a.date}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{a.name}</td>
                        <td style={{ padding: '8px 10px' }}><Badge label={a.action} color={a.action === 'Issuance' ? 'green' : a.action === 'Retirement' ? 'blue' : a.action === 'Verification' ? 'purple' : 'orange'} /></td>
                        <td style={{ padding: '8px 10px', fontSize: 12 }}>{a.family}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{(a.creditsIssued / 1000).toFixed(0)}k</td>
                        <td style={{ padding: '8px 10px' }}><Badge label={a.status} color={a.status === 'Verified' ? 'green' : a.status === 'Issuing' ? 'teal' : a.status === 'Validation' ? 'yellow' : 'gray'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {tab === 'Project Pipeline' && (
          <Section title="All Projects (40)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['ID', 'Project', 'Family', 'Cluster', 'Region', 'Methodology', 'Status', 'Vintage', 'Credits Issued', 'Price/t', 'Co-Benefits'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROJECTS.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{p.id}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                      <td style={{ padding: '6px 8px' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: FAMILY_COLORS[p.family] || T.sage, marginRight: 4 }} />{p.family.split('-')[0]}</td>
                      <td style={{ padding: '6px 8px', fontSize: 11 }}>{p.cluster}</td>
                      <td style={{ padding: '6px 8px', fontSize: 11 }}>{p.region}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono, fontSize: 11 }}>{p.methodology}</td>
                      <td style={{ padding: '6px 8px' }}><Badge label={p.status} color={p.status === 'Verified' ? 'green' : p.status === 'Issuing' ? 'teal' : p.status === 'Validation' ? 'yellow' : 'gray'} /></td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{p.vintage}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{(p.creditsIssued / 1000).toFixed(0)}k</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>${p.pricePerCredit.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{p.coBenefits}/6</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === 'Family Navigator' && (
          <Section title="Project Families">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320, 1fr))', gap: 16 }}>
              {familyNav.map(f => (
                <div key={f.family} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, background: T.surface, borderLeft: `4px solid ${FAMILY_COLORS[f.family] || T.sage}` }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{f.family}</div>
                  <Row>
                    <div>
                      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>PROJECTS</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{f.count}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>VOLUME</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.navy }}>{(f.volume / 1e6).toFixed(2)}M</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>AVG $/t</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>${f.avgPrice}</div>
                    </div>
                  </Row>
                  <div style={{ marginTop: 12, fontSize: 12, color: T.textSec }}>
                    Clusters: {[...new Set(PROJECTS.filter(p => p.family === f.family).map(p => p.cluster))].join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tab === 'Methodology Library' && (
          <Section title="Methodology Catalog (20 Entries)">
            <Inp label="Search methodologies" value={searchLib} onChange={setSearchLib} type="text" />
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Code', 'Methodology Name', 'Family', 'Cluster', 'Registry', 'Complexity'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMethods.map((m, i) => (
                    <tr key={m.code} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding: '8px 10px', fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{m.code}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{m.name}</td>
                      <td style={{ padding: '8px 10px' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: FAMILY_COLORS[m.family] || T.sage, marginRight: 4 }} />{m.family}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11 }}>{m.cluster}</td>
                      <td style={{ padding: '8px 10px' }}><Badge label={m.registry} color={m.registry === 'Verra' ? 'green' : m.registry === 'Gold Standard' ? 'yellow' : m.registry === 'Puro.earth' ? 'blue' : m.registry === 'Isometric' ? 'purple' : 'orange'} /></td>
                      <td style={{ padding: '8px 10px' }}><Badge label={m.complexity} color={m.complexity === 'Low' ? 'green' : m.complexity === 'Medium' ? 'yellow' : m.complexity === 'High' ? 'orange' : 'red'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {tab === 'Credit Market Overview' && (
          <>
            <Section title="Registry Volume & Pricing">
              <Row>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={marketOverview.byRegistry}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" style={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} style={{ fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => n === 'avgPrice' ? '$' + v.toFixed(2) : (v / 1e6).toFixed(3) + 'M'} />
                    <Legend />
                    <Bar dataKey="volume" name="Volume (tCO2e)" fill={T.sage} />
                  </BarChart>
                </ResponsiveContainer>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8 }}>Registry Stats</div>
                  {marketOverview.byRegistry.map(r => (
                    <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      <span style={{ fontFamily: T.mono }}>{r.projects} proj | ${r.avgPrice}</span>
                    </div>
                  ))}
                </div>
              </Row>
            </Section>
            <Section title="Vintage Volume Trend">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={marketOverview.vintageVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" style={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} style={{ fontSize: 11 }} />
                  <Tooltip formatter={v => (v / 1e6).toFixed(3) + 'M tCO2e'} />
                  <Legend />
                  <Bar dataKey="issued" name="Issued" fill="#059669" />
                  <Bar dataKey="retired" name="Retired" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </>
        )}

        {tab === 'Quick Calculator' && (
          <Section title="Credit Estimation Calculator">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <Sel label="Project Family" value={calcFamily} onChange={v => { setCalcFamily(v); setCalcCluster(''); setCalcMeth(''); }} options={FAMILIES.map(f => ({ value: f, label: f }))} />
                <Sel label="Cluster" value={calcCluster} onChange={v => { setCalcCluster(v); setCalcMeth(''); }} options={[{ value: '', label: 'All Clusters' }, ...calcClusters.map(c => ({ value: c, label: c }))]} />
                <Sel label="Methodology" value={calcMeth} onChange={setCalcMeth} options={[{ value: '', label: 'Select methodology...' }, ...calcMeths.map(m => ({ value: m.code, label: `${m.code} - ${m.name}` }))]} />
                <DualInput label="Project Area (hectares)" value={calcArea} onChange={setCalcArea} min={1} max={50000} step={10} />
                <DualInput label="Crediting Period (years)" value={calcPeriod} onChange={setCalcPeriod} min={1} max={30} step={1} />
              </div>
              <div>
                {calcResult ? (
                  <div style={{ border: `2px solid ${T.gold}`, borderRadius: 10, padding: 24, background: T.surface }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Estimated Output</div>
                    <Row>
                      <KpiCard label="ANNUAL CREDITS" value={calcResult.annualCredits.toLocaleString()} sub="tCO2e / year" accent={T.gold} />
                      <KpiCard label="TOTAL CREDITS" value={calcResult.totalCredits.toLocaleString()} sub={`Over ${calcPeriod} years`} accent={T.gold} />
                    </Row>
                    <div style={{ marginTop: 12 }}>
                      <Row>
                        <KpiCard label="AVG PRICE" value={'$' + calcResult.avgPrice.toFixed(2)} sub="per tCO2e" />
                        <KpiCard label="EST. TOTAL VALUE" value={'$' + (calcResult.totalValue / 1e6).toFixed(2) + 'M'} sub="Gross revenue est." />
                      </Row>
                    </div>
                    <div style={{ marginTop: 16, padding: 12, background: T.surfaceH, borderRadius: 6, fontSize: 12, color: T.textSec }}>
                      <strong>Methodology:</strong> {calcResult.methodology.code} - {calcResult.methodology.name}<br />
                      <strong>Complexity:</strong> {calcResult.methodology.complexity} | <strong>Registry:</strong> {calcResult.methodology.registry}
                    </div>
                  </div>
                ) : (
                  <div style={{ border: `1px dashed ${T.border}`, borderRadius: 10, padding: 40, textAlign: 'center', color: T.textMut }}>
                    Select a methodology to see credit estimates
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}
