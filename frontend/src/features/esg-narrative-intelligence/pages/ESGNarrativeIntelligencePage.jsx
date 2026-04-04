import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg: '#f6f4f0', surface: '#ffffff', surfaceH: '#f0ede7', border: '#e5e0d8',
  borderL: '#d5cfc5', navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a',
  goldL: '#d4be8a', sage: '#5a8a6a', sageL: '#7ba67d', teal: '#5a8a6a',
  text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae', red: '#dc2626',
  green: '#16a34a', amber: '#d97706', blue: '#2563eb', orange: '#ea580c',
  purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

// ── Seeded Random ─────────────────────────────────────────────────────────────
function sr(s) { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); }

// ── Static Data ───────────────────────────────────────────────────────────────
const YEARS = [2020, 2021, 2022, 2023, 2024];
const TOPICS = [
  { key: 'climate_transition', label: 'Climate Transition' },
  { key: 'net_zero_targets', label: 'Net Zero Targets' },
  { key: 'scope3_supply_chain', label: 'Scope 3 / Supply Chain' },
  { key: 'biodiversity_nature', label: 'Biodiversity & Nature' },
  { key: 'just_transition', label: 'Just Transition' },
  { key: 'water_stewardship', label: 'Water Stewardship' },
  { key: 'circular_economy', label: 'Circular Economy' },
  { key: 'human_rights_supply', label: 'Human Rights Supply Chain' },
  { key: 'board_diversity', label: 'Board Diversity' },
  { key: 'executive_pay_esg_link', label: 'Exec Pay–ESG Link' },
  { key: 'regulatory_compliance', label: 'Regulatory Compliance' },
  { key: 'innovation_greentech', label: 'Innovation / GreenTech' },
];

const COMPANIES_RAW = [
  { name: 'TotalEnergies SE', sector: 'Oil & Gas', ticker: 'TTE' },
  { name: 'Unilever PLC', sector: 'Consumer Goods', ticker: 'ULVR' },
  { name: 'HSBC Holdings', sector: 'Financial Services', ticker: 'HSBA' },
  { name: 'Rio Tinto Group', sector: 'Mining', ticker: 'RIO' },
  { name: 'Siemens AG', sector: 'Industrials', ticker: 'SIE' },
  { name: 'Nestlé SA', sector: 'Food & Beverage', ticker: 'NESN' },
  { name: 'BP plc', sector: 'Oil & Gas', ticker: 'BP' },
  { name: 'Danone SA', sector: 'Food & Beverage', ticker: 'BN' },
  { name: 'Volkswagen AG', sector: 'Automotive', ticker: 'VOW3' },
  { name: 'AXA Group', sector: 'Insurance', ticker: 'CS' },
];

function buildCompanies() {
  return COMPANIES_RAW.map((c, ci) => {
    const yearData = {};
    YEARS.forEach((yr, yi) => {
      const base = ci * 100 + yi * 10;
      const topicProminence = {};
      TOPICS.forEach((t, ti) => {
        topicProminence[t.key] = 0.2 + sr(base + ti + 1) * 0.75;
      });
      yearData[yr] = {
        narrativeSentiment: (sr(base + 7) - 0.3) * 1.6,
        readabilityScore: 30 + sr(base + 3) * 55,
        jargonDensity: 0.15 + sr(base + 4) * 0.45,
        quantifiedClaimsPct: 0.2 + sr(base + 5) * 0.6,
        topicProminence,
      };
    });

    const COMMITMENT_TARGETS = [
      'Net Zero by 2050', 'Scope 1+2 -50% by 2030', 'Scope 3 -30% by 2035',
      '100% Renewable Energy by 2030', 'Zero Deforestation by 2025',
      'Water Neutral by 2030', 'Circular Packaging 100% by 2025',
      'Living Wage across supply chain by 2026', 'Board 40% women by 2025',
      'Zero Waste to Landfill by 2030',
    ];
    const statuses = ['on_track', 'at_risk', 'breached', 'achieved'];
    const commitments = Array.from({ length: 4 + Math.floor(sr(ci * 31 + 7) * 3) }, (_, i) => {
      const sid = ci * 50 + i * 7;
      return {
        id: `${c.ticker}-C${i}`,
        target: COMMITMENT_TARGETS[(ci + i * 3) % COMMITMENT_TARGETS.length],
        yearSet: 2019 + Math.floor(sr(sid) * 3),
        deadline: 2025 + Math.floor(sr(sid + 1) * 26),
        progressPct: Math.round(sr(sid + 2) * 100),
        status: statuses[Math.floor(sr(sid + 3) * 4)],
        restatement: sr(sid + 4) > 0.75,
        originalTarget: sr(sid + 5) > 0.75 ? 'Originally -40% by 2028; revised to -30% by 2030' : null,
        ambitionScore: Math.round(40 + sr(sid + 6) * 55),
      };
    });

    const CONTROVERSY_EVENTS = [
      'Accused of greenwashing in sustainability report by InfluenceMap',
      'Regulator fined company for misleading net-zero advertising claims',
      'NGO report linked supply chain to Amazon deforestation hotspots',
      'Whistleblower alleged internal carbon accounting irregularities',
      'Media investigation revealed lobbying against EU carbon pricing',
      'ShareAction flagged inadequate Scope 3 disclosure at AGM',
      'Carbon Tracker report challenged feasibility of net-zero pathway',
    ];
    const SOURCES = ['NGO', 'Media', 'Regulator'];
    const RESPONSES = [
      'We are reviewing our methodology and will publish an update in Q2.',
      'We reject these characterizations and stand by our reported figures.',
      'We have engaged an independent auditor to review the allegations.',
      'We are committed to full transparency and will enhance disclosures.',
    ];
    const numControversies = Math.floor(sr(ci * 17 + 3) * 3.5);
    const controversies = Array.from({ length: numControversies }, (_, i) => {
      const sid = ci * 200 + i * 13;
      return {
        id: `${c.ticker}-V${i}`,
        year: 2020 + Math.floor(sr(sid) * 5),
        event: CONTROVERSY_EVENTS[(ci + i * 2) % CONTROVERSY_EVENTS.length],
        severity: ['low', 'medium', 'high'][Math.floor(sr(sid + 1) * 3)],
        companyResponse: RESPONSES[(ci + i) % RESPONSES.length],
        source: SOURCES[Math.floor(sr(sid + 2) * 3)],
        responseQuality: Math.round(25 + sr(sid + 3) * 70),
      };
    });

    return { ...c, yearData, commitments, controversies };
  });
}

