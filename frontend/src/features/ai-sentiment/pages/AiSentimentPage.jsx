import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES, globalSearch } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ── Static seed articles ───────────────────────────────────────── */
const SEED_ARTICLES = [
  { id:'S001', date:'2025-03-20', company:'Reliance Industries', ticker:'RELIANCE', sector:'Energy', headline:'Reliance announces $10B green hydrogen investment in Gujarat', sentiment:0.85, category:'E', keywords:['green hydrogen','renewable','investment'], source:'Bloomberg' },
  { id:'S002', date:'2025-03-19', company:'TCS', ticker:'TCS', sector:'IT', headline:'TCS achieves carbon neutrality across global operations', sentiment:0.92, category:'E', keywords:['carbon neutral','net zero','operations'], source:'ET' },
  { id:'S003', date:'2025-03-18', company:'Adani Enterprises', ticker:'ADANIENT', sector:'Energy', headline:'Adani faces renewed scrutiny over Carmichael coal expansion', sentiment:-0.78, category:'E', keywords:['coal','controversy','expansion'], source:'Guardian' },
  { id:'S004', date:'2025-03-17', company:'HDFC Bank', ticker:'HDFCBANK', sector:'Financials', headline:'HDFC Bank launches sustainable lending framework aligned with EU Taxonomy', sentiment:0.72, category:'G', keywords:['sustainable finance','taxonomy','lending'], source:'Mint' },
  { id:'S005', date:'2025-03-16', company:'Infosys', ticker:'INFY', sector:'IT', headline:'Infosys ESG score upgraded by MSCI to AA rating', sentiment:0.88, category:'G', keywords:['ESG rating','MSCI','upgrade'], source:'Reuters' },
  { id:'S006', date:'2025-03-15', company:'NTPC', ticker:'NTPC', sector:'Utilities', headline:'NTPC solar capacity addition falls short of FY24 target', sentiment:-0.45, category:'E', keywords:['solar','target miss','renewable'], source:'LiveMint' },
  { id:'S007', date:'2025-03-14', company:'Tata Steel', ticker:'TATASTEEL', sector:'Materials', headline:'Tata Steel Port Talbot green transition receives UK govt support', sentiment:0.65, category:'E', keywords:['green steel','transition','hydrogen'], source:'FT' },
  { id:'S008', date:'2025-03-13', company:'Shell plc', ticker:'SHEL', sector:'Energy', headline:'Shell walks back 2030 emissions reduction target', sentiment:-0.82, category:'E', keywords:['emissions target','rollback','net zero'], source:'BBC' },
  { id:'S009', date:'2025-03-12', company:'Apple Inc.', ticker:'AAPL', sector:'IT', headline:'Apple supply chain achieves 100% renewable energy milestone', sentiment:0.95, category:'E', keywords:['supply chain','renewable','100%'], source:'CNBC' },
  { id:'S010', date:'2025-03-11', company:'Nestl\u00e9', ticker:'NESN', sector:'Consumer Staples', headline:'Nestl\u00e9 deforestation-free palm oil commitment under independent audit', sentiment:0.55, category:'E', keywords:['deforestation','palm oil','audit'], source:'Reuters' },
  { id:'S011', date:'2025-03-10', company:'Samsung', ticker:'005930', sector:'IT', headline:'Samsung pledges $5B for AI-driven energy efficiency in fabs', sentiment:0.78, category:'E', keywords:['AI','energy efficiency','semiconductor'], source:'Nikkei' },
  { id:'S012', date:'2025-03-09', company:'BHP Group', ticker:'BHP', sector:'Materials', headline:'BHP water stewardship program recognized by CDP A-list', sentiment:0.82, category:'E', keywords:['CDP','water','A-list'], source:'Mining Weekly' },
  { id:'S013', date:'2025-03-08', company:'JPMorgan Chase', ticker:'JPM', sector:'Financials', headline:'JPMorgan increases climate lending target to $2.5T by 2030', sentiment:0.68, category:'E', keywords:['climate finance','lending','target'], source:'Bloomberg' },
  { id:'S014', date:'2025-03-07', company:'Tesla', ticker:'TSLA', sector:'Consumer Discretionary', headline:'Tesla board diversity criticized at shareholder meeting', sentiment:-0.55, category:'S', keywords:['board diversity','governance','shareholder'], source:'WSJ' },
  { id:'S015', date:'2025-03-06', company:'Enel', ticker:'ENEL', sector:'Utilities', headline:'Enel achieves SBTi 1.5C validation for near-term targets', sentiment:0.90, category:'E', keywords:['SBTi','1.5C','validation'], source:'Reuters' },
  { id:'S016', date:'2025-03-05', company:'Rio Tinto', ticker:'RIO', sector:'Materials', headline:'Rio Tinto Aboriginal heritage management under federal review', sentiment:-0.65, category:'S', keywords:['indigenous rights','heritage','review'], source:'ABC' },
  { id:'S017', date:'2025-03-04', company:'Microsoft', ticker:'MSFT', sector:'IT', headline:'Microsoft carbon removal portfolio reaches 5.8M tonnes', sentiment:0.88, category:'E', keywords:['carbon removal','CDR','negative emissions'], source:'TechCrunch' },
  { id:'S018', date:'2025-03-03', company:'Glencore', ticker:'GLEN', sector:'Materials', headline:'Glencore DRC copper mine community displacement allegations', sentiment:-0.72, category:'S', keywords:['displacement','community','human rights'], source:'Amnesty' },
  { id:'S019', date:'2025-03-02', company:'ICICI Bank', ticker:'ICICIBANK', sector:'Financials', headline:'ICICI Bank green bond framework receives positive SPO from CICERO', sentiment:0.70, category:'G', keywords:['green bond','SPO','CICERO'], source:'ET' },
  { id:'S020', date:'2025-03-01', company:'Toyota', ticker:'7203', sector:'Consumer Discretionary', headline:'Toyota EV transition strategy questioned by Climate Action 100+', sentiment:-0.48, category:'E', keywords:['EV transition','engagement','laggard'], source:'Nikkei' },
  { id:'S021', date:'2025-02-28', company:'Iberdrola', ticker:'IBE', sector:'Utilities', headline:'Iberdrola offshore wind farm approval in Baltic Sea', sentiment:0.80, category:'E', keywords:['offshore wind','renewable','expansion'], source:'Reuters' },
  { id:'S022', date:'2025-02-27', company:'Adani Ports', ticker:'ADANIPORTS', sector:'Industrials', headline:'Adani Ports excluded from S&P Dow Jones ESG indices', sentiment:-0.85, category:'G', keywords:['exclusion','ESG index','controversy'], source:'CNBC' },
  { id:'S023', date:'2025-02-26', company:'Orsted', ticker:'ORSTED', sector:'Utilities', headline:'Orsted achieves 99% renewable electricity generation', sentiment:0.94, category:'E', keywords:['renewable','99%','generation'], source:'Bloomberg' },
  { id:'S024', date:'2025-02-25', company:'Vale S.A.', ticker:'VALE3', sector:'Materials', headline:'Vale Brumadinho compensation payments reach $7B', sentiment:-0.35, category:'S', keywords:['reparations','dam disaster','compensation'], source:'Reuters' },
  { id:'S025', date:'2025-02-24', company:'Sun Pharma', ticker:'SUNPHARMA', sector:'Health Care', headline:'Sun Pharma recognized for gender equality initiatives in India', sentiment:0.62, category:'S', keywords:['gender equality','diversity','India'], source:'Mint' },
];

