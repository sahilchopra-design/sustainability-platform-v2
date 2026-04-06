import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', teal: '#0f766e', red: '#991b1b', green: '#065f46', gray: '#6b7280' };

const DEFAULT_TEXT = `Our company is committed to sustainability and we will achieve net zero by 2050. We have implemented various green initiatives to reduce our environmental impact. Our renewable energy portfolio continues to grow as we transition to a low-carbon economy. We are proud of our environmental leadership and our ongoing efforts to create a greener future for all stakeholders.`;

const ESRS_TOPICS = ['E1','E2','E3','E4','E5','S1','S2','S3','S4','G1'];

const DETECTED_PATTERNS = [
  { phrase: '"committed to sustainability"', type: 'Vague claim', severity: 'Medium', esrs: 'E1-1' },
  { phrase: '"various green initiatives"', type: 'Unsubstantiated', severity: 'High', esrs: 'E1-2' },
  { phrase: '"continues to grow"', type: 'Missing timeframe', severity: 'Low', esrs: 'E1-4' },
  { phrase: '"reduce our environmental impact"', type: 'No quantification', severity: 'High', esrs: 'E1-5' },
  { phrase: '"environmental leadership"', type: 'Self-certification', severity: 'Medium', esrs: 'G1-1' },
  { phrase: '"greener future"', type: 'Vague forward-looking', severity: 'Low', esrs: 'E2-1' },
];

const COMPANIES = [
  'Shell plc','BP p.l.c.','TotalEnergies','Equinor','ENI S.p.A.',
  'Repsol SA','Galp Energia','OMV AG','Neste Oyj','Orlen SA',
  'Fortescue Metals','ArcelorMittal','Thyssenkrupp','Heidelberg Mats','Lafarge',
  'Maersk','CMA CGM','Hapag-Lloyd','Lufthansa','Air France-KLM',
];

const BASE_MODELS = ['BERT-base','RoBERTa','FinBERT'];
const MAX_TOKENS = [128, 256, 512];
const INDUSTRIES = ['Energy','Finance','Manufacturing','All'];

const ESRS_EXTRACTED = [
  { excerpt: 'We target a 46% reduction in Scope 1 & 2 emissions by 2030', esrs: 'E1-4', completeness: 85, gap: 'Baseline year missing' },
  { excerpt: 'Water consumption intensity reduced 12% year-on-year', esrs: 'E3-2', completeness: 70, gap: 'Absolute volume not stated' },
  { excerpt: 'Zero biodiversity net loss commitment by 2025', esrs: 'E4-1', completeness: 60, gap: 'No monitoring methodology' },
  { excerpt: 'All suppliers sign our Code of Conduct on human rights', esrs: 'S2-1', completeness: 55, gap: 'No audit evidence provided' },
  { excerpt: 'Gender pay gap reporting submitted to HMRC annually', esrs: 'S1-16', completeness: 90, gap: 'Non-binary data missing' },
  { excerpt: 'Board has 38% female representation as of Dec 2025', esrs: 'G1-5', completeness: 95, gap: null },
  { excerpt: 'Circular economy waste diversion rate reached 73%', esrs: 'E5-4', completeness: 75, gap: 'Definition of diversion not specified' },
  { excerpt: 'Anti-bribery training completed by 100% of employees', esrs: 'G1-3', completeness: 80, gap: 'Third-party coverage unknown' },
];

const MISSING_DISCLOSURES = [
  'ESRS E3-1 (Water consumption intensity) — NOT FOUND',
  'ESRS S3-2 (Affected communities engagement) — NOT FOUND',
  'ESRS E2-3 (Pollution incidents) — PARTIAL',
];

const TabBar = ({ tabs, active, onSelect }) => (
  <div style={{ display: 'flex', borderBottom: `2px solid ${T.gold}`, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onSelect(t)} style={{
        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active === t ? 700 : 400,
        color: active === t ? T.navy : T.gray,
        borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent', marginBottom: -2,
      }}>{t}</button>
    ))}
  </div>
);

