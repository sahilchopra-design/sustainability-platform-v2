import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Alliance Definitions ─────────────────────────────────────────── */
const ALLIANCES = [
  { id:'NZAM', name:'Net Zero Asset Managers Initiative', members:315, aum:43, aumUnit:'T',
    color:T.navy, pctTargets:72, pctOnTrack:48, type:'Asset Managers',
    founded:2020, secretariat:'IGCC / PRI / CDP',
    description:'Coalition of asset managers committed to supporting the goal of net zero greenhouse gas emissions by 2050 or sooner.',
    keyReqs:['Set interim 2030 targets','Report annually on progress','Implement stewardship strategy','Escalate engagement'] },
  { id:'NZAOA', name:'Net Zero Asset Owner Alliance', members:88, aum:11, aumUnit:'T',
    color:T.sage, pctTargets:81, pctOnTrack:55, type:'Asset Owners',
    founded:2019, secretariat:'UNEP FI / PRI',
    description:'UN-convened alliance of asset owners committed to transitioning investment portfolios to net zero by 2050.',
    keyReqs:['Set 5-year sub-portfolio targets','Engagement strategy','Sector-specific decarbonisation','Annual reporting'] },
  { id:'NZBA', name:'Net Zero Banking Alliance', members:144, aum:74, aumUnit:'T',
    color:T.gold, pctTargets:65, pctOnTrack:39, type:'Banks',
    founded:2021, secretariat:'UNEP FI',
    description:'Industry-led, UN-convened alliance of banks committed to aligning lending and investment portfolios with net zero by 2050.',
    keyReqs:['Set 2030 sector targets','Publish transition plan','Financed emissions reporting','Client engagement'] },
];

const MEMBERSHIP_GROWTH = (() => {
  const years = [2020,2021,2022,2023,2024,2025,2026];
  return years.map((y,i) => ({
    year: y,
    NZAM: Math.round(30 + 285 * (1 - Math.exp(-0.5*(i)))),
    NZAOA: Math.round(12 + 76 * (1 - Math.exp(-0.45*(i)))),
    NZBA: Math.round(20 + 124 * (1 - Math.exp(-0.55*(i)))),
    total: Math.round(62 + 485 * (1 - Math.exp(-0.5*(i)))),
  }));
})();

/* ── Signatory Data (120 signatories across 3 alliances) ──────────── */
const FIRM_NAMES_NZAM = [
  'BlackRock','Vanguard','State Street Global','Fidelity Intl','PIMCO','Amundi',
  'Schroders','Legal & General IM','UBS Asset Mgmt','abrdn','Invesco','Nuveen',
  'BNP Paribas AM','DWS Group','Nordea AM','Robeco','Aviva Investors','NN Investment',
  'Columbia Threadneedle','Wellington Mgmt','T. Rowe Price','MFS Investment',
  'Franklin Templeton','Manulife IM','AXA Investment Mgrs','Allianz GI',
  'Federated Hermes','Jupiter AM','Janus Henderson','Man Group',
  'Lombard Odier IM','Pictet AM','BMO GAM','Candriam','HSBC AM',
  'Baillie Gifford','M&G Investments','Standard Life','Ninety One','Impax AM',
];

const FIRM_NAMES_NZAOA = [
  'Allianz SE','AXA Group','Zurich Insurance','Swiss Re','Munich Re','CalPERS',
  'CalSTRS','CDPQ','CPP Investments','APG','PGGM','PensionDanmark',
  'AP2 Sweden','AP4 Sweden','Folksam','Storebrand','KLP','PKA',
  'Nest Pensions','LGPS Central','QBE Insurance','Generali','Aviva plc',
  'Wespath','Church Commissioners','ERAFP','Ircantec','Environment Agency Pensions',
  'Greater Manchester PF','Brunel Pension Partnership',
  'Border to Coast','LPPI','ATP Denmark','PFA Pension','Sampension',
  'Danica Pension','Nordea Life & Pension','LocalTapiola','Varma','Ilmarinen',
];

const FIRM_NAMES_NZBA = [
  'HSBC Holdings','Barclays','Deutsche Bank','BNP Paribas','Societe Generale',
  'Credit Agricole','ING Group','UBS Group','Credit Suisse','Standard Chartered',
  'NatWest Group','Lloyds Banking','Santander','BBVA','UniCredit',
  'Intesa Sanpaolo','ABN AMRO','Rabobank','Nordea Bank','Danske Bank',
  'DNB ASA','Handelsbanken','SEB Group','Swedbank','CaixaBank',
  'Commerzbank','KBC Group','Bank of Ireland','AIB Group','Erste Group',
  'Mizuho Financial','SMBC Group','MUFG','Macquarie Group','ANZ Banking',
  'NAB Australia','Westpac Banking','Bank of Montreal','Scotiabank','TD Bank',
];

const REGIONS = ['Europe','North America','Asia-Pacific','UK','Nordics','Other'];
const STATUS_OPTIONS = ['On-Track','Behind','No Target','Withdrawn'];
const AUM_TIERS = ['<$100B','$100B-500B','$500B-1T','>$1T'];

