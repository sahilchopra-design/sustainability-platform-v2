/**
 * DataCaptureHubPage — Platform-Wide Data Capture, Pipeline Visualization & Documentation Hub
 *
 * 10 tabs: Dashboard | Data Entry | Module Requirements | Pipeline Map | Schema Docs
 *          | Coverage Analysis | Validation | Records Browser | Import/Export | Platform Docs
 *
 * All data sourced from DataCaptureContext (DATA_ENTITIES, MODULE_DATA_MAP, DATA_PIPELINES, DOMAIN_GROUPS)
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useDataCapture, DATA_ENTITIES, MODULE_DATA_MAP, DATA_PIPELINES, DOMAIN_GROUPS } from '../../../contexts/DataCaptureContext';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

/* ── deterministic PRNG ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── theme ── */
const T = { surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e', text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5', green: '#065f46', red: '#991b1b', amber: '#92400e' };

/* ── chart palette ── */
const CHART_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0284c7', '#b45309', '#16a34a', '#9333ea', '#991b1b', '#475569', '#6366f1', '#14b8a6', '#f59e0b'];

/* ── ISO countries shortlist ── */
const ISO_COUNTRIES = ['US','GB','DE','FR','JP','CN','IN','BR','CA','AU','CH','SG','KR','NL','SE','NO','DK','FI','ZA','AE','SA','MX','ID','TH','MY','PH','VN','EG','NG','KE'];

/* ── tab definitions ── */
const TABS = [
  { key: 'dashboard', label: 'Capture Dashboard' },
  { key: 'entry', label: 'Data Entry Forms' },
  { key: 'requirements', label: 'Module Requirements' },
  { key: 'pipelines', label: 'Pipeline & Connectivity' },
  { key: 'schema', label: 'Entity Schema Docs' },
  { key: 'coverage', label: 'Data Coverage Analysis' },
  { key: 'validation', label: 'Validation & Quality' },
  { key: 'records', label: 'Records Browser' },
  { key: 'importexport', label: 'Import / Export' },
  { key: 'docs', label: 'Platform Documentation' },
];

/* ── utility: paginate ── */
const paginate = (arr, page, perPage = 20) => {
  const start = (page - 1) * perPage;
  return { items: arr.slice(start, start + perPage), totalPages: Math.max(1, Math.ceil(arr.length / perPage)), total: arr.length };
};

/* ── Pagination controls ── */
const PaginationBar = ({ page, totalPages, onPage }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
    <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} style={btnSmStyle}>Prev</button>
    <span style={{ fontSize: 13, color: T.sub }}>Page {page} of {totalPages}</span>
    <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={btnSmStyle}>Next</button>
  </div>
);

/* ── Toast ── */
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;
  const bg = type === 'error' ? '#fef2f2' : type === 'warning' ? '#fffbeb' : '#f0fdf4';
  const border = type === 'error' ? T.red : type === 'warning' ? T.amber : T.green;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <span style={{ fontSize: 14, color: T.text }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.sub }}>x</button>
    </div>
  );
};

