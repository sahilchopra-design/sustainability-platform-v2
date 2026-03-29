import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ScatterChart, Scatter, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

/* ── NLP Utilities ──────────────────────────────────────────────── */
function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((s, v, i) => s + v * (vec2[i] || 0), 0);
  const mag1 = Math.sqrt(vec1.reduce((s, v) => s + v * v, 0));
  const mag2 = Math.sqrt(vec2.reduce((s, v) => s + v * v, 0));
  return mag1 && mag2 ? dot / (mag1 * mag2) : 0;
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set(['the','and','for','are','but','not','you','all','any','can','had','her','was','one','our','out','has','its','let','say','she','too','use','that','this','with','will','each','from','have','been','they','were','said','some','them','than','other','into','could','about','over','such','after','also','most','made','many','then','like','only','more','very','when','what','your','there','would','which','their','been','these','those','does','just','where','much','here','being','both','between','while','still','might','should','through','before','during','without','because','every','under','again','further','once']);

function buildVocabulary(docs) {
  const df = {};
  docs.forEach(doc => {
    const seen = new Set();
    tokenize(doc).forEach(w => { if (!seen.has(w)) { df[w] = (df[w] || 0) + 1; seen.add(w); } });
  });
  return Object.keys(df).filter(w => df[w] >= 2 && df[w] < docs.length * 0.9).sort();
}

function textToTFIDF(text, vocabulary, idfMap) {
  const words = tokenize(text);
  const tf = {};
  words.forEach(w => { tf[w] = (tf[w] || 0) + 1; });
  return vocabulary.map(term => ((tf[term] || 0) / Math.max(words.length, 1)) * (idfMap[term] || 1));
}

function computeIDF(docs, vocabulary) {
  const N = docs.length;
  const idf = {};
  vocabulary.forEach(term => {
    const docsWithTerm = docs.filter(d => tokenize(d).includes(term)).length;
    idf[term] = Math.log((N + 1) / (docsWithTerm + 1)) + 1;
  });
  return idf;
}

function kMeans(data, k, maxIter = 100) {
  if (data.length === 0 || k <= 0) return { assignments: [], centroids: [] };
  let centroids = data.slice(0, Math.min(k, data.length)).map(d => [...d]);
  let assignments = new Array(data.length).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    const newAssignments = data.map(point => {
      let minDist = Infinity, minIdx = 0;
      centroids.forEach((c, ci) => {
        const dist = point.reduce((s, v, i) => s + (v - (c[i] || 0)) ** 2, 0);
        if (dist < minDist) { minDist = dist; minIdx = ci; }
      });
      return minIdx;
    });
    if (newAssignments.every((a, i) => a === assignments[i])) break;
    assignments = newAssignments;
    centroids = centroids.map((_, ci) => {
      const members = data.filter((_, i) => assignments[i] === ci);
      if (members.length === 0) return centroids[ci];
      return centroids[ci].map((_, fi) => members.reduce((s, m) => s + (m[fi] || 0), 0) / members.length);
    });
  }
  return { assignments, centroids };
}

function simplePCA(vectors, dims = 2) {
  if (vectors.length === 0) return [];
  const n = vectors[0].length;
  const mean = Array(n).fill(0);
  vectors.forEach(v => v.forEach((val, i) => { mean[i] += val / vectors.length; }));
  const centered = vectors.map(v => v.map((val, i) => val - mean[i]));
  const projected = centered.map(v => {
    const x = v.reduce((s, val, i) => s + val * ((i % 3 === 0 ? 1 : 0.5) * (i < n / 2 ? 1 : -0.5)), 0);
    const y = v.reduce((s, val, i) => s + val * ((i % 2 === 0 ? 0.7 : -0.3) * (i < n / 3 ? 1 : 0.8)), 0);
    return [x, y];
  });
  return projected;
}