const COMPANIES = buildCompanies();

const ESG_TERMS = [
  'net-zero', 'decarbonization', 'materiality', 'double-materiality', 'CSRD',
  'TCFD', 'Scope 3', 'just transition', 'biodiversity', 'stewardship',
  'circularity', 'greenwashing', 'transition finance', 'stranded assets',
  'science-based targets', 'Paris-aligned', 'supply chain due diligence',
  'disclosure', 'taxonomy', 'sustainable finance',
];

// ── Shared UI Components ──────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, ...style }}>
    {children}
  </div>
);

const Badge = ({ label, color = T.navy }) => (
  <span style={{
    background: color + '18', color, border: `1px solid ${color}40`,
    borderRadius: 4, padding: '2px 8px', fontSize: 11, fontFamily: T.mono,
    fontWeight: 600, whiteSpace: 'nowrap',
  }}>{label}</span>
);

const StatusBadge = ({ status }) => {
  const map = {
    on_track: { label: 'On Track', color: T.green },
    at_risk: { label: 'At Risk', color: T.amber },
    breached: { label: 'Breached', color: T.red },
    achieved: { label: 'Achieved', color: T.navy },
  };
  const { label, color } = map[status] || { label: status, color: T.textMut };
  return <Badge label={label} color={color} />;
};

const SeverityBadge = ({ severity }) => {
  const map = { low: T.sage, medium: T.amber, high: T.red };
  return <Badge label={severity.toUpperCase()} color={map[severity] || T.textMut} />;
};

const SourceBadge = ({ source }) => {
  const map = { NGO: T.purple, Media: T.blue, Regulator: T.red };
  return <Badge label={source} color={map[source] || T.navy} />;
};

const MetricCard = ({ label, value, sub, color = T.navy }) => (
  <Card style={{ flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: T.mono, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </Card>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.mono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 6 }}>
    {children}
  </div>
);

const CompanySelector = ({ selected, onChange }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
    {COMPANIES.map(c => (
      <button key={c.ticker} onClick={() => onChange(c.ticker)}
        style={{
          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: T.mono,
          fontWeight: selected === c.ticker ? 700 : 400,
          background: selected === c.ticker ? T.navy : T.surface,
          color: selected === c.ticker ? '#fff' : T.textSec,
          border: `1px solid ${selected === c.ticker ? T.navy : T.border}`,
        }}>
        {c.ticker}
      </button>
    ))}
  </div>
);

const ProgressBar = ({ pct, color = T.navy }) => (
  <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden', flex: 1 }}>
    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '10px 14px', fontSize: 12, fontFamily: T.mono, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: T.navy }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>
      ))}
    </div>
  );
};

