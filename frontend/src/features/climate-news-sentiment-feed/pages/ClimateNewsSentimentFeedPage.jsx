import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TOPICS = ['Carbon Markets','Physical Risk','Transition Policy','Corporate Disclosure',
  'Nature','Energy Transition','Climate Finance','Litigation','Adaptation',
  'Regulation','Technology','Agriculture','Transport','Water','Social'];
const SOURCES = ['Reuters','Bloomberg','FT','WSJ','Guardian','S&P Global','MSCI','CDP','WRI','IPCC',
  'IEA','UNFCCC','Carbon Brief','ClimateHome','E&E News'];
const CATEGORIES = ['Breaking','Analysis','Data Release','Regulatory'];
const ENTITIES = ['Shell','BP','TotalEnergies','ExxonMobil','Chevron','Volkswagen','Toyota',
  'Apple','Microsoft','Amazon','BHP','Rio Tinto','Glencore','Nestle','Unilever',
  'BlackRock','Vanguard','JPMorgan','HSBC','Barclays','Citi','Goldman Sachs',
  'Tesla','Siemens','BASF','ArcelorMittal','LafargeHolcim','Duke Energy','NextEra',
  'Orsted','Vestas','First Solar','SolarEdge','Neste','Equinor'];

const HEADLINE_TEMPLATES = [
  '{entity} announces 2030 net-zero commitment for {topic}',
  '{entity} faces regulatory scrutiny over {topic} disclosures',
  'New {topic} policy framework released by regulators',
  '{entity} reports breakthrough in {topic} technology',
  'Study warns of accelerating {topic} risks for investors',
  '{entity} beats {topic} targets two years early',
  'Record investment in {topic} sector hits $2.1 trillion',
  '{entity} sued over misleading {topic} claims',
  'Central bank warns of systemic {topic} risk to financial stability',
  '{entity} joins science-based {topic} alliance',
];

// Build 200 news items outside component
const NEWS_ITEMS = Array.from({ length: 200 }, (_, i) => {
  const topicIdx = Math.floor(sr(i * 7) * TOPICS.length);
  const sourceIdx = Math.floor(sr(i * 11) * SOURCES.length);
  const catIdx = Math.floor(sr(i * 13) * CATEGORIES.length);
  const e1 = Math.floor(sr(i * 17) * ENTITIES.length);
  const e2 = Math.floor(sr(i * 19) * ENTITIES.length);
  const e3 = Math.floor(sr(i * 23) * ENTITIES.length);
  const tmplIdx = Math.floor(sr(i * 29) * HEADLINE_TEMPLATES.length);
  const rawSentiment = sr(i * 31) * 2 - 1; // -1 to +1
  const relevance = parseFloat((0.3 + sr(i * 37) * 0.7).toFixed(2));
  const reach = Math.round(1000 + sr(i * 41) * 49000);
  const portfolioImpact = parseFloat(((sr(i * 43) - 0.5) * 6).toFixed(2));
  const daysAgo = Math.floor(sr(i * 47) * 30);
  const headline = HEADLINE_TEMPLATES[tmplIdx]
    .replace('{entity}', ENTITIES[e1])
    .replace('{topic}', TOPICS[topicIdx].toLowerCase());
  return {
    id: i,
    headline,
    source: SOURCES[sourceIdx],
    topic: TOPICS[topicIdx],
    category: CATEGORIES[catIdx],
    sentiment: parseFloat(rawSentiment.toFixed(3)),
    relevanceScore: relevance,
    entityMentions: [ENTITIES[e1], ENTITIES[e2], ENTITIES[e3]],
    portfolioImpact,
    reach,
    daysAgo,
    date: `2026-${String(Math.floor(1 + sr(i * 53) * 3)).padStart(2,'0')}-${String(Math.floor(1 + sr(i * 57) * 27)).padStart(2,'0')}`,
  };
});

// Holdings list for portfolio linkage (re-use 20 companies)
const PORTFOLIO_HOLDINGS = ENTITIES.slice(0, 20);

export default function ClimateNewsSentimentFeedPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [topicFilter, setTopicFilter] = useState([]);
  const [sentimentMin, setSentimentMin] = useState(-1);
  const [sentimentMax, setSentimentMax] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [portfolioOnly, setPortfolioOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const tabs = ['Sentiment Dashboard','News Feed','Topic Analysis','Entity Impact','Portfolio Linkage','Sentiment Analytics','Summary & Export'];

  const filteredNews = useMemo(() => {
    let out = [...NEWS_ITEMS];
    if (topicFilter.length > 0) out = out.filter(n => topicFilter.includes(n.topic));
    out = out.filter(n => n.sentiment >= sentimentMin && n.sentiment <= sentimentMax);
    if (categoryFilter !== 'All') out = out.filter(n => n.category === categoryFilter);
    if (sourceFilter !== 'All') out = out.filter(n => n.source === sourceFilter);
    if (searchTerm) out = out.filter(n => n.headline.toLowerCase().includes(searchTerm.toLowerCase()) || n.entityMentions.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())));
    if (portfolioOnly) out = out.filter(n => n.entityMentions.some(e => PORTFOLIO_HOLDINGS.includes(e)));
    return out;
  }, [topicFilter, sentimentMin, sentimentMax, categoryFilter, sourceFilter, searchTerm, portfolioOnly]);

  const weightedSentimentIndex = useMemo(() => {
    if (!NEWS_ITEMS.length) return 0;
    const totalWeight = NEWS_ITEMS.reduce((s, n) => s + n.reach * n.relevanceScore, 0);
    const weighted = NEWS_ITEMS.reduce((s, n) => s + n.sentiment * n.reach * n.relevanceScore, 0);
    return totalWeight > 0 ? parseFloat((weighted / totalWeight).toFixed(4)) : 0;
  }, []);

  const topicStats = useMemo(() => {
    return TOPICS.map(topic => {
      const items = NEWS_ITEMS.filter(n => n.topic === topic);
      if (!items.length) return { topic, avgSentiment: 0, count: 0, momentum: 0, volatility: 0, portfolioImpact: 0 };
      const avgSentiment = items.reduce((s, n) => s + n.sentiment, 0) / items.length;
      const recent = items.filter(n => n.daysAgo < 7);
      const older = items.filter(n => n.daysAgo >= 7);
      const recentAvg = recent.length > 0 ? recent.reduce((s,n)=>s+n.sentiment,0)/recent.length : 0;
      const olderAvg = older.length > 0 ? older.reduce((s,n)=>s+n.sentiment,0)/older.length : 0;
      const momentum = parseFloat((recentAvg - olderAvg).toFixed(3));
      const mean = avgSentiment;
      const variance = items.length > 1 ? items.reduce((s, n) => s + Math.pow(n.sentiment - mean, 2), 0) / (items.length - 1) : 0;
      const volatility = parseFloat(Math.sqrt(variance).toFixed(3));
      const portfolioImpact = parseFloat((items.reduce((s,n)=>s+n.portfolioImpact,0)/items.length).toFixed(2));
      return { topic, avgSentiment: parseFloat(avgSentiment.toFixed(3)), count: items.length, momentum, volatility, portfolioImpact };
    });
  }, []);

  const sentimentTrend = useMemo(() => {
    return Array.from({ length: 30 }, (_, day) => {
      const dayItems = NEWS_ITEMS.filter(n => n.daysAgo === day);
      const avg = dayItems.length > 0 ? dayItems.reduce((s,n)=>s+n.sentiment,0)/dayItems.length : 0;
      return { day: `D-${30-day}`, sentiment: parseFloat(avg.toFixed(3)), count: dayItems.length };
    }).reverse();
  }, []);

  const entityStats = useMemo(() => {
    const stats = {};
    ENTITIES.forEach(e => { stats[e] = { entity: e, count: 0, totalSentiment: 0, totalImpact: 0, inPortfolio: PORTFOLIO_HOLDINGS.includes(e) }; });
    NEWS_ITEMS.forEach(n => {
      n.entityMentions.forEach(e => {
        if (stats[e]) {
          stats[e].count++;
          stats[e].totalSentiment += n.sentiment;
          stats[e].totalImpact += n.portfolioImpact;
        }
      });
    });
    return Object.values(stats).filter(s => s.count > 0).map(s => ({
      ...s,
      avgSentiment: parseFloat((s.count > 0 ? s.totalSentiment/s.count : 0).toFixed(3)),
      avgImpact: parseFloat((s.count > 0 ? s.totalImpact/s.count : 0).toFixed(2)),
    })).sort((a,b) => b.count - a.count);
  }, []);

  const portfolioLinkage = useMemo(() => {
    return PORTFOLIO_HOLDINGS.map((holding, i) => {
      const items = NEWS_ITEMS.filter(n => n.entityMentions.includes(holding));
      const avgSentiment = items.length > 0 ? items.reduce((s,n)=>s+n.sentiment,0)/items.length : 0;
      const totalImpact = items.reduce((s,n)=>s+n.portfolioImpact,0);
      const estPnL = totalImpact * (1 + sr(i * 7) * 4);
      return {
        holding, count: items.length,
        avgSentiment: parseFloat(avgSentiment.toFixed(3)),
        totalImpact: parseFloat(totalImpact.toFixed(2)),
        estPnL: parseFloat(estPnL.toFixed(2)),
      };
    });
  }, []);

  const sentimentHistogram = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({
      range: `${(-1 + i * 0.2).toFixed(1)}–${(-0.8 + i * 0.2).toFixed(1)}`,
      count: 0,
    }));
    NEWS_ITEMS.forEach(n => {
      const binIdx = Math.min(9, Math.floor((n.sentiment + 1) / 0.2));
      if (bins[binIdx]) bins[binIdx].count++;
    });
    return bins;
  }, []);

  const toggleTopic = (t) => setTopicFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const sentimentColor = (s) => s > 0.2 ? T.green : s < -0.2 ? T.red : T.amber;
  const sentimentBadge = (s) => s > 0.3 ? { bg: '#dcfce7', color: T.green, label: 'Positive' }
    : s > 0 ? { bg: '#f0fdf4', color: T.teal, label: 'Slightly +' }
    : s > -0.3 ? { bg: '#fef3c7', color: T.amber, label: 'Slightly -' }
    : { bg: '#fee2e2', color: T.red, label: 'Negative' };

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1 }}>
      <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const pagedNews = filteredNews.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 32, background: T.blue, borderRadius: 2 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Climate News Sentiment Feed</h1>
            <span style={{ background: T.blue, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>EP-CY4</span>
          </div>
          <p style={{ color: T.muted, margin: 0, marginLeft: 16, fontSize: 13 }}>200 news items · 15 topics · NLP sentiment scoring · Portfolio impact linkage</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Sentiment Index" value={weightedSentimentIndex.toFixed(3)} sub="reach-weighted avg" color={sentimentColor(weightedSentimentIndex)} />
          <KpiCard label="Total Articles" value={200} sub="last 30 days" />
          <KpiCard label="Positive" value={NEWS_ITEMS.filter(n=>n.sentiment>0.2).length} sub="articles" color={T.green} />
          <KpiCard label="Negative" value={NEWS_ITEMS.filter(n=>n.sentiment<-0.2).length} sub="articles" color={T.red} />
          <KpiCard label="Portfolio Linked" value={NEWS_ITEMS.filter(n=>n.entityMentions.some(e=>PORTFOLIO_HOLDINGS.includes(e))).length} sub="articles w/ holdings" color={T.indigo} />
          <KpiCard label="Filtered" value={filteredNews.length} sub="after current filters" />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '8px 14px', border: 'none', background: activeTab === i ? T.blue : 'transparent',
              color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer',
              fontWeight: activeTab === i ? 600 : 400, fontSize: 12,
            }}>{t}</button>
          ))}
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search headlines or entities…"
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 220 }} />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Sources</option>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => setPortfolioOnly(p => !p)} style={{ padding: '5px 12px', background: portfolioOnly ? T.blue : T.card, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, cursor: 'pointer', color: portfolioOnly ? '#fff' : T.text }}>
            {portfolioOnly ? '✓ Portfolio Only' : 'Portfolio Filter'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: T.muted }}>Sentiment:</span>
            <input type="number" value={sentimentMin} onChange={e => setSentimentMin(Number(e.target.value))} min="-1" max="1" step="0.1"
              style={{ width: 50, padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11 }} />
            <span style={{ fontSize: 11, color: T.muted }}>–</span>
            <input type="number" value={sentimentMax} onChange={e => setSentimentMax(Number(e.target.value))} min="-1" max="1" step="0.1"
              style={{ width: 50, padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11 }} />
          </div>
        </div>
        {/* Topic chips */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
          {TOPICS.map(t => (
            <button key={t} onClick={() => toggleTopic(t)} style={{ padding: '3px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', background: topicFilter.includes(t) ? T.blue : T.card, color: topicFilter.includes(t) ? '#fff' : T.muted }}>
              {t}
            </button>
          ))}
        </div>

        {/* TAB 0 — Sentiment Dashboard */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, alignSelf: 'flex-start' }}>Weighted Sentiment Index</h3>
                <div style={{ width: 150, height: 150, borderRadius: '50%', border: `14px solid ${sentimentColor(weightedSentimentIndex)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 30, fontWeight: 700, color: sentimentColor(weightedSentimentIndex) }}>{weightedSentimentIndex > 0 ? '+' : ''}{weightedSentimentIndex.toFixed(3)}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>WSI Score</div>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: T.muted, textAlign: 'center' }}>
                  Range: -1 (very negative) to +1 (very positive)<br />
                  Weighted by article reach × relevance score
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>30-Day Sentiment Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sentiment" stroke={T.blue} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Average Sentiment by Topic</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...topicStats].sort((a,b) => b.avgSentiment - a.avgSentiment)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="topic" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={55} />
                  <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke={T.border} />
                  <Tooltip />
                  <Bar dataKey="avgSentiment" fill={T.blue} radius={[2,2,0,0]} name="Avg Sentiment" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1 — News Feed */}
        {activeTab === 1 && (
          <div>
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.muted }}>{filteredNews.length} articles · Page {page + 1}/{Math.ceil(filteredNews.length / PAGE_SIZE)}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: 4, cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}>← Prev</button>
                <button disabled={(page + 1) * PAGE_SIZE >= filteredNews.length} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: 4, cursor: (page + 1) * PAGE_SIZE >= filteredNews.length ? 'not-allowed' : 'pointer', fontSize: 12 }}>Next →</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pagedNews.map(n => {
                const badge = sentimentBadge(n.sentiment);
                return (
                  <div key={n.id} onClick={() => setSelectedItem(selectedItem?.id === n.id ? null : n)}
                    style={{ background: T.card, border: `1px solid ${selectedItem?.id === n.id ? T.blue : T.border}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{n.headline}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: T.muted }}>{n.source}</span>
                          <span style={{ fontSize: 11, color: T.muted }}>·</span>
                          <span style={{ fontSize: 11, background: T.sub, padding: '1px 5px', borderRadius: 3, color: T.blue }}>{n.topic}</span>
                          <span style={{ fontSize: 11, color: T.muted }}>·</span>
                          <span style={{ fontSize: 11, color: T.muted }}>{n.category}</span>
                          <span style={{ fontSize: 11, color: T.muted }}>·</span>
                          <span style={{ fontSize: 11, color: T.muted }}>{n.date}</span>
                        </div>
                        {selectedItem?.id === n.id && (
                          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                            {[['Sentiment', `${n.sentiment > 0 ? '+' : ''}${n.sentiment.toFixed(3)}`],['Relevance', n.relevanceScore],['Reach', n.reach.toLocaleString()],['Portfolio Impact', `${n.portfolioImpact > 0 ? '+' : ''}${n.portfolioImpact}%`],['Source', n.source],['Category', n.category],['Topic', n.topic],['Days Ago', `${n.daysAgo}d`]].map(([k,v]) => (
                              <div key={k} style={{ background: T.sub, borderRadius: 5, padding: '6px 8px' }}>
                                <div style={{ fontSize: 10, color: T.muted }}>{k}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{v}</div>
                              </div>
                            ))}
                            <div style={{ gridColumn: 'span 4', background: T.sub, borderRadius: 5, padding: '6px 8px' }}>
                              <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>Entity Mentions</div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {n.entityMentions.map(e => <span key={e} style={{ fontSize: 11, background: PORTFOLIO_HOLDINGS.includes(e) ? '#dbeafe' : T.card, color: PORTFOLIO_HOLDINGS.includes(e) ? T.blue : T.text, padding: '1px 7px', borderRadius: 4, border: `1px solid ${T.border}` }}>{e}</span>)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{badge.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: sentimentColor(n.sentiment) }}>{n.sentiment > 0 ? '+' : ''}{n.sentiment.toFixed(3)}</span>
                        <span style={{ fontSize: 10, color: T.muted }}>Reach: {(n.reach/1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2 — Topic Analysis */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Topic Momentum (Recent vs Older)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topicStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="topic" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Tooltip />
                    <Bar dataKey="momentum" fill={T.blue} radius={[2,2,0,0]} name="Momentum" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sentiment Volatility by Topic</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[...topicStats].sort((a,b)=>b.volatility-a.volatility)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="topic" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="volatility" fill={T.orange} radius={[2,2,0,0]} name="Volatility" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Topic','Articles','Avg Sentiment','Momentum','Volatility','Avg Portfolio Impact'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topicStats.map((t, i) => (
                    <tr key={t.topic} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{t.topic}</td>
                      <td style={{ padding: '7px 12px' }}>{t.count}</td>
                      <td style={{ padding: '7px 12px', color: sentimentColor(t.avgSentiment), fontWeight: 700 }}>{t.avgSentiment > 0 ? '+' : ''}{t.avgSentiment.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px', color: t.momentum > 0 ? T.green : T.red }}>{t.momentum > 0 ? '+' : ''}{t.momentum.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px' }}>{t.volatility.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px', color: t.portfolioImpact > 0 ? T.green : T.red }}>{t.portfolioImpact > 0 ? '+' : ''}{t.portfolioImpact.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3 — Entity Impact */}
        {activeTab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Top 20 Entities by Mention Count</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={entityStats.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="entity" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.blue} radius={[2,2,0,0]} name="Mentions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Entity','Mentions','Avg Sentiment','Avg Portfolio Impact','In Portfolio'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entityStats.map((e, i) => (
                      <tr key={e.entity} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600 }}>{e.entity}</td>
                        <td style={{ padding: '7px 12px' }}>{e.count}</td>
                        <td style={{ padding: '7px 12px', color: sentimentColor(e.avgSentiment), fontWeight: 700 }}>{e.avgSentiment > 0 ? '+' : ''}{e.avgSentiment.toFixed(3)}</td>
                        <td style={{ padding: '7px 12px', color: e.avgImpact > 0 ? T.green : T.red }}>{e.avgImpact > 0 ? '+' : ''}{e.avgImpact.toFixed(2)}%</td>
                        <td style={{ padding: '7px 12px', color: e.inPortfolio ? T.blue : T.muted, fontWeight: e.inPortfolio ? 700 : 400 }}>{e.inPortfolio ? 'Yes' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 — Portfolio Linkage */}
        {activeTab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Portfolio Holdings — Sentiment-Linked Impact</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={portfolioLinkage}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="holding" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={55} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke={T.border} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="estPnL" fill={T.blue} radius={[2,2,0,0]} name="Est. Sentiment P&L%" />
                  <Bar dataKey="avgSentiment" fill={T.teal} radius={[2,2,0,0]} name="Avg Sentiment" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Holding','News Count','Avg Sentiment','Total Portfolio Impact','Est. P&L Contribution'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolioLinkage.map((h, i) => (
                    <tr key={h.holding} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600, color: T.blue }}>{h.holding}</td>
                      <td style={{ padding: '7px 12px' }}>{h.count}</td>
                      <td style={{ padding: '7px 12px', color: sentimentColor(h.avgSentiment), fontWeight: 700 }}>{h.avgSentiment > 0 ? '+' : ''}{h.avgSentiment.toFixed(3)}</td>
                      <td style={{ padding: '7px 12px', color: h.totalImpact > 0 ? T.green : T.red }}>{h.totalImpact > 0 ? '+' : ''}{h.totalImpact.toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', color: h.estPnL > 0 ? T.green : T.red, fontWeight: 600 }}>{h.estPnL > 0 ? '+' : ''}{h.estPnL.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5 — Sentiment Analytics */}
        {activeTab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sentiment Distribution Histogram</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sentimentHistogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.blue} radius={[2,2,0,0]} name="Article Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Topic Sentiment Volatility Ranking</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[...topicStats].sort((a,b)=>b.volatility-a.volatility)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="topic" type="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="volatility" fill={T.orange} radius={[0,2,2,0]} name="Volatility" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: 'span 2' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Articles Volume & Sentiment by Source</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={SOURCES.map(s => {
                  const items = NEWS_ITEMS.filter(n => n.source === s);
                  return { source: s, count: items.length, avgSent: items.length > 0 ? parseFloat((items.reduce((a,n)=>a+n.sentiment,0)/items.length).toFixed(3)) : 0 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="source" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[-1,1]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill={T.blue} radius={[2,2,0,0]} name="Articles" />
                  <Bar yAxisId="right" dataKey="avgSent" fill={T.teal} radius={[2,2,0,0]} name="Avg Sentiment" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 6 — Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Climate News Sentiment — Aggregate Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  ['Total Articles', 200],['Weighted Sentiment Index', weightedSentimentIndex.toFixed(4)],
                  ['Positive Articles', NEWS_ITEMS.filter(n=>n.sentiment>0.2).length],
                  ['Negative Articles', NEWS_ITEMS.filter(n=>n.sentiment<-0.2).length],
                  ['Most Positive Topic', topicStats.sort((a,b)=>b.avgSentiment-a.avgSentiment)[0]?.topic],
                  ['Most Negative Topic', topicStats.sort((a,b)=>a.avgSentiment-b.avgSentiment)[0]?.topic],
                  ['Highest Volatility Topic', topicStats.sort((a,b)=>b.volatility-a.volatility)[0]?.topic],
                  ['Most Mentioned Entity', entityStats[0]?.entity],
                  ['Portfolio-linked Articles', NEWS_ITEMS.filter(n=>n.entityMentions.some(e=>PORTFOLIO_HOLDINGS.includes(e))).length],
                  ['Breaking News', NEWS_ITEMS.filter(n=>n.category==='Breaking').length],
                  ['Data Releases', NEWS_ITEMS.filter(n=>n.category==='Data Release').length],
                  ['Regulatory Items', NEWS_ITEMS.filter(n=>n.category==='Regulatory').length],
                ].map(([k,v]) => (
                  <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: T.sub, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Top Stories Export (200 articles)</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#','Headline','Source','Topic','Category','Date','Sentiment','Relevance','Reach','Portfolio Impact'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NEWS_ITEMS.slice(0, 50).map((n, idx) => (
                      <tr key={n.id} style={{ background: idx % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', color: T.muted }}>{n.id + 1}</td>
                        <td style={{ padding: '5px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.headline}</td>
                        <td style={{ padding: '5px 8px' }}>{n.source}</td>
                        <td style={{ padding: '5px 8px' }}>{n.topic}</td>
                        <td style={{ padding: '5px 8px' }}>{n.category}</td>
                        <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{n.date}</td>
                        <td style={{ padding: '5px 8px', color: sentimentColor(n.sentiment), fontWeight: 700 }}>{n.sentiment > 0 ? '+' : ''}{n.sentiment.toFixed(3)}</td>
                        <td style={{ padding: '5px 8px' }}>{n.relevanceScore}</td>
                        <td style={{ padding: '5px 8px' }}>{(n.reach/1000).toFixed(0)}K</td>
                        <td style={{ padding: '5px 8px', color: n.portfolioImpact > 0 ? T.green : T.red }}>{n.portfolioImpact > 0 ? '+' : ''}{n.portfolioImpact.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Persistent bottom analytics */}
        <div style={{ marginTop: 20 }}>
          {/* Sentiment correlation matrix */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Topic × Category Sentiment Cross-Tab</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    <th style={{ padding:'5px 8px', textAlign:'left', fontWeight:600 }}>Topic</th>
                    {CATEGORIES.map(c=><th key={c} style={{ padding:'5px 8px', textAlign:'center', fontWeight:600 }}>{c}</th>)}
                    <th style={{ padding:'5px 8px', textAlign:'center', fontWeight:600 }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {TOPICS.map((topic,i)=>{
                    const topicItems = NEWS_ITEMS.filter(n=>n.topic===topic);
                    return (
                      <tr key={topic} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'5px 8px', fontWeight:600 }}>{topic}</td>
                        {CATEGORIES.map(cat=>{
                          const catItems = topicItems.filter(n=>n.category===cat);
                          const avgS = catItems.length>0 ? catItems.reduce((s,n)=>s+n.sentiment,0)/catItems.length : null;
                          return (
                            <td key={cat} style={{ padding:'5px 8px', textAlign:'center', color:avgS===null?T.muted:sentimentColor(avgS), fontWeight:avgS!==null?700:400 }}>
                              {avgS===null?'—':`${avgS>0?'+':''}${avgS.toFixed(2)}`}
                            </td>
                          );
                        })}
                        <td style={{ padding:'5px 8px', textAlign:'center', fontWeight:600 }}>{topicItems.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Sentiment-to-price correlation by topic */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sentiment-to-Price Correlation by Topic (Deterministic, sr-seeded)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {TOPICS.map((topic,i)=>{
                const correlation = parseFloat(((sr(i*79+3)-0.5)*1.8).toFixed(3));
                return (
                  <div key={topic} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:T.muted }}>{topic}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:correlation>0.3?T.green:correlation<-0.3?T.red:T.amber, marginTop:2 }}>
                      ρ={correlation>0?'+':''}{correlation}
                    </div>
                    <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{Math.abs(correlation)>0.5?'Strong':Math.abs(correlation)>0.25?'Moderate':'Weak'}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Source reliability and bias */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Source Profile — Articles, Avg Sentiment, Avg Reach & Relevance</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Source','Articles','Avg Sentiment','Avg Reach','Avg Relevance','Breaking','Regulatory'].map(h=>(
                    <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOURCES.map((src,i)=>{
                  const srcItems = NEWS_ITEMS.filter(n=>n.source===src);
                  const avgS = srcItems.length>0 ? srcItems.reduce((a,n)=>a+n.sentiment,0)/srcItems.length : 0;
                  const avgReach = srcItems.length>0 ? srcItems.reduce((a,n)=>a+n.reach,0)/srcItems.length : 0;
                  const avgRel = srcItems.length>0 ? srcItems.reduce((a,n)=>a+n.relevanceScore,0)/srcItems.length : 0;
                  const breaking = srcItems.filter(n=>n.category==='Breaking').length;
                  const regulatory = srcItems.filter(n=>n.category==='Regulatory').length;
                  return (
                    <tr key={src} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 10px', fontWeight:600 }}>{src}</td>
                      <td style={{ padding:'5px 10px' }}>{srcItems.length}</td>
                      <td style={{ padding:'5px 10px', color:sentimentColor(avgS), fontWeight:700 }}>{avgS>0?'+':''}{avgS.toFixed(3)}</td>
                      <td style={{ padding:'5px 10px' }}>{(avgReach/1000).toFixed(1)}K</td>
                      <td style={{ padding:'5px 10px' }}>{avgRel.toFixed(2)}</td>
                      <td style={{ padding:'5px 10px', color:breaking>0?T.red:T.muted }}>{breaking}</td>
                      <td style={{ padding:'5px 10px', color:regulatory>0?T.blue:T.muted }}>{regulatory}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Portfolio impact by topic */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Portfolio-Linked Sentiment Analysis — Monthly Rolling Avg</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {Array.from({length:4},(_,week)=>{
                const weekItems = NEWS_ITEMS.filter(n=>n.daysAgo>=week*7&&n.daysAgo<(week+1)*7&&n.entityMentions.some(e=>PORTFOLIO_HOLDINGS.includes(e)));
                const avgS = weekItems.length>0 ? weekItems.reduce((s,n)=>s+n.sentiment,0)/weekItems.length : 0;
                const totalImpact = weekItems.reduce((s,n)=>s+n.portfolioImpact,0);
                return (
                  <div key={week} style={{ background:T.sub, borderRadius:6, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, color:T.muted }}>Week {4-week} ago</div>
                    <div style={{ fontSize:11 }}>{weekItems.length} articles</div>
                    <div style={{ fontSize:15, fontWeight:700, color:sentimentColor(avgS), marginTop:4 }}>{avgS>0?'+':''}{avgS.toFixed(3)}</div>
                    <div style={{ fontSize:11, color:totalImpact>0?T.green:T.red }}>Impact: {totalImpact>0?'+':''}{totalImpact.toFixed(2)}%</div>
                  </div>
                );
              })}
              <div style={{ background:T.sub, borderRadius:6, padding:'10px 12px', borderTop:`3px solid ${T.blue}` }}>
                <div style={{ fontSize:11, color:T.muted }}>Full Month</div>
                <div style={{ fontSize:11 }}>{NEWS_ITEMS.filter(n=>n.entityMentions.some(e=>PORTFOLIO_HOLDINGS.includes(e))).length} articles</div>
                <div style={{ fontSize:15, fontWeight:700, color:sentimentColor(weightedSentimentIndex), marginTop:4 }}>{weightedSentimentIndex>0?'+':''}{weightedSentimentIndex.toFixed(3)}</div>
                <div style={{ fontSize:11, color:T.blue }}>WSI (reach-weighted)</div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer: Breaking news + top positive/negative */}
        <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 8px', fontSize:13, color:T.red }}>Breaking News ({NEWS_ITEMS.filter(n=>n.category==='Breaking').length})</h4>
            {NEWS_ITEMS.filter(n=>n.category==='Breaking').slice(0,6).map(n=>(
              <div key={n.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{n.headline}</div>
                <div style={{ color:sentimentColor(n.sentiment), fontSize:10 }}>{n.source} · {n.sentiment>0?'+':''}{n.sentiment.toFixed(2)} · Reach:{(n.reach/1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 8px', fontSize:13, color:T.green }}>Most Positive Articles</h4>
            {[...NEWS_ITEMS].sort((a,b)=>b.sentiment-a.sentiment).slice(0,6).map(n=>(
              <div key={n.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{n.headline}</div>
                <div style={{ color:T.green, fontSize:10 }}>+{n.sentiment.toFixed(3)} · {n.topic} · {n.source}</div>
              </div>
            ))}
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 8px', fontSize:13, color:T.red }}>Most Negative Articles</h4>
            {[...NEWS_ITEMS].sort((a,b)=>a.sentiment-b.sentiment).slice(0,6).map(n=>(
              <div key={n.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:200 }}>{n.headline}</div>
                <div style={{ color:T.red, fontSize:10 }}>{n.sentiment.toFixed(3)} · {n.topic} · {n.source}</div>
              </div>
            ))}
          </div>
        </div>
        {/* High-reach breaking news alert */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>High-Reach Articles (&gt;25K reach) — Sentiment Impact</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:10 }}>
            {[['High-Reach Count', NEWS_ITEMS.filter(n=>n.reach>25000).length],['Avg Sentiment (HR)', (NEWS_ITEMS.filter(n=>n.reach>25000).reduce((s,n)=>s+n.sentiment,0)/(NEWS_ITEMS.filter(n=>n.reach>25000).length||1)).toFixed(3)],['Positive High-Reach', NEWS_ITEMS.filter(n=>n.reach>25000&&n.sentiment>0.2).length],['Negative High-Reach', NEWS_ITEMS.filter(n=>n.reach>25000&&n.sentiment<-0.2).length]].map(([k,v])=>(
              <div key={k} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:T.muted }}>{k}</div>
                <div style={{ fontSize:16, fontWeight:700, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ overflowX:'auto', maxHeight:160, overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:T.sub }}>
                  {['Headline','Source','Topic','Reach','Sentiment'].map(h=>(
                    <th key={h} style={{ padding:'4px 8px', textAlign:'left', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...NEWS_ITEMS].filter(n=>n.reach>25000).sort((a,b)=>b.reach-a.reach).slice(0,8).map((n,i)=>(
                  <tr key={n.id} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'3px 8px', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.headline}</td>
                    <td style={{ padding:'3px 8px' }}>{n.source}</td>
                    <td style={{ padding:'3px 8px' }}>{n.topic}</td>
                    <td style={{ padding:'3px 8px', color:T.blue, fontWeight:600 }}>{(n.reach/1000).toFixed(0)}K</td>
                    <td style={{ padding:'3px 8px', color:sentimentColor(n.sentiment), fontWeight:700 }}>{n.sentiment>0?'+':''}{n.sentiment.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Reach-weighted topic sentiment summary */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Reach-Weighted Sentiment Index by Topic</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {TOPICS.map((topic,i)=>{
              const items = NEWS_ITEMS.filter(n=>n.topic===topic);
              const totalWeight = items.reduce((s,n)=>s+n.reach*n.relevanceScore,0);
              const wsi = totalWeight>0 ? items.reduce((s,n)=>s+n.sentiment*n.reach*n.relevanceScore,0)/totalWeight : 0;
              const totalReach = items.reduce((s,n)=>s+n.reach,0);
              return (
                <div key={topic} style={{ background:T.sub, borderRadius:6, padding:'8px 10px', minWidth:110 }}>
                  <div style={{ fontSize:10, color:T.muted }}>{topic}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:sentimentColor(wsi), marginTop:2 }}>{wsi>0?'+':''}{wsi.toFixed(3)}</div>
                  <div style={{ fontSize:10, color:T.muted }}>Reach: {(totalReach/1000).toFixed(0)}K</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Relevance distribution */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Relevance Score Distribution — Article Count by Band</h4>
          <div style={{ display:'flex', gap:8 }}>
            {[[0,0.3,'Low'],[0.3,0.6,'Medium'],[0.6,0.8,'High'],[0.8,1,'Very High']].map(([min,max,label])=>{
              const items = NEWS_ITEMS.filter(n=>n.relevanceScore>=min&&n.relevanceScore<max);
              const avgSentiment = items.length>0 ? items.reduce((s,n)=>s+n.sentiment,0)/items.length : 0;
              const totalReach = items.reduce((s,n)=>s+n.reach,0);
              const colors = [T.muted, T.amber, T.blue, T.indigo];
              const colorIdx = [[0,0.3],[0.3,0.6],[0.6,0.8],[0.8,1]].findIndex(([a,b])=>min===a);
              return (
                <div key={label} style={{ flex:1, background:T.sub, borderRadius:6, padding:'10px 12px', borderTop:`3px solid ${colors[colorIdx]}` }}>
                  <div style={{ fontSize:11, fontWeight:600, color:colors[colorIdx] }}>{label} Relevance ({(min*100).toFixed(0)}–{(max*100).toFixed(0)}%)</div>
                  <div style={{ fontSize:22, fontWeight:800, marginTop:4 }}>{items.length}</div>
                  <div style={{ fontSize:11, color:T.muted }}>articles</div>
                  <div style={{ fontSize:11, marginTop:4 }}>Avg sentiment: <strong style={{color:sentimentColor(avgSentiment)}}>{avgSentiment>0?'+':''}{avgSentiment.toFixed(3)}</strong></div>
                  <div style={{ fontSize:11, color:T.muted }}>Total reach: {(totalReach/1000).toFixed(0)}K</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Daily article cadence */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Daily Article Cadence & Avg Sentiment (Last 14 Days)</h4>
          <div style={{ display:'flex', gap:4 }}>
            {Array.from({length:14},(_,day)=>{
              const dayItems = NEWS_ITEMS.filter(n=>n.daysAgo===day);
              const avgS = dayItems.length>0 ? dayItems.reduce((s,n)=>s+n.sentiment,0)/dayItems.length : 0;
              const maxH = 60;
              const barH = Math.max(4, (dayItems.length/20)*maxH);
              return (
                <div key={day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ fontSize:9, color:sentimentColor(avgS), fontWeight:600 }}>{avgS>0?'+':''}{avgS.toFixed(1)}</div>
                  <div style={{ width:'100%', background:sentimentColor(avgS), borderRadius:'2px 2px 0 0', height:barH, opacity:0.8 }} />
                  <div style={{ fontSize:9, color:T.muted }}>{dayItems.length}</div>
                  <div style={{ fontSize:8, color:T.muted }}>D-{day}</div>
                </div>
              );
            }).reverse()}
          </div>
        </div>
        {/* Entity co-occurrence matrix (top 6 entities) */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Entity Co-occurrence Matrix (Top 6 by Mentions)</h4>
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:T.sub }}>
                  <th style={{ padding:'5px 8px', textAlign:'left', fontWeight:600 }}>Entity</th>
                  {entityStats.slice(0,6).map(e=>(
                    <th key={e.entity} style={{ padding:'5px 8px', textAlign:'center', fontWeight:600, fontSize:10 }}>{e.entity.split(' ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entityStats.slice(0,6).map((rowE,ri)=>(
                  <tr key={rowE.entity} style={{ background:ri%2===0?'#fff':T.sub }}>
                    <td style={{ padding:'5px 8px', fontWeight:600 }}>{rowE.entity}</td>
                    {entityStats.slice(0,6).map((colE,ci)=>{
                      if(ri===ci) return <td key={colE.entity} style={{ padding:'5px 8px', textAlign:'center', background:T.sub }}>—</td>;
                      const coCount = NEWS_ITEMS.filter(n=>n.entityMentions.includes(rowE.entity)&&n.entityMentions.includes(colE.entity)).length;
                      return <td key={colE.entity} style={{ padding:'5px 8px', textAlign:'center', color:coCount>2?T.indigo:T.muted, fontWeight:coCount>0?600:400 }}>{coCount||'—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Source Profile — Article Count &amp; Avg Sentiment</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {['Reuters','Bloomberg','FT','Guardian','WSJ','Nature','Carbon Brief','IEEFA','RFF','Axios'].map((src,si)=>{
              const items = NEWS_ITEMS.filter(n=>n.source===src);
              const avgSent = items.length>0 ? items.reduce((a,n)=>a+n.sentiment,0)/items.length : 0;
              return (
                <div key={src} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:11, fontWeight:600 }}>{src}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:avgSent>0.1?T.green:avgSent<-0.1?T.red:T.muted, marginTop:2 }}>{avgSent>=0?'+':''}{avgSent.toFixed(2)}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{items.length} articles</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Portfolio Monthly Rolling Average Sentiment</h4>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {['Jan','Feb','Mar','Apr','May','Jun'].map((month,mi)=>{
              const seed = mi * 77;
              const val = (sr(seed)*2-1)*0.6;
              return (
                <div key={month} style={{ background:T.sub, borderRadius:6, padding:'8px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:T.muted }}>{month} 2026</div>
                  <div style={{ fontSize:17, fontWeight:700, color:val>0.1?T.green:val<-0.1?T.red:T.muted, marginTop:2 }}>{val>=0?'+':''}{val.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