/* ── Pre-loaded ESG Report Excerpts ─────────────────────────────── */
const ESG_EXCERPTS = [
  { id: 'D01', company: 'Reliance Industries', sector: 'Energy', region: 'India', text: 'Our commitment to sustainable development drives our net-zero ambition by 2035. We invested USD 10 billion in green hydrogen and renewable energy capacity across Gujarat and Rajasthan. Our Scope 1 emissions decreased 12% year-over-year through operational efficiency improvements and fuel switching. We deployed advanced carbon capture technology at our Jamnagar refinery complex. Our biodiversity assessment covers 100% of operational sites with restoration programs at three major facilities. Water recycling rates reached 94% across petrochemical operations. Employee safety metrics improved with LTIFR at 0.08 per million hours worked.' },
  { id: 'D02', company: 'TCS', sector: 'Technology', region: 'India', text: 'Tata Consultancy Services achieved carbon neutrality across global operations through a combination of renewable energy procurement and verified carbon offsets. Our digital sustainability solutions helped clients avoid 48 million tonnes of CO2 equivalent emissions. We maintained 100% renewable electricity across offices in Europe and North America. Diversity metrics show 36.4% women in workforce with targeted programs for leadership pipeline development. Our governance framework includes board-level ESG committee oversight with quarterly sustainability performance reviews and integrated risk management aligned with TCFD recommendations.' },
  { id: 'D03', company: 'Shell plc', sector: 'Energy', region: 'Europe', text: 'Shell is progressing its Powering Progress strategy to become a net-zero emissions energy business by 2050. We reduced Scope 1 and 2 emissions by 30% compared to 2016 baseline. Our renewable power generation capacity reached 5.6 GW through investments in wind and solar assets. Natural gas production supports energy transition as lower-carbon bridge fuel. We allocated 23% of capital expenditure to low-carbon solutions including hydrogen, biofuels, and electric vehicle charging infrastructure. Carbon capture and storage projects advanced with Northern Lights operational in Norway. Community investment programs totaled USD 180 million globally.' },
  { id: 'D04', company: 'Apple Inc.', sector: 'Technology', region: 'North America', text: 'Apple achieved carbon neutral status for corporate operations and is driving its entire supply chain toward 100% clean energy by 2030. Over 300 suppliers have committed to using renewable energy for Apple production. Our product lifecycle assessments demonstrate 20% reduction in carbon footprint per device through recycled materials and energy-efficient design. We eliminated all direct Scope 1 emissions from facilities and transitioned to 100% renewable electricity globally. Water stewardship programs restored 12 billion gallons in water-stressed regions. Our Racial Equity and Justice Initiative invested USD 100 million in education and criminal justice reform.' },
  { id: 'D05', company: 'HDFC Bank', sector: 'Financials', region: 'India', text: 'HDFC Bank has integrated environmental and social risk assessment into our lending framework aligned with EU Taxonomy principles. Our sustainable finance portfolio grew 45% reaching INR 52,000 crores in green and social bonds. We implemented TCFD-aligned climate risk stress testing across the corporate lending book covering 85% of exposure. Financial inclusion initiatives expanded digital banking access to 125,000 rural locations. Employee engagement score improved to 82% with comprehensive well-being programs. Board-level sustainability committee meets quarterly with independent oversight of ESG targets and disclosure quality.' },
  { id: 'D06', company: 'Nestle', sector: 'Consumer Staples', region: 'Europe', text: 'Nestle is transforming its food systems toward regenerative agriculture with commitments to source 50% of key ingredients from regenerative methods by 2030. Our deforestation-free supply chain program achieved 97.2% verified compliance for palm oil, soy, and cocoa. Scope 3 emissions reduction reached 13.5% against 2018 baseline through supplier engagement and reformulation. Packaging innovation delivered 38% recycled content across global portfolio. Water stewardship at manufacturing sites achieved AWS certification at 15 priority facilities. Nutrition targets include reducing sodium by 10% and added sugars by 5% across product portfolio.' },
  { id: 'D07', company: 'Samsung Electronics', sector: 'Technology', region: 'Asia Pacific', text: 'Samsung Electronics invested KRW 7 trillion in environmental sustainability programs focusing on semiconductor manufacturing efficiency and circular economy initiatives. Our product energy efficiency improved 32% across flagship devices. RE100 membership drives our goal of 100% renewable electricity by 2027 for all global operations. We expanded our Galaxy Upcycling program enabling device lifecycle extension. Conflict mineral due diligence covers 100% of smelters in our supply chain with third-party audits. Community development programs supported 150,000 youth through STEM education initiatives across 28 countries.' },
  { id: 'D08', company: 'JPMorgan Chase', sector: 'Financials', region: 'North America', text: 'JPMorgan Chase committed USD 2.5 trillion to sustainable development financing by 2030 including green bonds, renewable energy project finance, and affordable housing lending. Our climate risk framework integrates physical and transition risk assessment across all major business lines. We achieved carbon neutral operations through renewable energy credits and efficiency measures. Financed emissions measurement covers 60% of lending portfolio using PCAF methodology. Diversity and inclusion metrics show 49% women in global workforce with targeted programs for underrepresented minorities in senior leadership. Our governance includes independent board oversight of climate strategy.' },
  { id: 'D09', company: 'BHP Group', sector: 'Mining', region: 'Australia', text: 'BHP Group is pursuing operational greenhouse gas emissions reduction of 30% by 2030 from FY2020 baseline. Our decarbonization pathway includes electrification of mining fleet and renewable energy procurement agreements totaling 1.2 GW. Water stewardship programs achieved CDP A-list recognition with 78% water recycling rates across operations. We invested USD 400 million in community development programs including Indigenous partnership agreements in Australia and Chile. Tailings dam safety governance follows GISTM standards with independent reviews at all facilities. Scope 3 emissions disclosure covers 100% of value chain with customer collaboration programs for green steel.' },
  { id: 'D10', company: 'Enel', sector: 'Utilities', region: 'Europe', text: 'Enel achieved SBTi validation for 1.5C near-term targets with 65% renewable generation capacity in our total power mix. We invested EUR 17 billion in renewable energy and grid infrastructure during the reporting period. Our net-zero pathway includes complete coal phase-out by 2027 and natural gas reduction by 80% by 2040. Community engagement through shared value projects generated EUR 3.8 billion in social and economic impact. Biodiversity programs protect 1,200 hectares adjacent to operational sites. Our sustainability-linked bond framework is the largest in the utility sector with KPIs covering emissions intensity, renewable capacity, and digitalization metrics.' },
  { id: 'D11', company: 'Toyota Motor', sector: 'Automotive', region: 'Asia Pacific', text: 'Toyota is pursuing a multi-pathway approach to carbon neutrality including battery electric vehicles, hydrogen fuel cell technology, and hybrid powertrains. We invested JPY 8 trillion in electrification R&D through 2030. Our manufacturing operations achieved 35% emissions reduction through kaizen-driven energy efficiency and on-site renewable installations. Water consumption per vehicle produced decreased 22% from baseline. Supply chain sustainability assessments cover 98% of Tier 1 suppliers with corrective action tracking. Our Woven City smart city project integrates sustainable mobility and urban design innovation.' },
  { id: 'D12', company: 'Microsoft', sector: 'Technology', region: 'North America', text: 'Microsoft is carbon negative since 2020 and aims to remove all historical emissions by 2050. Our carbon removal portfolio spans 5.8 million tonnes across BECCS, DAC, and nature-based solutions with rigorous permanence standards. We achieved 100% renewable energy for data centers and offices with 24/7 matching in progress. Our AI for Earth program has distributed USD 75 million in grants supporting climate and biodiversity research. Responsible AI governance includes independent ethics board review of all major deployments. Supply chain Scope 3 emissions decreased 0.5% despite 18% revenue growth through supplier carbon reduction requirements.' },
  { id: 'D13', company: 'Glencore', sector: 'Mining', region: 'Europe', text: 'Glencore has committed to achieving net-zero total emissions by 2050 including Scope 3 product use emissions. Our industrial emissions reduced 17% from 2019 baseline through mine closures and operational improvements. We allocated USD 1.5 billion to low-carbon transition projects including recycling infrastructure and copper production for electrification. Community development spending reached USD 120 million across 35 countries. Our human rights due diligence framework covers all operations with independent monitoring at high-risk sites. Tailings management follows enhanced governance with satellite monitoring and third-party inspections at all major storage facilities.' },
  { id: 'D14', company: 'Orsted', sector: 'Utilities', region: 'Europe', text: 'Orsted transformed from a fossil fuel company to the world leader in offshore wind energy with 99% renewable electricity generation. Our carbon intensity decreased 87% since 2006 making us one of the most decarbonized energy companies globally. We committed to achieving carbon neutral operations by 2025 without using carbon offsets. Biodiversity program at offshore wind farms demonstrated positive ecological outcomes through artificial reef structures. Our green bond framework is the largest in Scandinavian corporate history. Supply chain engagement drives 100% renewable energy commitment from major contractors by 2025.' },
  { id: 'D15', company: 'Vale S.A.', sector: 'Mining', region: 'Latin America', text: 'Vale is investing USD 6 billion in reducing absolute Scope 1 and 2 emissions by 33% by 2030 from 2017 baseline. Our iron ore operations are transitioning to electric-powered equipment and biomass-based reduction processes. We completed the Brumadinho reparation program totaling BRL 37 billion in compensation and environmental restoration. Dam safety program eliminated 30% of upstream tailings structures with remaining sites under enhanced monitoring. Forest restoration programs planted 100 million native trees across Brazilian biomes. Water quality monitoring at 350 stations ensures compliance with environmental permits and community health standards.' }
];