/* ── shared styles ── */
const cardStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 };
const kpiStyle = { ...cardStyle, textAlign: 'center', flex: 1, minWidth: 140 };
const btnStyle = { background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 };
const btnSmStyle = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 12 };
const inputStyle = { width: '100%', padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, background: T.card };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: T.sub, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' };
const tdStyle = { padding: '8px 12px', fontSize: 13, borderBottom: `1px solid ${T.border}`, color: T.text };
const badgeStyle = (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + '18', color });

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function DataCaptureHubPage() {
  const ctx = useDataCapture();
  const { capturedData, addRecord, updateRecord, deleteRecord, getRecords, validateRecord, searchRecords, getDataCoverage, getEntityConsumers, exportRecords, stats, entities, entityMap, moduleMap, pipelines, domainGroups } = ctx;

  /* ── global state ── */
  const [tab, setTab] = useState('dashboard');
  const [selectedEntity, setSelectedEntity] = useState(DATA_ENTITIES[0].id);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  /* ── toast helper ── */
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 3500);
  }, []);

  /* ── derived: all modules array ── */
  const allModules = useMemo(() => Object.entries(MODULE_DATA_MAP).map(([route, m]) => ({ route, ...m })), []);

  /* ── derived: total fields ── */
  const totalFields = useMemo(() => DATA_ENTITIES.reduce((s, e) => s + e.fields.length, 0), []);

  /* ── derived: total pipeline connections ── */
  const totalPipelines = DATA_PIPELINES.length;

  /* ── header ── */
  const header = (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>Data Capture Hub</h1>
      <p style={{ color: T.sub, margin: '4px 0 0', fontSize: 14 }}>Platform-wide data capture, pipeline visualization & documentation</p>
    </div>
  );

  /* ── tab bar ── */
  const tabBar = (
    <div style={{ display: 'flex', gap: 2, borderBottom: `2px solid ${T.border}`, marginBottom: 24, overflowX: 'auto' }}>
      {TABS.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{
          padding: '10px 16px', fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
          color: tab === t.key ? T.navy : T.sub, background: tab === t.key ? T.card : 'transparent',
          border: 'none', borderBottom: tab === t.key ? `3px solid ${T.gold}` : '3px solid transparent',
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}>{t.label}</button>
      ))}
    </div>
  );

  /* ── entity selector (shared) ── */
  const entitySelector = (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Entity</label>
      <select value={selectedEntity} onChange={e => setSelectedEntity(e.target.value)} style={{ ...selectStyle, maxWidth: 320, marginTop: 4 }}>
        {DATA_ENTITIES.map(e => <option key={e.id} value={e.id}>{e.icon} {e.name}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ background: T.surface, minHeight: '100vh', padding: '32px 28px' }}>
      {header}
      {tabBar}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {tab === 'dashboard' && <DashboardTab capturedData={capturedData} stats={stats} totalFields={totalFields} totalPipelines={totalPipelines} allModules={allModules} getDataCoverage={getDataCoverage} domainGroups={domainGroups} onQuickCapture={(eid) => { setSelectedEntity(eid); setTab('entry'); }} />}
      {tab === 'entry' && <DataEntryTab selectedEntity={selectedEntity} entitySelector={entitySelector} entityMap={entityMap} addRecord={addRecord} getRecords={getRecords} deleteRecord={deleteRecord} showToast={showToast} />}
      {tab === 'requirements' && <RequirementsTab allModules={allModules} domainGroups={domainGroups} capturedData={capturedData} getDataCoverage={getDataCoverage} entityMap={entityMap} />}
      {tab === 'pipelines' && <PipelineTab allModules={allModules} pipelines={pipelines} domainGroups={domainGroups} getEntityConsumers={getEntityConsumers} />}
      {tab === 'schema' && <SchemaTab selectedEntity={selectedEntity} entitySelector={entitySelector} entityMap={entityMap} getEntityConsumers={getEntityConsumers} />}
      {tab === 'coverage' && <CoverageTab capturedData={capturedData} allModules={allModules} domainGroups={domainGroups} getDataCoverage={getDataCoverage} entityMap={entityMap} />}
      {tab === 'validation' && <ValidationTab selectedEntity={selectedEntity} entitySelector={entitySelector} entityMap={entityMap} capturedData={capturedData} validateRecord={validateRecord} />}
      {tab === 'records' && <RecordsTab capturedData={capturedData} entityMap={entityMap} deleteRecord={deleteRecord} searchRecords={searchRecords} showToast={showToast} />}
      {tab === 'importexport' && <ImportExportTab selectedEntity={selectedEntity} entitySelector={entitySelector} entityMap={entityMap} capturedData={capturedData} exportRecords={exportRecords} addRecord={addRecord} showToast={showToast} />}
      {tab === 'docs' && <DocsTab entityMap={entityMap} allModules={allModules} pipelines={pipelines} domainGroups={domainGroups} getEntityConsumers={getEntityConsumers} />}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 1: CAPTURE DASHBOARD
   ══════════════════════════════════════════════════════════════════════════════ */
function DashboardTab({ capturedData, stats, totalFields, totalPipelines, allModules, getDataCoverage, domainGroups, onQuickCapture }) {
  const totalRecords = stats.totalRecords;
  const entitiesWithData = stats.totalEntities;
  const validationRate = useMemo(() => {
    if (totalRecords === 0) return 0;
    let passed = 0;
    for (const [, recs] of Object.entries(capturedData)) {
      passed += recs.length;
    }
    return totalRecords > 0 ? Math.round((passed / totalRecords) * 100) : 0;
  }, [capturedData, totalRecords]);

  /* KPI values */
  const kpis = [
    { label: 'Entities Defined', value: DATA_ENTITIES.length, color: T.indigo },
    { label: 'Total Fields', value: totalFields, color: T.green },
    { label: 'Modules Mapped', value: allModules.length, color: '#0891b2' },
    { label: 'Pipeline Connections', value: totalPipelines, color: T.gold },
    { label: 'Records Captured', value: totalRecords, color: '#7c3aed' },
    { label: 'Data Coverage', value: `${stats.coveragePct}%`, color: T.green },
    { label: 'Domains Covered', value: domainGroups.length, color: '#d97706' },
    { label: 'Validation Pass', value: `${validationRate}%`, color: totalRecords > 0 ? T.green : T.sub },
  ];

  /* Records by entity for pie */
  const pieData = useMemo(() => DATA_ENTITIES.map((e, i) => ({
    name: e.name, value: (capturedData[e.id] || []).length, fill: CHART_COLORS[i % CHART_COLORS.length],
  })).filter(d => d.value > 0), [capturedData]);

  /* Coverage by domain for bar */
  const domainCoverage = useMemo(() => domainGroups.map(dg => {
    const mods = allModules.filter(m => m.domain === dg.id);
    if (mods.length === 0) return { name: dg.name.split(' ')[0], coverage: 0 };
    const avg = mods.reduce((s, m) => s + getDataCoverage(m.route), 0) / mods.length;
    return { name: dg.name.length > 14 ? dg.name.slice(0, 12) + '..' : dg.name, coverage: Math.round(avg) };
  }), [allModules, domainGroups, getDataCoverage]);

  /* Activity feed */
  const recentCaptures = useMemo(() => {
    const all = [];
    for (const [entityId, recs] of Object.entries(capturedData)) {
      for (const r of recs) {
        all.push({ entityId, entity: DATA_ENTITIES.find(e => e.id === entityId)?.name || entityId, ts: r._capturedAt, fieldsFilled: Object.keys(r).filter(k => !k.startsWith('_') && r[k] !== '' && r[k] !== null && r[k] !== undefined).length });
      }
    }
    return [...all].sort((a, b) => (b.ts || '').localeCompare(a.ts || '')).slice(0, 10);
  }, [capturedData]);

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} style={kpiStyle}>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Pie: records by entity */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Records by Entity Type</h3>
          {pieData.length === 0 ? <p style={{ color: T.sub, fontSize: 13 }}>No records captured yet. Use Quick Capture below.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: coverage by domain */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Coverage by Domain (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={domainCoverage} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="coverage" fill={T.indigo} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Recent Captures</h3>
        {recentCaptures.length === 0 ? <p style={{ color: T.sub, fontSize: 13 }}>No captures yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Entity', 'Timestamp', 'Fields Filled'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {recentCaptures.map((c, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{c.entity}</td>
                  <td style={tdStyle}>{c.ts ? new Date(c.ts).toLocaleString() : '-'}</td>
                  <td style={tdStyle}>{c.fieldsFilled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick capture buttons */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Quick Capture</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DATA_ENTITIES.map(e => (
            <button key={e.id} onClick={() => onQuickCapture(e.id)} style={{ ...btnStyle, background: T.indigo, fontSize: 12, padding: '6px 12px' }}>
              {e.icon} {e.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 2: DATA ENTRY FORMS
   ══════════════════════════════════════════════════════════════════════════════ */
function DataEntryTab({ selectedEntity, entitySelector, entityMap, addRecord, getRecords, deleteRecord, showToast }) {
  const entity = entityMap[selectedEntity];
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);

  const records = getRecords(selectedEntity);
  const { items: pageRecords, totalPages } = paginate(records, page);

  const handleChange = useCallback((key, value, type) => {
    let parsed = value;
    if ((type === 'number' || type === 'currency' || type === 'percentage') && value !== '') {
      parsed = parseFloat(value);
      if (isNaN(parsed)) parsed = value;
    }
    if (type === 'boolean') parsed = value === 'true' || value === true;
    setFormData(prev => ({ ...prev, [key]: parsed }));
  }, []);

  const handleSave = useCallback(() => {
    if (!entity) return;
    const result = addRecord(selectedEntity, formData);
    if (result.success) {
      showToast(`Record saved to ${entity.name}`, 'success');
      setFormData({});
      setErrors([]);
    } else {
      setErrors(result.errors || []);
      showToast('Validation failed. Check highlighted fields.', 'error');
    }
  }, [entity, selectedEntity, formData, addRecord, showToast]);

  const handleDelete = useCallback((id) => {
    deleteRecord(selectedEntity, id);
    showToast('Record deleted', 'warning');
  }, [selectedEntity, deleteRecord, showToast]);

  const handleEdit = useCallback((rec) => {
    setEditId(rec._id);
    const clean = {};
    if (entity) {
      for (const f of entity.fields) {
        if (rec[f.key] !== undefined) clean[f.key] = rec[f.key];
      }
    }
    setFormData(clean);
  }, [entity]);

  if (!entity) return <p style={{ color: T.sub }}>Entity not found.</p>;

  const errorMap = Object.fromEntries((errors || []).map(e => [e.field, e.message]));

  return (
    <div>
      {entitySelector}

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 16px' }}>
          {editId ? 'Edit' : 'New'} {entity.icon} {entity.name} Record
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {entity.fields.map(f => {
            const hasError = !!errorMap[f.key];
            return (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: hasError ? T.red : T.sub, display: 'block', marginBottom: 4 }}>
                  {f.label} {f.required && <span style={{ color: T.red }}>*</span>}
                  {f.unit && <span style={{ fontWeight: 400, marginLeft: 4 }}>({f.unit})</span>}
                </label>

                {f.type === 'select' ? (
                  <select value={formData[f.key] || ''} onChange={e => handleChange(f.key, e.target.value, f.type)} style={{ ...selectStyle, borderColor: hasError ? T.red : T.border }}>
                    <option value="">-- select --</option>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'multiselect' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(f.options || []).map(o => {
                      const selected = Array.isArray(formData[f.key]) && formData[f.key].includes(o);
                      return (
                        <label key={o} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="checkbox" checked={selected} onChange={() => {
                            const current = Array.isArray(formData[f.key]) ? formData[f.key] : [];
                            handleChange(f.key, selected ? current.filter(x => x !== o) : [...current, o], 'multiselect');
                          }} /> {o}
                        </label>
                      );
                    })}
                  </div>
                ) : f.type === 'boolean' ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="radio" name={f.key} checked={formData[f.key] === true} onChange={() => handleChange(f.key, true, 'boolean')} /> Yes
                    </label>
                    <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="radio" name={f.key} checked={formData[f.key] === false} onChange={() => handleChange(f.key, false, 'boolean')} /> No
                    </label>
                  </div>
                ) : f.type === 'date' ? (
                  <input type="date" value={formData[f.key] || ''} onChange={e => handleChange(f.key, e.target.value, f.type)} style={{ ...inputStyle, borderColor: hasError ? T.red : T.border }} />
                ) : f.type === 'iso_country' ? (
                  <select value={formData[f.key] || ''} onChange={e => handleChange(f.key, e.target.value, f.type)} style={{ ...selectStyle, borderColor: hasError ? T.red : T.border }}>
                    <option value="">-- country --</option>
                    {ISO_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' || f.type === 'currency' || f.type === 'percentage' ? 'number' : f.type === 'url' ? 'url' : 'text'}
                    value={formData[f.key] !== undefined && formData[f.key] !== null ? formData[f.key] : ''}
                    onChange={e => handleChange(f.key, e.target.value, f.type)}
                    placeholder={f.help || ''}
                    style={{ ...inputStyle, borderColor: hasError ? T.red : T.border }}
                    step={f.type === 'number' || f.type === 'currency' || f.type === 'percentage' ? 'any' : undefined}
                  />
                )}

                {hasError && <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>{errorMap[f.key]}</div>}
                {f.help && !hasError && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{f.help}</div>}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={handleSave} style={btnStyle}>{editId ? 'Update' : 'Save'} Record</button>
          {editId && <button onClick={() => { setEditId(null); setFormData({}); setErrors([]); }} style={{ ...btnStyle, background: T.sub }}>Cancel Edit</button>}
        </div>
      </div>

      {/* Recent records */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Recent {entity.name} Records ({records.length})</h3>
        {records.length === 0 ? <p style={{ color: T.sub, fontSize: 13 }}>No records yet.</p> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {entity.fields.slice(0, 6).map(f => <th key={f.key} style={thStyle}>{f.label}</th>)}
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map(r => (
                    <tr key={r._id}>
                      {entity.fields.slice(0, 6).map(f => (
                        <td key={f.key} style={tdStyle}>{r[f.key] !== undefined && r[f.key] !== null ? String(r[f.key]).slice(0, 30) : '-'}</td>
                      ))}
                      <td style={tdStyle}>
                        <button onClick={() => handleEdit(r)} style={{ ...btnSmStyle, marginRight: 4, color: T.indigo }}>Edit</button>
                        <button onClick={() => handleDelete(r._id)} style={{ ...btnSmStyle, color: T.red }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 3: MODULE REQUIREMENTS BROWSER
   ══════════════════════════════════════════════════════════════════════════════ */
function RequirementsTab({ allModules, domainGroups, capturedData, getDataCoverage, entityMap }) {
  const [search, setSearch] = useState('');
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  const filteredModules = useMemo(() => {
    if (!search) return allModules;
    const q = search.toLowerCase();
    return allModules.filter(m => m.name.toLowerCase().includes(q) || m.route.toLowerCase().includes(q));
  }, [allModules, search]);

  const moduleCoverage = useCallback((route) => getDataCoverage(route), [getDataCoverage]);

  const coverageBadge = (pct) => {
    if (pct >= 100) return <span style={badgeStyle(T.green)}>Ready</span>;
    if (pct >= 50) return <span style={badgeStyle(T.amber)}>Partial</span>;
    return <span style={badgeStyle(T.red)}>Needs Data</span>;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search modules..." style={{ ...inputStyle, maxWidth: 400 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedModule ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Domain accordions */}
        <div>
          {domainGroups.map(dg => {
            const mods = filteredModules.filter(m => m.domain === dg.id);
            if (mods.length === 0) return null;
            const isOpen = expandedDomain === dg.id;
            return (
              <div key={dg.id} style={{ ...cardStyle, marginBottom: 8 }}>
                <div onClick={() => setExpandedDomain(isOpen ? null : dg.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: dg.color }}>{dg.icon} {dg.name} ({mods.length})</span>
                  <span style={{ fontSize: 18, color: T.sub }}>{isOpen ? '-' : '+'}</span>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 12 }}>
                    {mods.map(m => {
                      const cov = moduleCoverage(m.route);
                      return (
                        <div key={m.route} onClick={() => setSelectedModule(m)} style={{
                          padding: '8px 12px', borderRadius: 6, marginBottom: 4, cursor: 'pointer',
                          background: selectedModule?.route === m.route ? T.indigo + '12' : 'transparent',
                          border: `1px solid ${selectedModule?.route === m.route ? T.indigo : 'transparent'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{m.name}</span>
                            <span style={{ fontSize: 11, color: T.sub, marginLeft: 8 }}>{m.code}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: T.sub }}>{cov}%</span>
                            {coverageBadge(cov)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Module detail panel */}
        {selectedModule && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 4px' }}>{selectedModule.name}</h3>
            <p style={{ fontSize: 12, color: T.sub, margin: '0 0 16px' }}>{selectedModule.code} | {selectedModule.domain}</p>

            <h4 style={{ fontSize: 13, fontWeight: 600, color: T.green, margin: '0 0 8px' }}>Required Entities</h4>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {(selectedModule.requiredEntities || []).map(eid => (
                <span key={eid} style={{ ...badgeStyle(T.green), padding: '4px 10px' }}>{entityMap[eid]?.icon} {entityMap[eid]?.name || eid}</span>
              ))}
              {(selectedModule.requiredEntities || []).length === 0 && <span style={{ fontSize: 12, color: T.sub }}>None (reference module)</span>}
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 600, color: T.indigo, margin: '0 0 8px' }}>Optional Entities</h4>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {(selectedModule.optionalEntities || []).map(eid => (
                <span key={eid} style={{ ...badgeStyle(T.indigo), padding: '4px 10px' }}>{entityMap[eid]?.icon} {entityMap[eid]?.name || eid}</span>
              ))}
              {(selectedModule.optionalEntities || []).length === 0 && <span style={{ fontSize: 12, color: T.sub }}>None</span>}
            </div>

            {selectedModule.specificFields && Object.keys(selectedModule.specificFields).length > 0 && (
              <>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: '0 0 8px' }}>Specific Fields Needed</h4>
                {Object.entries(selectedModule.specificFields).map(([eid, fields]) => (
                  <div key={eid} style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{entityMap[eid]?.name || eid}:</span>
                    <span style={{ fontSize: 12, color: T.text, marginLeft: 6 }}>{fields.join(', ')}</span>
                  </div>
                ))}
              </>
            )}

            {(selectedModule.outputs || []).length > 0 && (
              <>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: T.gold, margin: '16px 0 8px' }}>Outputs</h4>
                {selectedModule.outputs.map((o, i) => (
                  <div key={i} style={{ fontSize: 12, color: T.text, marginBottom: 4 }}>
                    <strong>{o.name}</strong> ({o.entity}) - {o.description}
                  </div>
                ))}
              </>
            )}

            <div style={{ marginTop: 16, padding: '8px 12px', background: T.surface, borderRadius: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Coverage: </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{moduleCoverage(selectedModule.route)}%</span>
              <span style={{ marginLeft: 8 }}>{coverageBadge(moduleCoverage(selectedModule.route))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 4: PIPELINE & CONNECTIVITY MAP
   ══════════════════════════════════════════════════════════════════════════════ */
function PipelineTab({ allModules, pipelines, domainGroups, getEntityConsumers }) {
  const [sourceFilter, setSourceFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [entityFlowId, setEntityFlowId] = useState('');

  const moduleRoutes = useMemo(() => allModules.map(m => m.route), [allModules]);
  const moduleNameMap = useMemo(() => Object.fromEntries(Object.entries(MODULE_DATA_MAP).map(([r, m]) => [r, m.name])), []);

  /* Filtered pipelines */
  const filtered = useMemo(() => {
    let result = pipelines;
    if (sourceFilter) result = result.filter(p => p.from === sourceFilter);
    if (targetFilter) result = result.filter(p => p.to === targetFilter);
    return result;
  }, [pipelines, sourceFilter, targetFilter]);

  /* Pipeline counts per domain */
  const domainPipeCounts = useMemo(() => {
    const domainLookup = {};
    for (const [route, mod] of Object.entries(MODULE_DATA_MAP)) domainLookup[route] = mod.domain;
    const counts = {};
    for (const dg of domainGroups) counts[dg.id] = { name: dg.name, outbound: 0, inbound: 0 };
    for (const p of pipelines) {
      const fromD = domainLookup[p.from];
      const toD = domainLookup[p.to];
      if (fromD && counts[fromD]) counts[fromD].outbound++;
      if (toD && counts[toD]) counts[toD].inbound++;
    }
    return Object.values(counts);
  }, [pipelines, domainGroups]);

  /* Top 5 most-connected modules */
  const topConnected = useMemo(() => {
    const countMap = {};
    for (const p of pipelines) {
      countMap[p.from] = (countMap[p.from] || 0) + 1;
      countMap[p.to] = (countMap[p.to] || 0) + 1;
    }
    return [...Object.entries(countMap)].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([route, count]) => ({
      route, name: moduleNameMap[route] || route, count,
    }));
  }, [pipelines, moduleNameMap]);

  /* Entity flow */
  const entityFlow = useMemo(() => {
    if (!entityFlowId) return null;
    const producers = [...new Set(pipelines.filter(p => p.entity === entityFlowId).map(p => p.from))];
    const consumers = [...new Set(pipelines.filter(p => p.entity === entityFlowId).map(p => p.to))];
    return { producers, consumers };
  }, [pipelines, entityFlowId]);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Source Module</label>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={selectStyle}>
            <option value="">All Sources</option>
            {moduleRoutes.map(r => <option key={r} value={r}>{moduleNameMap[r] || r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Target Module</label>
          <select value={targetFilter} onChange={e => setTargetFilter(e.target.value)} style={selectStyle}>
            <option value="">All Targets</option>
            {moduleRoutes.map(r => <option key={r} value={r}>{moduleNameMap[r] || r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Entity Flow</label>
          <select value={entityFlowId} onChange={e => setEntityFlowId(e.target.value)} style={selectStyle}>
            <option value="">-- select entity --</option>
            {DATA_ENTITIES.map(e => <option key={e.id} value={e.id}>{e.icon} {e.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Pipeline list */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Pipelines ({filtered.length})</h3>
          <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['From', 'Entity', 'To', 'Fields', 'Description'].map(h => <th key={h} style={{ ...thStyle, position: 'sticky', top: 0, background: T.card }}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{moduleNameMap[p.from] || p.from}</span></td>
                    <td style={tdStyle}><span style={badgeStyle(T.indigo)}>{p.entity}</span></td>
                    <td style={tdStyle}><span style={{ fontSize: 12 }}>{moduleNameMap[p.to] || p.to}</span></td>
                    <td style={{ ...tdStyle, fontSize: 11 }}>{p.fields.join(', ')}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: T.sub }}>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top connected + entity flow */}
        <div>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Top 5 Connected Modules</h3>
            {topConnected.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.text }}>{m.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.indigo }}>{m.count} connections</span>
              </div>
            ))}
          </div>

          {entityFlow && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Entity Flow: {entityFlowId}</h3>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: T.green, margin: '0 0 4px' }}>Producers ({entityFlow.producers.length})</h4>
              {entityFlow.producers.map(r => (
                <div key={r} style={{ fontSize: 12, color: T.text, padding: '2px 0' }}>{moduleNameMap[r] || r} --{'>'}</div>
              ))}
              <h4 style={{ fontSize: 12, fontWeight: 600, color: T.indigo, margin: '12px 0 4px' }}>Consumers ({entityFlow.consumers.length})</h4>
              {entityFlow.consumers.map(r => (
                <div key={r} style={{ fontSize: 12, color: T.text, padding: '2px 0' }}>--{'>'} {moduleNameMap[r] || r}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grouped bar: pipeline counts by domain */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Pipeline Connections by Domain</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={domainPipeCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="outbound" fill={T.indigo} name="Outbound" radius={[4, 4, 0, 0]} />
            <Bar dataKey="inbound" fill={T.gold} name="Inbound" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 5: ENTITY SCHEMA DOCUMENTATION
   ══════════════════════════════════════════════════════════════════════════════ */
function SchemaTab({ selectedEntity, entitySelector, entityMap, getEntityConsumers }) {
  const entity = entityMap[selectedEntity];
  if (!entity) return <p style={{ color: T.sub }}>Entity not found.</p>;

  const consumers = getEntityConsumers(selectedEntity);

  /* Generate example record deterministically */
  const exampleRecord = useMemo(() => {
    const rec = {};
    entity.fields.forEach((f, i) => {
      const seed = i * 7 + 3;
      if (f.type === 'text' || f.type === 'url') rec[f.key] = f.key === 'id' ? 'DEMO_001' : f.key.includes('name') ? 'Acme Corp' : f.key.includes('website') ? 'https://acme.example.com' : `sample_${f.key}`;
      else if (f.type === 'number') rec[f.key] = +(sr(seed) * 1000).toFixed(2);
      else if (f.type === 'currency') rec[f.key] = +(sr(seed) * 1e9).toFixed(0);
      else if (f.type === 'percentage') rec[f.key] = +(sr(seed) * 100).toFixed(1);
      else if (f.type === 'boolean') rec[f.key] = sr(seed) > 0.5;
      else if (f.type === 'date') rec[f.key] = '2025-06-15';
      else if (f.type === 'select') rec[f.key] = (f.options || [''])[Math.floor(sr(seed) * (f.options || ['']).length)];
      else if (f.type === 'multiselect') rec[f.key] = (f.options || []).slice(0, Math.floor(sr(seed) * 3) + 1);
      else if (f.type === 'iso_country') rec[f.key] = ISO_COUNTRIES[Math.floor(sr(seed) * ISO_COUNTRIES.length)];
      else rec[f.key] = `demo_${f.key}`;
    });
    return rec;
  }, [entity]);

  /* Export schema as CSV */
  const handleExportSchema = useCallback(() => {
    const header = 'Field Name,Type,Unit,Required,Default,Help Text';
    const rows = entity.fields.map(f => [f.key, f.type, f.unit || '', f.required ? 'Yes' : 'No', f.defaultValue !== undefined ? f.defaultValue : '', (f.help || '').replace(/,/g, ';')].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEntity}_schema.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entity, selectedEntity]);

  return (
    <div>
      {entitySelector}

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: 0 }}>{entity.icon} {entity.name}</h3>
            <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0' }}>{entity.description}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.indigo }}>{entity.fields.length}</div>
            <div style={{ fontSize: 11, color: T.sub }}>Total Fields</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Field Name', 'Type', 'Unit', 'Required', 'Default', 'Help Text'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {entity.fields.map(f => (
                <tr key={f.key}>
                  <td style={{ ...tdStyle, fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{f.key}</td>
                  <td style={tdStyle}><span style={badgeStyle(T.indigo)}>{f.type}</span></td>
                  <td style={tdStyle}>{f.unit || '-'}</td>
                  <td style={tdStyle}>{f.required ? <span style={badgeStyle(T.red)}>Required</span> : <span style={{ fontSize: 12, color: T.sub }}>Optional</span>}</td>
                  <td style={tdStyle}>{f.defaultValue !== undefined ? String(f.defaultValue) : '-'}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: T.sub }}>{f.help || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={handleExportSchema} style={{ ...btnStyle, background: T.indigo }}>Export Schema as CSV</button>
        </div>
      </div>

      {/* Related modules */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Related Modules ({consumers.length})</h3>
          {consumers.length === 0 ? <p style={{ color: T.sub, fontSize: 12 }}>No modules consume this entity.</p> : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {consumers.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 13 }}>{c.name}</span>
                  <span style={badgeStyle(c.required ? T.green : T.indigo)}>{c.required ? 'Required' : 'Optional'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Example Record</h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {entity.fields.map(f => (
              <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.sub }}>{f.key}</span>
                <span style={{ fontSize: 12, color: T.text }}>{Array.isArray(exampleRecord[f.key]) ? exampleRecord[f.key].join(', ') : String(exampleRecord[f.key])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 6: DATA COVERAGE ANALYSIS
   ══════════════════════════════════════════════════════════════════════════════ */
function CoverageTab({ capturedData, allModules, domainGroups, getDataCoverage, entityMap }) {
  /* Heatmap data: entities x metrics */
  const entityHeatmap = useMemo(() => DATA_ENTITIES.map(e => {
    const records = capturedData[e.id] || [];
    const totalFields = e.fields.length;
    let filledFields = 0;
    for (const r of records) {
      filledFields += Object.keys(r).filter(k => !k.startsWith('_') && r[k] !== '' && r[k] !== null && r[k] !== undefined).length;
    }
    const maxFilled = records.length > 0 ? totalFields * records.length : 0;
    const fillPct = maxFilled > 0 ? Math.round((filledFields / maxFilled) * 100) : 0;
    return { entity: e.name, icon: e.icon, id: e.id, totalFields, records: records.length, fillPct, validationPct: records.length > 0 ? 100 : 0 };
  }), [capturedData]);

  /* Per-entity bar chart */
  const entityBarData = entityHeatmap.map(e => ({ name: e.entity.length > 12 ? e.entity.slice(0, 10) + '..' : e.entity, records: e.records, fillPct: e.fillPct }));

  /* Module readiness table */
  const moduleReadiness = useMemo(() =>
    allModules.map(m => {
      const cov = getDataCoverage(m.route);
      const domainInfo = domainGroups.find(d => d.id === m.domain);
      return { name: m.name, code: m.code, domain: domainInfo?.name || m.domain, coverage: cov, status: cov >= 100 ? 'Ready' : cov >= 50 ? 'Partial' : 'Needs Data' };
    }).sort((a, b) => a.coverage - b.coverage),
  [allModules, getDataCoverage, domainGroups]);

  /* Recommendation cards: entities with 0 records */
  const recommendations = useMemo(() => {
    return DATA_ENTITIES.filter(e => (capturedData[e.id] || []).length === 0).map(e => {
      const mods = allModules.filter(m => (m.requiredEntities || []).includes(e.id));
      return { entity: e, moduleCount: mods.length };
    }).filter(r => r.moduleCount > 0).sort((a, b) => b.moduleCount - a.moduleCount).slice(0, 5);
  }, [capturedData, allModules]);

  const [modPage, setModPage] = useState(1);
  const { items: pageModules, totalPages: modTotalPages } = paginate(moduleReadiness, modPage);

  return (
    <div>
      {/* Heatmap table */}
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Entity Coverage Heatmap</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Entity', 'Total Fields', 'Records', 'Fields Filled %', 'Validation Pass %'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {entityHeatmap.map(e => (
                <tr key={e.id} style={{ background: e.records === 0 ? '#fef2f2' : 'transparent' }}>
                  <td style={tdStyle}>{e.icon} {e.entity}</td>
                  <td style={tdStyle}>{e.totalFields}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: e.records === 0 ? T.red : T.green }}>{e.records}</td>
                  <td style={tdStyle}>
                    <div style={{ width: 80, height: 8, background: T.border, borderRadius: 4 }}>
                      <div style={{ width: `${e.fillPct}%`, height: 8, background: T.indigo, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: T.sub, marginLeft: 4 }}>{e.fillPct}%</span>
                  </td>
                  <td style={tdStyle}>{e.validationPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Entity bar chart */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Records per Entity</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={entityBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="records" fill={T.indigo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendations */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Recommendations</h3>
          {recommendations.length === 0 ? <p style={{ color: T.sub, fontSize: 13 }}>All critical entities have data.</p> : (
            recommendations.map((r, i) => (
              <div key={i} style={{ padding: 12, background: T.surface, borderRadius: 8, marginBottom: 8, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{r.entity.icon} Capture {r.entity.name} data</div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Unlocks <strong style={{ color: T.indigo }}>{r.moduleCount}</strong> modules</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Module readiness */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Module Readiness ({moduleReadiness.length} modules)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Module', 'Code', 'Domain', 'Coverage', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {pageModules.map((m, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{m.name}</td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{m.code}</td>
                  <td style={tdStyle}>{m.domain}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 6, background: T.border, borderRadius: 3 }}>
                        <div style={{ width: `${m.coverage}%`, height: 6, background: m.coverage >= 100 ? T.green : m.coverage >= 50 ? T.gold : T.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: T.sub }}>{m.coverage}%</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(m.status === 'Ready' ? T.green : m.status === 'Partial' ? T.amber : T.red)}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={modPage} totalPages={modTotalPages} onPage={setModPage} />
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 7: VALIDATION & QUALITY
   ══════════════════════════════════════════════════════════════════════════════ */
function ValidationTab({ selectedEntity, entitySelector, entityMap, capturedData, validateRecord }) {
  const [results, setResults] = useState(null);

  const entity = entityMap[selectedEntity];
  const records = capturedData[selectedEntity] || [];

  const runValidation = useCallback(() => {
    if (!entity) return;
    const allResults = [];
    for (const rec of records) {
      const v = validateRecord(selectedEntity, rec);
      if (!v.valid) {
        for (const e of v.errors) {
          allResults.push({ recordId: rec._id, field: e.field, message: e.message, severity: 'error' });
        }
      }
    }
    setResults(allResults);
  }, [entity, records, selectedEntity, validateRecord]);

  /* Quality score */
  const qualityScore = useMemo(() => {
    if (!results || records.length === 0) return null;
    const failedIds = new Set(results.map(r => r.recordId));
    return Math.round(((records.length - failedIds.size) / records.length) * 100);
  }, [results, records]);

  /* Common errors */
  const commonErrors = useMemo(() => {
    if (!results || results.length === 0) return [];
    const freq = {};
    for (const r of results) {
      const key = `${r.field}: ${r.message}`;
      freq[key] = (freq[key] || 0) + 1;
    }
    return [...Object.entries(freq)].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([pattern, count]) => ({ pattern, count }));
  }, [results]);

  /* Quality trend (mock with sr) */
  const qualityTrend = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      period: `Week ${i + 1}`,
      score: Math.round(60 + sr(i * 31) * 40),
    }));
  }, []);

  const [vPage, setVPage] = useState(1);
  const validResults = results || [];
  const { items: pageResults, totalPages: vTotalPages } = paginate(validResults, vPage);

  return (
    <div>
      {entitySelector}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button onClick={runValidation} style={btnStyle} disabled={records.length === 0}>
          Run Validation ({records.length} records)
        </button>
        {qualityScore !== null && (
          <div style={{ padding: '8px 16px', background: qualityScore >= 90 ? '#f0fdf4' : qualityScore >= 60 ? '#fffbeb' : '#fef2f2', borderRadius: 8, border: `1px solid ${qualityScore >= 90 ? T.green : qualityScore >= 60 ? T.amber : T.red}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: qualityScore >= 90 ? T.green : qualityScore >= 60 ? T.amber : T.red }}>
              Quality Score: {qualityScore}%
            </span>
          </div>
        )}
      </div>

      {results !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Validation results table */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Validation Results ({validResults.length} issues)</h3>
            {validResults.length === 0 ? <p style={{ color: T.green, fontSize: 13, fontWeight: 600 }}>All records pass validation.</p> : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Record ID', 'Field', 'Error', 'Severity'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {pageResults.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{r.recordId.slice(0, 16)}..</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{r.field}</td>
                        <td style={tdStyle}>{r.message}</td>
                        <td style={tdStyle}><span style={badgeStyle(r.severity === 'error' ? T.red : T.amber)}>{r.severity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationBar page={vPage} totalPages={vTotalPages} onPage={setVPage} />
              </>
            )}
          </div>

          {/* Common errors */}
          <div>
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Common Error Patterns</h3>
              {commonErrors.length === 0 ? <p style={{ color: T.sub, fontSize: 12 }}>No errors detected.</p> :
                commonErrors.map((e, i) => (
                  <div key={i} style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.text }}>{e.pattern}</span>
                    <span style={badgeStyle(T.red)}>{e.count}x</span>
                  </div>
                ))
              }
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Quality Scoring Methodology</h3>
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                <p><strong>Quality Score</strong> = (Records passing all validations / Total records) x 100%</p>
                <p>Validations include: required field checks, type coercion, range validation (min/max), regex pattern matching (ISIN, LEI, ISO country), and custom business rules.</p>
                <p>Severity levels: <span style={badgeStyle(T.red)}>Error</span> blocks module usage; <span style={badgeStyle(T.amber)}>Warning</span> flags potential issues.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality trend chart */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Quality Trend (Simulated)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={qualityTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => `${v}%`} />
            <Area type="monotone" dataKey="score" fill={T.indigo + '30'} stroke={T.indigo} strokeWidth={2} />
            <ReferenceLine y={80} stroke={T.green} strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 8: RECORDS BROWSER
   ══════════════════════════════════════════════════════════════════════════════ */
function RecordsTab({ capturedData, entityMap, deleteRecord, searchRecords, showToast }) {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState(DATA_ENTITIES[0].id);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [page, setPage] = useState(1);

  const records = capturedData[entityFilter] || [];
  const entity = entityMap[entityFilter];

  /* Cross-entity search */
  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return null;
    return searchRecords(search);
  }, [search, searchRecords]);

  /* Paginated records */
  const displayRecords = searchResults ? searchResults.filter(r => r.entityId === entityFilter).map(r => r.record) : records;
  const { items: pageRecords, totalPages } = paginate(displayRecords, page);

  /* Record count summary */
  const entityCounts = useMemo(() => DATA_ENTITIES.map(e => ({
    id: e.id, name: e.name, icon: e.icon, count: (capturedData[e.id] || []).length,
  })), [capturedData]);

  /* Bulk export CSV */
  const handleBulkExport = useCallback(() => {
    if (!entity || records.length === 0) return;
    const keys = entity.fields.map(f => f.key);
    const header = keys.join(',');
    const rows = records.map(r => keys.map(k => {
      const v = r[k];
      if (v === null || v === undefined) return '';
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
      return String(v);
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityFilter}_records.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entity, records, entityFilter]);

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search across all records..." style={{ ...inputStyle, maxWidth: 400 }} />
      </div>

      {/* Entity summary bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {entityCounts.map(ec => (
          <button key={ec.id} onClick={() => { setEntityFilter(ec.id); setPage(1); }} style={{
            ...btnSmStyle, background: entityFilter === ec.id ? T.indigo + '15' : T.card,
            borderColor: entityFilter === ec.id ? T.indigo : T.border, fontWeight: entityFilter === ec.id ? 600 : 400,
          }}>
            {ec.icon} {ec.name} ({ec.count})
          </button>
        ))}
      </div>

      {/* Records table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: 0 }}>{entity?.name || entityFilter} Records ({displayRecords.length})</h3>
          <button onClick={handleBulkExport} style={{ ...btnStyle, background: T.green }} disabled={records.length === 0}>Export CSV</button>
        </div>

        {displayRecords.length === 0 ? <p style={{ color: T.sub, fontSize: 13 }}>No records found.</p> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {entity && entity.fields.slice(0, 5).map(f => <th key={f.key} style={thStyle}>{f.label}</th>)}
                    <th style={thStyle}>Captured</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map(r => (
                    <React.Fragment key={r._id}>
                      <tr onClick={() => setExpandedRecord(expandedRecord === r._id ? null : r._id)} style={{ cursor: 'pointer' }}>
                        {entity && entity.fields.slice(0, 5).map(f => (
                          <td key={f.key} style={tdStyle}>{r[f.key] !== undefined && r[f.key] !== null ? String(r[f.key]).slice(0, 25) : '-'}</td>
                        ))}
                        <td style={{ ...tdStyle, fontSize: 11 }}>{r._capturedAt ? new Date(r._capturedAt).toLocaleDateString() : '-'}</td>
                        <td style={tdStyle}>
                          <button onClick={e => { e.stopPropagation(); deleteRecord(entityFilter, r._id); showToast('Record deleted', 'warning'); }} style={{ ...btnSmStyle, color: T.red }}>Delete</button>
                        </td>
                      </tr>
                      {expandedRecord === r._id && entity && (
                        <tr>
                          <td colSpan={7} style={{ padding: 16, background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                              {entity.fields.map(f => (
                                <div key={f.key}>
                                  <span style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>{f.label}: </span>
                                  <span style={{ fontSize: 12, color: T.text }}>{r[f.key] !== undefined && r[f.key] !== null ? (Array.isArray(r[f.key]) ? r[f.key].join(', ') : String(r[f.key])) : '-'}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 9: IMPORT / EXPORT
   ══════════════════════════════════════════════════════════════════════════════ */
function ImportExportTab({ selectedEntity, entitySelector, entityMap, capturedData, exportRecords, addRecord, showToast }) {
  const entity = entityMap[selectedEntity];
  const [importPreview, setImportPreview] = useState(null);
  const [columnMap, setColumnMap] = useState({});

  /* Mock import history */
  const importHistory = useMemo(() => [
    { id: 1, filename: 'company_data_2025.csv', entity: 'Company', rows: 142, status: 'Completed', date: '2025-12-15' },
    { id: 2, filename: 'emissions_q3.csv', entity: 'Emissions Data', rows: 89, status: 'Completed', date: '2025-11-20' },
    { id: 3, filename: 'portfolio_update.csv', entity: 'Portfolio Holding', rows: 256, status: 'Partial (12 errors)', date: '2025-11-01' },
    { id: 4, filename: 'supplier_list.csv', entity: 'Supplier', rows: 45, status: 'Completed', date: '2025-10-15' },
    { id: 5, filename: 'esg_scores_msci.csv', entity: 'ESG Score', rows: 200, status: 'Completed', date: '2025-09-30' },
  ], []);

  /* Demo import flow */
  const handleDemoImport = useCallback(() => {
    if (!entity) return;
    const demoRows = Array.from({ length: 5 }, (_, i) => {
      const row = {};
      entity.fields.forEach((f, fi) => {
        const seed = i * 47 + fi * 13;
        if (f.type === 'text') row[f.key] = `demo_${f.key}_${i + 1}`;
        else if (f.type === 'number' || f.type === 'currency' || f.type === 'percentage') row[f.key] = +(sr(seed) * 100).toFixed(2);
        else if (f.type === 'boolean') row[f.key] = sr(seed) > 0.5;
        else if (f.type === 'date') row[f.key] = '2025-06-15';
        else if (f.type === 'select') row[f.key] = (f.options || [''])[0];
        else if (f.type === 'iso_country') row[f.key] = 'US';
        else row[f.key] = `demo_${i}`;
      });
      return row;
    });
    setImportPreview(demoRows);
    const mapping = {};
    entity.fields.forEach(f => { mapping[f.key] = f.key; });
    setColumnMap(mapping);
  }, [entity]);

  const handleImportConfirm = useCallback(() => {
    if (!importPreview || !entity) return;
    let ok = 0;
    let fail = 0;
    for (const row of importPreview) {
      const result = addRecord(selectedEntity, row);
      if (result.success) ok++;
      else fail++;
    }
    showToast(`Imported ${ok} records (${fail} failed)`, fail > 0 ? 'warning' : 'success');
    setImportPreview(null);
  }, [importPreview, entity, selectedEntity, addRecord, showToast]);

  /* Export */
  const handleExport = useCallback(() => {
    const csv = exportRecords(selectedEntity);
    if (!csv) { showToast('No records to export', 'warning'); return; }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEntity}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${(capturedData[selectedEntity] || []).length} records`, 'success');
  }, [selectedEntity, capturedData, exportRecords, showToast]);

  /* Template download */
  const handleTemplateDownload = useCallback((entityId) => {
    const ent = entityMap[entityId];
    if (!ent) return;
    const header = ent.fields.map(f => f.key).join(',');
    const blob = new Blob([header + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityId}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Template downloaded: ${ent.name}`, 'success');
  }, [entityMap, showToast]);

  return (
    <div>
      {entitySelector}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Import */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Import Data</h3>
          <div style={{ border: `2px dashed ${T.border}`, borderRadius: 8, padding: 32, textAlign: 'center', marginBottom: 16, background: T.surface }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>CSV</div>
            <p style={{ fontSize: 13, color: T.sub }}>Drop CSV file here or click to browse</p>
            <p style={{ fontSize: 11, color: T.sub }}>Supported: .csv files with headers matching entity schema</p>
            <button onClick={handleDemoImport} style={{ ...btnStyle, marginTop: 12 }}>Load Demo Data</button>
          </div>

          {importPreview && (
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: '0 0 8px' }}>Preview ({importPreview.length} rows)</h4>
              <div style={{ overflowX: 'auto', maxHeight: 200 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{entity && entity.fields.slice(0, 5).map(f => <th key={f.key} style={thStyle}>{f.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {importPreview.slice(0, 3).map((row, i) => (
                      <tr key={i}>{entity && entity.fields.slice(0, 5).map(f => <td key={f.key} style={tdStyle}>{String(row[f.key]).slice(0, 20)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleImportConfirm} style={{ ...btnStyle, marginTop: 8 }}>Confirm Import</button>
            </div>
          )}
        </div>

        {/* Export */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Export Data</h3>
          <p style={{ fontSize: 13, color: T.sub, marginBottom: 12 }}>Export all records for the selected entity as CSV.</p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.text }}>Entity: <strong>{entity?.name}</strong></div>
            <div style={{ fontSize: 13, color: T.text }}>Records: <strong>{(capturedData[selectedEntity] || []).length}</strong></div>
          </div>
          <button onClick={handleExport} style={btnStyle}>Export as CSV</button>

          <h4 style={{ fontSize: 13, fontWeight: 600, color: T.navy, margin: '24px 0 8px' }}>Download Templates</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DATA_ENTITIES.map(e => (
              <button key={e.id} onClick={() => handleTemplateDownload(e.id)} style={{ ...btnSmStyle, fontSize: 11 }}>
                {e.icon} {e.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Import history */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Import History</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Filename', 'Entity', 'Rows', 'Status', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {importHistory.map(h => (
              <tr key={h.id}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{h.filename}</td>
                <td style={tdStyle}>{h.entity}</td>
                <td style={tdStyle}>{h.rows}</td>
                <td style={tdStyle}><span style={badgeStyle(h.status.includes('error') ? T.amber : T.green)}>{h.status}</span></td>
                <td style={tdStyle}>{h.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Data format docs */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Data Format Documentation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {DATA_ENTITIES.map(e => (
            <div key={e.id} style={{ padding: 12, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{e.icon} {e.name}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{e.fields.length} columns | Required: {e.fields.filter(f => f.required).length}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Key fields: {e.fields.filter(f => f.required).map(f => f.key).join(', ') || 'None'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   TAB 10: PLATFORM DOCUMENTATION
   ══════════════════════════════════════════════════════════════════════════════ */
function DocsTab({ entityMap, allModules, pipelines, domainGroups, getEntityConsumers }) {
  const [expandedEntity, setExpandedEntity] = useState(null);

  /* Glossary */
  const glossary = useMemo(() => [
    { term: 'DQS', definition: 'Data Quality Score per PCAF methodology, 1 (reported) to 5 (estimated)' },
    { term: 'WACI', definition: 'Weighted Average Carbon Intensity: portfolio carbon intensity weighted by holding value' },
    { term: 'ITR', definition: 'Implied Temperature Rise: projected warming based on emissions trajectory vs budget' },
    { term: 'EVIC', definition: 'Enterprise Value Including Cash: equity + debt + cash, PCAF denominator for attribution' },
    { term: 'PAI', definition: 'Principal Adverse Impact: 18 mandatory indicators under SFDR for sustainability impact' },
    { term: 'ESRS', definition: 'European Sustainability Reporting Standards: CSRD disclosure requirements (E1-E5, S1-S4, G1)' },
    { term: 'INFF', definition: 'Integrated National Financing Framework: UNDP methodology for blended finance' },
    { term: 'NDC', definition: 'Nationally Determined Contribution: Paris Agreement country-level climate pledges' },
    { term: 'SBTi', definition: 'Science Based Targets initiative: validates corporate emissions reduction targets against climate science' },
    { term: 'TCFD', definition: 'Task Force on Climate-related Financial Disclosures: governance/strategy/risk/metrics framework' },
    { term: 'CBAM', definition: 'Carbon Border Adjustment Mechanism: EU carbon tariff on imported goods in 6 sectors' },
    { term: 'CORSIA', definition: 'Carbon Offsetting and Reduction Scheme for International Aviation' },
    { term: 'CVaR', definition: 'Climate Value-at-Risk: potential portfolio loss from climate transition/physical risks' },
    { term: 'GHG Protocol', definition: 'Corporate standard for greenhouse gas accounting: Scope 1 (direct), 2 (purchased energy), 3 (value chain)' },
    { term: 'GICS', definition: 'Global Industry Classification Standard: 11 sectors, 25 industry groups, 74 industries, 163 sub-industries' },
    { term: 'ISIN', definition: 'International Securities Identification Number: 12-character alphanumeric code' },
    { term: 'LEI', definition: 'Legal Entity Identifier: 20-character alphanumeric for legal entity identification' },
    { term: 'EU Taxonomy', definition: 'EU classification system defining environmentally sustainable economic activities' },
    { term: 'SFDR', definition: 'Sustainable Finance Disclosure Regulation: EU framework for sustainability disclosures by financial market participants' },
    { term: 'CSRD', definition: 'Corporate Sustainability Reporting Directive: EU mandatory sustainability reporting for large companies' },
    { term: 'ISSB', definition: 'International Sustainability Standards Board: global baseline for sustainability-related financial disclosures (IFRS S1/S2)' },
    { term: 'PCAF', definition: 'Partnership for Carbon Accounting Financials: global standard for measuring financed emissions' },
    { term: 'tCO2e', definition: 'Tonnes of CO2 equivalent: standard GHG measurement unit accounting for all greenhouse gases' },
    { term: 'RCP', definition: 'Representative Concentration Pathway: IPCC scenarios (2.6, 4.5, 6.0, 8.5) for future radiative forcing' },
    { term: 'SSP', definition: 'Shared Socioeconomic Pathway: IPCC AR6 scenarios (SSP1-5) combining socioeconomic and climate pathways' },
    { term: 'NGFS', definition: 'Network for Greening the Financial System: central bank scenarios for climate stress testing' },
    { term: 'Cat Model', definition: 'Catastrophe Model: probabilistic loss estimation for natural catastrophe events' },
    { term: 'ACT', definition: 'Assessing low Carbon Transition: methodology for evaluating corporate climate strategies' },
    { term: 'IRIS+', definition: 'Impact Reporting and Investment Standards: GIIN system for measuring social/environmental impact' },
    { term: 'DMA', definition: 'Double Materiality Assessment: CSRD/ESRS process to identify material sustainability topics from impact and financial perspectives' },
    { term: 'EEIO', definition: 'Environmentally Extended Input-Output: economic model for estimating supply chain emissions from spend data' },
    { term: 'EPD', definition: 'Environmental Product Declaration: standardized life-cycle environmental impact statement for products' },
    { term: 'LCA', definition: 'Life Cycle Assessment: cradle-to-grave environmental impact analysis methodology' },
  ], []);

  return (
    <div>
      {/* Entity documentation */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 16px' }}>Entity Documentation ({DATA_ENTITIES.length} Entities)</h3>
        {DATA_ENTITIES.map(e => {
          const isOpen = expandedEntity === e.id;
          return (
            <div key={e.id} style={{ marginBottom: 4, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => setExpandedEntity(isOpen ? null : e.id)} style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isOpen ? T.surface : T.card }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.navy }}>{e.icon} {e.name} <span style={{ color: T.sub, fontWeight: 400 }}>- {e.description}</span></span>
                <span style={{ color: T.sub }}>{isOpen ? '-' : '+'} ({e.fields.length} fields)</span>
              </div>
              {isOpen && (
                <div style={{ padding: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Field', 'Type', 'Unit', 'Required', 'Help'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {e.fields.map(f => (
                        <tr key={f.key}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{f.key}</td>
                          <td style={tdStyle}><span style={badgeStyle(T.indigo)}>{f.type}</span></td>
                          <td style={tdStyle}>{f.unit || '-'}</td>
                          <td style={tdStyle}>{f.required ? 'Yes' : 'No'}</td>
                          <td style={{ ...tdStyle, fontSize: 12, color: T.sub }}>{f.help || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cross-reference: entity -> modules */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Entity-to-Module Cross Reference</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>Entity</th><th style={thStyle}>Required By</th><th style={thStyle}>Optional In</th></tr></thead>
            <tbody>
              {DATA_ENTITIES.map(e => {
                const consumers = getEntityConsumers(e.id);
                const req = consumers.filter(c => c.required);
                const opt = consumers.filter(c => !c.required);
                return (
                  <tr key={e.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{e.icon} {e.name}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{req.length > 0 ? req.map(c => c.name).join(', ') : '-'}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: T.sub }}>{opt.length > 0 ? opt.map(c => c.name).join(', ') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline documentation */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Pipeline Documentation ({pipelines.length} pipelines)</h3>
        <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ position: 'sticky', top: 0, background: T.card }}>
                {['#', 'Source', 'Entity', 'Target', 'Fields', 'Description'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pipelines.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontSize: 11, color: T.sub }}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{MODULE_DATA_MAP[p.from]?.name || p.from}</td>
                  <td style={tdStyle}><span style={badgeStyle(T.indigo)}>{p.entity}</span></td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{MODULE_DATA_MAP[p.to]?.name || p.to}</td>
                  <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'monospace' }}>{p.fields.slice(0, 3).join(', ')}{p.fields.length > 3 ? ` +${p.fields.length - 3}` : ''}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: T.sub }}>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data flow narrative */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Data Flow Narrative</h3>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: T.text }}>
          <p style={{ marginBottom: 12 }}>
            <strong>1. Data Capture:</strong> Users enter data through the Data Entry Forms tab, selecting one of 15 normalized entity types. Each entity has a rigorous schema with field-level type validation, required-field enforcement, and custom business rules (ISIN regex, PCAF DQS range, etc.). Records are persisted to localStorage via the DataCaptureContext.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>2. Normalization:</strong> All captured data conforms to the platform's canonical entity schemas. Company identifiers (company_id) serve as the primary join key across emissions, holdings, targets, and regulatory filings. This normalized structure enables cross-module data sharing without entity-specific adapters.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>3. Module Consumption:</strong> Each of the {allModules.length} platform modules declares its data requirements via MODULE_DATA_MAP: required entities (must have records to function), optional entities (enhance output when available), and specific fields needed per entity. Modules check coverage at runtime to determine readiness.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>4. Pipeline Flows:</strong> {pipelines.length} defined data pipelines connect modules in a directed acyclic graph. For example, the Scope 3 Engine produces category-level emissions that feed the Integrated Carbon Emissions module, which in turn feeds PCAF Financed Emissions, Portfolio Temperature Score, and SFDR PAI calculations. Each pipeline specifies the entity type and exact fields that flow between modules.
          </p>
          <p>
            <strong>5. Reporting & Disclosure:</strong> Terminal modules in the pipeline graph produce regulatory-ready outputs: CSRD iXBRL filings, SFDR PAI templates, ISSB/TCFD disclosures, and PCAF financed emissions reports. Data quality scores (DQS) propagate through the pipeline to ensure disclosure-grade data provenance.
          </p>
        </div>
      </div>

      {/* Methodology notes */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Methodology Notes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { title: 'PCAF Data Quality Scoring', desc: 'DQS 1: Verified reported data. DQS 2: Reported unverified. DQS 3: Physical activity-based estimates. DQS 4: Economic activity-based estimates (EEIO). DQS 5: Estimated with proxies. Asset-class-specific scoring for listed equity, corporate bonds, commercial real estate, mortgages, project finance, and sovereign debt.' },
            { title: 'GHG Protocol Scopes', desc: 'Scope 1: Direct emissions from owned/controlled sources. Scope 2: Indirect from purchased electricity (market-based and location-based). Scope 3: All other indirect emissions across 15 upstream/downstream categories. Consolidation approaches: operational control, financial control, equity share.' },
            { title: 'CBAM Product Codes', desc: 'EU Combined Nomenclature (CN) codes for 6 CBAM sectors: Iron & Steel (72xx), Aluminum (76xx), Cement (2523), Fertilizers (3102-3105), Electricity (2716), Hydrogen (2804). Embedded emissions include direct (Scope 1) and indirect (Scope 2) per tonne of product.' },
            { title: 'SFDR PAI Indicators', desc: '14 mandatory + 4 optional Principal Adverse Impact indicators. PAI 1-6: climate/emissions. PAI 7: biodiversity. PAI 8: water. PAI 9: hazardous waste. PAI 10-11: social (UNGC, human rights). PAI 12: gender pay gap. PAI 13: board gender diversity. PAI 14: controversial weapons. PAI 15-18: real estate energy/fossil fuel indicators.' },
          ].map((m, i) => (
            <div key={i} style={{ padding: 16, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: T.navy, margin: '0 0 8px' }}>{m.title}</h4>
              <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Glossary ({glossary.length} terms)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {glossary.map((g, i) => (
            <div key={i} style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.indigo, minWidth: 80 }}>{g.term}</span>
              <span style={{ fontSize: 12, color: T.text }}>{g.definition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Version info */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: T.navy, margin: '0 0 12px' }}>Platform Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Platform Version', value: '2.0' },
            { label: 'Entity Schemas', value: DATA_ENTITIES.length },
            { label: 'Mapped Modules', value: allModules.length },
            { label: 'Data Pipelines', value: pipelines.length },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: 16, background: T.surface, borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: T.navy }}>{item.value}</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