function buildSignatories() {
  const sigs = [];
  let id = 1;
  const allianceMap = { NZAM: FIRM_NAMES_NZAM, NZAOA: FIRM_NAMES_NZAOA, NZBA: FIRM_NAMES_NZBA };
  const withdrawn = new Set(['Vanguard','Invesco','T. Rowe Price','Janus Henderson','QBE Insurance']);

  for (const [alliance, firms] of Object.entries(allianceMap)) {
    firms.forEach((name, idx) => {
      const s = sr(id * 7 + idx * 3);
      const s2 = sr(id * 13 + idx * 5);
      const s3 = sr(id * 17 + idx * 11);
      const s4 = sr(id * 23 + idx * 19);
      const isWithdrawn = withdrawn.has(name);
      const aumVal = alliance === 'NZBA'
        ? Math.round(200 + s * 2800)
        : Math.round(50 + s * 4500);
      const targetYear = isWithdrawn ? null : (2040 + Math.floor(s2 * 4) * 5);
      const interimTarget = isWithdrawn ? null : Math.round(25 + s3 * 30);
      const pctCovered = isWithdrawn ? 0 : Math.round(30 + s * 60);
      const actualReduction = isWithdrawn ? 0 : Math.round(interimTarget * (0.3 + s2 * 0.8));
      const committed = isWithdrawn ? 0 : interimTarget;
      const regionIdx = Math.floor(s4 * REGIONS.length);
      let status;
      if (isWithdrawn) status = 'Withdrawn';
      else if (!targetYear) status = 'No Target';
      else if (actualReduction >= committed * 0.7) status = 'On-Track';
      else status = 'Behind';

      const scopeBreakdown = {
        scope1: Math.round(15 + s * 35),
        scope2: Math.round(20 + s2 * 30),
        scope3: Math.round(5 + s3 * 25),
      };

      sigs.push({
        id: id++,
        name,
        alliance,
        aum: aumVal,
        targetYear,
        interimTarget,
        pctCovered,
        status,
        committed,
        actual: actualReduction,
        joinedYear: 2020 + Math.floor(s * 3),
        engagements: Math.round(5 + s3 * 40),
        region: REGIONS[regionIdx],
        scopeBreakdown,
        sectorTargets: [
          { sector:'Oil & Gas', target: Math.round(30 + s * 25), actual: Math.round(15 + s2 * 20) },
          { sector:'Power Generation', target: Math.round(35 + s2 * 20), actual: Math.round(20 + s3 * 25) },
          { sector:'Steel & Cement', target: Math.round(20 + s3 * 15), actual: Math.round(8 + s4 * 15) },
          { sector:'Real Estate', target: Math.round(25 + s4 * 20), actual: Math.round(18 + s * 15) },
          { sector:'Transport', target: Math.round(15 + s * 20), actual: Math.round(10 + s2 * 12) },
        ],
        milestones: [
          { year: 2020, label: 'Alliance membership signed', done: true },
          { year: 2021, label: 'Board-level climate governance established', done: !isWithdrawn },
          { year: 2022, label: 'Initial commitment & scope defined', done: !isWithdrawn && s > 0.15 },
          { year: 2023, label: 'Interim targets published (2030)', done: !isWithdrawn && s > 0.25 },
          { year: 2024, label: 'First annual progress report filed', done: !isWithdrawn && s2 > 0.3 },
          { year: 2025, label: 'Portfolio alignment assessment completed', done: !isWithdrawn && s3 > 0.5 },
          { year: 2026, label: 'Transition plan published', done: false },
          { year: 2028, label: 'Mid-term target review', done: false },
          { year: 2030, label: 'Interim target deadline', done: false },
        ],
        withdrawnDate: isWithdrawn ? `${['Jan','Mar','Jun','Sep','Dec'][Math.floor(s*5)]} ${2022 + Math.floor(s2*2)}` : null,
        withdrawnReason: isWithdrawn ? ['Legal & regulatory concerns','Fiduciary duty conflict','Strategy realignment','Political pressure','Board decision'][Math.floor(s3*5)] : null,
      });
    });
  }
  return sigs;
}

const ALL_SIGNATORIES = buildSignatories();

/* ── Portfolio Exposure Data ──────────────────────────────────────── */
const PORTFOLIO_HOLDINGS = (() => {
  const holdings = [];
  const managers = [
    'BlackRock','Fidelity Intl','PIMCO','Amundi','Schroders','Legal & General IM',
    'Invesco','Nuveen','DWS Group','Robeco','Wellington Mgmt','Franklin Templeton',
    'Non-NZ Manager Alpha','Non-NZ Manager Beta','Non-NZ Manager Gamma',
    'Non-NZ Boutique Capital','Non-NZ Quant Partners','Non-NZ Value Advisors',
  ];
  managers.forEach((m, i) => {
    const s = sr(i * 31 + 7);
    const s2 = sr(i * 37 + 13);
    const sig = ALL_SIGNATORIES.find(x => x.name === m);
    holdings.push({
      id: i + 1,
      manager: m,
      allocationPct: Math.round(2 + s * 12),
      aumAllocated: Math.round(50 + s * 800),
      isNzCommitted: !!sig,
      alliance: sig ? sig.alliance : null,
      status: sig ? sig.status : 'Not Committed',
      assetClass: ['Equities','Fixed Income','Multi-Asset','Alternatives','Real Assets'][Math.floor(s2 * 5)],
      mandate: ['Global Equity','IG Credit','Multi-Strategy','Private Markets','Infrastructure'][Math.floor(s * 5)],
    });
  });
  return holdings;
})();

/* ── Regional breakdown for tab 1 ────────────────────────────────── */
const REGIONAL_BREAKDOWN = (() => {
  const regionCounts = {};
  ALL_SIGNATORIES.forEach(s => {
    if (!regionCounts[s.region]) regionCounts[s.region] = { region: s.region, count: 0, aum: 0 };
    regionCounts[s.region].count++;
    regionCounts[s.region].aum += s.aum;
  });
  return Object.values(regionCounts).sort((a, b) => b.count - a.count);
})();