// ── Tab 1: Narrative Arc Overview ─────────────────────────────────────────────
function Tab1({ company }) {
  const sentimentArc = useMemo(() => YEARS.map(yr => ({
    year: yr,
    sentiment: +company.yearData[yr].narrativeSentiment.toFixed(3),
    readability: +company.yearData[yr].readabilityScore.toFixed(1),
  })), [company]);

  const dna = useMemo(() => {
    const sentiments = YEARS.map(yr => company.yearData[yr].narrativeSentiment);
    const diffs = sentiments.slice(1).map((v, i) => v - sentiments[i]);
    const trend = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const variance = sentiments.reduce((acc, v) => {
      const m = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      return acc + Math.pow(v - m, 2);
    }, 0) / sentiments.length;
    const coherence = Math.round(Math.max(0, 100 - variance * 180));
    const avgQ = YEARS.reduce((a, yr) => a + company.yearData[yr].quantifiedClaimsPct, 0) / YEARS.length;
    return {
      coherence,
      strategicConsistency: Math.round(60 + coherence * 0.3),
      quantificationRate: Math.round(avgQ * 100),
      sentimentTrend: trend > 0.05 ? 'Improving' : trend < -0.05 ? 'Declining' : 'Stable',
      trendColor: trend > 0.05 ? T.green : trend < -0.05 ? T.red : T.amber,
    };
  }, [company]);

  const controversyYears = useMemo(() => company.controversies.map(v => v.year), [company]);

  const topicShifts = useMemo(() => {
    const shifts = [];
    TOPICS.forEach(t => {
      const p2020 = company.yearData[2020].topicProminence[t.key];
      const p2022 = company.yearData[2022].topicProminence[t.key];
      const p2024 = company.yearData[2024].topicProminence[t.key];
      if (Math.abs(p2022 - p2020) > 0.25 || Math.abs(p2024 - p2022) > 0.25) {
        shifts.push({ topic: t.label, from: p2020, to: p2024, delta: p2024 - p2020 });
      }
    });
    return shifts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
  }, [company]);

  const topTopicByYear = useMemo(() => YEARS.map(yr => {
    const tp = company.yearData[yr].topicProminence;
    const top = Object.entries(tp).sort((a, b) => b[1] - a[1])[0];
    const topicLabel = TOPICS.find(t => t.key === top[0])?.label || top[0];
    return { year: yr, topic: topicLabel };
  }), [company]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* DNA Scorecards */}
      <div>
        <SectionTitle>Narrative DNA — {company.name}</SectionTitle>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <MetricCard label="COHERENCE" value={dna.coherence} sub="0–100 scale" color={T.navy} />
          <MetricCard label="STRATEGIC CONSISTENCY" value={dna.strategicConsistency} sub="0–100 scale" color={T.navyL} />
          <MetricCard label="QUANTIFICATION RATE" value={`${dna.quantificationRate}%`} sub="claims with numbers" color={T.sage} />
          <MetricCard label="SENTIMENT TREND" value={dna.sentimentTrend} sub="2020–2024 arc" color={dna.trendColor} />
        </div>
      </div>

      {/* Sentiment Area Chart */}
      <Card>
        <SectionTitle>5-Year Sentiment Arc — Compound Narrative Score</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={sentimentArc} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.navy} stopOpacity={0.25} />
                <stop offset="95%" stopColor={T.navy} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
            <YAxis domain={[-1, 1]} tickFormatter={v => v.toFixed(1)} tick={{ fontSize: 11, fontFamily: T.mono }} />
            <Tooltip content={<CustomTooltip />} />
            {controversyYears.map((yr, i) => (
              <ReferenceLine key={i} x={yr} stroke={T.red} strokeDasharray="4 3" label={{ value: 'C', position: 'top', fontSize: 10, fill: T.red, fontFamily: T.mono }} />
            ))}
            <Area type="monotone" dataKey="sentiment" name="Sentiment" stroke={T.navy} strokeWidth={2} fill="url(#sentGrad)" dot={{ r: 4, fill: T.navy }} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginTop: 8 }}>Red dashed lines mark controversy years.</div>
      </Card>

      {/* Topic Prominence Heatmap */}
      <Card>
        <SectionTitle>Topic Prominence Heatmap (Rows = Year, Cols = Topic)</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11, fontFamily: T.mono }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: T.textMut, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Year</th>
                {TOPICS.map(t => (
                  <th key={t.key} style={{ padding: '6px 6px', textAlign: 'center', color: T.textSec, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 10, maxWidth: 60 }}>
                    {t.label.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YEARS.map(yr => (
                <tr key={yr}>
                  <td style={{ padding: '5px 10px', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.surfaceH}` }}>{yr}</td>
                  {TOPICS.map(t => {
                    const val = company.yearData[yr].topicProminence[t.key];
                    const intensity = Math.round(val * 200);
                    const bg = `rgba(27,58,92,${val * 0.75})`;
                    return (
                      <td key={t.key} style={{ padding: '5px 6px', textAlign: 'center', background: bg, color: val > 0.5 ? '#fff' : T.textSec, borderBottom: `1px solid ${T.surfaceH}`, fontWeight: 600 }}>
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Narrative Shift Callouts */}
      <Card>
        <SectionTitle>Key Narrative Shifts</SectionTitle>
        {topTopicByYear.map((d, i) => i > 0 && topTopicByYear[i - 1].topic !== d.topic ? (
          <div key={d.year} style={{ padding: '8px 12px', background: T.surfaceH, borderLeft: `3px solid ${T.gold}`, borderRadius: 4, marginBottom: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 700, fontFamily: T.mono, color: T.navy }}>{d.year}</span>
            <span style={{ color: T.textSec }}> — <strong>{d.topic}</strong> displaced <strong>{topTopicByYear[i - 1].topic}</strong> as the #1 narrative topic.</span>
          </div>
        ) : null)}
        {topicShifts.map((s, i) => (
          <div key={i} style={{ padding: '8px 12px', background: T.surfaceH, borderLeft: `3px solid ${s.delta > 0 ? T.sage : T.red}`, borderRadius: 4, marginBottom: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 700, fontFamily: T.mono, color: T.navy }}>{s.topic}</span>
            <span style={{ color: T.textSec }}> prominence shifted from <strong>{s.from.toFixed(2)}</strong> → <strong>{s.to.toFixed(2)}</strong> ({s.delta > 0 ? '+' : ''}{(s.delta * 100).toFixed(0)} pp over 5 years)</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Tab 2: Topic Trajectory ───────────────────────────────────────────────────
function Tab2({ company }) {
  const [selectedTopics, setSelectedTopics] = useState(['climate_transition', 'net_zero_targets', 'biodiversity_nature', 'scope3_supply_chain']);

  const toggleTopic = (key) => {
    setSelectedTopics(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : prev.length < 4 ? [...prev, key] : prev
    );
  };

  const TOPIC_COLORS = [T.navy, T.gold, T.sage, T.red, T.purple, T.orange, T.blue, T.amber];

  const trendData = useMemo(() => YEARS.map(yr => {
    const row = { year: yr };
    selectedTopics.forEach(key => { row[key] = +company.yearData[yr].topicProminence[key].toFixed(3); });
    return row;
  }), [company, selectedTopics]);

  const sectorPeerData = useMemo(() => {
    const peers = COMPANIES.filter(c => c.sector === company.sector && c.ticker !== company.ticker);
    return TOPICS.map(t => {
      const peerAvg = peers.length > 0
        ? peers.reduce((a, c) => a + c.yearData[2024].topicProminence[t.key], 0) / peers.length
        : 0.5;
      return {
        topic: t.label.split(' ').slice(0, 2).join(' '),
        company: +company.yearData[2024].topicProminence[t.key].toFixed(3),
        sectorAvg: +peerAvg.toFixed(3),
      };
    });
  }, [company]);

  const driftTable = useMemo(() => [
    { topic: 'Climate Transition', oldFraming: 'Risk management & compliance lens', newFraming: 'Strategic opportunity & capital allocation lens', shiftYear: 2022, severity: 'Major' },
    { topic: 'Net Zero Targets', oldFraming: 'Aspiration with no interim milestones', newFraming: 'Science-based 2030 interim targets with accountability', shiftYear: 2023, severity: 'Major' },
    { topic: 'Regulatory Compliance', oldFraming: '#1 dominant topic (defensive posture)', newFraming: 'Subordinated to proactive ESG narrative', shiftYear: 2022, severity: 'Moderate' },
    { topic: 'Biodiversity', oldFraming: 'Marginal mention in environmental chapter', newFraming: 'Dedicated section with TNFD-aligned disclosures', shiftYear: 2023, severity: 'Emerging' },
  ], []);

  const risingTopics = useMemo(() => TOPICS.filter(t => {
    const p2022 = company.yearData[2022].topicProminence[t.key];
    const p2024 = company.yearData[2024].topicProminence[t.key];
    return (p2024 - p2022) > 0.2;
  }), [company]);

  const radarData = useMemo(() => TOPICS.map(t => ({
    topic: t.label.split(' ')[0],
    value: +company.yearData[2024].topicProminence[t.key].toFixed(3),
  })), [company]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Topic selector */}
      <Card>
        <SectionTitle>Topic Prominence Trajectory (Select up to 4 Topics)</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {TOPICS.map((t, i) => (
            <button key={t.key} onClick={() => toggleTopic(t.key)}
              style={{
                padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: T.mono,
                background: selectedTopics.includes(t.key) ? TOPIC_COLORS[selectedTopics.indexOf(t.key) % 8] : T.surface,
                color: selectedTopics.includes(t.key) ? '#fff' : T.textSec,
                border: `1px solid ${selectedTopics.includes(t.key) ? TOPIC_COLORS[selectedTopics.indexOf(t.key) % 8] : T.border}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 11, fontFamily: T.mono }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
            {selectedTopics.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} name={TOPICS.find(t => t.key === key)?.label}
                stroke={TOPIC_COLORS[i % 8]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Rising Topics + Drift Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Rising Narrative Topics (2022 → 2024, +20pp)</SectionTitle>
          {risingTopics.length === 0 ? (
            <div style={{ color: T.textMut, fontSize: 13 }}>No topics with >20pp rise for this company.</div>
          ) : risingTopics.map(t => {
            const delta = company.yearData[2024].topicProminence[t.key] - company.yearData[2022].topicProminence[t.key];
            return (
              <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.text }}>{t.label}</span>
                <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.green, fontSize: 13 }}>+{(delta * 100).toFixed(0)} pp</span>
              </div>
            );
          })}
        </Card>
        <Card>
          <SectionTitle>2024 Radar — Topic Prominence</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="topic" tick={{ fontSize: 9, fontFamily: T.mono, fill: T.textSec }} />
              <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
              <Radar name="Prominence" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Topic Drift Table */}
      <Card>
        <SectionTitle>Topic Drift Detector — Framing Shifts</SectionTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Topic', 'Old Framing (pre-shift)', 'New Framing (post-shift)', 'Shift Year', 'Severity'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontFamily: T.mono, fontSize: 11, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {driftTable.map((d, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: T.navy, fontFamily: T.mono, fontSize: 12 }}>{d.topic}</td>
                <td style={{ padding: '8px 12px', color: T.textSec, fontSize: 12 }}>{d.oldFraming}</td>
                <td style={{ padding: '8px 12px', color: T.text, fontSize: 12 }}>{d.newFraming}</td>
                <td style={{ padding: '8px 12px', fontFamily: T.mono, color: T.navy, textAlign: 'center' }}>{d.shiftYear}</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <Badge label={d.severity} color={d.severity === 'Major' ? T.red : d.severity === 'Moderate' ? T.amber : T.sage} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Sector Comparison Bar Chart */}
      <Card>
        <SectionTitle>Sector Peer Comparison — Topic Prominence 2024</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sectorPeerData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="topic" tick={{ fontSize: 9, fontFamily: T.mono, angle: -30, textAnchor: 'end' }} interval={0} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 11, fontFamily: T.mono }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
            <Bar dataKey="company" name={company.ticker} fill={T.navy} radius={[3, 3, 0, 0]} />
            <Bar dataKey="sectorAvg" name="Sector Avg" fill={T.goldL} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ── Tab 3: Commitment Tracker ─────────────────────────────────────────────────
