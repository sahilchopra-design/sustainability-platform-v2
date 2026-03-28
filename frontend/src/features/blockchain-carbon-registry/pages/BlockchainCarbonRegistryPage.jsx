import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS = ['Registry Explorer', 'Tokenization Analytics', 'Integrity & Double-Counting', 'Portfolio Carbon Credit Manager'];
const PIE_COLORS = [T.navy, T.sage, T.gold, T.navyL, T.amber, T.green, T.red, '#8b5cf6', '#06b6d4', '#ec4899'];

const REGISTRIES = ['Verra VCS', 'Gold Standard', 'ACR', 'CAR'];
const PROJECT_TYPES = ['REDD+', 'Renewable Energy', 'Cookstove', 'Afforestation', 'Methane Capture', 'Blue Carbon', 'Soil Carbon', 'Industrial Gas'];
const STATUSES = ['Active', 'Retired', 'Cancelled'];
const COUNTRIES = ['Brazil', 'India', 'Indonesia', 'Kenya', 'Colombia', 'Vietnam', 'Peru', 'China', 'Mexico', 'DR Congo', 'Thailand', 'Guatemala', 'Uganda', 'Nepal', 'Cambodia'];
const PROJECT_NAMES_PREFIX = ['Amazon', 'Sundarbans', 'Cerrado', 'Mekong', 'Andes', 'Congo Basin', 'Sahel', 'Borneo', 'Sumatra', 'Kerala', 'Oaxaca', 'Chitwan', 'Virunga', 'Tonle Sap', 'Madre de Dios', 'Pacaya', 'Alto Mayo', 'Kariba', 'Mai Ndombe', 'Cordillera'];
const PROJECT_NAMES_SUFFIX = ['Forest Protection', 'Reforestation', 'Clean Cook Initiative', 'Wind Farm', 'Solar Array', 'Mangrove Restoration', 'Biogas Capture', 'Soil Regeneration', 'Methane Recovery', 'Tidal Wetland'];