/* ── Style Helpers ────────────────────────────────────────────────── */
const card = { background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, padding:20 };
const cardShadow = { ...card, boxShadow:'0 1px 4px rgba(27,58,92,0.06)' };
const pillBase = { display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, fontFamily:T.font };
const btn = (active) => ({
  padding:'7px 16px', borderRadius:6, fontSize:13, fontWeight:600, fontFamily:T.font, cursor:'pointer',
  border: active ? `2px solid ${T.navy}` : `1px solid ${T.border}`,
  background: active ? T.navy : T.surface,
  color: active ? '#fff' : T.text,
  transition:'all 0.15s ease',
});
const statusColor = (s) => s==='On-Track'?T.green:s==='Behind'?T.amber:s==='Withdrawn'?T.red:T.textMut;
const statusPill = (s) => ({ ...pillBase, background:statusColor(s)+'18', color:statusColor(s) });
const fmtB = (v) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v}B`;
const TABS = ['Alliance Overview','Signatory Deep Dive','Progress Monitor','Portfolio Exposure'];
const ALLIANCE_COLORS = { NZAM: T.navy, NZAOA: T.sage, NZBA: T.gold };

const CustomTooltipStyle = { borderRadius:8, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' };

/* ═══════════════════════════════════════════════════════════════════ */
export default function NetZeroCommitmentTrackerPage() {
  const [tab, setTab] = useState(0);
  const [selectedAlliance, setSelectedAlliance] = useState(null);
  const [filterAlliance, setFilterAlliance] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTier, setFilterTier] = useState('All');
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedSig, setSelectedSig] = useState(null);
  const [whatIfTarget, setWhatIfTarget] = useState('');
  const [flagged, setFlagged] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllianceDetail, setShowAllianceDetail] = useState(null);

  /* ── Tab 2 filtering / sorting ──────────────────────────────── */
  const filteredSigs = useMemo(() => {
    let list = [...ALL_SIGNATORIES];
    if (filterAlliance !== 'All') list = list.filter(s => s.alliance === filterAlliance);
    if (filterStatus !== 'All') list = list.filter(s => s.status === filterStatus);
    if (filterTier !== 'All') {
      list = list.filter(s => {
        if (filterTier === '<$100B') return s.aum < 100;
        if (filterTier === '$100B-500B') return s.aum >= 100 && s.aum < 500;
        if (filterTier === '$500B-1T') return s.aum >= 500 && s.aum < 1000;
        return s.aum >= 1000;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (va == null) va = '';
      if (vb == null) vb = '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = String(vb).toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filterAlliance, filterStatus, filterTier, sortCol, sortDir, searchQuery]);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }, [sortCol]);

  /* ── Tab 3 gap data ─────────────────────────────────────────── */
  const gapData = useMemo(() => {
    return ALL_SIGNATORIES
      .filter(s => s.status !== 'Withdrawn' && s.committed > 0)
      .map(s => ({ name: s.name.length > 18 ? s.name.slice(0,16)+'..' : s.name, fullName: s.name, committed: s.committed, actual: s.actual, gap: s.committed - s.actual, alliance: s.alliance }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 30);
  }, []);

  const withdrawnSigs = useMemo(() => ALL_SIGNATORIES.filter(s => s.status === 'Withdrawn'), []);
  const laggards = useMemo(() => ALL_SIGNATORIES.filter(s => s.status === 'Behind' && s.actual < s.committed * 0.4).slice(0, 15), []);

  const emissionsTrend = useMemo(() => {
    return [2020,2021,2022,2023,2024,2025,2026].map((y, i) => ({
      year: y,
      NZAM: Math.round(100 - i * 3.2 + sr(i*7) * 4),
      NZAOA: Math.round(100 - i * 4.1 + sr(i*11) * 3),
      NZBA: Math.round(100 - i * 2.5 + sr(i*13) * 5),
      target: Math.round(100 - i * 5.7),
    }));
  }, []);

  const statusDistribution = useMemo(() => {
    const counts = { 'On-Track':0, 'Behind':0, 'No Target':0, 'Withdrawn':0 };
    ALL_SIGNATORIES.forEach(s => counts[s.status]++);
    return Object.entries(counts).map(([name, value]) => ({
      name, value, color: statusColor(name),
    }));
  }, []);

  const avgGapByAlliance = useMemo(() => {
    return ALLIANCES.map(a => {
      const sigs = ALL_SIGNATORIES.filter(s => s.alliance === a.id && s.status !== 'Withdrawn' && s.committed > 0);
      const avgCommitted = sigs.length ? Math.round(sigs.reduce((t, s) => t + s.committed, 0) / sigs.length) : 0;
      const avgActual = sigs.length ? Math.round(sigs.reduce((t, s) => t + s.actual, 0) / sigs.length) : 0;
      return { alliance: a.id, committed: avgCommitted, actual: avgActual, gap: avgCommitted - avgActual };
    });
  }, []);

  /* ── Tab 4 portfolio calcs ──────────────────────────────────── */
  const portfolioStats = useMemo(() => {
    const total = PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.allocationPct, 0);
    const committed = PORTFOLIO_HOLDINGS.filter(h => h.isNzCommitted).reduce((s, h) => s + h.allocationPct, 0);
    const nzam = PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZAM').reduce((s, h) => s + h.allocationPct, 0);
    const nzaoa = PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZAOA').reduce((s, h) => s + h.allocationPct, 0);
    const nzba = PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZBA').reduce((s, h) => s + h.allocationPct, 0);
    const notCovered = total - committed;
    return { total, committed, nzam, nzaoa, nzba, notCovered, pctCovered: Math.round(committed / (total || 1) * 100) };
  }, []);

  const allianceDonut = useMemo(() => [
    { name:'NZAM', value: portfolioStats.nzam, color: T.navy },
    { name:'NZAOA', value: portfolioStats.nzaoa, color: T.sage },
    { name:'NZBA', value: portfolioStats.nzba, color: T.gold },
    { name:'Not Committed', value: portfolioStats.notCovered, color: T.textMut },
  ], [portfolioStats]);

  const uncoveredHoldings = useMemo(() => PORTFOLIO_HOLDINGS.filter(h => !h.isNzCommitted).sort((a,b) => b.allocationPct - a.allocationPct), []);

  const whatIfResult = useMemo(() => {
    if (!whatIfTarget) return null;
    const target = PORTFOLIO_HOLDINGS.find(h => h.manager.toLowerCase().includes(whatIfTarget.toLowerCase()) && !h.isNzCommitted);
    if (!target) return null;
    const newCommitted = portfolioStats.committed + target.allocationPct;
    const newPct = Math.round(newCommitted / (portfolioStats.total || 1) * 100);
    return { manager: target.manager, addedPct: target.allocationPct, newCoverage: newPct, oldCoverage: portfolioStats.pctCovered, aumAdded: target.aumAllocated };
  }, [whatIfTarget, portfolioStats]);

  const assetClassBreakdown = useMemo(() => {
    const classes = {};
    PORTFOLIO_HOLDINGS.forEach(h => {
      if (!classes[h.assetClass]) classes[h.assetClass] = { name: h.assetClass, committed: 0, total: 0 };
      classes[h.assetClass].total += h.allocationPct;
      if (h.isNzCommitted) classes[h.assetClass].committed += h.allocationPct;
    });
    return Object.values(classes).map(c => ({ ...c, pctCommitted: c.total > 0 ? Math.round(c.committed / c.total * 100) : 0 }));
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ['Manager','Allocation %','AUM ($M)','NZ Committed','Alliance','Status','Asset Class','Mandate'];
    const rows = PORTFOLIO_HOLDINGS.map(h => [h.manager, h.allocationPct, h.aumAllocated, h.isNzCommitted ? 'Yes' : 'No', h.alliance || '-', h.status, h.assetClass, h.mandate]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nz_portfolio_exposure.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  /* ── Header KPIs ────────────────────────────────────────────── */
  const totalMembers = ALLIANCES.reduce((s, a) => s + a.members, 0);
  const totalAum = ALLIANCES.reduce((s, a) => s + a.aum, 0);
  const avgOnTrack = Math.round(ALLIANCES.reduce((s, a) => s + a.pctOnTrack, 0) / ALLIANCES.length);

  const globalAumPie = ALLIANCES.map(a => ({ name: a.id, value: a.aum, color: a.color }));

  const allianceMembers = useMemo(() => {
    if (!selectedAlliance) return [];
    return ALL_SIGNATORIES.filter(s => s.alliance === selectedAlliance);
  }, [selectedAlliance]);

  /* ═══════════════════ RENDER ════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24, color:T.text }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <span style={{ fontSize:22, fontWeight:700, color:T.navy }}>Net Zero Commitment Tracker</span>
          <span style={{ ...pillBase, background:T.navy+'14', color:T.navy }}>EP-AL4</span>
          <span style={{ ...pillBase, background:T.sage+'18', color:T.sage }}>NZAM / NZAOA / NZBA</span>
        </div>
        <p style={{ color:T.textSec, fontSize:13, margin:0, maxWidth:760 }}>
          Monitor NZAM, NZAOA, and NZBA alliance commitments, signatory progress, portfolio exposure, and commitment-delivery gaps across {ALL_SIGNATORIES.length} signatories managing ${totalAum}T in combined assets.
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:20 }}>
        {[
          { label:'Alliance Members', value: totalMembers.toLocaleString(), sub:'across 3 alliances', icon:'🏛' },
          { label:'Combined AUM', value:`$${totalAum}T`, sub:'global coverage', icon:'💰' },
          { label:'Avg On-Track', value:`${avgOnTrack}%`, sub:'meeting interim targets', color: avgOnTrack > 50 ? T.green : T.amber, icon:'📊' },
          { label:'Withdrawn', value: withdrawnSigs.length, sub:'since 2022', color: T.red, icon:'⚠' },
          { label:'Flagged for Review', value: flagged.size, sub:'by analyst', color: flagged.size > 0 ? T.amber : T.textMut, icon:'⚑' },
        ].map((k, i) => (
          <div key={i} style={cardShadow}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{k.label}</div>
              <span style={{ fontSize:14 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize:24, fontWeight:700, color: k.color || T.navy, fontFamily:T.mono }}>{k.value}</div>
            <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:6, marginBottom:20, borderBottom:`2px solid ${T.border}`, paddingBottom:8 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => { setTab(i); setSelectedAlliance(null); setSelectedSig(null); setShowAllianceDetail(null); }} style={{
            ...btn(tab === i), borderRadius:'6px 6px 0 0',
            borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {/* ═══════════ TAB 1: Alliance Overview ═══════════════════════ */}
      {tab === 0 && (
        <div>
          {/* Alliance cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
            {ALLIANCES.map(a => (
              <div key={a.id} onClick={() => setSelectedAlliance(selectedAlliance === a.id ? null : a.id)}
                style={{ ...cardShadow, cursor:'pointer', borderLeft:`4px solid ${a.color}`,
                  background: selectedAlliance === a.id ? T.surfaceH : T.surface, transition:'all 0.15s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:a.color }}>{a.id}</div>
                    <div style={{ fontSize:11, color:T.textSec, maxWidth:200 }}>{a.name}</div>
                  </div>
                  <span style={{ ...pillBase, background:a.color+'18', color:a.color, fontSize:10 }}>{a.type}</span>
                </div>
                <div style={{ fontSize:10, color:T.textMut, marginBottom:10, lineHeight:1.4 }}>
                  Founded {a.founded} &middot; Secretariat: {a.secretariat}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:T.mono, color:T.navy }}>{a.members}</div>
                    <div style={{ fontSize:10, color:T.textMut }}>Members</div>
                  </div>
                  <div>
                    <div style={{ fontSize:22, fontWeight:700, fontFamily:T.mono, color:T.navy }}>${a.aum}{a.aumUnit}</div>
                    <div style={{ fontSize:10, color:T.textMut }}>Total AUM/Assets</div>
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec, marginBottom:3 }}>
                    <span>Published Targets</span><span style={{ fontWeight:600 }}>{a.pctTargets}%</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:T.border }}>
                    <div style={{ height:6, borderRadius:3, background:a.color, width:`${a.pctTargets}%`, transition:'width 0.3s' }}/>
                  </div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec, marginBottom:3 }}>
                    <span>On-Track</span><span style={{ fontWeight:600, color: a.pctOnTrack >= 50 ? T.green : T.amber }}>{a.pctOnTrack}%</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:T.border }}>
                    <div style={{ height:6, borderRadius:3, background: a.pctOnTrack >= 50 ? T.green : T.amber, width:`${a.pctOnTrack}%`, transition:'width 0.3s' }}/>
                  </div>
                </div>
                {/* Key requirements */}
                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:8, marginTop:4 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:T.textSec, marginBottom:4 }}>Key Requirements:</div>
                  {a.keyReqs.map((r, ri) => (
                    <div key={ri} style={{ fontSize:10, color:T.textMut, paddingLeft:8, marginBottom:2 }}>• {r}</div>
                  ))}
                </div>
                <div style={{ fontSize:10, color:T.textMut, marginTop:8, textAlign:'right' }}>Click to view members &rarr;</div>
              </div>
            ))}
          </div>

          {/* Member list when alliance clicked */}
          {selectedAlliance && (
            <div style={{ ...cardShadow, marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div>
                  <span style={{ fontSize:15, fontWeight:700, color:T.navy }}>{selectedAlliance} Members</span>
                  <span style={{ fontSize:12, color:T.textMut, marginLeft:8 }}>({allianceMembers.length} signatories)</span>
                </div>
                <button onClick={() => setSelectedAlliance(null)} style={{ ...btn(false), fontSize:11 }}>Close</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                {STATUS_OPTIONS.map(st => {
                  const c = allianceMembers.filter(m => m.status === st).length;
                  return (
                    <div key={st} style={{ padding:8, background:T.surfaceH, borderRadius:6, textAlign:'center' }}>
                      <div style={{ fontSize:18, fontWeight:700, fontFamily:T.mono, color:statusColor(st) }}>{c}</div>
                      <div style={{ fontSize:10, color:T.textMut }}>{st}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ maxHeight:360, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:T.surfaceH }}>
                      {['Name','Region','AUM','Target Year','Interim %','Status','Coverage'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontWeight:600, color:T.textSec, borderBottom:`1px solid ${T.border}`, fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allianceMembers.map(m => (
                      <tr key={m.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'7px 10px', fontWeight:600 }}>{m.name}</td>
                        <td style={{ padding:'7px 10px', fontSize:11, color:T.textSec }}>{m.region}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono, fontSize:11 }}>{fmtB(m.aum)}</td>
                        <td style={{ padding:'7px 10px' }}>{m.targetYear || '—'}</td>
                        <td style={{ padding:'7px 10px', fontFamily:T.mono, fontSize:11 }}>{m.interimTarget != null ? `${m.interimTarget}%` : '—'}</td>
                        <td style={{ padding:'7px 10px' }}><span style={statusPill(m.status)}>{m.status}</span></td>
                        <td style={{ padding:'7px 10px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <div style={{ width:40, height:4, borderRadius:2, background:T.border }}>
                              <div style={{ height:4, borderRadius:2, background:T.sage, width:`${m.pctCovered}%` }}/>
                            </div>
                            <span style={{ fontFamily:T.mono, fontSize:10 }}>{m.pctCovered}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:20 }}>
            <div style={cardShadow}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:14 }}>Membership Growth (2020–2026)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={MEMBERSHIP_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textSec }} />
                  <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Area type="monotone" dataKey="NZAM" stroke={T.navy} fill={T.navy+'30'} strokeWidth={2} name="NZAM" />
                  <Area type="monotone" dataKey="NZAOA" stroke={T.sage} fill={T.sage+'30'} strokeWidth={2} name="NZAOA" />
                  <Area type="monotone" dataKey="NZBA" stroke={T.gold} fill={T.gold+'30'} strokeWidth={2} name="NZBA" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={cardShadow}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:14 }}>Global AUM Coverage</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={globalAumPie} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={42} paddingAngle={3}>
                    {globalAumPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v}T`} contentStyle={CustomTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center', marginTop:4 }}>
                {globalAumPie.map((d, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:T.textSec }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:d.color }} />{d.name}: ${d.value}T
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regional breakdown */}
          <div style={cardShadow}>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:14 }}>Regional Distribution of Signatories</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
              {REGIONAL_BREAKDOWN.map((r, i) => (
                <div key={r.region} style={{ padding:12, background:T.surfaceH, borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:700, fontFamily:T.mono, color:T.navy }}>{r.count}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginTop:2 }}>{r.region}</div>
                  <div style={{ fontSize:10, color:T.textMut }}>{fmtB(r.aum)} AUM</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB 2: Signatory Deep Dive ═══════════════════ */}
      {tab === 1 && (
        <div style={{ display:'flex', gap:16 }}>
          <div style={{ flex: selectedSig ? '0 0 58%' : '1 1 100%', transition:'flex 0.2s' }}>
            {/* Filters */}
            <div style={{ ...cardShadow, marginBottom:16, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Filters:</div>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search signatory..."
                style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, background:T.surface, width:160 }} />
              <select value={filterAlliance} onChange={e => setFilterAlliance(e.target.value)}
                style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, background:T.surface }}>
                <option value="All">All Alliances</option>
                {ALLIANCES.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, background:T.surface }}>
                <option value="All">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
                style={{ padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, background:T.surface }}>
                <option value="All">All AUM Tiers</option>
                {AUM_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span style={{ fontSize:11, color:T.textMut, marginLeft:'auto' }}>
                Showing {filteredSigs.length} of {ALL_SIGNATORIES.length}
              </span>
            </div>

            {/* Table */}
            <div style={{ ...cardShadow, maxHeight:620, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead style={{ position:'sticky', top:0, background:T.surface, zIndex:2 }}>
                  <tr>
                    {[
                      { key:'name', label:'Signatory' },
                      { key:'alliance', label:'Alliance' },
                      { key:'aum', label:'AUM' },
                      { key:'targetYear', label:'Target Yr' },
                      { key:'interimTarget', label:'Interim %' },
                      { key:'pctCovered', label:'Covered %' },
                      { key:'status', label:'Status' },
                    ].map(c => (
                      <th key={c.key} onClick={() => handleSort(c.key)}
                        style={{ textAlign:'left', padding:'10px 8px', fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`,
                          cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', fontSize:11 }}>
                        {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSigs.map(s => (
                    <tr key={s.id} onClick={() => setSelectedSig(selectedSig?.id === s.id ? null : s)}
                      style={{ borderBottom:`1px solid ${T.border}`, cursor:'pointer',
                        background: selectedSig?.id === s.id ? T.surfaceH : flagged.has(s.id) ? T.red+'06' : 'transparent',
                        transition:'background 0.1s' }}
                      onMouseEnter={e => { if (selectedSig?.id !== s.id) e.currentTarget.style.background = T.surfaceH; }}
                      onMouseLeave={e => { if (selectedSig?.id !== s.id) e.currentTarget.style.background = flagged.has(s.id) ? T.red+'06' : 'transparent'; }}>
                      <td style={{ padding:'7px 8px', fontWeight:600 }}>
                        {flagged.has(s.id) && <span style={{ color:T.red, marginRight:4 }}>⚑</span>}
                        {s.name}
                      </td>
                      <td style={{ padding:'7px 8px' }}>
                        <span style={{ ...pillBase, fontSize:10, background: ALLIANCE_COLORS[s.alliance]+'18', color: ALLIANCE_COLORS[s.alliance] }}>{s.alliance}</span>
                      </td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono, fontSize:11 }}>{fmtB(s.aum)}</td>
                      <td style={{ padding:'7px 8px' }}>{s.targetYear || '—'}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono, fontSize:11 }}>{s.interimTarget != null ? `${s.interimTarget}%` : '—'}</td>
                      <td style={{ padding:'7px 8px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <div style={{ width:44, height:5, borderRadius:3, background:T.border }}>
                            <div style={{ height:5, borderRadius:3, background:T.sage, width:`${s.pctCovered}%` }}/>
                          </div>
                          <span style={{ fontFamily:T.mono, fontSize:10 }}>{s.pctCovered}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'7px 8px' }}><span style={statusPill(s.status)}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side panel */}
          {selectedSig && (
            <div style={{ flex:'0 0 40%', ...cardShadow, maxHeight:680, overflowY:'auto', position:'sticky', top:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{selectedSig.name}</div>
                  <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                    <span style={{ ...pillBase, fontSize:10, background: ALLIANCE_COLORS[selectedSig.alliance]+'18', color: ALLIANCE_COLORS[selectedSig.alliance] }}>{selectedSig.alliance}</span>
                    <span style={statusPill(selectedSig.status)}>{selectedSig.status}</span>
                    <span style={{ ...pillBase, fontSize:10, background:T.surfaceH, color:T.textSec }}>{selectedSig.region}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedSig(null)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:T.textMut, padding:4 }}>&times;</button>
              </div>

              {selectedSig.status === 'Withdrawn' && (
                <div style={{ padding:10, background:T.red+'08', border:`1px solid ${T.red}30`, borderRadius:6, marginBottom:14, fontSize:11 }}>
                  <span style={{ fontWeight:700, color:T.red }}>Withdrawn:</span>
                  <span style={{ color:T.textSec, marginLeft:4 }}>{selectedSig.withdrawnDate} — {selectedSig.withdrawnReason}</span>
                </div>
              )}

              {/* Key metrics */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
                {[
                  { l:'AUM', v: fmtB(selectedSig.aum) },
                  { l:'Target Year', v: selectedSig.targetYear || '—' },
                  { l:'Interim Target', v: selectedSig.interimTarget ? `${selectedSig.interimTarget}%` : '—' },
                  { l:'AUM Covered', v:`${selectedSig.pctCovered}%` },
                  { l:'Joined', v: selectedSig.joinedYear },
                  { l:'Engagements', v: selectedSig.engagements },
                ].map((m, i) => (
                  <div key={i} style={{ padding:8, background:T.surfaceH, borderRadius:6 }}>
                    <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase', letterSpacing:0.5 }}>{m.l}</div>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:T.mono, color:T.navy, marginTop:1 }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {/* Commitment timeline */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Commitment Timeline</div>
                {selectedSig.milestones.map((ms, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      background: ms.done ? T.green+'20' : T.border, color: ms.done ? T.green : T.textMut, fontSize:11, fontWeight:700, flexShrink:0, marginTop:1 }}>
                      {ms.done ? '✓' : '○'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, fontWeight:600, color: ms.done ? T.text : T.textMut }}>{ms.label}</div>
                      <div style={{ fontSize:9, color:T.textMut }}>{ms.year}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Portfolio coverage breakdown */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Portfolio Coverage by Asset Class</div>
                {[
                  { label:'Equities', pct: Math.min(95, Math.round(selectedSig.pctCovered * 1.1)) },
                  { label:'Fixed Income', pct: Math.round(selectedSig.pctCovered * 0.8) },
                  { label:'Real Assets', pct: Math.round(selectedSig.pctCovered * 0.5) },
                  { label:'Alternatives', pct: Math.round(selectedSig.pctCovered * 0.3) },
                  { label:'Sovereign Bonds', pct: Math.round(selectedSig.pctCovered * 0.65) },
                ].map((ac, i) => (
                  <div key={i} style={{ marginBottom:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textSec, marginBottom:2 }}>
                      <span>{ac.label}</span><span style={{ fontFamily:T.mono }}>{ac.pct}%</span>
                    </div>
                    <div style={{ height:4, borderRadius:2, background:T.border }}>
                      <div style={{ height:4, borderRadius:2, background:T.sage, width:`${ac.pct}%` }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sector targets */}
              {selectedSig.status !== 'Withdrawn' && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Sector Reduction Targets vs Actual</div>
                  {selectedSig.sectorTargets.map((st, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                      <span style={{ color:T.textSec, flex:'0 0 120px' }}>{st.sector}</span>
                      <div style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:80, height:4, borderRadius:2, background:T.border, position:'relative' }}>
                          <div style={{ position:'absolute', height:4, borderRadius:2, background:T.navy+'40', width:`${st.target}%` }}/>
                          <div style={{ position:'absolute', height:4, borderRadius:2, background:T.sage, width:`${st.actual}%` }}/>
                        </div>
                        <span style={{ fontFamily:T.mono, fontSize:9, color: st.actual >= st.target * 0.7 ? T.green : T.amber }}>
                          {st.actual}% / {st.target}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Engagement activities */}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:6 }}>Engagement Activities</div>
                <div style={{ fontSize:11, color:T.textSec }}>
                  {[
                    { l:'Direct company engagements', v:Math.round(selectedSig.engagements * 0.5) },
                    { l:'Collaborative initiatives', v:Math.round(selectedSig.engagements * 0.2) },
                    { l:'Proxy votes (climate)', v:Math.round(selectedSig.engagements * 0.15) },
                    { l:'Policy advocacy actions', v:Math.round(selectedSig.engagements * 0.1) },
                    { l:'Escalation cases', v:Math.round(selectedSig.engagements * 0.05) },
                  ].map((e, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}` }}>
                      <span>{e.l}</span><span style={{ fontFamily:T.mono, fontWeight:600 }}>{e.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flag button */}
              <button onClick={() => {
                setFlagged(prev => {
                  const next = new Set(prev);
                  if (next.has(selectedSig.id)) next.delete(selectedSig.id); else next.add(selectedSig.id);
                  return next;
                });
              }} style={{
                width:'100%', padding:'10px 0', borderRadius:6, fontSize:13, fontWeight:600, fontFamily:T.font, cursor:'pointer',
                border: flagged.has(selectedSig.id) ? `2px solid ${T.red}` : `1px solid ${T.border}`,
                background: flagged.has(selectedSig.id) ? T.red+'12' : T.surface,
                color: flagged.has(selectedSig.id) ? T.red : T.textSec,
              }}>
                {flagged.has(selectedSig.id) ? '⚑ Flagged for Review — Click to Remove' : '⚐ Flag for Review'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB 3: Progress Monitor ═════════════════════════ */}
      {tab === 2 && (
        <div>
          {/* Summary stats for progress */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            {statusDistribution.map((sd, i) => (
              <div key={i} style={{ ...cardShadow, borderLeft:`3px solid ${sd.color}` }}>
                <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{sd.name}</div>
                <div style={{ fontSize:26, fontWeight:700, fontFamily:T.mono, color:sd.color, marginTop:4 }}>{sd.value}</div>
                <div style={{ fontSize:10, color:T.textSec }}>{Math.round(sd.value/ALL_SIGNATORIES.length*100)}% of signatories</div>
              </div>
            ))}
          </div>

          {/* Average gap by alliance */}
          <div style={{ ...cardShadow, marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>Average Commitment vs Delivery by Alliance</div>
            <div style={{ fontSize:11, color:T.textSec, marginBottom:14 }}>Mean interim reduction target vs mean actual reduction achieved</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={avgGapByAlliance} layout="vertical" margin={{ left:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} unit="%" />
                <YAxis type="category" dataKey="alliance" tick={{ fontSize:11, fill:T.textSec }} width={60} />
                <Tooltip contentStyle={CustomTooltipStyle} formatter={(v, name) => [`${v}%`, name === 'committed' ? 'Committed' : 'Actual']} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="committed" fill={T.navy+'70'} name="Committed" radius={[0,3,3,0]} barSize={14} />
                <Bar dataKey="actual" fill={T.sage} name="Actual" radius={[0,3,3,0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gap analysis chart — top 30 */}
          <div style={{ ...cardShadow, marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>Commitment vs Delivery Gap — Top 30 Widest Gaps</div>
            <div style={{ fontSize:11, color:T.textSec, marginBottom:14 }}>
              Individual signatory committed interim reduction target (%) vs actual reduction achieved. Sorted by largest gap.
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={gapData} layout="vertical" margin={{ left:10, right:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize:10, fill:T.textSec }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:T.textSec }} width={130} />
                <Tooltip contentStyle={CustomTooltipStyle}
                  formatter={(v, name) => [`${v}%`, name === 'committed' ? 'Committed' : name === 'actual' ? 'Actual' : 'Gap']}
                  labelFormatter={(l) => { const d = gapData.find(x => x.name === l); return d ? `${d.fullName} (${d.alliance})` : l; }} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="committed" fill={T.navy+'55'} name="Committed" radius={[0,3,3,0]} barSize={9} />
                <Bar dataKey="actual" fill={T.sage} name="Actual" radius={[0,3,3,0]} barSize={9} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Emissions trend + withdrawn + laggards */}
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16 }}>
            <div style={cardShadow}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>Portfolio Emissions Index (Base Year 2020 = 100)</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Aggregate weighted emissions intensity trajectory by alliance</div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={emissionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fill:T.textSec }} />
                  <YAxis tick={{ fontSize:11, fill:T.textSec }} domain={[55,110]} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Line type="monotone" dataKey="NZAM" stroke={T.navy} strokeWidth={2} dot={{ r:3 }} name="NZAM" />
                  <Line type="monotone" dataKey="NZAOA" stroke={T.sage} strokeWidth={2} dot={{ r:3 }} name="NZAOA" />
                  <Line type="monotone" dataKey="NZBA" stroke={T.gold} strokeWidth={2} dot={{ r:3 }} name="NZBA" />
                  <Line type="monotone" dataKey="target" stroke={T.red} strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="1.5°C Pathway" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ ...cardShadow, borderLeft:`4px solid ${T.red}` }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.red, marginBottom:8 }}>Withdrawn Signatories ({withdrawnSigs.length})</div>
                {withdrawnSigs.map(w => (
                  <div key={w.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{w.name}</div>
                      <div style={{ fontSize:10, color:T.textMut }}>{w.alliance} &middot; {w.withdrawnDate}</div>
                    </div>
                    <div style={{ fontSize:10, color:T.red, maxWidth:100, textAlign:'right' }}>{w.withdrawnReason}</div>
                  </div>
                ))}
                <div style={{ fontSize:10, color:T.textMut, marginTop:8, fontStyle:'italic' }}>
                  Notable: Vanguard withdrew from NZAM in Dec 2022 citing legal and regulatory concerns, removing ~$7T in AUM from alliance coverage.
                </div>
              </div>

              <div style={{ ...cardShadow, borderLeft:`4px solid ${T.amber}`, flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.amber, marginBottom:6 }}>Laggard Alerts ({laggards.length})</div>
                <div style={{ fontSize:10, color:T.textSec, marginBottom:8 }}>Signatories achieving &lt;40% of interim commitment — potential escalation needed</div>
                <div style={{ maxHeight:200, overflowY:'auto' }}>
                  {laggards.map(l => (
                    <div key={l.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                      <div>
                        <span style={{ fontWeight:600 }}>{l.name}</span>
                        <span style={{ color:T.textMut, marginLeft:6, fontSize:10 }}>{l.alliance}</span>
                      </div>
                      <div style={{ fontFamily:T.mono, fontSize:10, display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ color:T.red }}>{l.actual}%</span>
                        <span style={{ color:T.textMut }}>/ {l.committed}%</span>
                        <span style={{ color:T.amber, fontSize:9 }}>({Math.round(l.actual/l.committed*100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB 4: Portfolio Exposure ═══════════════════════ */}
      {tab === 3 && (
        <div>
          {/* Top KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            {[
              { label:'Portfolio NZ Coverage', value:`${portfolioStats.pctCovered}%`, color: portfolioStats.pctCovered > 60 ? T.green : T.amber, sub:'of allocated AUM' },
              { label:'NZ-Committed Allocation', value:`${portfolioStats.committed}%`, sub:`of ${portfolioStats.total}% total allocation` },
              { label:'Committed Managers', value: PORTFOLIO_HOLDINGS.filter(h=>h.isNzCommitted).length, sub:`of ${PORTFOLIO_HOLDINGS.length} total managers` },
              { label:'Uncovered Managers', value: uncoveredHoldings.length, color:T.amber, sub:'engagement priority' },
            ].map((k, i) => (
              <div key={i} style={cardShadow}>
                <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>{k.label}</div>
                <div style={{ fontSize:24, fontWeight:700, fontFamily:T.mono, color:k.color||T.navy }}>{k.value}</div>
                {k.sub && <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            {/* Alliance breakdown donut */}
            <div style={cardShadow}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:14 }}>Alliance Breakdown (Portfolio Allocation %)</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={allianceDonut} dataKey="value" cx="50%" cy="50%" outerRadius={88} innerRadius={48} paddingAngle={2}>
                    {allianceDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}% allocation`} contentStyle={CustomTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
                {allianceDonut.map((d, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:T.textSec }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:d.color }} />{d.name}: {d.value}%
                  </div>
                ))}
              </div>
            </div>

            {/* Asset class coverage */}
            <div style={cardShadow}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:14 }}>NZ Coverage by Asset Class</div>
              {assetClassBreakdown.map((ac, i) => (
                <div key={i} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                    <span style={{ fontWeight:600, color:T.textSec }}>{ac.name}</span>
                    <span style={{ fontFamily:T.mono, fontSize:11, color: ac.pctCommitted > 60 ? T.green : T.amber }}>{ac.pctCommitted}% covered</span>
                  </div>
                  <div style={{ height:8, borderRadius:4, background:T.border }}>
                    <div style={{ height:8, borderRadius:4, background: ac.pctCommitted > 60 ? T.sage : T.gold, width:`${ac.pctCommitted}%`, transition:'width 0.3s' }}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut, marginTop:2 }}>
                    <span>{ac.committed}% committed</span><span>{ac.total}% total allocation</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement priority + What-if */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div style={cardShadow}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>Engagement Priority List</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Portfolio managers NOT covered by any net-zero alliance — sorted by allocation weight</div>
              <div style={{ maxHeight:320, overflowY:'auto' }}>
                {uncoveredHoldings.map((h, i) => (
                  <div key={h.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:22, height:22, borderRadius:'50%', background:T.amber+'20', color:T.amber,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>{i+1}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600 }}>{h.manager}</div>
                        <div style={{ fontSize:10, color:T.textMut }}>{fmtB(h.aumAllocated)} &middot; {h.assetClass} &middot; {h.mandate}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.amber }}>{h.allocationPct}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* What-if calculator */}
            <div style={cardShadow}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:4 }}>What-If Calculator</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>
                Estimate how portfolio NZ coverage changes if a non-committed manager joins an alliance.
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <input value={whatIfTarget} onChange={e => setWhatIfTarget(e.target.value)}
                  placeholder="Type non-committed manager name..."
                  style={{ flex:1, padding:'8px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, background:T.surface }} />
              </div>
              {whatIfTarget && !whatIfResult && (
                <div style={{ padding:12, background:T.surfaceH, borderRadius:6, fontSize:12, color:T.textMut }}>
                  No matching non-committed manager found. Try: {uncoveredHoldings.map(h => h.manager).slice(0,3).join(', ')}
                </div>
              )}
              {whatIfResult && (
                <div style={{ padding:16, background:T.surfaceH, borderRadius:8, marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>
                    If "{whatIfResult.manager}" joins NZAM:
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div style={{ padding:10, background:T.surface, borderRadius:6, textAlign:'center' }}>
                      <div style={{ fontSize:10, color:T.textMut, marginBottom:2 }}>Current Coverage</div>
                      <div style={{ fontSize:24, fontWeight:700, fontFamily:T.mono, color:T.amber }}>{whatIfResult.oldCoverage}%</div>
                    </div>
                    <div style={{ padding:10, background:T.surface, borderRadius:6, textAlign:'center' }}>
                      <div style={{ fontSize:10, color:T.textMut, marginBottom:2 }}>New Coverage</div>
                      <div style={{ fontSize:24, fontWeight:700, fontFamily:T.mono, color:T.green }}>{whatIfResult.newCoverage}%</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:T.textSec, textAlign:'center' }}>
                    +{whatIfResult.addedPct}% allocation ({fmtB(whatIfResult.aumAdded)}) would become NZ-committed
                  </div>
                  <div style={{ marginTop:10, padding:8, background:T.green+'08', borderRadius:4, fontSize:11, color:T.green, textAlign:'center' }}>
                    Coverage improvement: +{whatIfResult.newCoverage - whatIfResult.oldCoverage} percentage points
                  </div>
                </div>
              )}

              {/* Quick links for what-if */}
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:6 }}>Quick scenario picks:</div>
                {uncoveredHoldings.slice(0, 4).map(h => (
                  <button key={h.id} onClick={() => setWhatIfTarget(h.manager)}
                    style={{ display:'block', width:'100%', textAlign:'left', padding:'6px 8px', marginBottom:4,
                      borderRadius:4, border:`1px solid ${T.border}`, background: whatIfTarget === h.manager ? T.surfaceH : T.surface,
                      cursor:'pointer', fontSize:11, fontFamily:T.font, color:T.textSec }}>
                    {h.manager} — {h.allocationPct}% allocation
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Full holdings table + export */}
          <div style={cardShadow}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy }}>Complete Holdings Coverage</div>
                <div style={{ fontSize:11, color:T.textSec }}>All portfolio managers with net-zero commitment status</div>
              </div>
              <button onClick={handleExportCSV} style={{ ...btn(false), fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                ↓ Export Exposure Report CSV
              </button>
            </div>
            <div style={{ maxHeight:350, overflowY:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                <thead style={{ position:'sticky', top:0, background:T.surface, zIndex:2 }}>
                  <tr style={{ background:T.surfaceH }}>
                    {['Manager','Alloc %','AUM','Alliance','Asset Class','Mandate','Status'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'8px 8px', fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, fontSize:10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO_HOLDINGS.sort((a,b) => b.allocationPct - a.allocationPct).map(h => (
                    <tr key={h.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'7px 8px', fontWeight:500 }}>{h.manager}</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono, fontSize:10 }}>{h.allocationPct}%</td>
                      <td style={{ padding:'7px 8px', fontFamily:T.mono, fontSize:10 }}>{fmtB(h.aumAllocated)}</td>
                      <td style={{ padding:'7px 8px' }}>
                        {h.alliance ? <span style={{ ...pillBase, fontSize:9, background: ALLIANCE_COLORS[h.alliance]+'18', color: ALLIANCE_COLORS[h.alliance] }}>{h.alliance}</span> : <span style={{ color:T.textMut }}>—</span>}
                      </td>
                      <td style={{ padding:'7px 8px', fontSize:10, color:T.textSec }}>{h.assetClass}</td>
                      <td style={{ padding:'7px 8px', fontSize:10, color:T.textSec }}>{h.mandate}</td>
                      <td style={{ padding:'7px 8px' }}>
                        <span style={statusPill(h.isNzCommitted ? 'On-Track' : 'No Target')}>
                          {h.isNzCommitted ? 'Committed' : 'Not Committed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:32, padding:'16px 0', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10, color:T.textMut }}>
          EP-AL4 Net Zero Commitment Tracker &middot; Data as of March 2026 &middot; Sources: NZAM, NZAOA, NZBA public disclosures &middot; GFANZ reporting framework
        </span>
        <span style={{ fontSize:10, color:T.textMut }}>
          {ALL_SIGNATORIES.length} signatories &middot; 3 alliances &middot; ${totalAum}T combined AUM &middot; {withdrawnSigs.length} withdrawn
        </span>
      </div>
    </div>
  );
}