const catColors = { E: T.green, S: '#7c3aed', G: T.navy };
const catLabels = { E: 'Environmental', S: 'Social', G: 'Governance' };
const sentimentColor = v => v > 0.3 ? T.green : v < -0.3 ? T.red : T.amber;
const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(2);

/* ── Generate portfolio-specific sentiment articles ──────────────── */
const generatePortfolioSentiment = (holdings) => {
  return holdings.map((h, i) => {
    const c = h.company || {};
    const isPositive = (c.esg_score || 50) > 60 && c.sbti_committed;
    return {
      id: `PS-${c.ticker || h.ticker || i}`,
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      company: c.name || h.name || h.ticker,
      ticker: c.ticker || h.ticker || '',
      sector: c.sector || h.sector || 'Unknown',
      headline: isPositive
        ? `${c.name || h.name} ESG score at ${c.esg_score || 'N/A'}/100 ${c.sbti_committed ? '- SBTi validated' : '- improving trajectory'}`
        : `${c.name || h.name} faces climate transition challenges - T-Risk score ${c.transition_risk_score || 'N/A'}/100`,
      sentiment: isPositive ? 0.3 + sr(_sc++) * 0.5 : -0.2 - sr(_sc++) * 0.5,
      category: 'E',
      keywords: isPositive ? ['ESG leader', 'SBTi', 'transition'] : ['transition risk', 'high carbon', 'engagement needed'],
      source: 'Portfolio Analysis',
      isAutoGenerated: true,
    };
  });
};