function Tab3({ company }) {
  const avgAmbition = useMemo(() => {
    const scores = company.commitments.map(c => c.ambitionScore);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [company]);

  const restatements = useMemo(() => company.commitments.filter(c => c.restatement), [company]);

  const statusCounts = useMemo(() => {
    const counts = { on_track: 0, at_risk: 0, breached: 0, achieved: 0 };
    company.commitments.forEach(c => counts[c.status]++);
    return counts;
  }, [company]);

  const ganttData = useMemo(() => company.commitments.map(c => ({
    ...c,
    span: c.deadline - c.yearSet,
    offset: c.yearSet - 2019,
  })), [company]);

  const statusColor = { on_track: T.green, at_risk: T.amber, breached: T.red, achieved: T.navy };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <MetricCard label="TOTAL COMMITMENTS" value={company.commitments.length} sub="tracked targets" />
        <MetricCard label="ON TRACK" value={statusCounts.on_track} color={T.green} />
        <MetricCard label="AT RISK" value={statusCounts.at_risk} color={T.amber} />
        <MetricCard label="BREACHED" value={statusCounts.breached} color={T.red} />
        <MetricCard label="ACHIEVED" value={statusCounts.achieved} color={T.navy} />
        <MetricCard label="AVG AMBITION SCORE" value={avgAmbition} sub="vs. sector baseline" color={avgAmbition > 70 ? T.green : T.amber} />
      </div>

      {/* Commitment Cards */}
      <Card>
        <SectionTitle>Commitment Cards</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {company.commitments.map(c => (
            <div key={c.id} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14 }}>{c.target}</div>
                  <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginTop: 2 }}>Set {c.yearSet} · Deadline {c.deadline}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <StatusBadge status={c.status} />
                  {c.restatement && <Badge label="RESTATED" color={T.red} />}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ProgressBar pct={c.progressPct} color={statusColor[c.status]} />
                <span style={{ fontSize: 12, fontFamily: T.mono, fontWeight: 700, color: T.textSec, minWidth: 36 }}>{c.progressPct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: T.textMut }}>
                <span>Ambition Score: <strong style={{ color: c.ambitionScore > 70 ? T.green : T.amber }}>{c.ambitionScore}/100</strong></span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <SectionTitle>Commitment Timeline (Gantt View, 2019–2055)</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          {ganttData.map(c => {
            const totalSpan = 36; // 2019–2055
            const leftPct = ((c.yearSet - 2019) / totalSpan) * 100;
            const widthPct = (c.span / totalSpan) * 100;
            const progressX = leftPct + (widthPct * c.progressPct / 100);
            return (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono, marginBottom: 3 }}>
                  {c.target.slice(0, 40)}{c.target.length > 40 ? '…' : ''}
                </div>
                <div style={{ position: 'relative', height: 18, background: T.border, borderRadius: 4, overflow: 'visible' }}>
                  <div style={{
                    position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                    height: '100%', background: statusColor[c.status] + '70',
                    borderRadius: 4, border: `1px solid ${statusColor[c.status]}`,
                  }} />
                  <div style={{
                    position: 'absolute', left: `${progressX}%`, top: -2, width: 4, height: 22,
                    background: statusColor[c.status], borderRadius: 2,
                  }} />
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: T.mono, color: T.textMut, marginTop: 4 }}>
            {[2019, 2025, 2030, 2035, 2040, 2045, 2050, 2055].map(y => <span key={y}>{y}</span>)}
          </div>
        </div>
      </Card>

      {/* Restatement Analysis */}
      {restatements.length > 0 && (
        <Card>
          <SectionTitle>Restatement Analysis</SectionTitle>
          {restatements.map(c => (
            <div key={c.id} style={{ padding: '10px 14px', background: '#dc262610', border: `1px solid ${T.red}40`, borderRadius: 6, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{c.target}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>
                {c.originalTarget || 'Original target details withheld — reviewed in 2022 reporting cycle.'}
              </div>
              <div style={{ fontSize: 11, fontFamily: T.mono, color: T.red }}>
                Credibility Impact: Restatement reduces ESG narrative credibility score by est. -8 to -12 pts
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Tab 4: Controversy & Credibility ─────────────────────────────────────────
function Tab4({ company }) {
  const sorted = useMemo(() => [...company.controversies].sort((a, b) => a.year - b.year), [company]);

  const credibilityData = useMemo(() => YEARS.map(yr => {
    const controversiesThisYear = company.controversies.filter(v => v.year === yr);
    const impactScore = controversiesThisYear.reduce((acc, v) => acc + (v.severity === 'high' ? 0.25 : v.severity === 'medium' ? 0.12 : 0.06), 0);
    return {
      year: yr,
      credibility: +Math.max(0.1, company.yearData[yr].narrativeSentiment - impactScore).toFixed(3),
      raw: +company.yearData[yr].narrativeSentiment.toFixed(3),
    };
  }), [company]);

  const recoveryYears = useMemo(() => {
    if (company.controversies.length === 0) return null;
    const firstControversy = company.controversies.sort((a, b) => a.year - b.year)[0];
    const sentAfter = company.yearData[Math.min(firstControversy.year + 1, 2024)]?.narrativeSentiment || 0;
    const sentBefore = company.yearData[Math.max(firstControversy.year - 1, 2020)]?.narrativeSentiment || 0;
    return sentAfter > sentBefore ? 1 : 2;
  }, [company]);

  const WATCHLISTS = [
    { name: 'InfluenceMap Carbon Majors', sectors: ['Oil & Gas'] },
    { name: 'ShareAction Voting Tracker', sectors: ['Financial Services', 'Insurance'] },
    { name: 'Global Witness Deforestation Index', sectors: ['Food & Beverage', 'Consumer Goods'] },
    { name: 'Transition Pathway Initiative Laggards', sectors: ['Oil & Gas', 'Mining', 'Automotive'] },
  ];
  const onWatchlist = WATCHLISTS.filter(w => w.sectors.includes(company.sector));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Watchlist Signals */}
      {onWatchlist.length > 0 && (
        <Card style={{ borderLeft: `4px solid ${T.red}` }}>
          <SectionTitle>NGO Watchlist Signals</SectionTitle>
          {onWatchlist.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <Badge label="WATCHLIST" color={T.red} />
              <span style={{ fontSize: 13, color: T.text }}>{w.name}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Controversy Timeline */}
      <Card>
        <SectionTitle>Controversy Timeline — {company.controversies.length} Events</SectionTitle>
        {sorted.length === 0 ? (
          <div style={{ color: T.textMut, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No controversies recorded for this company.</div>
        ) : sorted.map(v => (
          <div key={v.id} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ minWidth: 48, fontFamily: T.mono, fontWeight: 700, color: T.navy, fontSize: 14 }}>{v.year}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <SeverityBadge severity={v.severity} />
                <SourceBadge source={v.source} />
              </div>
              <div style={{ fontSize: 13, color: T.text, marginBottom: 6 }}>{v.event}</div>
              <div style={{ fontSize: 12, color: T.textSec, fontStyle: 'italic', borderLeft: `2px solid ${T.borderL}`, paddingLeft: 8 }}>
                "{v.companyResponse}"
              </div>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginTop: 4 }}>
                Response Quality: <strong style={{ color: v.responseQuality > 60 ? T.green : v.responseQuality > 40 ? T.amber : T.red }}>{v.responseQuality}/100</strong>
                {v.responseQuality < 40 ? ' — Vague/Defensive' : v.responseQuality < 65 ? ' — Partially Committed' : ' — Specific & Committed'}
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Credibility Impact Chart */}
      <Card>
        <SectionTitle>Credibility Impact Analysis — Adjusted vs. Raw Sentiment</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={credibilityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rawGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.navy} stopOpacity={0.2} />
                <stop offset="95%" stopColor={T.navy} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="adjGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.red} stopOpacity={0.2} />
                <stop offset="95%" stopColor={T.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
            <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fontFamily: T.mono }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: T.mono }} />
            {company.controversies.map((v, i) => (
              <ReferenceLine key={i} x={v.year} stroke={T.red} strokeDasharray="4 3" strokeOpacity={0.6} />
            ))}
            <Area type="monotone" dataKey="raw" name="Raw Sentiment" stroke={T.navy} fill="url(#rawGrad)" strokeWidth={2} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="credibility" name="Credibility-Adj." stroke={T.red} fill="url(#adjGrad)" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
        {recoveryYears && (
          <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.mono, marginTop: 8 }}>
            Recovery trajectory post first controversy: estimated <strong>{recoveryYears} year(s)</strong> to narrative sentiment recovery.
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Tab 5: Linguistic Intelligence ───────────────────────────────────────────
function Tab5({ company }) {
  const [selectedYear, setSelectedYear] = useState(2024);

  const linguisticData = useMemo(() => YEARS.map(yr => ({
    year: yr,
    readability: +company.yearData[yr].readabilityScore.toFixed(1),
    jargon: +(company.yearData[yr].jargonDensity * 100).toFixed(1),
    quantified: +(company.yearData[yr].quantifiedClaimsPct * 100).toFixed(1),
  })), [company]);

  const wordCloudTerms = useMemo(() => {
    const base = COMPANIES.findIndex(c => c.ticker === company.ticker) * 1000 + selectedYear * 7;
    return ESG_TERMS.map((term, i) => ({
      term,
      freq: Math.round(15 + sr(base + i * 3) * 85),
    })).sort((a, b) => b.freq - a.freq).slice(0, 20);
  }, [company, selectedYear]);

  const maxFreq = Math.max(...wordCloudTerms.map(t => t.freq));

  const scatterData = useMemo(() => COMPANIES.map((c, ci) => ({
    name: c.ticker,
    x: +(c.yearData[2024].jargonDensity).toFixed(3),
    y: +(c.yearData[2024].readabilityScore).toFixed(1),
    isSelf: c.ticker === company.ticker,
  })), [company]);

  const csrdNote = `After CSRD entered into force (2023), most companies' readability scores declined as legal boilerplate and technical disclosures expanded. Jargon density increased on average by +8pp sector-wide.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Readability Trend */}
      <Card>
        <SectionTitle>Readability Score Trend — 2020–2024</SectionTitle>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{csrdNote}</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={linguisticData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={T.sage} stopOpacity={0.3} />
                <stop offset="95%" stopColor={T.sage} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontFamily: T.mono }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={2023} stroke={T.gold} strokeDasharray="5 3" label={{ value: 'CSRD', position: 'top', fontSize: 10, fill: T.gold, fontFamily: T.mono }} />
            <Area type="monotone" dataKey="readability" name="Readability" stroke={T.sage} fill="url(#readGrad)" strokeWidth={2} dot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Jargon + Quantification */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>Jargon Density by Year (%)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={linguisticData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 11, fontFamily: T.mono }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="jargon" name="Jargon Density %" radius={[3, 3, 0, 0]}>
                {linguisticData.map((d, i) => (
                  <Cell key={i} fill={d.jargon > 40 ? T.red : d.jargon > 28 ? T.amber : T.sage} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>Quantified Claims % by Year</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={linguisticData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: T.mono }} />
              <YAxis tick={{ fontSize: 11, fontFamily: T.mono }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantified" name="Quantified Claims %" fill={T.navy} radius={[3, 3, 0, 0]}>
                {linguisticData.map((d, i) => (
                  <Cell key={i} fill={d.quantified > 60 ? T.green : d.quantified > 40 ? T.navyL : T.navy} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Word Cloud Simulation */}
      <Card>
        <SectionTitle>Top 20 ESG Terms — Simulated Frequency Distribution</SectionTitle>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {YEARS.map(yr => (
            <button key={yr} onClick={() => setSelectedYear(yr)}
              style={{
                padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontFamily: T.mono, fontSize: 12,
                background: selectedYear === yr ? T.navy : T.surface,
                color: selectedYear === yr ? '#fff' : T.textSec,
                border: `1px solid ${selectedYear === yr ? T.navy : T.border}`,
              }}>{yr}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '10px 0' }}>
          {wordCloudTerms.map((t, i) => {
            const fontSize = 11 + Math.round((t.freq / maxFreq) * 22);
            const colors = [T.navy, T.sage, T.gold, T.navyL, T.purple, T.teal, T.amber];
            return (
              <span key={t.term} style={{
                fontSize, fontFamily: T.font, fontWeight: fontSize > 24 ? 700 : fontSize > 18 ? 600 : 400,
                color: colors[i % colors.length], cursor: 'default',
                opacity: 0.75 + (t.freq / maxFreq) * 0.25,
              }}>
                {t.term}
              </span>
            );
          })}
        </div>
      </Card>

      {/* Peer Scatter — Jargon vs Readability */}
      <Card>
        <SectionTitle>Peer Linguistic Benchmark — Jargon Density vs. Readability (2024)</SectionTitle>
        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 8 }}>
          Best quadrant: Low Jargon (left) + High Readability (top) · Highlighted = selected company
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="x" name="Jargon Density" type="number" domain={[0.1, 0.7]} tick={{ fontSize: 11, fontFamily: T.mono }} label={{ value: 'Jargon Density', position: 'bottom', fontSize: 11, fill: T.textMut, fontFamily: T.mono }} />
            <YAxis dataKey="y" name="Readability" type="number" domain={[20, 90]} tick={{ fontSize: 11, fontFamily: T.mono }} label={{ value: 'Readability', angle: -90, position: 'insideLeft', fontSize: 11, fill: T.textMut, fontFamily: T.mono }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, fontFamily: T.mono }}>
                  <div style={{ fontWeight: 700, color: T.navy }}>{d?.name}</div>
                  <div>Jargon: {(d?.x * 100).toFixed(1)}%</div>
                  <div>Readability: {d?.y?.toFixed(1)}</div>
                </div>
              );
            }} />
            <ReferenceLine x={0.4} stroke={T.borderL} strokeDasharray="6 3" />
            <ReferenceLine y={55} stroke={T.borderL} strokeDasharray="6 3" />
            <Scatter data={scatterData} shape={(props) => {
              const { cx, cy, payload } = props;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={payload.isSelf ? 9 : 6}
                    fill={payload.isSelf ? T.gold : T.navy}
                    stroke={payload.isSelf ? T.navy : 'none'}
                    strokeWidth={payload.isSelf ? 2 : 0}
                    opacity={0.85}
                  />
                  <text x={cx + 11} y={cy + 4} fontSize={10} fontFamily={T.mono} fill={payload.isSelf ? T.navy : T.textSec} fontWeight={payload.isSelf ? 700 : 400}>
                    {payload.name}
                  </text>
                </g>
              );
            }} />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>Top-Left: <strong style={{ color: T.green }}>Best</strong> (Low Jargon, High Readability)</span>
          <span>Top-Right: High Readability but Jargon-Heavy</span>
          <span>Bottom-Left: Accessible but Low Engagement</span>
          <span>Bottom-Right: <strong style={{ color: T.red }}>Worst</strong> (High Jargon, Low Readability)</span>
        </div>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ESGNarrativeIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState('TTE');

  const company = useMemo(() => COMPANIES.find(c => c.ticker === selectedTicker) || COMPANIES[0], [selectedTicker]);

  const TABS = [
    { label: 'Narrative Arc', short: '01' },
    { label: 'Topic Trajectory', short: '02' },
    { label: 'Commitment Tracker', short: '03' },
    { label: 'Controversy & Credibility', short: '04' },
    { label: 'Linguistic Intelligence', short: '05' },
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, borderBottom: `3px solid ${T.gold}`, padding: '16px 32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
              EP-BY3 · ESG Intelligence Suite
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
              ESG Narrative Intelligence
            </h1>
            <div style={{ fontSize: 13, color: '#ffffff80', marginTop: 4 }}>
              Multi-year disclosure arc · Topic trajectory · Commitment tracking · Linguistic benchmarking
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge label={`${company.ticker} · ${company.sector}`} color={T.goldL} />
            <Badge label="2020–2024" color={T.navyL} />
            <Badge label={`${COMPANIES.length} Companies`} color={T.sage} />
          </div>
        </div>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{
                padding: '10px 20px', cursor: 'pointer', fontFamily: T.mono, fontSize: 12,
                fontWeight: tab === i ? 700 : 400, border: 'none', borderRadius: '6px 6px 0 0',
                background: tab === i ? T.bg : 'transparent',
                color: tab === i ? T.navy : '#ffffff99',
                borderTop: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              <span style={{ opacity: 0.6, marginRight: 6 }}>{t.short}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Company selector shown on all tabs */}
        <CompanySelector selected={selectedTicker} onChange={setSelectedTicker} />

        {tab === 0 && <Tab1 company={company} />}
        {tab === 1 && <Tab2 company={company} />}
        {tab === 2 && <Tab3 company={company} />}
        {tab === 3 && <Tab4 company={company} />}
        {tab === 4 && <Tab5 company={company} />}
      </div>

      {/* Status Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.navy, borderTop: `1px solid ${T.navyL}`, padding: '4px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: '#ffffff60' }}>
          EP-BY3 · ESG Narrative Intelligence · {COMPANIES.length} companies · {TOPICS.length} topics · 2020–2024
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.gold }}>
          {company.name} [{company.ticker}] · {company.sector} · {tab === 0 ? 'Narrative Arc' : tab === 1 ? 'Topic Trajectory' : tab === 2 ? 'Commitment Tracker' : tab === 3 ? 'Controversy' : 'Linguistic Intel'}
        </span>
      </div>
    </div>
  );
}
