/**
 * EP-CT1 — FI Client Portfolio Analyzer
 * Sprint CT · Financial Institution Profiler
 *
 * Client portfolio analyzer with sector concentration, geography heatmap,
 * transition score distribution, line of business, and watchlist.
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, Treemap, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import TAXONOMY_TREE, {
  scoreToRating, HIGH_IMPACT_SECTORS, GEOGRAPHIC_REGIONS
} from '../../../data/taxonomyTree';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Client Overview', 'Sector Concentration', 'Geography Heatmap', 'Transition Score Distribution', 'Line of Business', 'Watchlist'];
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const RATING_COLORS = { A: T.green, B: '#22c55e', C: T.amber, D: T.orange, E: T.red };
const SECTOR_COLORS = [T.navy, T.blue, T.teal, T.green, T.amber, T.orange, T.red, T.purple, T.sage, '#6366f1', '#be185d', '#78716c'];

const LOBS = ['Corporate Banking', 'Investment Banking', 'Wealth Management', 'Treasury'];

const BORROWERS = Array.from({ length: 50 }, (_, i) => {
  const sectorIdx = i % HIGH_IMPACT_SECTORS.length;
  const regionIdx = i % GEOGRAPHIC_REGIONS.length;
  const names = ['Acme Corp', 'GlobalEnergy', 'SteelWorks', 'GreenTech', 'MfgCo', 'TransOcean', 'AgriFirst', 'FinServ', 'BuildRight', 'WaterUtil',
    'SolarPeak', 'MineGlobal', 'ChemUnion', 'PowerGrid', 'EcoWaste', 'UrbanDev', 'TradeLink', 'HostPrime', 'DataCloud', 'RealtyMax',
    'OilMajor', 'CoalPower', 'GasSupply', 'WindFarm', 'HydroDam', 'CementCo', 'AlumGlobal', 'AutoMfg', 'ShipLine', 'AirCargo',
    'FoodProc', 'TextileCo', 'PharmaLab', 'TelecomNet', 'RetailChain', 'LogiCorp', 'InsureTech', 'BankCross', 'PropDev', 'FertilCo',
    'PetroChem', 'LNGTerminal', 'RailFreight', 'PortAuth', 'ForestProd', 'PalmOilCo', 'SugarMills', 'RubberTech', 'GlassMfg', 'PaperInc'];
  const score = Math.round(20 + sr(i * 7) * 70);
  return {
    id: i + 1, name: names[i], sector: HIGH_IMPACT_SECTORS[sectorIdx].name, sectorCode: HIGH_IMPACT_SECTORS[sectorIdx].code,
    region: GEOGRAPHIC_REGIONS[regionIdx].name, regionCode: GEOGRAPHIC_REGIONS[regionIdx].code,
    exposure: Math.round(10 + sr(i * 11) * 490), score, rating: scoreToRating(score).label,
    lob: LOBS[i % LOBS.length],
  };
});

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20, flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: T.font, fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.gold : T.navy,
        borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
      }}>{t}</button>
    ))}
  </div>
);

const Card = ({ title, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16, ...style }}>
    {title && <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

const RatingBadge = ({ rating }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: T.mono, color: '#fff', background: RATING_COLORS[rating] || T.textMut }}>{rating}</span>
);

export default function FiClientPortfolioAnalyzerPage() {
  const [tab, setTab] = useState(TABS[0]);
  const [sortBy, setSortBy] = useState('exposure');
  const [filterSector, setFilterSector] = useState('all');

  const totalExposure = useMemo(() => BORROWERS.reduce((s, b) => s + b.exposure, 0), []);
  const avgScore = useMemo(() => Math.round(BORROWERS.reduce((s, b) => s + b.score, 0) / BORROWERS.length), []);

  const sectorConcentration = useMemo(() => {
    const map = {};
    BORROWERS.forEach(b => { map[b.sector] = (map[b.sector] || 0) + b.exposure; });
    return Object.entries(map).map(([name, value], i) => ({ name: name.split(' ')[0], fullName: name, value, fill: SECTOR_COLORS[i % SECTOR_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const geoExposure = useMemo(() => {
    const map = {};
    BORROWERS.forEach(b => { map[b.region] = (map[b.region] || 0) + b.exposure; });
    return GEOGRAPHIC_REGIONS.map((r, i) => ({ region: r.name, code: r.code, exposure: map[r.name] || 0 })).filter(g => g.exposure > 0);
  }, []);

  const scoreDistribution = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({ range: `${i * 10}-${(i + 1) * 10}`, count: 0, exposure: 0 }));
    BORROWERS.forEach(b => { const idx = Math.min(Math.floor(b.score / 10), 9); buckets[idx].count++; buckets[idx].exposure += b.exposure; });
    return buckets;
  }, []);

  const lobData = useMemo(() => {
    const map = {};
    BORROWERS.forEach(b => { if (!map[b.lob]) map[b.lob] = { lob: b.lob, exposure: 0, clients: 0, avgScore: 0, scores: [] }; map[b.lob].exposure += b.exposure; map[b.lob].clients++; map[b.lob].scores.push(b.score); });
    return Object.values(map).map(l => ({ ...l, avgScore: Math.round(l.scores.reduce((a, b) => a + b, 0) / l.scores.length) }));
  }, []);

  const watchlist = useMemo(() => BORROWERS.filter(b => b.score < 40).sort((a, b) => a.score - b.score), []);

  const filtered = useMemo(() => {
    let data = [...BORROWERS];
    if (filterSector !== 'all') data = data.filter(b => b.sectorCode === filterSector);
    data.sort((a, b) => sortBy === 'exposure' ? b.exposure - a.exposure : a.score - b.score);
    return data;
  }, [sortBy, filterSector]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 4 }}>EP-CT1 · SPRINT CT</div>
          <h1 style={{ fontSize: 26, color: T.navy, margin: 0 }}>FI Client Portfolio Analyzer</h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '6px 0 0' }}>
            {BORROWERS.length} borrowers · ${(totalExposure).toLocaleString()}M total exposure · {HIGH_IMPACT_SECTORS.length} sectors
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Exposure', value: `$${(totalExposure / 1000).toFixed(1)}B`, color: T.navy },
            { label: 'Clients', value: BORROWERS.length, color: T.navy },
            { label: 'Avg Score', value: avgScore, color: avgScore >= 50 ? T.green : T.amber },
            { label: 'Watchlist', value: watchlist.length, color: T.red },
            { label: 'Top Sector', value: sectorConcentration[0]?.name, color: T.gold },
          ].map((k, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </Card>
          ))}
        </div>

        <TabBar tabs={TABS} active={tab} onSelect={setTab} />

        {/* Tab 1: Client Overview */}
        {tab === TABS[0] && (
          <Card title="Client Portfolio">
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 12 }}>
                <option value="all">All Sectors</option>
                {HIGH_IMPACT_SECTORS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: T.font, fontSize: 12 }}>
                <option value="exposure">Sort by Exposure</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Client</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Sector</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Region</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Exposure $M</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
                    <th style={{ textAlign: 'center', padding: 6 }}>Rating</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>LoB</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 30).map(b => (
                    <tr key={b.id} style={{ borderBottom: `1px solid ${T.border}`, background: b.score < 40 ? '#fee2e2' : 'transparent' }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{b.name}</td>
                      <td style={{ padding: 6, color: T.textSec, fontSize: 11 }}>{b.sector.split(' ').slice(0, 2).join(' ')}</td>
                      <td style={{ padding: 6, fontFamily: T.mono, fontSize: 11 }}>{b.regionCode}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{b.exposure}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{b.score}</td>
                      <td style={{ textAlign: 'center', padding: 6 }}><RatingBadge rating={b.rating} /></td>
                      <td style={{ padding: 6, fontSize: 11, color: T.textSec }}>{b.lob}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Sector Concentration */}
        {tab === TABS[1] && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card title="Sector Concentration — TreeMap">
              <ResponsiveContainer width="100%" height={360}>
                <Treemap data={sectorConcentration} dataKey="value" nameKey="name" stroke="#fff" strokeWidth={2}
                  content={({ x, y, width, height, name, value, fill }) => {
                    if (width < 40 || height < 25) return null;
                    return (
                      <g>
                        <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
                        <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>{name}</text>
                        <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#ffffffcc" fontSize={10}>${value}M</text>
                      </g>
                    );
                  }}>
                  {sectorConcentration.map((s, i) => <Cell key={i} fill={s.fill} />)}
                </Treemap>
              </ResponsiveContainer>
            </Card>
            <Card title="Sector Exposure Breakdown">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={sectorConcentration} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontFamily: T.font, fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => `$${v}M`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {sectorConcentration.map((s, i) => <Cell key={i} fill={s.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Tab 3: Geography Heatmap */}
        {tab === TABS[2] && (
          <Card title="Geographic Exposure by Region">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={geoExposure}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="code" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} formatter={v => `$${v}M`} labelFormatter={l => geoExposure.find(g => g.code === l)?.region || l} />
                <Bar dataKey="exposure" fill={T.navy} radius={[4, 4, 0, 0]}>
                  {geoExposure.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Region</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Exposure $M</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {geoExposure.sort((a, b) => b.exposure - a.exposure).map((g, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6 }}>{g.region}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{g.exposure}</td>
                      <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{((g.exposure / totalExposure) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 4: Transition Score Distribution */}
        {tab === TABS[3] && (
          <Card title="Transition Score Histogram (0-100)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis yAxisId="count" orientation="left" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <YAxis yAxisId="exposure" orientation="right" tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar yAxisId="count" dataKey="count" fill={T.navy} name="# Clients" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="exposure" dataKey="exposure" fill={T.gold} name="Exposure $M" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 5: Line of Business */}
        {tab === TABS[4] && (
          <Card title="Line of Business Analysis">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Line of Business</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Clients</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Exposure $M</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Avg Score</th>
                  <th style={{ textAlign: 'center', padding: 8 }}>Rating</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {lobData.map((l, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{l.lob}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{l.clients}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{l.exposure.toLocaleString()}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{l.avgScore}</td>
                    <td style={{ textAlign: 'center', padding: 8 }}><RatingBadge rating={scoreToRating(l.avgScore).label} /></td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{((l.exposure / totalExposure) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ResponsiveContainer width="100%" height={250} style={{ marginTop: 16 }}>
              <BarChart data={lobData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="lob" tick={{ fontFamily: T.font, fontSize: 11 }} />
                <YAxis tick={{ fontFamily: T.mono, fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: T.font, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: T.font, fontSize: 11 }} />
                <Bar dataKey="exposure" fill={T.navy} name="Exposure $M" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgScore" fill={T.gold} name="Avg Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tab 6: Watchlist */}
        {tab === TABS[5] && (
          <Card title={`Watchlist — ${watchlist.length} clients with score < 40`} style={{ borderColor: T.red }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.red}` }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Client</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Sector</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Exposure $M</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Score</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Rating</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(b => (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${T.border}`, background: b.score < 25 ? '#fee2e2' : '#fffbeb' }}>
                    <td style={{ padding: 6, fontWeight: 600 }}>{b.name}</td>
                    <td style={{ padding: 6, color: T.textSec, fontSize: 11 }}>{b.sector.split(' ').slice(0, 2).join(' ')}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono }}>{b.exposure}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: T.red }}>{b.score}</td>
                    <td style={{ textAlign: 'center', padding: 6 }}><RatingBadge rating={b.rating} /></td>
                    <td style={{ textAlign: 'center', padding: 6 }}>
                      <button style={{ padding: '3px 10px', fontSize: 11, borderRadius: 4, border: `1px solid ${T.red}`, background: '#fff', color: T.red, cursor: 'pointer', fontFamily: T.font, fontWeight: 600 }}>Engage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: T.mono, color: T.textMut }}>
          <span>EP-CT1 · FI Client Portfolio Analyzer</span>
          <span>Sprint CT · Financial Institution Profiler · {new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>
    </div>
  );
}