const card = (children, style = {}) => (
  <div style={{ background: '#fff', border: `1px solid #e8e4db`, borderRadius: 8, padding: 18, marginBottom: 16, ...style }}>
    {children}
  </div>
);

const sectionTitle = (t) => (
  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
    color: T.navy, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12, paddingBottom: 6,
    borderBottom: `1px solid ${T.gold}` }}>{t}</div>
);

const SeverityBadge = ({ sev }) => {
  const c = { High: T.red, Medium: '#b45309', Low: T.teal, Critical: '#7c3aed' };
  return (
    <span style={{ background: c[sev] || T.gray, color: '#fff', fontSize: 9, fontWeight: 700,
      padding: '2px 7px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>{sev}</span>
  );
};

const ATTENTION_WEIGHTS = {
  'committed': 0.82, 'sustainability': 0.91, 'net': 0.71, 'zero': 0.75, '2050': 0.68,
  'various': 0.89, 'green': 0.77, 'initiatives': 0.86, 'reduce': 0.79, 'environmental': 0.83,
  'renewable': 0.61, 'energy': 0.55, 'transition': 0.52, 'low-carbon': 0.64, 'leadership': 0.73,
  'greener': 0.66, 'future': 0.58,
};

function AttentionText({ text }) {
  const words = text.split(/(\s+)/);
  return (
    <div style={{ fontSize: 13, lineHeight: 2, fontFamily: 'DM Sans, sans-serif' }}>
      {words.map((w, i) => {
        const clean = w.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const weight = ATTENTION_WEIGHTS[clean];
        if (!weight) return <span key={i}>{w}</span>;
        const alpha = 0.15 + weight * 0.75;
        return (
          <span key={i} title={`Attention: ${(weight * 100).toFixed(0)}%`}
            style={{ background: `rgba(197,169,106,${alpha})`, borderRadius: 3,
              padding: '0 2px', cursor: 'default', fontWeight: weight > 0.8 ? 700 : 400,
              color: weight > 0.85 ? T.red : T.navy }}>
            {w}
          </span>
        );
      })}
    </div>
  );
}

export default function NLPDisclosureParserPage() {
  const [tab, setTab] = useState('Greenwashing Detector');

  // Tab 1 state
  const [inputText, setInputText] = useState(DEFAULT_TEXT);
  const [language, setLanguage] = useState('English');
  const [analysisType, setAnalysisType] = useState('Full CSRD');
  const [confThreshold, setConfThreshold] = useState(0.65);
  const [analysisState, setAnalysisState] = useState({ status: 'idle', progress: 0 });
  const [analysisResult, setAnalysisResult] = useState(null);

  // Tab 2 state
  const [esrsTopics, setEsrsTopics] = useState(new Set(ESRS_TOPICS));
  const [extractState, setExtractState] = useState({ status: 'idle', progress: 0 });
  const [extractResult, setExtractResult] = useState(null);
  const [pasteText2, setPasteText2] = useState('');

  // Tab 4 state
  const [baseModel, setBaseModel] = useState('FinBERT');
  const [confThresh2, setConfThresh2] = useState(0.65);
  const [maxTokens, setMaxTokens] = useState(256);
  const [langDetect, setLangDetect] = useState(true);
  const [industries, setIndustries] = useState(new Set(['All']));
  const [calState, setCalState] = useState({ status: 'idle', progress: 0 });

  const analyseText = useCallback(() => {
    setAnalysisState({ status: 'running', progress: 0 });
    setAnalysisResult(null);
    let p = 0;
    const iv = setInterval(() => {
      p += 7;
      setAnalysisState({ status: 'running', progress: Math.min(100, p) });
      if (p >= 100) {
        clearInterval(iv);
        const risk = ['LOW','MEDIUM','HIGH','CRITICAL'];
        const riskLevel = risk[Math.min(3, Math.floor(sr(inputText.length % 100) * 4))]; // clamp to [0,3] — floor(x*4) can return 4 at float boundary
        setAnalysisResult({ riskLevel, confidence: +(0.82 + sr(inputText.length) * 0.1).toFixed(3) });
        setAnalysisState({ status: 'complete', progress: 100 });
      }
    }, 80);
  }, [inputText]);

  const extractMap = useCallback(() => {
    setExtractState({ status: 'running', progress: 0 });
    setExtractResult(null);
    let p = 0;
    const iv = setInterval(() => {
      p += 7;
      setExtractState({ status: 'running', progress: Math.min(100, p) });
      if (p >= 100) {
        clearInterval(iv);
        setExtractResult(true);
        setExtractState({ status: 'complete', progress: 100 });
      }
    }, 80);
  }, []);

  const calibrateModel = useCallback(() => {
    setCalState({ status: 'running', progress: 0 });
    let p = 0;
    const iv = setInterval(() => {
      p += 7;
      setCalState({ status: 'running', progress: Math.min(100, p) });
      if (p >= 100) { clearInterval(iv); setCalState({ status: 'complete', progress: 100 }); }
    }, 90);
  }, []);

  const toggleEsrs = (t) => setEsrsTopics(prev => {
    const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n;
  });
  const toggleIndustry = (i) => setIndustries(prev => {
    const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n;
  });

  const riskColor = { LOW: T.green, MEDIUM: '#b45309', HIGH: T.red, CRITICAL: '#7c3aed' };

  const sentimentData = useMemo(() => COMPANIES.map((c, i) => ({
    company: c.split(' ')[0],
    ambition: Math.round(40 + sr(i * 7 + 1) * 55),
    credibility: Math.round(30 + sr(i * 11 + 3) * 60),
    specificity: Math.round(25 + sr(i * 13 + 5) * 65),
    urgency: Math.round(20 + sr(i * 17 + 7) * 70),
  })), []);

  const timeSeriesData = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    quarter: `Q${(i % 4) + 1} ${2024 + Math.floor(i / 4)}`,
    ambition: Math.round(55 + sr(i * 7 + 21) * 30),
    credibility: Math.round(45 + sr(i * 13 + 17) * 25),
    specificity: Math.round(50 + sr(i * 11 + 9) * 28),
  })), []);

  const rocData = useMemo(() => {
    const pts = [{ fpr: 0, tpr: 0 }];
    for (let i = 1; i <= 10; i++) {
      pts.push({ fpr: +(i / 10 - sr(i * 7) * 0.04).toFixed(3), tpr: +(i / 10 + sr(i * 11 + 3) * 0.08).toFixed(3) });
    }
    pts.push({ fpr: 1, tpr: 1 });
    return pts.map(p => ({ ...p, tpr: Math.min(1, Math.max(0, p.tpr)), fpr: Math.min(1, Math.max(0, p.fpr)) }));
  }, []);

  const prData = useMemo(() => Array.from({ length: 11 }, (_, i) => ({
    recall: +(i / 10).toFixed(1),
    precision: +(0.92 - (i / 10) * 0.35 + sr(i * 7 + 9) * 0.05).toFixed(3),
  })), []);

  const calHistory = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    run: `Run ${i + 1}`,
    model: BASE_MODELS[i % BASE_MODELS.length],
    accuracy: +(0.78 + i * 0.025 + sr(i * 7) * 0.01).toFixed(3),
    f1: +(0.76 + i * 0.022 + sr(i * 11) * 0.012).toFixed(3),
    date: `2026-03-${20 + i}`,
  })), []);

  const confMatrixData = useMemo(() => {
    const labels = ['None','Low','Medium','High'];
    return labels.map((actual, ai) => ({
      actual,
      cells: labels.map((pred, pi) => {
        if (ai === pi) return Math.round(150 + sr(ai * 7) * 80);
        return Math.round(sr(ai * 13 + pi * 7 + 3) * 25);
      }),
    }));
  }, []);

  const completenessColors = ['#fee2e2','#fef3c7','#d1fae5','#a7f3d0','#6ee7b7'];

  return (
    <div style={{ background: T.cream, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ background: T.navy, color: T.gold, fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1 }}>EP-BL2</span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>NLP Greenwashing & Disclosure Intelligence Engine</div>
          <div style={{ fontSize: 13, color: T.gray }}>Transformer-based text analysis · CSRD/ESRS extraction · Sentiment scoring · Model calibration</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span style={{ background: T.teal, color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>FinBERT</span>
          <span style={{ background: T.green, color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>ACTIVE</span>
        </div>
      </div>

      <TabBar tabs={['Greenwashing Detector','CSRD Text Extractor','Sentiment & Tone','Model Calibration']}
        active={tab} onSelect={setTab} />

      {/* TAB 1 — Greenwashing Detector */}
      {tab === 'Greenwashing Detector' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {card(
            <>
              {sectionTitle('Input Configuration')}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Disclosure Text</label>
                <textarea rows={10} value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Paste ESG disclosure text here..."
                  style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '8px 10px',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 12, resize: 'vertical', boxSizing: 'border-box',
                    background: '#fff', lineHeight: 1.6 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '6px 10px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                    {['English','French','German','Spanish'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Analysis Type</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['Full CSRD','Quick Screen','Custom'].map(at => (
                      <button key={at} onClick={() => setAnalysisType(at)} style={{
                        flex: 1, padding: '6px 4px', border: `1px solid ${analysisType === at ? T.navy : '#d1cdc7'}`,
                        background: analysisType === at ? T.navy : '#fff',
                        color: analysisType === at ? T.gold : T.gray,
                        borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                      }}>{at}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, marginBottom: 4 }}>
                  <span>Confidence Threshold</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontWeight: 700 }}>{confThreshold.toFixed(2)}</span>
                </div>
                <input type="range" min={0.5} max={0.95} step={0.05} value={confThreshold}
                  onChange={e => setConfThreshold(Number(e.target.value))}
                  style={{ width: '100%', accentColor: T.gold }} />
              </div>
              <button onClick={analyseText} disabled={analysisState.status === 'running'}
                style={{ width: '100%', padding: '12px 0', background: T.navy, color: T.gold,
                  border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', letterSpacing: 1.5,
                  opacity: analysisState.status === 'running' ? 0.7 : 1 }}>
                {analysisState.status === 'running' ? 'ANALYSING...' : 'ANALYSE TEXT'}
              </button>
              {analysisState.status === 'running' && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ background: '#e8e4db', borderRadius: 4, height: 8 }}>
                    <div style={{ width: `${analysisState.progress}%`, height: '100%', background: T.gold,
                      borderRadius: 4, transition: 'width 0.08s ease' }} />
                  </div>
                </div>
              )}
            </>, {}
          )}

          <div>
            {!analysisResult && analysisState.status === 'idle' && card(
              <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                Enter disclosure text and click ANALYSE TEXT to detect greenwashing patterns
              </div>, {}
            )}
            {analysisResult && (
              <>
                {card(
                  <>
                    {sectionTitle('Greenwashing Risk Assessment')}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{ background: riskColor[analysisResult.riskLevel] || T.gray, color: '#fff',
                        fontSize: 18, fontWeight: 900, padding: '10px 20px', borderRadius: 6,
                        fontFamily: 'JetBrains Mono, monospace', letterSpacing: 2 }}>
                        {analysisResult.riskLevel} RISK
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.gray }}>Model Confidence</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: T.navy,
                          fontFamily: 'JetBrains Mono, monospace' }}>
                          {(analysisResult.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: 12, color: T.navy, background: '#fff8e7',
                        border: `1px solid ${T.gold}`, borderRadius: 5, padding: '8px 12px' }}>
                        ⚠ 2 potential CSRD ESRS E1 violations detected
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: T.navy, color: '#fff' }}>
                          {['Pattern / Phrase','Type','ESRS Ref','Severity'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10,
                              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DETECTED_PATTERNS.map((p, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3',
                            borderBottom: '1px solid #e8e4db' }}>
                            <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace',
                              fontSize: 11, color: T.red, fontStyle: 'italic' }}>{p.phrase}</td>
                            <td style={{ padding: '6px 10px', fontSize: 11 }}>{p.type}</td>
                            <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace',
                              fontSize: 10, color: T.teal }}>{p.esrs}</td>
                            <td style={{ padding: '6px 10px' }}><SeverityBadge sev={p.severity} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>, {}
                )}
                {card(
                  <>
                    {sectionTitle('BERT Attention Visualization')}
                    <AttentionText text={inputText} />
                    <div style={{ fontSize: 11, color: T.gray, marginTop: 8 }}>
                      Highlighted words show attention weight intensity. Bold red = highest risk tokens.
                    </div>
                  </>, {}
                )}
                {card(
                  <>
                    {sectionTitle('Entity Extraction')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      <div><div style={{ fontSize: 10, color: T.gray, marginBottom: 4 }}>Climate Targets Found</div>
                        <div style={{ fontSize: 13, color: T.navy, fontWeight: 600 }}>Net zero by 2050</div></div>
                      <div><div style={{ fontSize: 10, color: T.gray, marginBottom: 4 }}>Frameworks Referenced</div>
                        <div style={{ fontSize: 13, color: T.navy, fontWeight: 600 }}>None specified</div></div>
                      <div><div style={{ fontSize: 10, color: T.gray, marginBottom: 4 }}>Quantitative Claims</div>
                        <div style={{ fontSize: 13, color: T.red, fontWeight: 600 }}>0 found ⚠</div></div>
                    </div>
                  </>, {}
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2 — CSRD Text Extractor */}
      {tab === 'CSRD Text Extractor' && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
          <div style={{ background: '#f9f7f3', border: `1px solid #e8e4db`, borderRadius: 8, padding: 20 }}>
            {sectionTitle('Document Configuration')}
            <div style={{ border: `2px dashed #c5a96a`, borderRadius: 8, padding: '30px 20px',
              textAlign: 'center', marginBottom: 16, cursor: 'pointer', color: T.gray, fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              Drop PDF/Word file here<br />
              <span style={{ fontSize: 11 }}>or paste text below</span>
            </div>
            <textarea rows={5} value={pasteText2} onChange={e => setPasteText2(e.target.value)}
              placeholder="Or paste disclosure text here..."
              style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: 8,
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, boxSizing: 'border-box',
                background: '#fff', marginBottom: 14, resize: 'vertical' }} />
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: T.navy, marginBottom: 8 }}>ESRS Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ESRS_TOPICS.map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                    cursor: 'pointer', color: esrsTopics.has(t) ? T.navy : T.gray }}>
                    <input type="checkbox" checked={esrsTopics.has(t)} onChange={() => toggleEsrs(t)}
                      style={{ accentColor: T.gold }} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={extractMap} disabled={extractState.status === 'running'}
              style={{ width: '100%', padding: '11px 0', background: T.navy, color: T.gold,
                border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', letterSpacing: 1.2,
                opacity: extractState.status === 'running' ? 0.7 : 1 }}>
              {extractState.status === 'running' ? 'EXTRACTING...' : 'EXTRACT & MAP'}
            </button>
            {extractState.status === 'running' && (
              <div style={{ marginTop: 10, background: '#e8e4db', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${extractState.progress}%`, height: '100%', background: T.gold,
                  borderRadius: 4, transition: 'width 0.08s ease' }} />
              </div>
            )}
            {extractResult && (
              <div style={{ marginTop: 14, background: '#f0fdf4', border: `1px solid #a7f3d0`,
                borderRadius: 6, padding: '10px 14px', fontSize: 12, color: T.green }}>
                ✓ Found 23 disclosure points across 6 ESRS topics
              </div>
            )}
          </div>

          <div>
            {extractResult && (
              <>
                {card(
                  <>
                    {sectionTitle('Extracted Disclosures')}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: T.navy, color: '#fff' }}>
                            {['Text Excerpt','ESRS Ref','Completeness','Gap'].map(h => (
                              <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10,
                                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ESRS_EXTRACTED.map((e, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3',
                              borderBottom: '1px solid #e8e4db' }}>
                              <td style={{ padding: '6px 10px', fontSize: 11, maxWidth: 260,
                                fontStyle: 'italic', color: T.navy }}>"{e.excerpt}"</td>
                              <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 11, color: T.teal }}>{e.esrs}</td>
                              <td style={{ padding: '6px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ flex: 1, background: '#e8e4db', borderRadius: 4, height: 6 }}>
                                    <div style={{ width: `${e.completeness}%`, height: '100%', borderRadius: 4,
                                      background: e.completeness >= 80 ? T.green : e.completeness >= 60 ? '#b45309' : T.red }} />
                                  </div>
                                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                                    color: T.navy, minWidth: 32 }}>{e.completeness}%</span>
                                </div>
                              </td>
                              <td style={{ padding: '6px 10px', fontSize: 11, color: e.gap ? T.red : T.green }}>
                                {e.gap || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>, {}
                )}
                {card(
                  <>
                    {sectionTitle('Coverage Heatmap (ESRS Topics × Completeness)')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5,1fr)', gap: 3, fontSize: 10, alignItems: 'center' }}>
                      <div />
                      {['Not Found','Partial','Moderate','Good','Complete'].map(l => (
                        <div key={l} style={{ textAlign: 'center', color: T.gray, fontSize: 9, fontWeight: 700 }}>{l}</div>
                      ))}
                      {ESRS_TOPICS.map((topic, ti) => (
                        <React.Fragment key={topic}>
                          <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: T.navy,
                            fontWeight: 700, paddingRight: 6 }}>{topic}</div>
                          {[0, 1, 2, 3, 4].map(ci => {
                            const v = sr(ti * 11 + ci * 7 + 3);
                            const active = v > (0.2 + ci * 0.15);
                            return (
                              <div key={ci} style={{
                                background: active ? completenessColors[ci] : '#f3f4f6',
                                height: 28, borderRadius: 3, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 9,
                                color: active && ci >= 3 ? '#065f46' : T.gray,
                                fontWeight: active ? 700 : 400,
                              }}>{active ? '✓' : ''}</div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </>, {}
                )}
                {card(
                  <>
                    {sectionTitle('Missing Disclosures')}
                    {MISSING_DISCLOSURES.map((m, i) => (
                      <div key={i} style={{ background: '#fff8e7', border: `1px solid ${T.gold}`,
                        borderRadius: 5, padding: '8px 12px', marginBottom: 6, fontSize: 12,
                        color: T.red, fontFamily: 'JetBrains Mono, monospace' }}>⚠ {m}</div>
                    ))}
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button onClick={() => alert('Generating gap report...')}
                        style={{ padding: '8px 16px', background: T.navy, color: T.gold, border: 'none',
                          borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Download Gap Report
                      </button>
                      <button onClick={() => alert('Exporting to XBRL format...')}
                        style={{ padding: '8px 16px', background: T.teal, color: '#fff', border: 'none',
                          borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Export to XBRL
                      </button>
                    </div>
                  </>, {}
                )}
              </>
            )}
            {!extractResult && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 300, color: T.gray, fontSize: 14 }}>
                Configure topics and click EXTRACT & MAP
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3 — Sentiment & Tone */}
      {tab === 'Sentiment & Tone Analysis' && (
        <>
          {card(
            <>
              {sectionTitle('Batch Sentiment Scores (20 Companies)')}
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sentimentData} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                  <XAxis dataKey="company" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="ambition" fill={T.gold} name="Ambition" />
                  <Bar dataKey="credibility" fill={T.navy} name="Credibility" />
                  <Bar dataKey="specificity" fill={T.teal} name="Specificity" />
                </BarChart>
              </ResponsiveContainer>
            </>, {}
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {card(
              <>
                {sectionTitle('Quarterly Trend — Shell plc')}
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={timeSeriesData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                    <YAxis domain={[30, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="ambition" stroke={T.gold} strokeWidth={2} dot={{ r: 3 }} name="Ambition" />
                    <Line type="monotone" dataKey="credibility" stroke={T.navy} strokeWidth={2} dot={{ r: 3 }} name="Credibility" />
                    <Line type="monotone" dataKey="specificity" stroke={T.teal} strokeWidth={2} dot={{ r: 3 }} name="Specificity" />
                  </LineChart>
                </ResponsiveContainer>
              </>, {}
            )}
            {card(
              <>
                {sectionTitle('Greenwashing Risk Flags')}
                {sentimentData.filter(c => c.ambition > 70 && c.credibility < 45).slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: '1px solid #e8e4db' }}>
                    <span style={{ background: T.red, color: '#fff', fontSize: 9, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 4 }}>HIGH RISK</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{c.company}</span>
                    <span style={{ fontSize: 11, color: T.gray }}>Ambition {c.ambition} · Credibility {c.credibility}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, fontSize: 11, color: T.gray }}>
                  Companies with Ambition &gt;70 but Credibility &lt;45 flagged as high greenwashing risk.
                </div>
              </>, {}
            )}
          </div>
        </>
      )}

      {/* TAB 4 — Model Calibration */}
      {tab === 'Model Calibration' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <div style={{ background: '#f9f7f3', border: `1px solid #e8e4db`, borderRadius: 8, padding: 20 }}>
            {sectionTitle('Calibration Parameters')}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 4 }}>Base Model</label>
              <select value={baseModel} onChange={e => setBaseModel(e.target.value)}
                style={{ width: '100%', border: `1px solid #d1cdc7`, borderRadius: 4, padding: '6px 10px',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12, background: '#fff' }}>
                {BASE_MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, marginBottom: 4 }}>
                <span>Confidence Threshold</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.gold, fontWeight: 700 }}>{confThresh2.toFixed(2)}</span>
              </div>
              <input type="range" min={0.3} max={0.9} step={0.05} value={confThresh2}
                onChange={e => setConfThresh2(Number(e.target.value))}
                style={{ width: '100%', accentColor: T.gold }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: T.navy, display: 'block', marginBottom: 6 }}>Max Token Length</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {MAX_TOKENS.map(mt => (
                  <button key={mt} onClick={() => setMaxTokens(mt)} style={{
                    flex: 1, padding: '6px 4px', border: `1px solid ${maxTokens === mt ? T.navy : '#d1cdc7'}`,
                    background: maxTokens === mt ? T.navy : '#fff', color: maxTokens === mt ? T.gold : T.gray,
                    borderRadius: 4, fontSize: 12, cursor: 'pointer',
                  }}>{mt}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.navy, cursor: 'pointer' }}>
                <input type="checkbox" checked={langDetect} onChange={e => setLangDetect(e.target.checked)}
                  style={{ accentColor: T.gold }} />
                Language auto-detection
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: T.navy, marginBottom: 6 }}>Industry Fine-tuning</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INDUSTRIES.map(ind => (
                  <label key={ind} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                    cursor: 'pointer', color: industries.has(ind) ? T.navy : T.gray }}>
                    <input type="checkbox" checked={industries.has(ind)} onChange={() => toggleIndustry(ind)}
                      style={{ accentColor: T.gold }} />
                    {ind}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={calibrateModel} disabled={calState.status === 'running'}
              style={{ width: '100%', padding: '11px 0', background: T.navy, color: T.gold,
                border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', letterSpacing: 1.2,
                opacity: calState.status === 'running' ? 0.7 : 1 }}>
              {calState.status === 'running' ? 'CALIBRATING...' : 'CALIBRATE MODEL'}
            </button>
            {calState.status === 'running' && (
              <div style={{ marginTop: 10, background: '#e8e4db', borderRadius: 4, height: 8 }}>
                <div style={{ width: `${calState.progress}%`, height: '100%', background: T.gold,
                  borderRadius: 4, transition: 'width 0.09s ease' }} />
              </div>
            )}
          </div>

          <div>
            {card(
              <>
                {sectionTitle('Calibration History')}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.navy, color: '#fff' }}>
                      {['Run','Model','Accuracy','F1 Score','Date'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10,
                          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calHistory.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9f7f3',
                        borderBottom: '1px solid #e8e4db' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{r.run}</td>
                        <td style={{ padding: '6px 10px', fontSize: 11 }}>{r.model}</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                          color: r.accuracy > 0.85 ? T.green : T.navy }}>{(r.accuracy * 100).toFixed(1)}%</td>
                        <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{r.f1.toFixed(3)}</td>
                        <td style={{ padding: '6px 10px', fontSize: 11, color: T.gray }}>{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>, {}
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {card(
                <>
                  {sectionTitle('Confusion Matrix')}
                  {(() => {
                    const labels = ['None','Low','Med','High'];
                    return (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(4,1fr)', gap: 3 }}>
                          <div />
                          {labels.map(l => <div key={l} style={{ textAlign: 'center', fontSize: 10,
                            fontWeight: 700, color: T.navy, padding: '3px 0' }}>Pred {l}</div>)}
                          {confMatrixData.map((row, ri) => (
                            <React.Fragment key={row.actual}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.gray, display: 'flex',
                                alignItems: 'center', paddingRight: 4, whiteSpace: 'nowrap' }}>
                                Act {row.actual}
                              </div>
                              {row.cells.map((v, ci) => {
                                const maxVal = 220;
                                const intensity = v / maxVal;
                                const bg = ri === ci
                                  ? `rgba(6,95,70,${0.2 + intensity * 0.7})`
                                  : `rgba(153,27,27,${0.05 + intensity * 0.7})`;
                                return (
                                  <div key={ci} style={{ background: bg, height: 36, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', borderRadius: 3,
                                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                                    color: intensity > 0.5 ? '#fff' : T.navy }}>{v}</div>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>, {}
              )}
              {card(
                <>
                  {sectionTitle('ROC Curve')}
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={rocData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                      <XAxis dataKey="fpr" tick={{ fontSize: 9 }} label={{ value: 'FPR', position: 'insideBottom', offset: -12, fontSize: 10 }} domain={[0, 1]} />
                      <YAxis tick={{ fontSize: 9 }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 10 }} domain={[0, 1]} />
                      <Tooltip contentStyle={{ fontSize: 10 }} formatter={v => v.toFixed(3)} />
                      <Line dataKey="fpr" stroke={T.gray} strokeDasharray="4 4" dot={false} name="Random" legendType="none" />
                      <Line type="monotone" dataKey="tpr" stroke={T.gold} strokeWidth={2} dot={false} name="Model AUC≈0.89" />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </>, {}
              )}
              {card(
                <>
                  {sectionTitle('Precision-Recall')}
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={prData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e4db" />
                      <XAxis dataKey="recall" tick={{ fontSize: 9 }} label={{ value: 'Recall', position: 'insideBottom', offset: -12, fontSize: 10 }} domain={[0, 1]} />
                      <YAxis tick={{ fontSize: 9 }} domain={[0.4, 1]} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} formatter={v => v.toFixed(3)} />
                      <Line type="monotone" dataKey="precision" stroke={T.teal} strokeWidth={2} dot={false} name="Precision" />
                    </LineChart>
                  </ResponsiveContainer>
                </>, {}
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