/* ── Utility Components ── */
const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', borderLeft: `4px solid ${color || T.navy}` }}>
    <div style={{ fontSize: 12, color: T.textMut, fontFamily: T.font, letterSpacing: 0.3, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2, fontFamily: T.font }}>{sub}</div>}
  </div>
);
const Row = ({ children, cols, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: cols || `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Section = ({ title, children, right }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{title}</div>
      {right}
    </div>
    {children}
  </div>
);
const Badge = ({ label, color }) => {
  const map = { green: { bg: '#dcfce7', text: '#166534' }, red: { bg: '#fee2e2', text: '#991b1b' }, amber: { bg: '#fef3c7', text: '#92400e' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: T.surfaceH, text: T.textSec }, purple: { bg: '#ede9fe', text: '#5b21b6' }, navy: { bg: '#e0e7ef', text: T.navy } };
  const c = map[color] || map.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, fontFamily: T.font }}>{label}</span>;
};
const Btn = ({ children, onClick, variant = 'primary', disabled, small }) => {
  const styles = {
    primary: { bg: T.navy, color: '#fff' }, secondary: { bg: T.surfaceH, color: T.navy },
    gold: { bg: T.gold, color: '#fff' }, danger: { bg: T.red, color: '#fff' },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '5px 12px' : '8px 18px', borderRadius: 6, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? T.border : s.bg, color: disabled ? T.textMut : s.color, fontWeight: 600, fontSize: small ? 12 : 13,
      fontFamily: T.font, opacity: disabled ? 0.6 : 1, transition: 'all 0.15s',
    }}>{children}</button>
  );
};
const Sel = ({ label, value, onChange, options }) => (
  <div>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 4, fontFamily: T.font }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '7px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13,
      background: T.surface, color: T.text, fontFamily: T.font, minWidth: 130,
    }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);
const Th = ({ children, w }) => (
  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMut,
    borderBottom: `2px solid ${T.border}`, fontFamily: T.font, letterSpacing: 0.5, width: w, textTransform: 'uppercase' }}>{children}</th>
);
const Td = ({ children, mono, color, bold }) => (
  <td style={{ padding: '9px 12px', fontSize: 13, color: color || T.text, fontFamily: mono ? T.mono : T.font,
    borderBottom: `1px solid ${T.border}`, fontWeight: bold ? 600 : 400 }}>{children}</td>
);
const Hash = ({ val }) => (
  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.navyL, background: T.surfaceH, padding: '2px 6px', borderRadius: 4 }}>
    {val}
  </span>
);
const ProgressBar = ({ value, max = 100, color }) => (
  <div style={{ background: T.surfaceH, borderRadius: 6, height: 8, width: '100%' }}>
    <div style={{ background: color || T.sage, borderRadius: 6, height: 8, width: `${Math.min((value / max) * 100, 100)}%`, transition: 'width 0.4s' }} />
  </div>
);

/* ── Data Generation ── */
const genHash = (i) => {
  const chars = '0123456789abcdef';
  let h = '0x';
  for (let j = 0; j < 12; j++) h += chars[Math.floor(sr(i * 17 + j * 3) * 16)];
  return h + '...';
};

const genCredits = () => {
  const credits = [];
  for (let i = 0; i < 200; i++) {
    const reg = REGISTRIES[Math.floor(sr(i * 3) * 4)];
    const typ = PROJECT_TYPES[Math.floor(sr(i * 5) * 8)];
    const pfx = PROJECT_NAMES_PREFIX[Math.floor(sr(i * 7) * PROJECT_NAMES_PREFIX.length)];
    const sfx = PROJECT_NAMES_SUFFIX[Math.floor(sr(i * 11) * PROJECT_NAMES_SUFFIX.length)];
    const vintage = 2018 + Math.floor(sr(i * 13) * 7);
    const volume = Math.round(sr(i * 17) * 95000 + 5000);
    const price = parseFloat((sr(i * 19) * 25 + 2).toFixed(2));
    const sIdx = sr(i * 23);
    const status = sIdx < 0.55 ? 'Active' : sIdx < 0.85 ? 'Retired' : 'Cancelled';
    const country = COUNTRIES[Math.floor(sr(i * 29) * COUNTRIES.length)];
    credits.push({
      id: `VCC-${String(1000 + i).padStart(5, '0')}`,
      name: `${pfx} ${sfx}`,
      registry: reg, type: typ, vintage, volume, price, status, country,
      hash: genHash(i),
      additionality: Math.round(sr(i * 31) * 40 + 60),
      permanence: Math.round(sr(i * 37) * 35 + 65),
      coBenefits: Math.round(sr(i * 41) * 30 + 70),
      retiredDate: status === 'Retired' ? `2024-${String(Math.floor(sr(i * 43) * 12) + 1).padStart(2, '0')}-${String(Math.floor(sr(i * 47) * 28) + 1).padStart(2, '0')}` : null,
      retiredBy: status === 'Retired' ? ['Shell plc', 'TotalEnergies', 'BP', 'Microsoft', 'Delta Air Lines', 'JetBlue', 'Nestle'][Math.floor(sr(i * 53) * 7)] : null,
      issuanceDate: `${vintage}-${String(Math.floor(sr(i * 59) * 12) + 1).padStart(2, '0')}-${String(Math.floor(sr(i * 61) * 28) + 1).padStart(2, '0')}`,
      serialStart: `${reg.replace(/\s/g, '')}-${vintage}-${String(Math.floor(sr(i * 67) * 9000000 + 1000000))}`,
    });
  }
  return credits;
};

const genTokenData = () => {
  const tokens = [
    { name: 'Toucan BCT', symbol: 'BCT', chain: 'Polygon', price: 1.42, supply: 18200000, bridged: 16800000, backed: 'Verra VCS' },
    { name: 'Moss MCO2', symbol: 'MCO2', chain: 'Ethereum', price: 2.18, supply: 4500000, bridged: 4100000, backed: 'Verra VCS' },
    { name: 'C3 Carbon Token', symbol: 'C3T', chain: 'Celo', price: 0.87, supply: 7600000, bridged: 6900000, backed: 'Gold Standard' },
    { name: 'Toucan NCT', symbol: 'NCT', chain: 'Polygon', price: 3.24, supply: 2800000, bridged: 2500000, backed: 'Verra VCS' },
    { name: 'Flowcarbon GNT', symbol: 'GNT', chain: 'Ethereum', price: 1.95, supply: 3200000, bridged: 2900000, backed: 'ACR' },
    { name: 'KlimaDAO KLIMA', symbol: 'KLIMA', chain: 'Polygon', price: 0.54, supply: 12000000, bridged: 11200000, backed: 'Multi-Registry' },
  ];
  const volumeTrend = [];
  for (let m = 0; m < 24; m++) {
    volumeTrend.push({
      month: `${2023 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}`,
      bct: Math.round(sr(m * 3 + 100) * 800000 + 400000),
      mco2: Math.round(sr(m * 5 + 100) * 300000 + 150000),
      c3t: Math.round(sr(m * 7 + 100) * 500000 + 200000),
      nct: Math.round(sr(m * 11 + 100) * 200000 + 100000),
    });
  }
  const qualityDist = PROJECT_TYPES.map((t, i) => ({
    name: t, tokenized: Math.round(sr(i * 13 + 200) * 2000000 + 500000),
    offChain: Math.round(sr(i * 17 + 200) * 5000000 + 1000000),
  }));
  const priceSpread = tokens.map(tk => ({
    name: tk.symbol,
    tokenPrice: tk.price,
    offsetPrice: parseFloat((tk.price * (1 + sr(tokens.indexOf(tk) * 19 + 300) * 0.4 - 0.1)).toFixed(2)),
    spread: parseFloat(((sr(tokens.indexOf(tk) * 23 + 300) * 0.5 - 0.15) * 100).toFixed(1)),
  }));
  return { tokens, volumeTrend, qualityDist, priceSpread };
};

const genFlaggedCredits = () => {
  const flags = [];
  const reasons = [
    'Duplicate serial detected across Verra & ACR', 'Same project registered in two registries',
    'Retired credit re-issued under different ID', 'Missing corresponding adjustment (Article 6)',
    'Vintage mismatch between on-chain and registry', 'Double retirement detected across bridges',
    'Project boundary overlap with adjacent credit', 'Additionality baseline outdated (>5 years)',
    'Methodology version mismatch', 'Host country NDC overlap without adjustment',
    'Cross-border leakage not accounted', 'Buffer pool insufficient for permanence risk',
    'Third-party audit expired', 'Crediting period extended without re-validation',
    'Token bridged but registry status unchanged',
  ];
  for (let i = 0; i < 15; i++) {
    const sev = sr(i * 3 + 400) < 0.33 ? 'Critical' : sr(i * 3 + 400) < 0.66 ? 'High' : 'Medium';
    flags.push({
      id: `FLAG-${String(i + 1).padStart(3, '0')}`,
      creditId: `VCC-${String(1000 + Math.floor(sr(i * 7 + 400) * 200)).padStart(5, '0')}`,
      reason: reasons[i],
      severity: sev,
      registry1: REGISTRIES[Math.floor(sr(i * 11 + 400) * 4)],
      registry2: REGISTRIES[Math.floor(sr(i * 13 + 400) * 4)],
      detectedDate: `2025-${String(Math.floor(sr(i * 17 + 400) * 3) + 1).padStart(2, '0')}-${String(Math.floor(sr(i * 19 + 400) * 28) + 1).padStart(2, '0')}`,
      status: sr(i * 23 + 400) < 0.4 ? 'Investigating' : sr(i * 23 + 400) < 0.7 ? 'Confirmed' : 'Resolved',
      evidence: `On-chain TX ${genHash(i + 500)} conflicts with registry serial ${REGISTRIES[Math.floor(sr(i * 29 + 400) * 4)].replace(/\s/g, '')}-${2020 + Math.floor(sr(i * 31 + 400) * 5)}-${Math.floor(sr(i * 37 + 400) * 9000000 + 1000000)}`,
    });
  }
  return flags;
};

const genPortfolioHoldings = () => {
  const holdings = [];
  for (let i = 0; i < 30; i++) {
    const reg = REGISTRIES[Math.floor(sr(i * 3 + 600) * 4)];
    const typ = PROJECT_TYPES[Math.floor(sr(i * 5 + 600) * 8)];
    const pfx = PROJECT_NAMES_PREFIX[Math.floor(sr(i * 7 + 600) * PROJECT_NAMES_PREFIX.length)];
    const vintage = 2019 + Math.floor(sr(i * 11 + 600) * 6);
    const volume = Math.round(sr(i * 13 + 600) * 18000 + 2000);
    const costBasis = parseFloat((sr(i * 17 + 600) * 15 + 3).toFixed(2));
    const currentPrice = parseFloat((costBasis * (1 + sr(i * 19 + 600) * 0.6 - 0.2)).toFixed(2));
    const addScore = Math.round(sr(i * 23 + 600) * 35 + 65);
    const permScore = Math.round(sr(i * 29 + 600) * 30 + 70);
    const cobenScore = Math.round(sr(i * 31 + 600) * 25 + 75);
    const qualScore = Math.round((addScore * 0.4 + permScore * 0.35 + cobenScore * 0.25));
    const country = COUNTRIES[Math.floor(sr(i * 37 + 600) * COUNTRIES.length)];
    const scheduledRetire = sr(i * 41 + 600) < 0.35 ? `2025-Q${Math.floor(sr(i * 43 + 600) * 4) + 1}` : null;
    holdings.push({
      id: `PH-${String(i + 1).padStart(3, '0')}`,
      name: `${pfx} ${PROJECT_NAMES_SUFFIX[Math.floor(sr(i * 47 + 600) * PROJECT_NAMES_SUFFIX.length)]}`,
      registry: reg, type: typ, vintage, volume, costBasis, currentPrice, country,
      additionality: addScore, permanence: permScore, coBenefits: cobenScore, quality: qualScore,
      scheduledRetire,
      unrealizedPL: parseFloat(((currentPrice - costBasis) * volume).toFixed(0)),
    });
  }
  return holdings;
};

/* ── Registry Stats ── */
const REGISTRY_STATS = REGISTRIES.map((r, i) => ({
  name: r,
  totalCredits: Math.round(sr(i * 3 + 800) * 800 + 200) * 1000000,
  activeProjects: Math.round(sr(i * 5 + 800) * 3000 + 500),
  retired: Math.round(sr(i * 7 + 800) * 500 + 100) * 1000000,
  avgPrice: parseFloat((sr(i * 11 + 800) * 18 + 4).toFixed(2)),
  integrityScore: Math.round(sr(i * 13 + 800) * 20 + 75),
  methodologies: Math.round(sr(i * 17 + 800) * 40 + 15),
}));

/* ── Main Component ── */
export default function BlockchainCarbonRegistryPage() {
  const [tab, setTab] = useState(0);
  const [filterReg, setFilterReg] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterVintage, setFilterVintage] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [retireModal, setRetireModal] = useState(null);
  const [page, setPage] = useState(0);

  const allCredits = useMemo(() => genCredits(), []);
  const tokenData = useMemo(() => genTokenData(), []);
  const flaggedCredits = useMemo(() => genFlaggedCredits(), []);
  const portfolio = useMemo(() => genPortfolioHoldings(), []);

  const filtered = useMemo(() => {
    return allCredits.filter(c =>
      (filterReg === 'All' || c.registry === filterReg) &&
      (filterType === 'All' || c.type === filterType) &&
      (filterVintage === 'All' || String(c.vintage) === filterVintage) &&
      (filterStatus === 'All' || c.status === filterStatus)
    );
  }, [allCredits, filterReg, filterType, filterVintage, filterStatus]);

  const pageSize = 20;
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const statusColor = (s) => s === 'Active' ? 'green' : s === 'Retired' ? 'blue' : 'red';
  const sevColor = (s) => s === 'Critical' ? 'red' : s === 'High' ? 'amber' : 'navy';
  const fmtN = (n) => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(n);
  const fmtUSD = (n) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleScan = () => {
    setScanRunning(true);
    setScanComplete(false);
    setTimeout(() => { setScanRunning(false); setScanComplete(true); }, 2800);
  };

  const handleExportCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Tab 1: Registry Explorer ── */
  const renderRegistryExplorer = () => (
    <div>
      <Section title="Registry Overview">
        <Row cols="repeat(4,1fr)">
          {REGISTRY_STATS.map((r, i) => (
            <div key={r.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, borderTop: `3px solid ${[T.navy, T.gold, T.sage, T.navyL][i]}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10, fontFamily: T.font }}>{r.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Total Credits</div><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fmtN(r.totalCredits)}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Active Projects</div><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{r.activeProjects.toLocaleString()}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Retired</div><div style={{ fontSize: 15, fontWeight: 700, color: T.sage }}>{fmtN(r.retired)}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Avg Price</div><div style={{ fontSize: 15, fontWeight: 700, color: T.gold }}>{fmtUSD(r.avgPrice)}</div></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 3 }}>
                  <span>Integrity Score</span><span style={{ fontWeight: 700 }}>{r.integrityScore}/100</span>
                </div>
                <ProgressBar value={r.integrityScore} color={r.integrityScore >= 85 ? T.green : r.integrityScore >= 70 ? T.amber : T.red} />
              </div>
              <div style={{ fontSize: 11, color: T.textMut, marginTop: 6 }}>{r.methodologies} methodologies</div>
            </div>
          ))}
        </Row>
      </Section>

      <Section title={`Carbon Credits Registry (${filtered.length} credits)`} right={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Sel value={filterReg} onChange={v => { setFilterReg(v); setPage(0); }} options={['All', ...REGISTRIES]} />
          <Sel value={filterType} onChange={v => { setFilterType(v); setPage(0); }} options={['All', ...PROJECT_TYPES]} />
          <Sel value={filterVintage} onChange={v => { setFilterVintage(v); setPage(0); }} options={['All', '2018', '2019', '2020', '2021', '2022', '2023', '2024']} />
          <Sel value={filterStatus} onChange={v => { setFilterStatus(v); setPage(0); }} options={['All', ...STATUSES]} />
        </div>
      }>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <Th>ID</Th><Th>Project</Th><Th>Registry</Th><Th>Type</Th><Th>Vintage</Th>
              <Th>Volume (tCO2e)</Th><Th>Price</Th><Th>Status</Th><Th>Blockchain Hash</Th>
            </tr></thead>
            <tbody>
              {paged.map(c => (
                <tr key={c.id} onClick={() => setSelectedCredit(c)} style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Td mono bold>{c.id}</Td>
                  <Td bold>{c.name}</Td>
                  <Td><Badge label={c.registry} color="navy" /></Td>
                  <Td>{c.type}</Td>
                  <Td mono>{c.vintage}</Td>
                  <Td mono>{c.volume.toLocaleString()}</Td>
                  <Td mono color={T.gold}>{fmtUSD(c.price)}</Td>
                  <Td><Badge label={c.status} color={statusColor(c.status)} /></Td>
                  <Td><Hash val={c.hash} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: T.textMut }}>Page {page + 1} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn small variant="secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</Btn>
            <Btn small variant="secondary" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Btn>
          </div>
        </div>
      </Section>

      {/* Credit Detail Modal */}
      {selectedCredit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,58,92,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedCredit(null)}>
          <div style={{ background: T.surface, borderRadius: 14, padding: 28, maxWidth: 680, width: '95%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(27,58,92,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: T.font }}>{selectedCredit.name}</div>
                <div style={{ fontSize: 13, color: T.textSec, marginTop: 2 }}>{selectedCredit.id} | {selectedCredit.country}</div>
              </div>
              <Btn small variant="secondary" onClick={() => setSelectedCredit(null)}>Close</Btn>
            </div>
            <Row cols="1fr 1fr 1fr" gap={10}>
              <Kpi label="Registry" value={selectedCredit.registry} color={T.navy} />
              <Kpi label="Vintage" value={selectedCredit.vintage} color={T.gold} />
              <Kpi label="Status" value={selectedCredit.status} color={selectedCredit.status === 'Active' ? T.green : T.red} />
            </Row>
            <div style={{ height: 12 }} />
            <Row cols="1fr 1fr 1fr" gap={10}>
              <Kpi label="Volume" value={`${selectedCredit.volume.toLocaleString()} tCO2e`} color={T.sage} />
              <Kpi label="Price" value={fmtUSD(selectedCredit.price)} color={T.gold} />
              <Kpi label="Type" value={selectedCredit.type} color={T.navyL} />
            </Row>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Quality Assessment</div>
              <Row cols="1fr 1fr 1fr" gap={10}>
                {[{ l: 'Additionality', v: selectedCredit.additionality }, { l: 'Permanence', v: selectedCredit.permanence }, { l: 'Co-Benefits', v: selectedCredit.coBenefits }].map(q => (
                  <div key={q.l} style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4 }}>{q.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: q.v >= 80 ? T.green : q.v >= 60 ? T.amber : T.red }}>{q.v}/100</div>
                    <ProgressBar value={q.v} color={q.v >= 80 ? T.green : q.v >= 60 ? T.amber : T.red} />
                  </div>
                ))}
              </Row>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Provenance Chain</div>
              <div style={{ background: T.surfaceH, borderRadius: 8, padding: 14 }}>
                {[
                  { step: 'Project Registration', date: `${selectedCredit.vintage}-01-15`, detail: `Registered with ${selectedCredit.registry}` },
                  { step: 'Verification', date: `${selectedCredit.vintage}-04-20`, detail: 'Third-party verification complete (VVB: SCS Global)' },
                  { step: 'Issuance', date: selectedCredit.issuanceDate, detail: `Serial: ${selectedCredit.serialStart}` },
                  { step: 'On-Chain Bridging', date: `${selectedCredit.vintage + 1}-02-10`, detail: `TX: ${selectedCredit.hash}` },
                  ...(selectedCredit.status === 'Retired' ? [{ step: 'Retirement', date: selectedCredit.retiredDate, detail: `Retired by ${selectedCredit.retiredBy}` }] : []),
                ].map((ev, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: idx < 4 ? 10 : 0, alignItems: 'flex-start' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: T.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{ev.step}</div>
                      <div style={{ fontSize: 12, color: T.textSec }}>{ev.date} -- {ev.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Retirement History</div>
              {selectedCredit.status === 'Retired' ? (
                <div style={{ background: T.surfaceH, borderRadius: 8, padding: 14 }}>
                  <Row cols="1fr 1fr" gap={10}>
                    <div><div style={{ fontSize: 11, color: T.textMut }}>Retired By</div><div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{selectedCredit.retiredBy}</div></div>
                    <div><div style={{ fontSize: 11, color: T.textMut }}>Retirement Date</div><div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{selectedCredit.retiredDate}</div></div>
                  </Row>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>Retirement Purpose</div>
                    <div style={{ fontSize: 13, color: T.text }}>Voluntary carbon offset -- Scope 1 & 2 emissions compensation</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>On-Chain Retirement TX</div>
                    <Hash val={genHash(allCredits.indexOf(selectedCredit) + 300)} />
                  </div>
                </div>
              ) : (
                <div style={{ background: T.surfaceH, borderRadius: 8, padding: 14, fontSize: 13, color: T.textMut, textAlign: 'center' }}>
                  This credit has not been retired. Status: <Badge label={selectedCredit.status} color={statusColor(selectedCredit.status)} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Methodology & Verification</div>
              <div style={{ background: T.surfaceH, borderRadius: 8, padding: 14 }}>
                <Row cols="1fr 1fr" gap={10}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMut }}>Methodology</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                      {selectedCredit.type === 'REDD+' ? 'VM0015 v1.1' : selectedCredit.type === 'Renewable Energy' ? 'AMS-I.D v18' : selectedCredit.type === 'Cookstove' ? 'AMS-II.G v7' : selectedCredit.type === 'Afforestation' ? 'AR-ACM0003 v2' : 'CDM-EB65 Annex 13'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMut }}>Verification Body</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                      {['SCS Global Services', 'RINA S.p.A.', 'Bureau Veritas', 'TUV SUD'][Math.floor(sr(allCredits.indexOf(selectedCredit) * 71 + 200) * 4)]}
                    </div>
                  </div>
                </Row>
                <Row cols="1fr 1fr" gap={10}>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>Crediting Period</div>
                    <div style={{ fontSize: 13, color: T.text }}>{selectedCredit.vintage} -- {selectedCredit.vintage + 10}</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: T.textMut }}>Buffer Pool Contribution</div>
                    <div style={{ fontSize: 13, color: T.text }}>{Math.round(sr(allCredits.indexOf(selectedCredit) * 73 + 200) * 15 + 10)}%</div>
                  </div>
                </Row>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ── Tab 2: Tokenization Analytics ── */
  const renderTokenization = () => (
    <div>
      <Section title="On-Chain Carbon Tokens">
        <Row cols="repeat(3,1fr)">
          {tokenData.tokens.map((tk, i) => (
            <div key={tk.symbol} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, borderLeft: `4px solid ${PIE_COLORS[i % PIE_COLORS.length]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{tk.name}</div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{tk.chain} | Backed by {tk.backed}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.gold }}>{fmtUSD(tk.price)}</div>
              </div>
              <Row cols="1fr 1fr" gap={6}>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Supply</div><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{fmtN(tk.supply)}</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Bridged</div><div style={{ fontSize: 13, fontWeight: 600, color: T.sage }}>{fmtN(tk.bridged)}</div></div>
              </Row>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: T.textMut, marginBottom: 3 }}>Bridge Reconciliation</div>
                <ProgressBar value={tk.bridged} max={tk.supply} color={T.sage} />
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{((tk.bridged / tk.supply) * 100).toFixed(1)}% reconciled</div>
              </div>
            </div>
          ))}
        </Row>
      </Section>

      <Section title="Token Price vs Offset Price Spread">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tokenData.priceSpread} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
              <Bar dataKey="tokenPrice" name="Token Price ($)" fill={T.navy} radius={[4, 4, 0, 0]} />
              <Bar dataKey="offsetPrice" name="Offset Price ($)" fill={T.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Row cols="1fr 1fr">
        <Section title="Tokenization Volume Trend (24M)">
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={tokenData.volumeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => fmtN(v)} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} formatter={v => fmtN(v)} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                <Area type="monotone" dataKey="bct" name="BCT" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
                <Area type="monotone" dataKey="mco2" name="MCO2" stackId="1" stroke={T.gold} fill={T.gold} fillOpacity={0.3} />
                <Area type="monotone" dataKey="c3t" name="C3T" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.3} />
                <Area type="monotone" dataKey="nct" name="NCT" stackId="1" stroke={T.navyL} fill={T.navyL} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Token Quality by Project Type">
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={tokenData.qualityDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => fmtN(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} formatter={v => fmtN(v)} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.font }} />
                <Bar dataKey="tokenized" name="Tokenized" fill={T.navy} radius={[0, 4, 4, 0]} />
                <Bar dataKey="offChain" name="Off-Chain" fill={T.goldL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </Row>

      <Section title="Fractionalization & Liquidity">
        <Row cols="repeat(4,1fr)">
          <Kpi label="Total Tokenized Volume" value={fmtN(tokenData.tokens.reduce((a, t) => a + t.supply, 0))} sub="tCO2e equivalent" color={T.navy} />
          <Kpi label="24h Trading Volume" value="$4.2M" sub="+12.3% vs 7d avg" color={T.gold} />
          <Kpi label="Avg Fractionalization" value="0.001 tCO2e" sub="Min tradeable unit" color={T.sage} />
          <Kpi label="Liquidity Pool TVL" value="$28.7M" sub="Across 14 pools" color={T.navyL} />
        </Row>
        <div style={{ marginTop: 14, background: T.surfaceH, borderRadius: 8, padding: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <Th>Token</Th><Th>DEX Pool</Th><Th>TVL</Th><Th>24h Vol</Th><Th>Spread</Th><Th>Bridge Status</Th>
            </tr></thead>
            <tbody>
              {tokenData.tokens.map((tk, i) => (
                <tr key={tk.symbol}>
                  <Td bold>{tk.symbol}</Td>
                  <Td>SushiSwap / Uniswap V3</Td>
                  <Td mono>{fmtUSD(Math.round(sr(i * 3 + 900) * 8000000 + 1000000))}</Td>
                  <Td mono>{fmtUSD(Math.round(sr(i * 5 + 900) * 1200000 + 200000))}</Td>
                  <Td mono color={T.amber}>{(sr(i * 7 + 900) * 3 + 0.1).toFixed(2)}%</Td>
                  <Td><Badge label={sr(i * 11 + 900) > 0.3 ? 'Synced' : 'Pending'} color={sr(i * 11 + 900) > 0.3 ? 'green' : 'amber'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Token Price History (24 Months)">
        <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tokenPriceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textSec }} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} formatter={v => `$${v}`} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
              <Line type="monotone" dataKey="BCT" stroke={T.navy} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="MCO2" stroke={T.gold} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="C3T" stroke={T.sage} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="NCT" stroke={T.navyL} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Market Depth & On-Chain Metrics">
        <Row cols="repeat(3,1fr)">
          {[
            { label: 'Total On-Chain Supply', value: fmtN(tokenData.tokens.reduce((a, t) => a + t.supply, 0)), sub: 'Across all tokens', icon: 'Supply', color: T.navy },
            { label: 'Unique Wallet Holders', value: '14,832', sub: '+8.2% MoM', icon: 'Holders', color: T.sage },
            { label: 'Smart Contract TVL', value: '$42.6M', sub: '18 verified contracts', icon: 'TVL', color: T.gold },
          ].map(m => (
            <div key={m.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </Row>
        <div style={{ marginTop: 14 }}>
          <Row cols="1fr 1fr">
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Bridge Activity (Last 30 Days)</div>
              {[
                { bridge: 'Toucan Protocol', direction: 'Off-chain to On-chain', vol: '2.4M tCO2e', txCount: 1847, status: 'Active' },
                { bridge: 'Moss.Earth', direction: 'Off-chain to On-chain', vol: '890K tCO2e', txCount: 423, status: 'Active' },
                { bridge: 'C3 Finance', direction: 'Bidirectional', vol: '1.1M tCO2e', txCount: 678, status: 'Active' },
                { bridge: 'Flowcarbon', direction: 'Off-chain to On-chain', vol: '540K tCO2e', txCount: 312, status: 'Paused' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{b.bridge}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{b.direction} | {b.txCount} TXs</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{b.vol}</div>
                    <Badge label={b.status} color={b.status === 'Active' ? 'green' : 'amber'} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Retirement Burn Rate</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={tokenData.volumeTrend.slice(-12).map((d, i) => ({
                  month: d.month,
                  burned: Math.round(sr(i * 13 + 1200) * 400000 + 100000),
                  minted: Math.round(sr(i * 17 + 1200) * 600000 + 200000),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} tickFormatter={v => fmtN(v)} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} formatter={v => fmtN(v)} />
                  <Area type="monotone" dataKey="minted" name="Minted" stroke={T.sage} fill={T.sage} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="burned" name="Burned (Retired)" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Row>
        </div>
      </Section>
    </div>
  );

  /* ── Token Price History Data ── */
  const tokenPriceHistory = useMemo(() => {
    const data = [];
    for (let m = 0; m < 24; m++) {
      data.push({
        month: `${2023 + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}`,
        BCT: parseFloat((sr(m * 3 + 1100) * 1.5 + 0.8).toFixed(2)),
        MCO2: parseFloat((sr(m * 5 + 1100) * 2.0 + 1.2).toFixed(2)),
        C3T: parseFloat((sr(m * 7 + 1100) * 0.8 + 0.4).toFixed(2)),
        NCT: parseFloat((sr(m * 11 + 1100) * 2.5 + 1.8).toFixed(2)),
      });
    }
    return data;
  }, []);

  /* ── Tab 3: Integrity & Double-Counting ── */
  const renderIntegrity = () => (
    <div>
      <Row cols="repeat(4,1fr)">
        <Kpi label="Flagged Credits" value={flaggedCredits.length} sub={`${flaggedCredits.filter(f => f.severity === 'Critical').length} critical`} color={T.red} />
        <Kpi label="Cross-Registry Checks" value="12,847" sub="Last 30 days" color={T.navy} />
        <Kpi label="Article 6 Adjustments" value="342" sub="Tracked" color={T.gold} />
        <Kpi label="Avg Registry Integrity" value={`${Math.round(REGISTRY_STATS.reduce((a, r) => a + r.integrityScore, 0) / 4)}/100`} sub="4 registries" color={T.sage} />
      </Row>

      <div style={{ height: 16 }} />

      <Section title="Integrity Scan" right={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {scanComplete && <Badge label="Scan Complete -- 15 issues found" color="amber" />}
          <Btn onClick={handleScan} disabled={scanRunning} variant={scanRunning ? 'secondary' : 'primary'}>
            {scanRunning ? 'Scanning...' : 'Run Integrity Scan'}
          </Btn>
        </div>
      }>
        {scanRunning && (
          <div style={{ background: T.surfaceH, borderRadius: 10, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10 }}>Running cross-registry integrity scan...</div>
            <div style={{ width: '100%', height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: `linear-gradient(90deg, ${T.navy}, ${T.gold})`, borderRadius: 3,
                animation: 'scanPulse 2.5s ease-in-out infinite', width: '60%',
              }} />
            </div>
            <style>{`@keyframes scanPulse { 0% { width: 0%; } 50% { width: 80%; } 100% { width: 100%; } }`}</style>
            <div style={{ fontSize: 12, color: T.textMut, marginTop: 8 }}>Checking 200 credits across 4 registries...</div>
          </div>
        )}
      </Section>

      <Section title="Flagged Credits (Double-Counting & Integrity Issues)">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <Th>Flag ID</Th><Th>Credit</Th><Th>Severity</Th><Th>Issue</Th><Th>Registries</Th><Th>Detected</Th><Th>Status</Th>
            </tr></thead>
            <tbody>
              {flaggedCredits.map(f => (
                <tr key={f.id}>
                  <Td mono bold>{f.id}</Td>
                  <Td mono>{f.creditId}</Td>
                  <Td><Badge label={f.severity} color={sevColor(f.severity)} /></Td>
                  <Td><span style={{ fontSize: 12 }}>{f.reason}</span></Td>
                  <Td><span style={{ fontSize: 12 }}>{f.registry1} / {f.registry2}</span></Td>
                  <Td mono>{f.detectedDate}</Td>
                  <Td><Badge label={f.status} color={f.status === 'Resolved' ? 'green' : f.status === 'Confirmed' ? 'red' : 'amber'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Row cols="1fr 1fr">
        <Section title="Integrity Score by Registry">
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={REGISTRY_STATS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 12 }} />
                <Bar dataKey="integrityScore" name="Integrity Score" radius={[6, 6, 0, 0]}>
                  {REGISTRY_STATS.map((_, i) => (
                    <Cell key={i} fill={REGISTRY_STATS[i].integrityScore >= 85 ? T.green : REGISTRY_STATS[i].integrityScore >= 75 ? T.amber : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Additionality Assessment by Project Type">
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={PROJECT_TYPES.map((t, i) => ({
                name: t.length > 12 ? t.substring(0, 12) + '...' : t,
                score: Math.round(sr(i * 7 + 700) * 30 + 65),
                baseline: Math.round(sr(i * 11 + 700) * 20 + 50),
              }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={95} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="score" name="Additionality" fill={T.navy} radius={[0, 4, 4, 0]} />
                <Bar dataKey="baseline" name="Baseline Rigor" fill={T.goldL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </Row>

      <Section title="Article 6 Corresponding Adjustment Tracker">
        <div style={{ background: T.surfaceH, borderRadius: 8, padding: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <Th>Host Country</Th><Th>Buyer Country</Th><Th>Volume (tCO2e)</Th><Th>Adjustment Status</Th><Th>NDC Impact</Th><Th>Authorization</Th>
            </tr></thead>
            <tbody>
              {[
                { host: 'Brazil', buyer: 'Switzerland', vol: 2500000, status: 'Applied', ndc: '-0.3%', auth: 'LOA Issued' },
                { host: 'Indonesia', buyer: 'Japan', vol: 1800000, status: 'Pending', ndc: '-0.2%', auth: 'Under Review' },
                { host: 'Kenya', buyer: 'Sweden', vol: 950000, status: 'Applied', ndc: '-0.5%', auth: 'LOA Issued' },
                { host: 'India', buyer: 'Singapore', vol: 3200000, status: 'Not Applied', ndc: 'N/A', auth: 'Not Requested' },
                { host: 'Colombia', buyer: 'UK', vol: 1200000, status: 'Applied', ndc: '-0.4%', auth: 'LOA Issued' },
                { host: 'Vietnam', buyer: 'South Korea', vol: 750000, status: 'Pending', ndc: '-0.1%', auth: 'Under Review' },
              ].map((r, i) => (
                <tr key={i}>
                  <Td bold>{r.host}</Td>
                  <Td>{r.buyer}</Td>
                  <Td mono>{r.vol.toLocaleString()}</Td>
                  <Td><Badge label={r.status} color={r.status === 'Applied' ? 'green' : r.status === 'Pending' ? 'amber' : 'red'} /></Td>
                  <Td mono>{r.ndc}</Td>
                  <Td><Badge label={r.auth} color={r.auth === 'LOA Issued' ? 'green' : r.auth === 'Under Review' ? 'amber' : 'gray'} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Cross-Registry Reconciliation Status">
        <Row cols="repeat(3,1fr)">
          {[
            { pair: 'Verra VCS <> ACR', checked: 4218, conflicts: 3, lastSync: '2025-03-27', status: 'Synced' },
            { pair: 'Verra VCS <> Gold Standard', checked: 6842, conflicts: 7, lastSync: '2025-03-27', status: 'Synced' },
            { pair: 'ACR <> CAR', checked: 2156, conflicts: 1, lastSync: '2025-03-26', status: 'Pending' },
          ].map((r, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{r.pair}</div>
              <Row cols="1fr 1fr" gap={8}>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Credits Checked</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{r.checked.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Conflicts Found</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: r.conflicts > 0 ? T.red : T.green }}>{r.conflicts}</div>
                </div>
              </Row>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: T.textMut }}>Last sync: {r.lastSync}</span>
                <Badge label={r.status} color={r.status === 'Synced' ? 'green' : 'amber'} />
              </div>
            </div>
          ))}
        </Row>
      </Section>

      <Section title="Methodology Integrity Assessment">
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <Th>Methodology</Th><Th>Registry</Th><Th>Projects</Th><Th>Rigor Score</Th><Th>Last Updated</Th><Th>Known Issues</Th>
            </tr></thead>
            <tbody>
              {[
                { meth: 'VM0015 REDD+', reg: 'Verra VCS', projects: 342, rigor: 82, updated: '2024-06', issues: 'Baseline recalculation pending' },
                { meth: 'AMS-I.D Renewable', reg: 'Gold Standard', projects: 218, rigor: 91, updated: '2024-09', issues: 'None' },
                { meth: 'AMS-II.G Cookstove', reg: 'Gold Standard', projects: 156, rigor: 78, updated: '2024-03', issues: 'Monitoring gap identified' },
                { meth: 'AR-ACM0003 A/R', reg: 'Verra VCS', projects: 89, rigor: 85, updated: '2024-11', issues: 'None' },
                { meth: 'ACM0001 Landfill', reg: 'ACR', projects: 67, rigor: 88, updated: '2024-08', issues: 'None' },
                { meth: 'VM0007 REDD+', reg: 'Verra VCS', projects: 124, rigor: 72, updated: '2023-12', issues: 'Leakage accounting under review' },
              ].map((m, i) => (
                <tr key={i}>
                  <Td bold>{m.meth}</Td>
                  <Td><Badge label={m.reg} color="navy" /></Td>
                  <Td mono>{m.projects}</Td>
                  <Td>
                    <span style={{ fontWeight: 700, color: m.rigor >= 85 ? T.green : m.rigor >= 75 ? T.amber : T.red }}>{m.rigor}/100</span>
                  </Td>
                  <Td mono>{m.updated}</Td>
                  <Td><span style={{ fontSize: 12, color: m.issues === 'None' ? T.green : T.amber }}>{m.issues}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );

  /* ── Tab 4: Portfolio Carbon Credit Manager ── */
  const totalVolume = portfolio.reduce((a, h) => a + h.volume, 0);
  const totalValue = portfolio.reduce((a, h) => a + h.volume * h.currentPrice, 0);
  const totalCost = portfolio.reduce((a, h) => a + h.volume * h.costBasis, 0);
  const totalPL = totalValue - totalCost;
  const avgQuality = Math.round(portfolio.reduce((a, h) => a + h.quality, 0) / portfolio.length);
  const scheduledRetirements = portfolio.filter(h => h.scheduledRetire);

  const portfolioByType = useMemo(() => {
    const map = {};
    portfolio.forEach(h => { map[h.type] = (map[h.type] || 0) + h.volume; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [portfolio]);

  const portfolioByRegistry = useMemo(() => {
    const map = {};
    portfolio.forEach(h => { map[h.registry] = (map[h.registry] || 0) + h.volume; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [portfolio]);

  const portfolioByCountry = useMemo(() => {
    const map = {};
    portfolio.forEach(h => { map[h.country] = (map[h.country] || 0) + h.volume; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [portfolio]);

  const renderPortfolio = () => (
    <div>
      <Row cols="repeat(5,1fr)">
        <Kpi label="Holdings" value={portfolio.length} sub="Carbon credits" color={T.navy} />
        <Kpi label="Total Volume" value={`${fmtN(totalVolume)} tCO2e`} sub="Across all holdings" color={T.sage} />
        <Kpi label="Portfolio Value" value={fmtUSD(totalValue)} sub={`Cost: ${fmtUSD(totalCost)}`} color={T.gold} />
        <Kpi label="Unrealized P/L" value={fmtUSD(totalPL)} sub={`${((totalPL / totalCost) * 100).toFixed(1)}%`} color={totalPL >= 0 ? T.green : T.red} />
        <Kpi label="Avg Quality Score" value={`${avgQuality}/100`} sub={avgQuality >= 80 ? 'High Quality' : 'Moderate'} color={avgQuality >= 80 ? T.green : T.amber} />
      </Row>

      <div style={{ height: 16 }} />

      <Row cols="1fr 1fr 1fr">
        <Section title="By Project Type">
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 12 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={portfolioByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name.substring(0, 8)} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                  {portfolioByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} formatter={v => `${fmtN(v)} tCO2e`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="By Registry">
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 12 }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={portfolioByRegistry} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 9 }}>
                  {portfolioByRegistry.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} formatter={v => `${fmtN(v)} tCO2e`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="By Geography (Top 8)">
          <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 12 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={portfolioByCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => fmtN(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} formatter={v => `${fmtN(v)} tCO2e`} />
                <Bar dataKey="value" name="Volume" fill={T.navy} radius={[0, 4, 4, 0]}>
                  {portfolioByCountry.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </Row>

      <Section title="Credit Quality Scoring" right={
        <Btn small variant="gold" onClick={() => handleExportCSV(portfolio.map(h => ({
          ID: h.id, Project: h.name, Registry: h.registry, Type: h.type, Vintage: h.vintage,
          Volume_tCO2e: h.volume, CostBasis: h.costBasis, CurrentPrice: h.currentPrice,
          Country: h.country, Quality: h.quality, Additionality: h.additionality,
          Permanence: h.permanence, CoBenefits: h.coBenefits, UnrealizedPL: h.unrealizedPL,
          ScheduledRetire: h.scheduledRetire || '',
        })), 'carbon_credit_portfolio.csv')}>Export CSV</Btn>
      }>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <Th>ID</Th><Th>Project</Th><Th>Registry</Th><Th>Type</Th><Th>Vintage</Th>
              <Th>Volume</Th><Th>Quality</Th><Th>Add.</Th><Th>Perm.</Th><Th>Co-Ben.</Th>
              <Th>Cost Basis</Th><Th>Current</Th><Th>P/L</Th><Th>Retire</Th>
            </tr></thead>
            <tbody>
              {portfolio.map(h => (
                <tr key={h.id}>
                  <Td mono bold>{h.id}</Td>
                  <Td><span style={{ fontSize: 12 }}>{h.name}</span></Td>
                  <Td><Badge label={h.registry} color="navy" /></Td>
                  <Td><span style={{ fontSize: 11 }}>{h.type}</span></Td>
                  <Td mono>{h.vintage}</Td>
                  <Td mono>{h.volume.toLocaleString()}</Td>
                  <Td>
                    <span style={{ fontWeight: 700, color: h.quality >= 85 ? T.green : h.quality >= 70 ? T.amber : T.red, fontSize: 13 }}>{h.quality}</span>
                  </Td>
                  <Td mono>{h.additionality}</Td>
                  <Td mono>{h.permanence}</Td>
                  <Td mono>{h.coBenefits}</Td>
                  <Td mono>{fmtUSD(h.costBasis)}</Td>
                  <Td mono>{fmtUSD(h.currentPrice)}</Td>
                  <Td mono color={h.unrealizedPL >= 0 ? T.green : T.red}>{h.unrealizedPL >= 0 ? '+' : ''}{fmtUSD(h.unrealizedPL)}</Td>
                  <Td>
                    {h.scheduledRetire ? (
                      <Badge label={h.scheduledRetire} color="purple" />
                    ) : (
                      <Btn small variant="secondary" onClick={() => setRetireModal(h)}>Schedule</Btn>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Retirement Planning">
        <Row cols="1fr 1fr">
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Corporate Target Alignment</div>
            {[
              { year: '2025', target: 50000, scheduled: scheduledRetirements.filter(h => h.scheduledRetire?.includes('2025')).reduce((a, h) => a + h.volume, 0) },
              { year: '2026', target: 75000, scheduled: Math.round(sr(501) * 30000 + 20000) },
              { year: '2027', target: 100000, scheduled: Math.round(sr(502) * 25000 + 15000) },
              { year: '2030', target: 250000, scheduled: Math.round(sr(503) * 40000 + 30000) },
            ].map(y => (
              <div key={y.year} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textSec, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{y.year} Target: {fmtN(y.target)} tCO2e</span>
                  <span>{fmtN(y.scheduled)} scheduled ({((y.scheduled / y.target) * 100).toFixed(0)}%)</span>
                </div>
                <ProgressBar value={y.scheduled} max={y.target} color={y.scheduled >= y.target * 0.8 ? T.green : y.scheduled >= y.target * 0.5 ? T.amber : T.red} />
              </div>
            ))}
          </div>

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Price Exposure Analysis</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PROJECT_TYPES.map((t, i) => {
                const typeHoldings = portfolio.filter(h => h.type === t);
                const exposure = typeHoldings.reduce((a, h) => a + h.volume * h.currentPrice, 0);
                return { name: t.length > 10 ? t.substring(0, 10) + '..' : t, exposure: Math.round(exposure) };
              }).filter(d => d.exposure > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `$${fmtN(v)}`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} formatter={v => fmtUSD(v)} />
                <Bar dataKey="exposure" name="Exposure ($)" fill={T.gold} radius={[4, 4, 0, 0]}>
                  {PROJECT_TYPES.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Row>
      </Section>

      <Section title="Vintage Analysis & Quality Distribution">
        <Row cols="1fr 1fr">
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Holdings by Vintage Year</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[2019, 2020, 2021, 2022, 2023, 2024].map(yr => ({
                year: String(yr),
                volume: portfolio.filter(h => h.vintage === yr).reduce((a, h) => a + h.volume, 0),
                avgQuality: Math.round(portfolio.filter(h => h.vintage === yr).reduce((a, h) => a + h.quality, 0) / Math.max(portfolio.filter(h => h.vintage === yr).length, 1)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => fmtN(v)} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="volume" name="Volume (tCO2e)" fill={T.navy} radius={[4, 4, 0, 0]}>
                  {[2019, 2020, 2021, 2022, 2023, 2024].map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10 }}>Quality Score Distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { range: '90-100', count: portfolio.filter(h => h.quality >= 90).length },
                { range: '80-89', count: portfolio.filter(h => h.quality >= 80 && h.quality < 90).length },
                { range: '70-79', count: portfolio.filter(h => h.quality >= 70 && h.quality < 80).length },
                { range: '60-69', count: portfolio.filter(h => h.quality >= 60 && h.quality < 70).length },
                { range: '<60', count: portfolio.filter(h => h.quality < 60).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="count" name="Holdings" fill={T.sage} radius={[4, 4, 0, 0]}>
                  {[T.green, T.sage, T.gold, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Row>
      </Section>

      <Section title="Risk Metrics & Sensitivity">
        <Row cols="repeat(4,1fr)">
          <Kpi label="Avg Vintage Age" value={`${(2025 - Math.round(portfolio.reduce((a, h) => a + h.vintage, 0) / portfolio.length)).toFixed(0)} yrs`} sub="Newer is better" color={T.navy} />
          <Kpi label="Concentration Risk" value={`${Math.round(Math.max(...Object.values(portfolio.reduce((m, h) => { m[h.registry] = (m[h.registry] || 0) + h.volume; return m; }, {}))) / totalVolume * 100)}%`} sub="Top registry share" color={T.amber} />
          <Kpi label="Price Volatility" value="18.4%" sub="30-day rolling" color={T.red} />
          <Kpi label="Retirement Coverage" value={`${((scheduledRetirements.reduce((a, h) => a + h.volume, 0) / 50000) * 100).toFixed(0)}%`} sub="vs 2025 target" color={T.sage} />
        </Row>
      </Section>

      {/* Retirement Modal */}
      {retireModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(27,58,92,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setRetireModal(null)}>
          <div style={{ background: T.surface, borderRadius: 14, padding: 28, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(27,58,92,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Schedule Retirement</div>
            <div style={{ marginBottom: 14, fontSize: 13, color: T.textSec }}>
              <strong>{retireModal.name}</strong> -- {retireModal.volume.toLocaleString()} tCO2e
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Target Quarter</div>
              <select style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontFamily: T.font }}>
                <option>2025-Q2</option><option>2025-Q3</option><option>2025-Q4</option>
                <option>2026-Q1</option><option>2026-Q2</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Volume to Retire (tCO2e)</div>
              <input type="number" defaultValue={retireModal.volume} style={{
                width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6,
                fontSize: 13, fontFamily: T.mono, boxSizing: 'border-box',
              }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 4 }}>Retirement Purpose</div>
              <select style={{ width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontFamily: T.font }}>
                <option>Scope 1 Offset</option><option>Scope 2 Offset</option><option>Scope 3 Offset</option>
                <option>Voluntary Commitment</option><option>CORSIA Compliance</option><option>EU ETS Compliance</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="secondary" onClick={() => setRetireModal(null)}>Cancel</Btn>
              <Btn onClick={() => setRetireModal(null)}>Schedule Retirement</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, background: T.bg, minHeight: '100vh', fontFamily: T.font }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: T.navy }}>Blockchain Carbon Registry & Tokenization</span>
          <Badge label="EP-AM3" color="navy" />
        </div>
        <div style={{ fontSize: 13, color: T.textSec }}>
          On-chain carbon credit tracking, tokenization analytics, and registry integrity monitoring
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 0 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setSelectedCredit(null); setRetireModal(null); }} style={{
            padding: '10px 20px', fontSize: 13, fontWeight: tab === i ? 700 : 500, fontFamily: T.font,
            color: tab === i ? T.navy : T.textMut, background: tab === i ? T.surface : 'transparent',
            border: tab === i ? `1px solid ${T.border}` : '1px solid transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
            borderRadius: '8px 8px 0 0', cursor: 'pointer', transition: 'all 0.15s',
            marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && renderRegistryExplorer()}
      {tab === 1 && renderTokenization()}
      {tab === 2 && renderIntegrity()}
      {tab === 3 && renderPortfolio()}
    </div>
  );
}