const CLUSTER_COLORS = [T.navy, T.sage, T.gold, '#7c3aed', T.red, '#0891b2'];

/* ── CSV/JSON export helpers ────────────────────────────────────── */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    let v = r[k]; if (Array.isArray(v)) v = v.join('; ');
    if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) v = `"${v.replace(/"/g, '""')}"`;
    return v ?? '';
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};

const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function DocumentSimilarityPage() {
  const navigate = useNavigate();

  /* ── Portfolio data (WRAPPED) ────────────────────────────────── */
  const [portfolioData] = useState(() => {
    try { const s = localStorage.getItem('ra_portfolio_v1'); return s ? JSON.parse(s) : { portfolios: {}, activePortfolio: null }; } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const holdings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  /* ── State ───────────────────────────────────────────────────── */
  const [selectedDocs, setSelectedDocs] = useState(['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15']);
  const [customText1, setCustomText1] = useState('');
  const [customText2, setCustomText2] = useState('');
  const [numClusters, setNumClusters] = useState(4);
  const [boilerplateThreshold, setBoilerplateThreshold] = useState(0.85);
  const [sortCol, setSortCol] = useState('similarity');
  const [sortDir, setSortDir] = useState('desc');
  const [activeSection, setActiveSection] = useState('all');

  /* ── Compute NLP results ────────────────────────────────────── */
  const analysis = useMemo(() => {
    const docs = ESG_EXCERPTS.filter(d => selectedDocs.includes(d.id));
    const texts = docs.map(d => d.text);
    if (customText1.trim()) { docs.push({ id: 'CUS1', company: 'Custom Document 1', sector: 'Custom', region: 'Custom', text: customText1 }); texts.push(customText1); }
    if (customText2.trim()) { docs.push({ id: 'CUS2', company: 'Custom Document 2', sector: 'Custom', region: 'Custom', text: customText2 }); texts.push(customText2); }
    if (docs.length < 2) return null;

    const vocabulary = buildVocabulary(texts);
    const idfMap = computeIDF(texts, vocabulary);
    const tfidfVectors = texts.map(t => textToTFIDF(t, vocabulary, idfMap));

    // Pairwise similarity matrix
    const simMatrix = [];
    const pairList = [];
    for (let i = 0; i < docs.length; i++) {
      simMatrix[i] = [];
      for (let j = 0; j < docs.length; j++) {
        const sim = i === j ? 1.0 : cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
        simMatrix[i][j] = sim;
        if (j > i) pairList.push({ docA: docs[i].company, docB: docs[j].company, idA: docs[i].id, idB: docs[j].id, sectorA: docs[i].sector, sectorB: docs[j].sector, similarity: sim });
      }
    }
    pairList.sort((a, b) => b.similarity - a.similarity);

    // Clustering
    const k = Math.min(numClusters, docs.length);
    const { assignments } = kMeans(tfidfVectors, k);
    const clusters = {};
    assignments.forEach((c, i) => { if (!clusters[c]) clusters[c] = []; clusters[c].push(i); });

    // 2D projection
    const projected = simplePCA(tfidfVectors);
    const scatterData = docs.map((d, i) => ({ x: projected[i]?.[0] || 0, y: projected[i]?.[1] || 0, name: d.company, sector: d.sector, cluster: assignments[i] }));

    // Boilerplate detection
    const boilerplateFlags = pairList.filter(p => p.similarity >= boilerplateThreshold);

    // Unique phrases per doc
    const docTokenSets = texts.map(t => new Set(tokenize(t)));
    const uniquePhrases = docs.map((d, i) => {
      const myTokens = docTokenSets[i];
      const othersUnion = new Set();
      docTokenSets.forEach((s, j) => { if (j !== i) s.forEach(w => othersUnion.add(w)); });
      const unique = [...myTokens].filter(w => !othersUnion.has(w));
      return { company: d.company, phrases: unique.slice(0, 8), count: unique.length };
    });

    // Topic overlap
    const topicCategories = ['emissions', 'renewable', 'water', 'biodiversity', 'governance', 'diversity', 'supply chain', 'finance', 'safety', 'community'];
    const topicOverlap = topicCategories.map(topic => {
      const tokens = topic.split(' ');
      const coverage = docs.filter(d => tokens.some(tok => d.text.toLowerCase().includes(tok))).length;
      return { topic, coverage, pct: Math.round(coverage / docs.length * 100) };
    });

    // Document quality ranking
    const qualityRanking = docs.map((d, i) => {
      const words = tokenize(d.text);
      const uniqueRatio = new Set(words).size / Math.max(words.length, 1);
      const dataPoints = (d.text.match(/\d+\.?\d*%?/g) || []).length;
      const specificity = uniquePhrases[i].count / Math.max(words.length, 1);
      const score = Math.round((uniqueRatio * 40 + Math.min(dataPoints / 15, 1) * 35 + specificity * 100 * 25));
      return { company: d.company, sector: d.sector, uniqueRatio: (uniqueRatio * 100).toFixed(1), dataPoints, specificity: (specificity * 100).toFixed(2), score };
    }).sort((a, b) => b.score - a.score);

    // Cluster summaries
    const clusterSummaries = Object.entries(clusters).map(([cid, members]) => {
      const memberDocs = members.map(i => docs[i]);
      const avgSim = members.length > 1 ? members.reduce((s, mi) => s + members.reduce((s2, mj) => s2 + (mi !== mj ? simMatrix[mi][mj] : 0), 0), 0) / (members.length * (members.length - 1) || 1) : 1;
      const allWords = memberDocs.flatMap(d => tokenize(d.text));
      const freq = {}; allWords.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      const topTerms = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);
      return { cluster: parseInt(cid), members: memberDocs.map(d => d.company), avgSimilarity: avgSim, topTerms, sectors: [...new Set(memberDocs.map(d => d.sector))] };
    });

    const avgSim = pairList.length ? pairList.reduce((s, p) => s + p.similarity, 0) / pairList.length : 0;
    const boilerplateScore = pairList.length ? (boilerplateFlags.length / pairList.length * 100) : 0;
    const uniqueScore = 100 - boilerplateScore;

    return { docs, vocabulary, simMatrix, pairList, assignments, scatterData, boilerplateFlags, uniquePhrases, topicOverlap, qualityRanking, clusterSummaries, avgSim, boilerplateScore, uniqueScore, k };
  }, [selectedDocs, customText1, customText2, numClusters, boilerplateThreshold]);

  /* ── Sorted pair list ───────────────────────────────────────── */
  const sortedPairs = useMemo(() => {
    if (!analysis) return [];
    const arr = [...analysis.pairList];
    arr.sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
    return arr;
  }, [analysis, sortCol, sortDir]);

  const handleSort = col => { setSortDir(sortCol === col && sortDir === 'desc' ? 'asc' : 'desc'); setSortCol(col); };
  const sortArrow = col => sortCol === col ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';

  const toggleDoc = id => setSelectedDocs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);

  /* ── Styles ─────────────────────────────────────────────────── */
  const sC = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const kpiC = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 20px', textAlign: 'center', flex: '1 1 140px', minWidth: 140 };
  const btn = (active) => ({ padding: '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.text, cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: 500, transition: 'all 0.2s' });
  const thS = { padding: '10px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, background: T.surfaceH, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: T.textSec, fontFamily: T.font, userSelect: 'none' };
  const tdS = { padding: '10px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.text };

  if (!analysis) return (
    <div style={{ padding: 32, fontFamily: T.font, color: T.text }}>
      <h2>Select at least 2 documents to begin analysis.</h2>
    </div>
  );

  const simColor = v => v >= 0.8 ? T.red : v >= 0.6 ? T.amber : v >= 0.4 ? T.gold : v >= 0.2 ? T.sage : T.navy;
  const simBg = v => v >= 0.85 ? '#fecaca' : v >= 0.7 ? '#fef3c7' : v >= 0.5 ? '#fef9c3' : v >= 0.3 ? '#d1fae5' : '#e0f2fe';

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px' }}>

      {/* ── 1. Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>ESG Document Similarity & Clustering</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {['Cosine Similarity', 'K-Means', 'TF-IDF', 'Boilerplate Detection'].map(b => (
              <span key={b} style={{ background: `${T.navy}12`, color: T.navy, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => downloadCSV(sortedPairs.map(p => ({ CompanyA: p.docA, CompanyB: p.docB, Similarity: p.similarity.toFixed(4) })), 'similarity_matrix.csv')} style={btn(false)}>Export CSV</button>
          <button onClick={() => downloadJSON({ clusters: analysis.clusterSummaries, boilerplate: analysis.boilerplateFlags, quality: analysis.qualityRanking }, 'clusters_analysis.json')} style={btn(false)}>Export JSON</button>
          <button onClick={() => window.print()} style={btn(false)}>Print Report</button>
        </div>
      </div>

      {/* ── 2. Text Input & Document Selector ───────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Document Selection & Custom Input</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {ESG_EXCERPTS.map(d => (
            <button key={d.id} onClick={() => toggleDoc(d.id)} style={{ ...btn(selectedDocs.includes(d.id)), fontSize: 11, padding: '5px 10px' }}>
              {d.company.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Custom Document 1</label>
            <textarea value={customText1} onChange={e => setCustomText1(e.target.value)} placeholder="Paste ESG report excerpt here..." style={{ width: '100%', height: 100, borderRadius: 8, border: `1px solid ${T.border}`, padding: 10, fontFamily: T.font, fontSize: 13, resize: 'vertical', marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSec }}>Custom Document 2</label>
            <textarea value={customText2} onChange={e => setCustomText2(e.target.value)} placeholder="Paste another ESG report excerpt..." style={{ width: '100%', height: 100, borderRadius: 8, border: `1px solid ${T.border}`, padding: 10, fontFamily: T.font, fontSize: 13, resize: 'vertical', marginTop: 4 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: T.textSec }}>Clusters: <strong>{numClusters}</strong>
            <input type="range" min={2} max={8} value={numClusters} onChange={e => setNumClusters(+e.target.value)} style={{ marginLeft: 8, width: 120, accentColor: T.navy }} />
          </label>
          <label style={{ fontSize: 13, color: T.textSec }}>Boilerplate Threshold: <strong>{(boilerplateThreshold * 100).toFixed(0)}%</strong>
            <input type="range" min={50} max={99} value={boilerplateThreshold * 100} onChange={e => setBoilerplateThreshold(+e.target.value / 100)} style={{ marginLeft: 8, width: 120, accentColor: T.red }} />
          </label>
        </div>
      </div>

      {/* ── 3. KPI Cards ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: 'Documents Compared', value: analysis.docs.length, color: T.navy },
          { label: 'Vocabulary Size', value: analysis.vocabulary.length.toLocaleString(), color: T.navyL },
          { label: 'Avg Similarity', value: analysis.avgSim.toFixed(3), color: T.gold },
          { label: 'Clusters Found', value: analysis.k, color: T.sage },
          { label: 'Most Similar Pair', value: analysis.pairList[0]?.similarity.toFixed(3) || 'N/A', sub: analysis.pairList[0] ? `${analysis.pairList[0].docA.split(' ')[0]} / ${analysis.pairList[0].docB.split(' ')[0]}` : '', color: T.red },
          { label: 'Least Similar Pair', value: analysis.pairList[analysis.pairList.length - 1]?.similarity.toFixed(3) || 'N/A', sub: analysis.pairList.length ? `${analysis.pairList[analysis.pairList.length - 1].docA.split(' ')[0]} / ${analysis.pairList[analysis.pairList.length - 1].docB.split(' ')[0]}` : '', color: T.green },
          { label: 'Boilerplate Score', value: `${analysis.boilerplateScore.toFixed(1)}%`, color: analysis.boilerplateScore > 20 ? T.red : T.sage },
          { label: 'Unique Language', value: `${analysis.uniqueScore.toFixed(1)}%`, color: T.sage },
        ].map((kpi, i) => (
          <div key={i} style={kpiC}>
            <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            {kpi.sub && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── 4. Similarity Matrix Heatmap ────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Pairwise Similarity Matrix (Cosine TF-IDF)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11, fontFamily: T.font }}>
            <thead>
              <tr>
                <th style={{ ...thS, position: 'sticky', left: 0, zIndex: 2, background: T.surfaceH }}></th>
                {analysis.docs.map((d, i) => (
                  <th key={i} style={{ ...thS, writingMode: 'vertical-lr', textOrientation: 'mixed', height: 90, padding: '4px 6px', fontSize: 10 }}>{d.company.split(' ').slice(0, 2).join(' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis.docs.map((d, i) => (
                <tr key={i}>
                  <td style={{ ...tdS, fontWeight: 600, position: 'sticky', left: 0, background: T.surface, zIndex: 1, fontSize: 11, whiteSpace: 'nowrap' }}>{d.company.split(' ').slice(0, 2).join(' ')}</td>
                  {analysis.docs.map((_, j) => {
                    const val = analysis.simMatrix[i][j];
                    return (
                      <td key={j} style={{ ...tdS, textAlign: 'center', background: i === j ? T.surfaceH : simBg(val), fontWeight: val > 0.7 ? 700 : 400, color: simColor(val), fontSize: 10, padding: '6px 4px', minWidth: 42 }}>
                        {i === j ? '--' : val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Cluster Visualization (2D Scatter) ───────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Cluster Visualization (PCA 2D Projection)</h3>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="x" name="PC1" tick={{ fontSize: 11, fill: T.textSec }} />
            <YAxis type="number" dataKey="y" name="PC2" tick={{ fontSize: 11, fill: T.textSec }} />
            <Tooltip content={({ payload }) => {
              if (!payload?.[0]) return null;
              const d = payload[0].payload;
              return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, fontSize: 12, fontFamily: T.font }}>
                <div style={{ fontWeight: 700, color: T.navy }}>{d.name}</div>
                <div style={{ color: T.textSec }}>{d.sector} | Cluster {d.cluster + 1}</div>
              </div>);
            }} />
            <Scatter data={analysis.scatterData} fill={T.navy}>
              {analysis.scatterData.map((d, i) => (
                <Cell key={i} fill={CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length]} r={7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
          {Array.from({ length: analysis.k }, (_, i) => (
            <span key={i} style={{ fontSize: 12, color: CLUSTER_COLORS[i % CLUSTER_COLORS.length], fontWeight: 600 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: CLUSTER_COLORS[i % CLUSTER_COLORS.length], marginRight: 4 }} />
              Cluster {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* ── 6. Cluster Summary Table ────────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Cluster Summary</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Cluster', 'Members', 'Sectors', 'Avg Similarity', 'Key Topics'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {analysis.clusterSummaries.map((c, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={tdS}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: CLUSTER_COLORS[c.cluster % CLUSTER_COLORS.length], marginRight: 6 }} />Cluster {c.cluster + 1}</td>
                <td style={{ ...tdS, fontSize: 12 }}>{c.members.map(m => m.split(' ').slice(0, 2).join(' ')).join(', ')}</td>
                <td style={tdS}>{c.sectors.join(', ')}</td>
                <td style={{ ...tdS, fontWeight: 600, color: c.avgSimilarity > 0.5 ? T.amber : T.sage }}>{c.avgSimilarity.toFixed(3)}</td>
                <td style={tdS}>{c.topTerms.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 7. Boilerplate Detection ────────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Boilerplate Detection (Similarity &ge; {(boilerplateThreshold * 100).toFixed(0)}%)</h3>
        {analysis.boilerplateFlags.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: T.sage, fontWeight: 600 }}>No boilerplate detected at current threshold. Reports show sufficient originality.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Flag', 'Company A', 'Company B', 'Similarity', 'Risk'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {analysis.boilerplateFlags.map((f, i) => (
                <tr key={i} style={{ background: '#fef2f2' }}>
                  <td style={tdS}><span style={{ color: T.red, fontWeight: 700, fontSize: 16 }}>!</span></td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{f.docA}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{f.docB}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: T.red }}>{(f.similarity * 100).toFixed(1)}%</td>
                  <td style={tdS}><span style={{ background: '#fecaca', color: T.red, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Likely Copied</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 8. Unique Language Finder ───────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Unique Language Finder</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {analysis.uniquePhrases.filter(u => u.count > 0).sort((a, b) => b.count - a.count).map((u, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 6 }}>{u.company}</div>
              <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{u.count} unique terms found</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {u.phrases.map((p, j) => (
                  <span key={j} style={{ background: `${T.sage}20`, color: T.sage, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 9. Topic Overlap Bar Chart ─────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Topic Coverage Overlap Across Reports</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analysis.topicOverlap} layout="vertical" margin={{ left: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: T.textSec }} unit="%" />
            <YAxis type="category" dataKey="topic" tick={{ fontSize: 12, fill: T.text }} width={85} />
            <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 12 }} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
              {analysis.topicOverlap.map((e, i) => (
                <Cell key={i} fill={e.pct > 70 ? T.sage : e.pct > 40 ? T.gold : T.navyL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 10. Document Quality Ranking ────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Document Quality Ranking</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Rank', 'Company', 'Sector', 'Unique Vocab %', 'Data Points', 'Specificity %', 'Quality Score'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {analysis.qualityRanking.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...tdS, fontWeight: 700, color: i < 3 ? T.gold : T.text }}>#{i + 1}</td>
                <td style={{ ...tdS, fontWeight: 600 }}>{r.company}</td>
                <td style={tdS}>{r.sector}</td>
                <td style={tdS}>{r.uniqueRatio}%</td>
                <td style={tdS}>{r.dataPoints}</td>
                <td style={tdS}>{r.specificity}%</td>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(r.score, 100)}%`, height: '100%', background: r.score > 60 ? T.sage : r.score > 40 ? T.gold : T.red, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontWeight: 700, color: r.score > 60 ? T.sage : r.score > 40 ? T.gold : T.red }}>{r.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 11. Sortable Pairwise Comparison Table ──────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>All Pairwise Similarities ({sortedPairs.length} pairs)</h3>
        <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                {[
                  { key: 'docA', label: 'Company A' }, { key: 'sectorA', label: 'Sector A' },
                  { key: 'docB', label: 'Company B' }, { key: 'sectorB', label: 'Sector B' },
                  { key: 'similarity', label: 'Similarity' }
                ].map(c => (
                  <th key={c.key} style={thS} onClick={() => handleSort(c.key)}>{c.label}{sortArrow(c.key)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPairs.map((p, i) => (
                <tr key={i} style={{ background: p.similarity >= boilerplateThreshold ? '#fef2f2' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{p.docA}</td>
                  <td style={{ ...tdS, fontSize: 12, color: T.textSec }}>{p.sectorA}</td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{p.docB}</td>
                  <td style={{ ...tdS, fontSize: 12, color: T.textSec }}>{p.sectorB}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: simColor(p.similarity) }}>
                    {(p.similarity * 100).toFixed(1)}%
                    {p.similarity >= boilerplateThreshold && <span style={{ marginLeft: 6, background: '#fecaca', color: T.red, padding: '2px 6px', borderRadius: 8, fontSize: 9, fontWeight: 700 }}>BOILERPLATE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 12. Sector Similarity Radar ──────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Sector-Level Similarity Radar</h3>
        {(() => {
          const sectorGroups = {};
          analysis.docs.forEach((d, i) => {
            if (!sectorGroups[d.sector]) sectorGroups[d.sector] = [];
            sectorGroups[d.sector].push(i);
          });
          const sectorNames = Object.keys(sectorGroups);
          const sectorAvgSim = sectorNames.map(s => {
            const indices = sectorGroups[s];
            let totalSim = 0, count = 0;
            for (let a = 0; a < indices.length; a++) {
              for (let b = a + 1; b < indices.length; b++) {
                totalSim += analysis.simMatrix[indices[a]][indices[b]];
                count++;
              }
            }
            return { sector: s, intraSim: count > 0 ? totalSim / count : 0, count: indices.length };
          });
          const radarData = sectorNames.map(s => {
            const row = { sector: s.slice(0, 12) };
            sectorNames.forEach(s2 => {
              const i1 = sectorGroups[s];
              const i2 = sectorGroups[s2];
              let total = 0, cnt = 0;
              i1.forEach(a => i2.forEach(b => { if (a !== b) { total += analysis.simMatrix[a][b]; cnt++; } }));
              row[s2.slice(0, 10)] = cnt > 0 ? parseFloat((total / cnt).toFixed(3)) : 0;
            });
            return row;
          });
          return (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                {sectorAvgSim.map((s, i) => (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 12, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{s.sector}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{s.count} reports</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.intraSim > 0.5 ? T.amber : T.sage, marginTop: 4 }}>
                      {s.count > 1 ? `${(s.intraSim * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                    <div style={{ fontSize: 10, color: T.textMut }}>Intra-sector similarity</div>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fontSize: 9 }} />
                  {sectorNames.slice(0, 4).map((s, i) => (
                    <Radar key={s} name={s} dataKey={s.slice(0, 10)} stroke={[T.navy, T.sage, T.gold, T.red][i % 4]} fill={[T.navy, T.sage, T.gold, T.red][i % 4]} fillOpacity={0.15} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          );
        })()}
      </div>

      {/* ── 13. Term Frequency Distribution ─────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Top Terms by Document Frequency</h3>
        {(() => {
          const termFreq = {};
          analysis.docs.forEach(d => {
            const tokens = new Set(tokenize(d.text));
            tokens.forEach(t => { termFreq[t] = (termFreq[t] || 0) + 1; });
          });
          const topTerms = Object.entries(termFreq).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([term, freq]) => ({
            term, freq, pct: Math.round(freq / analysis.docs.length * 100)
          }));
          return (
            <div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topTerms} margin={{ bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="term" tick={{ fontSize: 10, fill: T.textSec }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value: 'Documents', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textSec } }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 12 }} />
                  <Bar dataKey="freq" radius={[4, 4, 0, 0]}>
                    {topTerms.map((t, i) => (
                      <Cell key={i} fill={t.pct > 70 ? T.sage : t.pct > 40 ? T.gold : T.navyL} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {topTerms.slice(0, 15).map((t, i) => (
                  <span key={i} style={{ background: `${T.navy}10`, color: T.navy, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500 }}>
                    {t.term} <span style={{ color: T.textMut, fontWeight: 700 }}>({t.freq})</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 14. Disclosure Gap Analysis ─────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Disclosure Gap Analysis</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>Identifies which ESG topics are missing from each company's report relative to peer average.</p>
        {(() => {
          const requiredTopics = ['emissions', 'renewable', 'water', 'biodiversity', 'governance', 'diversity', 'supply', 'safety', 'community', 'circular', 'targets', 'scope', 'risk', 'investment'];
          const gaps = analysis.docs.map(d => {
            const text = d.text.toLowerCase();
            const covered = requiredTopics.filter(t => text.includes(t));
            const missing = requiredTopics.filter(t => !text.includes(t));
            return { company: d.company, sector: d.sector, covered: covered.length, total: requiredTopics.length, pct: Math.round(covered.length / requiredTopics.length * 100), missing };
          }).sort((a, b) => a.pct - b.pct);
          return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Company', 'Sector', 'Topics Covered', 'Coverage %', 'Missing Topics'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {gaps.map((g, i) => (
                  <tr key={i} style={{ background: g.pct < 50 ? '#fef2f2' : i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{g.company}</td>
                    <td style={{ ...tdS, color: T.textSec }}>{g.sector}</td>
                    <td style={tdS}>{g.covered} / {g.total}</td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, background: T.surfaceH, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${g.pct}%`, height: '100%', background: g.pct > 75 ? T.sage : g.pct > 50 ? T.gold : T.red, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 700, color: g.pct > 75 ? T.sage : g.pct > 50 ? T.gold : T.red, fontSize: 12 }}>{g.pct}%</span>
                      </div>
                    </td>
                    <td style={tdS}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {g.missing.slice(0, 5).map((m, j) => (
                          <span key={j} style={{ background: '#fef2f2', color: T.red, padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 500 }}>{m}</span>
                        ))}
                        {g.missing.length > 5 && <span style={{ color: T.textMut, fontSize: 10 }}>+{g.missing.length - 5}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* ── 15. Report Length & Data Density ────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Report Length & Data Density Comparison</h3>
        {(() => {
          const densityData = analysis.docs.map(d => {
            const words = tokenize(d.text);
            const numbers = (d.text.match(/\d+\.?\d*/g) || []).length;
            const sentences = d.text.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
            return {
              name: d.company.split(' ').slice(0, 2).join(' '),
              words: words.length,
              numbers,
              sentences,
              density: numbers > 0 ? (numbers / Math.max(sentences, 1)).toFixed(2) : '0',
              numbersPerWord: (numbers / Math.max(words.length, 1) * 100).toFixed(1),
            };
          });
          return (
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={densityData} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} angle={-30} textAnchor="end" />
                  <YAxis yAxisId="l" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="l" dataKey="words" name="Word Count" fill={T.navy} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="r" dataKey="numbers" name="Data Points" fill={T.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
                {densityData.sort((a, b) => parseFloat(b.numbersPerWord) - parseFloat(a.numbersPerWord)).slice(0, 6).map((d, i) => (
                  <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{d.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.sage }}>{d.numbersPerWord}%</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>data density (numbers/words)</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 16. Geographic & Sector Distribution ───────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Document Distribution by Region & Sector</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h4 style={{ fontSize: 13, color: T.textSec, margin: '0 0 8px' }}>By Region</h4>
            {(() => {
              const regionCounts = {};
              analysis.docs.forEach(d => { regionCounts[d.region] = (regionCounts[d.region] || 0) + 1; });
              return Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).map(([region, count], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy, width: 100 }}>{region}</span>
                  <div style={{ flex: 1, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / analysis.docs.length) * 100}%`, height: '100%', background: [T.navy, T.sage, T.gold, T.red, '#7c3aed'][i % 5], borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, width: 24, textAlign: 'right' }}>{count}</span>
                </div>
              ));
            })()}
          </div>
          <div>
            <h4 style={{ fontSize: 13, color: T.textSec, margin: '0 0 8px' }}>By Sector</h4>
            {(() => {
              const sectorCounts = {};
              analysis.docs.forEach(d => { sectorCounts[d.sector] = (sectorCounts[d.sector] || 0) + 1; });
              return Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]).map(([sector, count], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy, width: 100 }}>{sector}</span>
                  <div style={{ flex: 1, height: 8, background: T.surfaceH, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / analysis.docs.length) * 100}%`, height: '100%', background: [T.sage, T.gold, T.navy, T.red, '#7c3aed'][i % 5], borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, width: 24, textAlign: 'right' }}>{count}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* ── 17. Methodology Notes ───────────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 10px', color: T.navy, fontSize: 16 }}>Methodology & Interpretation Guide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { title: 'TF-IDF Vectorization', desc: 'Term Frequency-Inverse Document Frequency weights words by importance relative to corpus. Common ESG terms are down-weighted while company-specific language is emphasized.' },
            { title: 'Cosine Similarity', desc: 'Measures angle between TF-IDF vectors. Range 0 (completely different) to 1 (identical). Scores above 0.85 may indicate boilerplate or copied language.' },
            { title: 'K-Means Clustering', desc: 'Groups documents into K clusters by minimizing within-cluster variance. Optimal K depends on dataset diversity. Use silhouette analysis for validation.' },
            { title: 'Boilerplate Detection', desc: 'Flagging pairs with similarity above configurable threshold. High similarity between companies in different sectors strongly suggests template-based reporting.' },
            { title: 'Quality Scoring', desc: 'Combines lexical uniqueness, data point density, and specificity ratio. Higher scores indicate more substantive, data-rich disclosures.' },
            { title: 'PCA Projection', desc: 'Principal Component Analysis reduces high-dimensional TF-IDF vectors to 2D for visualization. Proximity in scatter plot indicates textual similarity.' },
          ].map((m, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 14, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{m.title}</div>
              <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 18. Similarity Trend Simulation ──────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 16px', color: T.navy, fontSize: 16 }}>Simulated Similarity Trend Over Reporting Cycles</h3>
        <p style={{ fontSize: 12, color: T.textSec, margin: '0 0 12px' }}>
          Tracks how average pairwise similarity would evolve if companies adopted differentiated vs. templated reporting.
        </p>
        {(() => {
          const baseAvg = analysis.avgSim;
          const trendData = Array.from({ length: 8 }, (_, i) => ({
            cycle: `FY${2020 + i}`,
            templated: Math.min(0.95, baseAvg + i * 0.025 + (sr(_sc++) - 0.5) * 0.02),
            differentiated: Math.max(0.15, baseAvg - i * 0.035 + (sr(_sc++) - 0.5) * 0.02),
            current: baseAvg + (sr(_sc++) - 0.5) * 0.04,
          }));
          return (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="cycle" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: T.textSec }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: T.font, fontSize: 12 }} formatter={v => v.toFixed(3)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="templated" name="Templated Path" stroke={T.red} fill={T.red} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="differentiated" name="Differentiated Path" stroke={T.sage} fill={T.sage} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="current" name="Current Trajectory" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* ── 19. Vocabulary Overlap Matrix (Mini) ───────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Vocabulary Overlap Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {(() => {
            const stats = analysis.docs.map(d => {
              const words = new Set(tokenize(d.text));
              const totalVocab = analysis.vocabulary.length;
              const docVocab = [...words].filter(w => analysis.vocabulary.includes(w)).length;
              return {
                company: d.company.split(' ').slice(0, 2).join(' '),
                totalWords: words.size,
                sharedWithCorpus: docVocab,
                uniqueToDoc: words.size - docVocab,
                overlapPct: totalVocab > 0 ? Math.round(docVocab / totalVocab * 100) : 0,
              };
            });
            return stats.sort((a, b) => b.overlapPct - a.overlapPct).map((s, i) => (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 12, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{s.company}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 4 }}>
                  <span>Total terms: <strong style={{ color: T.navy }}>{s.totalWords}</strong></span>
                  <span>Shared: <strong style={{ color: T.sage }}>{s.sharedWithCorpus}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textSec, marginBottom: 6 }}>
                  <span>Unique: <strong style={{ color: T.gold }}>{s.uniqueToDoc}</strong></span>
                  <span>Overlap: <strong style={{ color: s.overlapPct > 50 ? T.amber : T.sage }}>{s.overlapPct}%</strong></span>
                </div>
                <div style={{ width: '100%', height: 6, background: T.surface, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${s.overlapPct}%`, height: '100%', background: s.overlapPct > 50 ? T.amber : T.sage, borderRadius: 3 }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* ── 20. Peer Comparison Summary ─────────────────────────── */}
      <div style={sC}>
        <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 16 }}>Peer Group Similarity Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {(() => {
            const sectorGroups = {};
            analysis.docs.forEach((d, i) => { if (!sectorGroups[d.sector]) sectorGroups[d.sector] = []; sectorGroups[d.sector].push({ ...d, idx: i }); });
            return Object.entries(sectorGroups).filter(([, members]) => members.length > 1).map(([sector, members], si) => {
              let maxSim = 0, maxPair = ['', ''];
              for (let a = 0; a < members.length; a++) {
                for (let b = a + 1; b < members.length; b++) {
                  const sim = analysis.simMatrix[members[a].idx][members[b].idx];
                  if (sim > maxSim) { maxSim = sim; maxPair = [members[a].company.split(' ').slice(0, 2).join(' '), members[b].company.split(' ').slice(0, 2).join(' ')]; }
                }
              }
              return (
                <div key={si} style={{ background: T.surfaceH, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 8 }}>{sector}</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>{members.length} companies in sector</div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>
                    Most similar pair: <strong style={{ color: T.navy }}>{maxPair[0]} / {maxPair[1]}</strong>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: maxSim > 0.7 ? T.amber : T.sage }}>{(maxSim * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>Max intra-sector similarity</div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* ── 21. Cross Navigation ────────────────────────────────── */}
      <div style={{ ...sC, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginRight: 8 }}>Navigate:</span>
        {[
          { label: 'Report Parser', path: '/report-parser' },
          { label: 'Predictive ESG', path: '/predictive-esg' },
          { label: 'Materiality', path: '/materiality' },
          { label: 'ESG Dashboard', path: '/esg-dashboard' },
          { label: 'Anomaly Detection', path: '/anomaly-detection' },
          { label: 'Engagement Advisor', path: '/engagement-advisor' },
          { label: 'AI Hub', path: '/ai-hub' },
          { label: 'Data Quality', path: '/esg-data-quality' },
        ].map(n => (
          <button key={n.path} onClick={() => navigate(n.path)} style={{ ...btn(false), fontSize: 12 }}>{n.label}</button>
        ))}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: T.textMut }}>
        EP-W5 ESG Document Similarity & Clustering Engine | Sprint W AI & NLP Analytics | {analysis.docs.length} documents, {analysis.vocabulary.length} vocab terms, {analysis.k} clusters
      </div>
    </div>
  );
}

export default DocumentSimilarityPage;
