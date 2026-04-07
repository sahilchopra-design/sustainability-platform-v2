import React, { useState, useCallback } from 'react';
import {

  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const WIDGET_CATALOG = [
  { id: 'carbon_price', name: 'Carbon Price Chart', category: 'Market', icon: 'C$', color: T.green },
  { id: 'sector_heatmap', name: 'Sector Heatmap', category: 'Risk', icon: 'HM', color: T.red },
  { id: 'portfolio_var', name: 'Portfolio VaR', category: 'Risk', icon: 'VR', color: T.orange },
  { id: 'emissions_trajectory', name: 'Emissions Trajectory', category: 'Climate', icon: 'EM', color: T.blue },
  { id: 'itr_gauge', name: 'ITR Gauge', category: 'Alignment', icon: 'IT', color: T.teal },
  { id: 'policy_tracker', name: 'Policy Tracker', category: 'Regulatory', icon: 'PT', color: T.purple },
  { id: 'transition_score', name: 'Transition Score', category: 'Score', icon: 'TS', color: T.navy },
  { id: 'financed_emissions', name: 'Financed Emissions', category: 'PCAF', icon: 'FE', color: T.sage },
  { id: 'stress_test_kpi', name: 'Stress Test KPI', category: 'Stress', icon: 'ST', color: T.red },
  { id: 'climate_var', name: 'Climate VaR Gauge', category: 'Risk', icon: 'CV', color: T.orange },
  { id: 'sbti_progress', name: 'SBTi Progress', category: 'Targets', icon: 'SB', color: T.green },
  { id: 'eu_taxonomy', name: 'EU Taxonomy Alignment', category: 'Regulatory', icon: 'TX', color: T.blue },
  { id: 'physical_risk_map', name: 'Physical Risk Map', category: 'Physical', icon: 'PM', color: T.amber },
  { id: 'stranded_assets', name: 'Stranded Asset Monitor', category: 'Risk', icon: 'SA', color: T.red },
  { id: 'engagement_pipeline', name: 'Engagement Pipeline', category: 'Stewardship', icon: 'EP', color: T.teal },
  { id: 'just_transition', name: 'Just Transition Index', category: 'Social', icon: 'JT', color: T.purple },
  { id: 'scenario_blend', name: 'Scenario Blend Chart', category: 'Scenario', icon: 'BL', color: T.gold },
  { id: 'monte_carlo_fan', name: 'MC Fan Chart', category: 'Monte Carlo', icon: 'MC', color: T.navy },
  { id: 'tail_risk_gauge', name: 'Tail Risk Gauge', category: 'Tail Risk', icon: 'TR', color: T.red },
  { id: 'reg_deadline', name: 'Regulatory Deadlines', category: 'Compliance', icon: 'RD', color: T.orange },
];

const TEMPLATES = [
  { id: 'cio_brief', name: 'CIO Brief', widgets: ['climate_var', 'portfolio_var', 'transition_score', 'sector_heatmap'], desc: 'Executive summary for Chief Investment Officer', color: T.navy },
  { id: 'risk_committee', name: 'Risk Committee', widgets: ['stress_test_kpi', 'climate_var', 'tail_risk_gauge', 'portfolio_var', 'stranded_assets'], desc: 'Comprehensive risk view for committee meetings', color: T.red },
  { id: 'board_report', name: 'Board Report', widgets: ['transition_score', 'sbti_progress', 'engagement_pipeline', 'itr_gauge'], desc: 'High-level board-ready overview', color: T.gold },
  { id: 'regulatory', name: 'Regulatory Filing', widgets: ['eu_taxonomy', 'financed_emissions', 'reg_deadline', 'policy_tracker'], desc: 'Regulatory compliance dashboard', color: T.purple },
  { id: 'client_pres', name: 'Client Presentation', widgets: ['carbon_price', 'emissions_trajectory', 'itr_gauge', 'transition_score'], desc: 'Client-facing presentation materials', color: T.blue },
  { id: 'research', name: 'Research Note', widgets: ['scenario_blend', 'monte_carlo_fan', 'carbon_price', 'sector_heatmap'], desc: 'In-depth research analytics', color: T.teal },
  { id: 'audit_pack', name: 'Audit Pack', widgets: ['stress_test_kpi', 'financed_emissions', 'eu_taxonomy', 'reg_deadline', 'policy_tracker'], desc: 'Full audit trail and evidence', color: T.sage },
  { id: 'peer_comp', name: 'Peer Comparison', widgets: ['transition_score', 'sbti_progress', 'climate_var', 'just_transition'], desc: 'Competitive benchmarking', color: T.orange },
];

const TABS = ['Dashboard Builder', 'Saved Dashboards', 'Template Library', 'Widget Catalog', 'Share & Collaborate', 'Export Center'];

const Card = ({ title, children, span }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, gridColumn: span ? `span ${span}` : undefined }}>
    {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

const Pill = ({ label, val, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
    <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{val}</div>
  </div>
);

const Ref = ({ text }) => (
  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400e', marginTop: 12 }}>
    <strong>Reference:</strong> {text}
  </div>
);

function MiniWidget({ widget }) {
  const w = WIDGET_CATALOG.find(wc => wc.id === widget);
  if (!w) return null;
  const chartData = Array.from({ length: 12 }, (_, i) => ({ m: i + 1, v: 40 + sr(i * 15 + (WIDGET_CATALOG.findIndex(wc=>wc.id===widget)||0) * 10) * 30 }));
  return (
    <div style={{ background: T.bg, borderRadius: 10, padding: 14, border: `1px solid ${T.border}`, minHeight: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: w.color + '22', color: w.color, borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, fontFamily: T.mono }}>{w.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.navy }}>{w.name}</span>
        </div>
        <span style={{ fontSize: 9, color: T.textMut }}>{w.category}</span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={chartData}>
          <Area type="monotone" dataKey="v" fill={w.color + '20'} stroke={w.color} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ScenarioDashboardBuilderPage() {
  const [tab, setTab] = useState(0);
  const [activeWidgets, setActiveWidgets] = useState(['carbon_price', 'portfolio_var', 'sector_heatmap', 'itr_gauge', 'transition_score', 'emissions_trajectory']);
  const [savedDashboards, setSavedDashboards] = useState([]);
  const [dashboardName, setDashboardName] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [sharedWith, setSharedWith] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState('daily');

  const toggleWidget = useCallback((id) => {
    setActiveWidgets(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  }, []);

  const saveDashboard = useCallback(() => {
    if (!dashboardName.trim()) return;
    setSavedDashboards(prev => [...prev, { id: Date.now(), name: dashboardName, widgets: [...activeWidgets], ts: new Date().toLocaleString() }]);
    setDashboardName('');
  }, [dashboardName, activeWidgets]);

  const loadTemplate = useCallback((template) => {
    setActiveWidgets(template.widgets);
  }, []);

  const categories = ['All', ...new Set(WIDGET_CATALOG.map(w => w.category))];
  const filteredWidgets = filterCat === 'All' ? WIDGET_CATALOG : WIDGET_CATALOG.filter(w => w.category === filterCat);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CH5 -- SCENARIO DASHBOARD BUILDER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Customizable Scenario Analysis Dashboard</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Drag-and-Drop Widgets -- 20+ Widget Catalog -- 8 Pre-Built Templates -- Share & Collaborate -- PDF Export
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Pill label="Active Widgets" val={activeWidgets.length.toString()} color={T.gold} />
            <Pill label="Templates" val="8" color={T.blue} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Dashboard Canvas -- Click widgets below to add/remove" span={1}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input type="text" value={dashboardName} onChange={e => setDashboardName(e.target.value)} placeholder="Dashboard name..." style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 200 }} />
                <button onClick={saveDashboard} style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Save Dashboard</button>
                <button onClick={() => setActiveWidgets([])} style={{ padding: '6px 14px', background: T.red + '22', color: T.red, border: `1px solid ${T.red}33`, borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Clear All</button>
              </div>
              {activeWidgets.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.textMut, fontSize: 13 }}>No widgets selected. Use the Widget Catalog tab or click widgets below to add them.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {activeWidgets.map(wId => <MiniWidget key={wId} widget={wId} />)}
                </div>
              )}
            </Card>
            <Card title="Quick Add Widgets">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {WIDGET_CATALOG.map(w => (
                  <button key={w.id} onClick={() => toggleWidget(w.id)} style={{
                    padding: '5px 12px', borderRadius: 16, border: `1px solid ${activeWidgets.includes(w.id) ? w.color : T.border}`,
                    background: activeWidgets.includes(w.id) ? w.color + '18' : T.surface, cursor: 'pointer', fontSize: 10, color: activeWidgets.includes(w.id) ? w.color : T.textSec, fontWeight: activeWidgets.includes(w.id) ? 700 : 400
                  }}>{activeWidgets.includes(w.id) ? 'x ' : '+ '}{w.name}</button>
                ))}
              </div>
              <Ref text="Widget data sourced from Sprint CA-CR module outputs. Carbon price from ICE EUA. Emissions from NGFS Phase 5. All modules interconnected via platform data bus." />
            </Card>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Saved Dashboards">
              {savedDashboards.length === 0 && <div style={{ fontSize: 12, color: T.textMut, padding: 20, textAlign: 'center' }}>No dashboards saved yet. Build one in the Dashboard Builder tab and click Save.</div>}
              {savedDashboards.map(d => (
                <div key={d.id} style={{ background: T.bg, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{d.name}</div>
                      <div style={{ fontSize: 10, color: T.textMut }}>{d.ts} -- {d.widgets.length} widgets</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setActiveWidgets(d.widgets)} style={{ padding: '4px 12px', background: T.blue, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10 }}>Load</button>
                      <button onClick={() => setSavedDashboards(prev => prev.filter(s => s.id !== d.id))} style={{ padding: '4px 12px', background: T.red + '22', color: T.red, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10 }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {d.widgets.map(wId => {
                      const w = WIDGET_CATALOG.find(wc => wc.id === wId);
                      return w ? <span key={wId} style={{ background: w.color + '15', color: w.color, padding: '2px 8px', borderRadius: 8, fontSize: 9, fontWeight: 600 }}>{w.name}</span> : null;
                    })}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {TEMPLATES.map(tmpl => (
              <Card key={tmpl.id} title={tmpl.name}>
                <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{tmpl.desc}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                  {tmpl.widgets.map(wId => {
                    const w = WIDGET_CATALOG.find(wc => wc.id === wId);
                    return w ? <span key={wId} style={{ background: w.color + '15', color: w.color, padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{w.name}</span> : null;
                  })}
                </div>
                <button onClick={() => { loadTemplate(tmpl); setTab(0); }} style={{ padding: '6px 14px', background: tmpl.color, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Use Template</button>
              </Card>
            ))}
            <Ref text="Templates designed for institutional reporting workflows. CIO Brief per CFA Institute best practices. Regulatory templates aligned with ECB/BoE/APRA submission formats." />
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <Card title="Widget Catalog -- 20+ Available Widgets">
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {categories.map(c => (
                  <button key={c} onClick={() => setFilterCat(c)} style={{
                    padding: '4px 12px', borderRadius: 16, border: `1px solid ${filterCat === c ? T.navy : T.border}`,
                    background: filterCat === c ? T.navy : T.surface, color: filterCat === c ? '#fff' : T.textSec, cursor: 'pointer', fontSize: 10, fontWeight: 600
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {filteredWidgets.map(w => (
                  <div key={w.id} onClick={() => toggleWidget(w.id)} style={{
                    background: activeWidgets.includes(w.id) ? w.color + '12' : T.bg, borderRadius: 10, padding: 14, cursor: 'pointer',
                    border: `2px solid ${activeWidgets.includes(w.id) ? w.color : 'transparent'}`, transition: 'all 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ background: w.color + '22', color: w.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, fontFamily: T.mono }}>{w.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{w.name}</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{w.category}</div>
                    {activeWidgets.includes(w.id) && <div style={{ fontSize: 10, color: w.color, fontWeight: 600, marginTop: 4 }}>Active</div>}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Share Dashboard" span={2}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input type="text" placeholder="Enter email to share with..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} onKeyDown={e => { if (e.key === 'Enter' && e.target.value) { setSharedWith(prev => [...prev, e.target.value]); e.target.value = ''; } }} />
                <button style={{ padding: '8px 16px', background: T.navy, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Share</button>
              </div>
              {sharedWith.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6 }}>Shared with:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {sharedWith.map((email, i) => (
                      <span key={i} style={{ background: T.blue + '15', color: T.blue, padding: '3px 10px', borderRadius: 12, fontSize: 10 }}>{email}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
            <Card title="Schedule Automated Refresh">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: T.textSec }}>Refresh interval:</label>
                <select value={refreshInterval} onChange={e => setRefreshInterval(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
                  <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
                <button style={{ padding: '6px 14px', background: T.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Set Schedule</button>
              </div>
              <div style={{ fontSize: 11, color: T.textMut }}>Next refresh: {refreshInterval === 'hourly' ? 'In ~60 minutes' : refreshInterval === 'daily' ? 'Tomorrow 06:00 UTC' : refreshInterval === 'weekly' ? 'Next Monday 06:00 UTC' : '1st of next month'}</div>
            </Card>
            <Card title="Collaboration Log">
              {[
                { user: 'risk-team@firm.com', action: 'Viewed CIO Brief', ts: '10min ago' },
                { user: 'cio@firm.com', action: 'Exported Board Report', ts: '2hr ago' },
                { user: 'compliance@firm.com', action: 'Updated Regulatory Filing', ts: '1d ago' },
              ].map((log, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                  <span><strong>{log.user}</strong> -- {log.action}</span>
                  <span style={{ color: T.textMut }}>{log.ts}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Export Options" span={2}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { format: 'PDF Report', desc: 'High-quality PDF with charts and tables', icon: 'PDF', color: T.red },
                  { format: 'PowerPoint', desc: 'Editable PPTX with slide-per-widget', icon: 'PPT', color: T.orange },
                  { format: 'Excel Data', desc: 'Raw data tables behind all widgets', icon: 'XLS', color: T.green },
                  { format: 'API Endpoint', desc: 'JSON API for dashboard data', icon: 'API', color: T.blue },
                ].map(f => (
                  <div key={f.format} style={{ background: T.bg, borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer', border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: f.color, fontFamily: T.mono, marginBottom: 8 }}>{f.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{f.format}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>{f.desc}</div>
                    <button style={{ marginTop: 10, padding: '5px 14px', background: f.color, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10 }}>Export</button>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Export History">
              {[
                { name: 'CIO Brief Q4 2025', format: 'PDF', date: '2025-12-15', size: '2.4MB' },
                { name: 'Risk Committee Pack', format: 'PPTX', date: '2025-12-10', size: '5.1MB' },
                { name: 'ECB Data Submission', format: 'XLSX', date: '2025-12-01', size: '8.7MB' },
              ].map((exp, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <div><strong>{exp.name}</strong> <span style={{ color: T.textMut }}>({exp.format})</span></div>
                  <div style={{ color: T.textMut }}>{exp.date} -- {exp.size}</div>
                </div>
              ))}
            </Card>
            <Card title="Active Widgets in Current Dashboard">
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {activeWidgets.map(wId => {
                  const w = WIDGET_CATALOG.find(wc => wc.id === wId);
                  return w ? <span key={wId} style={{ background: w.color + '15', color: w.color, padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{w.name}</span> : null;
                })}
              </div>
              {activeWidgets.length === 0 && <div style={{ fontSize: 11, color: T.textMut }}>No widgets active. Go to Dashboard Builder to add widgets.</div>}
              <Ref text="Dashboard data aggregated from all Sprint CA-CR climate risk modules. Real-time data refresh via platform data bus. Export formats follow institutional reporting standards." />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