/* ── CSV export helper ──────────────────────────────────────────── */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    let v = r[k];
    if (Array.isArray(v)) v = v.join('; ');
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = `"${v.replace(/"/g, '""')}"`;
    return v ?? '';
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function AiSentimentPage() {
  const navigate = useNavigate();

  /* ── Portfolio data ────────────────────────────────────────────── */
  const [portfolioData, setPortfolioData] = useState(() => {
    try { const s = localStorage.getItem('ra_portfolio_v1'); return s ? JSON.parse(s) : { portfolios: {}, activePortfolio: null }; } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  /* ── Alerts state ──────────────────────────────────────────────── */
  const [alerts, setAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_sentiment_alerts_v1') || '[]'); } catch { return []; }
  });
  const [alertThreshold, setAlertThreshold] = useState(-0.5);

  /* ── Custom articles state ─────────────────────────────────────── */
  const [customArticles, setCustomArticles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_custom_articles_v1') || '[]'); } catch { return []; }
  });
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({ headline: '', company: '', ticker: '', sentiment: 0, category: 'E', source: '', keywords: '' });

  /* ── Filter state ──────────────────────────────────────────────── */
  const [searchText, setSearchText] = useState('');
  const [sentimentRange, setSentimentRange] = useState([-1, 1]);
  const [categoryFilter, setCategoryFilter] = useState({ E: true, S: true, G: true });
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState(90);
  const [portfolioOnly, setPortfolioOnly] = useState(false);
  const [activeKeywordFilter, setActiveKeywordFilter] = useState(null);

  /* ── Drill-down state ──────────────────────────────────────────── */
  const [drillCompany, setDrillCompany] = useState(null);

  /* ── Hover state ───────────────────────────────────────────────── */
  const [hoveredSector, setHoveredSector] = useState(null);

  /* ── Combined article feed ─────────────────────────────────────── */
  const allArticles = useMemo(() => {
    const portfolioArticles = generatePortfolioSentiment(holdings);
    const combined = [...SEED_ARTICLES, ...portfolioArticles, ...customArticles];
    // Deduplicate by id
    const seen = new Set();
    return combined.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
  }, [holdings, customArticles]);

  /* ── All unique sources ────────────────────────────────────────── */
  const allSources = useMemo(() => {
    const s = new Set(allArticles.map(a => a.source));
    return ['ALL', ...Array.from(s).sort()];
  }, [allArticles]);

  /* ── Cutoff date for date range filter ─────────────────────────── */
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - dateRange);
    return d.toISOString().slice(0, 10);
  }, [dateRange]);

  /* ── Portfolio tickers set ─────────────────────────────────────── */
  const portfolioTickers = useMemo(() => new Set(holdings.map(h => (h.ticker || '').toUpperCase())), [holdings]);

  /* ── Filtered articles ─────────────────────────────────────────── */
  const filteredArticles = useMemo(() => {
    return allArticles.filter(a => {
      if (a.sentiment < sentimentRange[0] || a.sentiment > sentimentRange[1]) return false;
      if (!categoryFilter[a.category]) return false;
      if (sourceFilter !== 'ALL' && a.source !== sourceFilter) return false;
      if (a.date < cutoffDate) return false;
      if (portfolioOnly && !portfolioTickers.has((a.ticker || '').toUpperCase())) return false;
      if (activeKeywordFilter && !(a.keywords || []).some(k => k.toLowerCase().includes(activeKeywordFilter.toLowerCase()))) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        const match = (a.headline || '').toLowerCase().includes(q) ||
          (a.company || '').toLowerCase().includes(q) ||
          (a.ticker || '').toLowerCase().includes(q) ||
          (a.keywords || []).some(k => k.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [allArticles, sentimentRange, categoryFilter, sourceFilter, cutoffDate, portfolioOnly, portfolioTickers, activeKeywordFilter, searchText]);

  /* ── KPIs ──────────────────────────────────────────────────────── */
  const avgSentiment = useMemo(() => filteredArticles.length ? filteredArticles.reduce((s, a) => s + a.sentiment, 0) / filteredArticles.length : 0, [filteredArticles]);
  const posCount = useMemo(() => filteredArticles.filter(a => a.sentiment > 0.3).length, [filteredArticles]);
  const negCount = useMemo(() => filteredArticles.filter(a => a.sentiment < -0.3).length, [filteredArticles]);
  const mostMentionedSector = useMemo(() => {
    const counts = {};
    filteredArticles.forEach(a => { counts[a.sector] = (counts[a.sector] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }, [filteredArticles]);

  /* ── Portfolio-weighted sentiment ──────────────────────────────── */
  const portfolioWeightedSentiment = useMemo(() => {
    if (holdings.length === 0) return null;
    let totalWeight = 0;
    let weightedSum = 0;
    holdings.forEach(h => {
      const ticker = (h.ticker || '').toUpperCase();
      const matched = allArticles.filter(a => (a.ticker || '').toUpperCase() === ticker);
      if (matched.length === 0) return;
      const avgS = matched.reduce((s, a) => s + a.sentiment, 0) / matched.length;
      const w = h.weight != null ? h.weight : (h.allocation != null ? h.allocation : (1 / holdings.length));
      weightedSum += w * avgS;
      totalWeight += w;
    });
    return totalWeight > 0 ? weightedSum / totalWeight : null;
  }, [holdings, allArticles]);

  /* ── Trend data ────────────────────────────────────────────────── */
  const trendData = useMemo(() => {
    const byDate = {};
    filteredArticles.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a.sentiment);
    });
    return Object.entries(byDate)
      .map(([date, vals]) => ({ date, sentiment: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 1000) / 1000 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredArticles]);

  /* ── Sector heatmap ────────────────────────────────────────────── */
  const sectorData = useMemo(() => {
    const map = {};
    filteredArticles.forEach(a => {
      if (!map[a.sector]) map[a.sector] = { sentiment: 0, count: 0, keywords: {} };
      map[a.sector].sentiment += a.sentiment;
      map[a.sector].count += 1;
      (a.keywords || []).forEach(k => { map[a.sector].keywords[k] = (map[a.sector].keywords[k] || 0) + 1; });
    });
    return Object.entries(map).map(([sector, d]) => {
      const avg = d.sentiment / d.count;
      const topKw = Object.entries(d.keywords).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      return { sector, avg: Math.round(avg * 100) / 100, count: d.count, topKeyword: topKw, trend: avg > 0.3 ? 'Improving' : avg < -0.3 ? 'Declining' : 'Stable' };
    }).sort((a, b) => b.avg - a.avg);
  }, [filteredArticles]);

  /* ── Keywords with time periods ────────────────────────────────── */
  const keywordData = useMemo(() => {
    const map = {};
    filteredArticles.forEach(a => {
      (a.keywords || []).forEach(k => {
        if (!map[k]) map[k] = { count: 0, sentiment: 0, categories: new Set(), byWeek: {} };
        map[k].count += 1;
        map[k].sentiment += a.sentiment;
        map[k].categories.add(a.category);
        const wk = a.date.slice(0, 7);
        map[k].byWeek[wk] = (map[k].byWeek[wk] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([kw, d]) => ({ keyword: kw, frequency: d.count, avgSentiment: Math.round((d.sentiment / d.count) * 100) / 100, category: [...d.categories].join('/'), periods: Object.keys(d.byWeek).length }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15);
  }, [filteredArticles]);

  /* ── E/S/G distribution ────────────────────────────────────────── */
  const esgDist = useMemo(() => {
    const counts = { E: 0, S: 0, G: 0 };
    filteredArticles.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return [
      { name: 'Environmental', value: counts.E, color: T.green },
      { name: 'Social', value: counts.S, color: '#7c3aed' },
      { name: 'Governance', value: counts.G, color: T.navy },
    ];
  }, [filteredArticles]);

  /* ── Portfolio overlay ─────────────────────────────────────────── */
  const portfolioOverlay = useMemo(() => {
    if (holdings.length === 0) return [];
    return holdings.map(h => {
      const ticker = (h.ticker || '').toUpperCase();
      const matched = allArticles.filter(a => (a.ticker || '').toUpperCase() === ticker);
      const avg = matched.length > 0 ? matched.reduce((s, a) => s + a.sentiment, 0) / matched.length : null;
      const c = h.company || {};
      return {
        company: c.name || h.name || h.ticker,
        ticker: h.ticker,
        weight: h.weight != null ? h.weight : (h.allocation != null ? h.allocation : null),
        sentiment: avg != null ? Math.round(avg * 100) / 100 : null,
        articles: matched.length,
        latestHeadline: matched.length > 0 ? matched.sort((a, b) => b.date.localeCompare(a.date))[0].headline : null,
        esgScore: c.esg_score || null,
        sector: c.sector || h.sector || null,
      };
    });
  }, [holdings, allArticles]);

  /* ── Alert generation ──────────────────────────────────────────── */
  useEffect(() => {
    if (holdings.length === 0) return;
    const newAlerts = [];
    holdings.forEach(h => {
      const ticker = (h.ticker || '').toUpperCase();
      const matched = allArticles.filter(a => (a.ticker || '').toUpperCase() === ticker);
      if (matched.length === 0) return;
      const avg = matched.reduce((s, a) => s + a.sentiment, 0) / matched.length;
      if (avg < alertThreshold) {
        const existing = alerts.find(al => al.ticker === ticker && !al.dismissed);
        if (!existing) {
          newAlerts.push({
            id: `AL-${ticker}-${Date.now()}`,
            ticker,
            company: (h.company?.name || h.name || h.ticker),
            sentiment: Math.round(avg * 100) / 100,
            headline: matched.sort((a, b) => b.date.localeCompare(a.date))[0].headline,
            date: new Date().toISOString().slice(0, 10),
            dismissed: false,
          });
        }
      }
    });
    if (newAlerts.length > 0) {
      const updated = [...alerts, ...newAlerts];
      setAlerts(updated);
      localStorage.setItem('ra_sentiment_alerts_v1', JSON.stringify(updated));
    }
  }, [holdings, allArticles, alertThreshold]); // eslint-disable-line

  const dismissAlert = (id) => {
    const updated = alerts.map(a => a.id === id ? { ...a, dismissed: true } : a);
    setAlerts(updated);
    localStorage.setItem('ra_sentiment_alerts_v1', JSON.stringify(updated));
  };

  const activeAlerts = alerts.filter(a => !a.dismissed);

  /* ── Add custom article ────────────────────────────────────────── */
  const addCustomArticle = () => {
    if (!newArticle.headline || !newArticle.company) return;
    const art = {
      id: `CA-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      company: newArticle.company,
      ticker: newArticle.ticker,
      sector: 'Custom',
      headline: newArticle.headline,
      sentiment: parseFloat(newArticle.sentiment) || 0,
      category: newArticle.category,
      keywords: newArticle.keywords.split(',').map(k => k.trim()).filter(Boolean),
      source: newArticle.source || 'Manual Entry',
      isCustom: true,
    };
    const updated = [...customArticles, art];
    setCustomArticles(updated);
    localStorage.setItem('ra_custom_articles_v1', JSON.stringify(updated));
    setNewArticle({ headline: '', company: '', ticker: '', sentiment: 0, category: 'E', source: '', keywords: '' });
    setShowAddArticle(false);
  };

  /* ── Company drill-down data ───────────────────────────────────── */
  const drillData = useMemo(() => {
    if (!drillCompany) return null;
    const ticker = drillCompany.toUpperCase();
    const articles = allArticles.filter(a => (a.ticker || '').toUpperCase() === ticker);
    const gcmMatch = GLOBAL_COMPANY_MASTER.find(c => (c.ticker || '').toUpperCase() === ticker);
    const trendByDate = {};
    articles.forEach(a => {
      if (!trendByDate[a.date]) trendByDate[a.date] = [];
      trendByDate[a.date].push(a.sentiment);
    });
    const trend = Object.entries(trendByDate).map(([date, vals]) => ({
      date, sentiment: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 1000) / 1000
    })).sort((a, b) => a.date.localeCompare(b.date));
    return { articles, gcmMatch, trend };
  }, [drillCompany, allArticles]);

  /* ── Export handlers ───────────────────────────────────────────── */
  const exportSentimentReport = () => {
    const rows = filteredArticles.map(a => ({
      ID: a.id, Date: a.date, Company: a.company, Ticker: a.ticker, Sector: a.sector,
      Headline: a.headline, Sentiment: a.sentiment, Category: a.category,
      Keywords: (a.keywords || []).join('; '), Source: a.source,
      AutoGenerated: a.isAutoGenerated ? 'Yes' : 'No',
    }));
    downloadCSV(rows, 'sentiment_report.csv');
  };

  const exportPortfolioSentiment = () => {
    const rows = portfolioOverlay.map(r => ({
      Company: r.company, Ticker: r.ticker, Weight: r.weight != null ? (r.weight * 100).toFixed(1) + '%' : '',
      Sentiment: r.sentiment != null ? r.sentiment : '', Articles: r.articles,
      ESGScore: r.esgScore || '', LatestHeadline: r.latestHeadline || '',
    }));
    downloadCSV(rows, 'portfolio_sentiment.csv');
  };

  /* ── Gauge helper ──────────────────────────────────────────────── */
  const GaugeDisplay = ({ value, label }) => {
    const color = value > 0.3 ? T.green : value > 0 ? T.amber : value > -0.3 ? T.amber : T.red;
    const pct = Math.min(Math.max((value + 1) / 2 * 100, 0), 100);
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: T.textMut, fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ position: 'relative', height: 12, background: T.surfaceH, borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: pct + '%', background: color, borderRadius: 6, transition: 'width 0.4s' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, width: 2, height: '100%', background: T.textMut, opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{fmt(value)}</div>
      </div>
    );
  };

  const inputStyle = { padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, color: T.text, background: T.surface, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const btnStyle = (bg, fg) => ({ padding: '8px 16px', borderRadius: 8, border: 'none', background: bg, color: fg, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: T.font, transition: 'opacity 0.15s' });

  /* ── KPI cards ─────────────────────────────────────────────────── */
  const kpiCards = [
    { label: 'Avg Sentiment', value: fmt(avgSentiment), color: sentimentColor(avgSentiment) },
    { label: 'Positive Articles', value: posCount, color: T.green },
    { label: 'Negative Articles', value: negCount, color: T.red },
    { label: 'Most Mentioned Sector', value: mostMentionedSector, color: T.navy },
    { label: 'Active Alerts', value: activeAlerts.length, color: activeAlerts.length > 0 ? T.red : T.green },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text, padding: '32px 40px' }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: T.navy }}>AI ESG Sentiment Intelligence</h1>
            <span style={{ fontSize: 11, fontWeight: 600, background: T.navy, color: '#fff', padding: '4px 12px', borderRadius: 20, letterSpacing: 0.5 }}>EP-H5</span>
          </div>
          <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>NLP Feed &middot; {filteredArticles.length} Articles &middot; E/S/G Classification &middot; Portfolio Overlay</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAddArticle(!showAddArticle)} style={btnStyle(T.navy, '#fff')}>+ Add Article</button>
          <button onClick={exportSentimentReport} style={btnStyle(T.sage, '#fff')}>Export Feed CSV</button>
          {holdings.length > 0 && <button onClick={exportPortfolioSentiment} style={btnStyle(T.gold, '#fff')}>Export Portfolio CSV</button>}
        </div>
      </div>

      {/* ── Alert Banner ─────────────────────────────────────────── */}
      {activeAlerts.length > 0 && (
        <div style={{ background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.2)`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.red }}>Sentiment Alerts ({activeAlerts.length})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.textSec }}>
              <span>Threshold:</span>
              <input type="range" min="-1" max="0" step="0.1" value={alertThreshold}
                onChange={e => setAlertThreshold(parseFloat(e.target.value))}
                style={{ width: 100, accentColor: T.red }} />
              <span style={{ fontWeight: 600, color: T.red }}>{alertThreshold.toFixed(1)}</span>
            </div>
          </div>
          {activeAlerts.map(al => (
            <div key={al.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid rgba(220,38,38,0.1)` }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
                <span style={{ fontWeight: 700, color: T.navy, minWidth: 120 }}>{al.company}</span>
                <span style={{ fontWeight: 700, color: T.red }}>{fmt(al.sentiment)}</span>
                <span style={{ fontSize: 12, color: T.textSec, flex: 1 }}>{al.headline}</span>
                <span style={{ fontSize: 11, color: T.textMut }}>{al.date}</span>
              </div>
              <button onClick={() => dismissAlert(al.id)} style={{ ...btnStyle('transparent', T.textMut), border: `1px solid ${T.border}`, padding: '4px 10px', fontSize: 11 }}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Custom Article Form ──────────────────────────────── */}
      {showAddArticle && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.navy, margin: '0 0 16px' }}>Add Custom Sentiment Article</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input placeholder="Headline *" value={newArticle.headline} onChange={e => setNewArticle({ ...newArticle, headline: e.target.value })} style={inputStyle} />
            <input placeholder="Company Name *" value={newArticle.company} onChange={e => setNewArticle({ ...newArticle, company: e.target.value })} style={inputStyle} />
            <input placeholder="Ticker" value={newArticle.ticker} onChange={e => setNewArticle({ ...newArticle, ticker: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: T.textMut, display: 'block', marginBottom: 4 }}>Sentiment (-1 to 1)</label>
              <input type="number" min="-1" max="1" step="0.1" value={newArticle.sentiment} onChange={e => setNewArticle({ ...newArticle, sentiment: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.textMut, display: 'block', marginBottom: 4 }}>Category</label>
              <select value={newArticle.category} onChange={e => setNewArticle({ ...newArticle, category: e.target.value })} style={inputStyle}>
                <option value="E">Environmental</option><option value="S">Social</option><option value="G">Governance</option>
              </select>
            </div>
            <input placeholder="Source" value={newArticle.source} onChange={e => setNewArticle({ ...newArticle, source: e.target.value })} style={inputStyle} />
            <input placeholder="Keywords (comma-separated)" value={newArticle.keywords} onChange={e => setNewArticle({ ...newArticle, keywords: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addCustomArticle} style={btnStyle(T.green, '#fff')}>Add Article</button>
            <button onClick={() => setShowAddArticle(false)} style={btnStyle(T.surfaceH, T.textSec)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map((c, i) => (
          <div key={i} style={{ background: T.surface, borderRadius: 12, padding: '20px 24px', border: `1px solid ${T.border}`, borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 12, color: T.textMut, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Portfolio Weighted Sentiment Gauge ────────────────────── */}
      {portfolioWeightedSentiment != null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
            <GaugeDisplay value={portfolioWeightedSentiment} label="Portfolio-Weighted Sentiment" />
            <div style={{ fontSize: 11, color: T.textMut, textAlign: 'center', marginTop: 8 }}>
              Weighted average of article sentiment per holding (weight x avg sentiment)
            </div>
          </div>
          <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
            <GaugeDisplay value={avgSentiment} label="Feed-Wide Avg Sentiment" />
            <div style={{ fontSize: 11, color: T.textMut, textAlign: 'center', marginTop: 8 }}>
              Simple average across all {filteredArticles.length} filtered articles
            </div>
          </div>
        </div>
      )}

      {/* ── Filters Bar ──────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: '16px 24px', border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1 1 200px' }}>
            <input placeholder="Search headlines, companies, keywords..." value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ ...inputStyle, background: T.bg }} />
          </div>
          {/* Sentiment range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ color: T.textMut, whiteSpace: 'nowrap' }}>Sentiment:</span>
            <input type="number" min="-1" max="1" step="0.1" value={sentimentRange[0]} onChange={e => setSentimentRange([parseFloat(e.target.value), sentimentRange[1]])}
              style={{ ...inputStyle, width: 60, padding: '6px 8px', fontSize: 12 }} />
            <span style={{ color: T.textMut }}>to</span>
            <input type="number" min="-1" max="1" step="0.1" value={sentimentRange[1]} onChange={e => setSentimentRange([sentimentRange[0], parseFloat(e.target.value)])}
              style={{ ...inputStyle, width: 60, padding: '6px 8px', fontSize: 12 }} />
          </div>
          {/* Category checkboxes */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['E', 'S', 'G'].map(c => (
              <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: categoryFilter[c] ? catColors[c] : T.textMut, fontWeight: categoryFilter[c] ? 600 : 400 }}>
                <input type="checkbox" checked={categoryFilter[c]} onChange={() => setCategoryFilter(p => ({ ...p, [c]: !p[c] }))}
                  style={{ accentColor: catColors[c] }} />
                {catLabels[c]}
              </label>
            ))}
          </div>
          {/* Source */}
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: 12 }}>
            {allSources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Date range */}
          <select value={dateRange} onChange={e => setDateRange(parseInt(e.target.value))} style={{ ...inputStyle, width: 'auto', padding: '6px 12px', fontSize: 12 }}>
            <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last year</option>
          </select>
          {/* Portfolio only */}
          {holdings.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: portfolioOnly ? T.navy : T.textMut, fontWeight: portfolioOnly ? 600 : 400 }}>
              <input type="checkbox" checked={portfolioOnly} onChange={() => setPortfolioOnly(!portfolioOnly)} style={{ accentColor: T.navy }} />
              Portfolio Only
            </label>
          )}
          {/* Active keyword filter badge */}
          {activeKeywordFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: T.gold, color: '#fff', padding: '4px 10px', borderRadius: 14, fontSize: 11, fontWeight: 600 }}>
              Keyword: {activeKeywordFilter}
              <span onClick={() => setActiveKeywordFilter(null)} style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>&times;</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Sentiment Trend Chart ────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: T.navy }}>Sentiment Trend (Daily Average)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.4} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => v.slice(5)} />
            <YAxis domain={[-1, 1]} tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={v => v.toFixed(1)} />
            <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
              formatter={v => [v.toFixed(3), 'Sentiment']} labelFormatter={l => `Date: ${l}`} />
            <ReferenceLine y={0} stroke={T.textMut} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="sentiment" stroke={T.green} strokeWidth={2} fill="url(#gradPos)"
              dot={{ r: 4, fill: T.surface, stroke: T.green, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Sector Heatmap + E/S/G Pie ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Sector Sentiment Heatmap</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Sector', 'Avg Sentiment', '# Articles', 'Top Keyword', 'Trend'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectorData.map((r, i) => {
                const bgRow = r.avg > 0.3 ? 'rgba(22,163,74,0.06)' : r.avg < -0.3 ? 'rgba(220,38,38,0.06)' : 'transparent';
                return (
                  <tr key={i} style={{ background: hoveredSector === i ? T.surfaceH : bgRow, borderBottom: `1px solid ${T.border}`, cursor: 'default', transition: 'background 0.15s' }}
                    onMouseEnter={() => setHoveredSector(i)} onMouseLeave={() => setHoveredSector(null)}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.sector}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: sentimentColor(r.avg) }}>{fmt(r.avg)}</td>
                    <td style={{ padding: '10px 12px' }}>{r.count}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: T.surfaceH, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{r.topKeyword}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: r.trend === 'Improving' ? T.green : r.trend === 'Declining' ? T.red : T.amber }}>{r.trend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>E/S/G Category Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={esgDist} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: T.textMut }}>
                {esgDist.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {esgDist.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.color }} />
                <span style={{ color: T.textSec }}>{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Keywords (clickable) ─────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Top Keywords (Click to Filter Feed)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['#', 'Keyword', 'Frequency', 'Avg Sentiment', 'Category', 'Time Periods'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keywordData.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: activeKeywordFilter === r.keyword ? 'rgba(197,169,106,0.1)' : 'transparent' }}
                onClick={() => setActiveKeywordFilter(activeKeywordFilter === r.keyword ? null : r.keyword)}>
                <td style={{ padding: '10px 12px', color: T.textMut }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                  {r.keyword}
                  {activeKeywordFilter === r.keyword && <span style={{ marginLeft: 6, fontSize: 10, color: T.gold }}>(active)</span>}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: Math.max(r.frequency * 20, 16), height: 8, borderRadius: 4, background: T.gold, transition: 'width 0.3s' }} />
                    <span>{r.frequency}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: sentimentColor(r.avgSentiment) }}>{fmt(r.avgSentiment)}</td>
                <td style={{ padding: '10px 12px' }}>
                  {r.category.split('/').map(c => (
                    <span key={c} style={{ display: 'inline-block', background: catColors[c] || T.textMut, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, marginRight: 4 }}>{catLabels[c] || c}</span>
                  ))}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: T.textSec }}>{r.periods} month(s)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Sentiment News Feed ──────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: T.navy }}>Sentiment News Feed ({filteredArticles.length})</h2>
          {drillCompany && (
            <button onClick={() => setDrillCompany(null)} style={btnStyle(T.surfaceH, T.textSec)}>Clear Company Filter</button>
          )}
        </div>
        <div style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 8 }}>
          {(drillCompany ? filteredArticles.filter(a => (a.ticker || '').toUpperCase() === drillCompany.toUpperCase()) : filteredArticles).map(a => {
            const barW = Math.abs(a.sentiment) * 100;
            const barColor = a.sentiment >= 0 ? T.green : T.red;
            return (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '90px 140px 1fr 120px 50px 70px', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
                onClick={() => setDrillCompany(a.ticker)}>
                <span style={{ fontSize: 12, color: T.textMut, fontWeight: 500 }}>{a.date}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>
                  {a.company}
                  {a.isAutoGenerated && <span style={{ fontSize: 9, color: T.gold, marginLeft: 4 }}>AUTO</span>}
                  {a.isCustom && <span style={{ fontSize: 9, color: '#7c3aed', marginLeft: 4 }}>CUSTOM</span>}
                </span>
                <span style={{ fontSize: 12, color: T.textSec, lineHeight: 1.4 }}>{a.headline}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: barW, height: 8, borderRadius: 4, background: barColor, transition: 'width 0.3s', minWidth: 4 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: barColor }}>{a.sentiment > 0 ? '+' : ''}{a.sentiment.toFixed(2)}</span>
                </div>
                <span style={{ display: 'inline-block', background: catColors[a.category], color: '#fff', padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, textAlign: 'center' }}>{a.category}</span>
                <span style={{ fontSize: 11, color: T.textMut }}>{a.source}</span>
              </div>
            );
          })}
          {filteredArticles.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: T.textMut, fontSize: 14 }}>No articles match current filters.</div>
          )}
        </div>
      </div>

      {/* ── Company Drill-Down Panel ─────────────────────────────── */}
      {drillData && drillCompany && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `2px solid ${T.gold}`, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: T.navy }}>
              Company Drill-Down: {drillData.gcmMatch?.name || drillCompany} ({drillCompany})
            </h2>
            <button onClick={() => setDrillCompany(null)} style={btnStyle(T.surfaceH, T.textSec)}>Close</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Sentiment trend */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Sentiment Over Time ({drillData.articles.length} articles)</h3>
              {drillData.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={drillData.trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textMut }} tickFormatter={v => v.slice(5)} />
                    <YAxis domain={[-1, 1]} tick={{ fontSize: 10, fill: T.textMut }} />
                    <Area type="monotone" dataKey="sentiment" stroke={T.navy} fill="rgba(27,58,92,0.1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: T.textMut, fontSize: 13 }}>No trend data available</div>
              )}
            </div>
            {/* Company info from GCM */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Company Profile (Global Master)</h3>
              {drillData.gcmMatch ? (
                <div style={{ fontSize: 12, lineHeight: 2 }}>
                  <div><span style={{ color: T.textMut }}>Name:</span> <b>{drillData.gcmMatch.name}</b></div>
                  <div><span style={{ color: T.textMut }}>Sector:</span> {drillData.gcmMatch.sector}</div>
                  <div><span style={{ color: T.textMut }}>Exchange:</span> {drillData.gcmMatch.exchange}</div>
                  <div><span style={{ color: T.textMut }}>ESG Score:</span> <b style={{ color: sentimentColor((drillData.gcmMatch.esg_score || 0) / 100 * 2 - 1) }}>{drillData.gcmMatch.esg_score || 'N/A'}</b>/100</div>
                  <div><span style={{ color: T.textMut }}>SBTi:</span> {drillData.gcmMatch.sbti_committed ? 'Committed' : 'Not committed'}</div>
                  <div><span style={{ color: T.textMut }}>Scope 1:</span> {drillData.gcmMatch.scope1_mt != null ? drillData.gcmMatch.scope1_mt.toLocaleString() + ' Mt' : 'N/A'}</div>
                  <div><span style={{ color: T.textMut }}>Scope 2:</span> {drillData.gcmMatch.scope2_mt != null ? drillData.gcmMatch.scope2_mt.toLocaleString() + ' Mt' : 'N/A'}</div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => navigate('/holdings-deep-dive')} style={btnStyle(T.navy, '#fff')}>
                      View in Holdings Deep-Dive &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 20, color: T.textMut, fontSize: 13 }}>Company not found in Global Company Master.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Portfolio Sentiment Overlay ───────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: 24, border: `1px solid ${T.border}`, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: T.navy }}>Portfolio Sentiment Overlay</h2>
        {holdings.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ color: T.textMut, fontSize: 14, marginBottom: 12 }}>No portfolio loaded. Save a portfolio via the Portfolio Builder to see sentiment overlay.</div>
            <button onClick={() => navigate('/portfolio-manager')} style={btnStyle(T.navy, '#fff')}>Go to Portfolio Builder</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Company', 'Ticker', 'Weight', 'Sentiment', '# Articles', 'ESG Score', 'Latest Headline'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.textSec, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioOverlay.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: drillCompany === r.ticker ? 'rgba(197,169,106,0.08)' : 'transparent' }}
                  onClick={() => setDrillCompany(r.ticker)}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.company}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{r.ticker}</td>
                  <td style={{ padding: '10px 12px' }}>{r.weight != null ? (r.weight * 100).toFixed(1) + '%' : '--'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: r.sentiment != null ? sentimentColor(r.sentiment) : T.textMut }}>
                    {r.sentiment != null ? fmt(r.sentiment) : '--'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{r.articles}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: r.esgScore ? (r.esgScore > 60 ? T.green : r.esgScore > 40 ? T.amber : T.red) : T.textMut }}>
                    {r.esgScore || '--'}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: r.latestHeadline ? T.textSec : T.textMut, fontStyle: r.latestHeadline ? 'normal' : 'italic', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.latestHeadline || 'No recent coverage'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: T.textMut }}>
        Risk Analytics Platform &middot; AI ESG Sentiment Intelligence (EP-H5) &middot; {allArticles.length} Total Articles &middot; {filteredArticles.length} Filtered
      </div>
    </div>
  );
}

export default AiSentimentPage;
