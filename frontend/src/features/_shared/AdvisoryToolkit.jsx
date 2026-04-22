import React, { useEffect, useState, useCallback } from 'react';

export const T = {
  bg: '#0f1117', surface: '#161a24', surfaceH: '#1b2030', border: '#262c3c', borderL: '#1f2433',
  navy: '#0b2030', gold: '#d4a843', goldL: '#e6bd65', sage: '#7a8f6a', teal: '#0d4f5c',
  text: '#e8e0d0', textSec: '#a9b0bd', textMut: '#6b7280', red: '#c2564a', green: '#5c8a5e',
  amber: '#d89b43',
  font: "'DM Sans', system-ui, sans-serif", mono: "'JetBrains Mono', monospace"
};

// =========================================================================
// SCENARIO STATE + LOCALSTORAGE
// =========================================================================
const LS_PREFIX = 'advisory_scenarios_';

export function useScenario(moduleKey, defaults) {
  const [scenarioName, setScenarioName] = useState('Baseline');
  const [state, setState] = useState(defaults);
  const [savedList, setSavedList] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(LS_PREFIX + moduleKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSavedList(Object.keys(parsed || {}));
      } catch (e) { /* noop */ }
    }
  }, [moduleKey]);

  const update = useCallback((patch) => {
    setState(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  const saveScenario = useCallback((name) => {
    const key = LS_PREFIX + moduleKey;
    const raw = localStorage.getItem(key);
    const bag = raw ? JSON.parse(raw) : {};
    bag[name] = { state, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(bag));
    setSavedList(Object.keys(bag));
    setScenarioName(name);
  }, [moduleKey, state]);

  const loadScenario = useCallback((name) => {
    const raw = localStorage.getItem(LS_PREFIX + moduleKey);
    if (!raw) return;
    const bag = JSON.parse(raw);
    if (bag[name]) {
      setState(bag[name].state);
      setScenarioName(name);
    }
  }, [moduleKey]);

  const deleteScenario = useCallback((name) => {
    const key = LS_PREFIX + moduleKey;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const bag = JSON.parse(raw);
    delete bag[name];
    localStorage.setItem(key, JSON.stringify(bag));
    setSavedList(Object.keys(bag));
  }, [moduleKey]);

  const reset = useCallback(() => {
    setState(defaults);
    setScenarioName('Baseline');
  }, [defaults]);

  return { state, update, setState, scenarioName, setScenarioName, savedList, saveScenario, loadScenario, deleteScenario, reset };
}

// =========================================================================
// EXPORT HELPERS
// =========================================================================
export function downloadText(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function toCsv(rows, cols) {
  if (!rows || !rows.length) return '';
  const keys = cols || Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const parseLine = (line) => {
    const out = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur); return out;
  };
  const header = parseLine(lines[0]);
  return lines.slice(1).map(l => {
    const cells = parseLine(l);
    const obj = {};
    header.forEach((h, i) => {
      const v = cells[i];
      obj[h] = v && !isNaN(Number(v)) && v.trim() !== '' ? Number(v) : v;
    });
    return obj;
  });
}

export function openDeliverable(html, title = 'Advisory Deliverable') {
  const w = window.open('', '_blank');
  if (!w) { alert('Popup blocked — please allow popups to open the deliverable.'); return; }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: 'Georgia', serif; max-width: 820px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.55; }
      h1 { border-bottom: 3px double #b8860b; padding-bottom: 10px; font-size: 26px; margin-bottom: 4px; }
      h2 { color: #0b2030; font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 28px; }
      h3 { font-size: 14px; color: #444; margin-top: 18px; }
      .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
      th, td { border: 1px solid #bbb; padding: 6px 10px; text-align: left; }
      th { background: #f0ede4; font-weight: 600; }
      .kpi { display: inline-block; border: 1px solid #b8860b; padding: 8px 14px; margin: 4px 6px 4px 0; border-radius: 2px; background: #fafaf5; }
      .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
      .kpi-value { font-size: 20px; font-weight: 600; color: #0b2030; }
      .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #ccc; padding-top: 10px; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; }
      .badge-green { background: #d4edda; color: #155724; }
      .badge-amber { background: #fff3cd; color: #856404; }
      .badge-red { background: #f8d7da; color: #721c24; }
      @media print { body { margin: 0; max-width: 100%; } }
      .print-btn { position: fixed; top: 20px; right: 20px; background: #b8860b; color: white; border: 0; padding: 10px 18px; font-size: 13px; cursor: pointer; border-radius: 3px; }
      @media print { .print-btn { display: none; } }
    </style></head><body>
    <button class="print-btn" onclick="window.print()">🖨 Print / Save PDF</button>
    ${html}
    <div class="footer">Generated ${new Date().toLocaleString()} · Client-anonymised advisory deliverable · Not for external distribution without review</div>
    </body></html>`);
  w.document.close();
}

// =========================================================================
// UI COMPONENTS
// =========================================================================
export function ToolkitBar({ moduleCode, scenario, onSave, onLoad, onDelete, onReset, onExportCsv, onExportJson, onDeliverable, onImportCsv, importLabel = 'Import CSV' }) {
  const [newName, setNewName] = useState('');
  const fileRef = React.useRef(null);
  return (
    <div style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 4, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1 }}>{moduleCode} TOOLKIT</span>
      <span style={{ color: T.textMut, fontSize: 11 }}>│</span>
      <span style={{ fontSize: 12, color: T.textSec }}>Scenario:</span>
      <select value={scenario.scenarioName} onChange={e => { if (e.target.value) scenario.loadScenario(e.target.value); }} style={selStyle}>
        <option value="Baseline">Baseline</option>
        {scenario.savedList.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="new scenario name" style={{ ...selStyle, width: 140 }} />
      <button style={btnStyle} onClick={() => { if (newName.trim()) { scenario.saveScenario(newName.trim()); setNewName(''); if (onSave) onSave(newName.trim()); } }}>Save</button>
      <button style={btnStyle} onClick={() => { if (scenario.scenarioName !== 'Baseline') scenario.deleteScenario(scenario.scenarioName); if (onDelete) onDelete(); }}>Delete</button>
      <button style={btnStyle} onClick={() => { scenario.reset(); if (onReset) onReset(); }}>Reset</button>
      <span style={{ color: T.textMut, fontSize: 11 }}>│</span>
      {onImportCsv && (
        <>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const text = await f.text();
            onImportCsv(parseCsv(text));
            e.target.value = '';
          }} />
          <button style={btnStyleAccent} onClick={() => fileRef.current?.click()}>{importLabel}</button>
        </>
      )}
      {onExportCsv && <button style={btnStyleAccent} onClick={onExportCsv}>Export CSV</button>}
      {onExportJson && <button style={btnStyleAccent} onClick={onExportJson}>Export JSON</button>}
      {onDeliverable && <button style={{ ...btnStyleAccent, background: T.gold, color: T.navy, borderColor: T.gold, fontWeight: 600 }} onClick={onDeliverable}>📄 Generate Deliverable</button>}
    </div>
  );
}

const selStyle = { background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '5px 8px', fontFamily: T.font, fontSize: 12, borderRadius: 3 };
const btnStyle = { background: T.surface, color: T.textSec, border: `1px solid ${T.border}`, padding: '5px 12px', fontFamily: T.font, fontSize: 12, cursor: 'pointer', borderRadius: 3 };
const btnStyleAccent = { ...btnStyle, color: T.gold, borderColor: T.gold };

export function NumInput({ value, onChange, step = 1, min, max, suffix, style }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <input type="number" value={value} step={step} min={min} max={max} onChange={e => onChange(Number(e.target.value))}
        style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontFamily: T.mono, fontSize: 12, width: 80, borderRadius: 2, ...style }} />
      {suffix && <span style={{ fontSize: 11, color: T.textMut }}>{suffix}</span>}
    </span>
  );
}

export function TextInput({ value, onChange, style }) {
  return (
    <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
      style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, padding: '4px 6px', fontFamily: T.font, fontSize: 12, width: 140, borderRadius: 2, ...style }} />
  );
}

export function SelectInput({ value, onChange, options, style }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...selStyle, ...style }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function Kpi({ label, value, sub, color }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '14px 16px', borderRadius: 4 }}>
      <div style={{ fontSize: 11, color: T.textMut, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: T.mono, color: color || T.gold, margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>
    </div>
  );
}

export function Panel({ title, children, right }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: T.gold, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Table({ cols, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.surfaceH }}>
            {cols.map((c, i) => <th key={i} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: T.textMut, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 500 }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const td = { padding: '8px 12px', fontSize: 13, verticalAlign: 'middle', borderTop: `1px solid ${T.borderL}` };

export function TabBar({ tabs, tab, setTab }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
      {tabs.map((t, i) => (
        <button key={t} onClick={() => setTab(i)} style={{
          background: tab === i ? T.surfaceH : 'transparent', color: tab === i ? T.gold : T.textSec,
          border: 'none', borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent',
          padding: '10px 16px', fontFamily: T.font, fontSize: 13, cursor: 'pointer', fontWeight: tab === i ? 600 : 400
        }}>{t}</button>
      ))}
    </div>
  );
}

export function PageHeader({ code, title, subtitle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 1.8 }}>{code}</span>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: -0.4, color: T.text }}>{title}</h1>
      </div>
      {subtitle && <div style={{ color: T.textSec, fontSize: 13, marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

export function Badge({ level, children }) {
  const colors = { good: T.green, warn: T.amber, bad: T.red, info: T.teal };
  return <span style={{ background: colors[level] || T.border, color: T.text, fontSize: 11, padding: '2px 8px', borderRadius: 3, fontWeight: 600, fontFamily: T.mono }}>{children}</span>;
}

// =========================================================================
// TOOL-LAYOUT PRIMITIVES (worksheet / wizard feel)
// =========================================================================

export function ToolShell({ header, steps, rail }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.font }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '24px 24px 80px' }}>
        {header}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 28, alignItems: 'start' }}>
          <div style={{ minWidth: 0 }}>{steps}</div>
          <div style={{ position: 'sticky', top: 24 }}>{rail}</div>
        </div>
      </div>
    </div>
  );
}

export function Step({ n, title, hint, children, done }) {
  return (
    <section style={{ marginBottom: 22, paddingBottom: 22, borderBottom: `1px dashed ${T.borderL}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: done ? T.green : T.gold, border: `1px solid ${done ? T.green : T.gold}`, padding: '2px 8px', borderRadius: 2, letterSpacing: 1 }}>
          {done ? '✓' : ('STEP ' + n)}
        </span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.text }}>{title}</h2>
      </div>
      {hint && <div style={{ color: T.textMut, fontSize: 12, marginBottom: 10, marginLeft: 2 }}>{hint}</div>}
      <div style={{ marginLeft: 2 }}>{children}</div>
    </section>
  );
}

export function OutputRail({ label = 'LIVE OUTPUT', stats = [], preview, cta, menu }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 4, padding: 18 }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.gold, letterSpacing: 1.8, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>● {label}</span>
        {menu}
      </div>
      {stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {stats.map((s, i) => <Stat key={i} {...s} />)}
        </div>
      )}
      {preview && (
        <div style={{ borderTop: `1px solid ${T.borderL}`, paddingTop: 12, marginBottom: 14, fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>
          {preview}
        </div>
      )}
      {cta}
    </div>
  );
}

export function Stat({ label, value, sub, color }) {
  return (
    <div style={{ background: T.surfaceH, padding: '10px 12px', borderRadius: 3, border: `1px solid ${T.borderL}` }}>
      <div style={{ fontSize: 10, color: T.textMut, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 17, fontFamily: T.mono, color: color || T.text, margin: '3px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.textSec }}>{sub}</div>}
    </div>
  );
}

export function PrimaryCTA({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: T.gold, color: T.navy, border: 'none', padding: '14px 16px',
      fontFamily: T.font, fontSize: 14, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer',
      borderRadius: 3, boxShadow: '0 2px 8px rgba(212,168,67,0.2)'
    }}>{children}</button>
  );
}

export function ToolMenu({ scenario, onExportCsv, onExportJson, onImportCsv, importLabel = 'Import CSV' }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const fileRef = React.useRef(null);
  return (
    <span style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', color: T.textSec, border: `1px solid ${T.border}`, padding: '3px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: T.mono }}>⋯ actions</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 3, padding: 10, width: 240, zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: 10, color: T.textMut, letterSpacing: 1, marginBottom: 6 }}>SCENARIO</div>
          <select value={scenario.scenarioName} onChange={e => { if (e.target.value) scenario.loadScenario(e.target.value); }} style={{ ...selStyle, width: '100%', marginBottom: 6 }}>
            <option value="Baseline">Baseline</option>
            {scenario.savedList.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="name" style={{ ...selStyle, flex: 1 }} />
            <button style={btnStyle} onClick={() => { if (newName.trim()) { scenario.saveScenario(newName.trim()); setNewName(''); } }}>Save</button>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            <button style={{ ...btnStyle, flex: 1 }} onClick={() => scenario.scenarioName !== 'Baseline' && scenario.deleteScenario(scenario.scenarioName)}>Delete</button>
            <button style={{ ...btnStyle, flex: 1 }} onClick={scenario.reset}>Reset</button>
          </div>
          <div style={{ fontSize: 10, color: T.textMut, letterSpacing: 1, marginBottom: 6 }}>DATA</div>
          {onImportCsv && (
            <>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                onImportCsv(parseCsv(await f.text())); e.target.value = '';
              }} />
              <button style={{ ...btnStyle, width: '100%', marginBottom: 4 }} onClick={() => fileRef.current?.click()}>{importLabel}</button>
            </>
          )}
          {onExportCsv && <button style={{ ...btnStyle, width: '100%', marginBottom: 4 }} onClick={onExportCsv}>Export CSV</button>}
          {onExportJson && <button style={{ ...btnStyle, width: '100%' }} onClick={onExportJson}>Export JSON</button>}
        </div>
      )}
    </span>
  );
}

export function FieldRow({ label, hint, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
      <div>
        <div style={{ fontSize: 12, color: T.text }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Worksheet({ cols, rows, onCell, onAdd, onDel, renderRow }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `36px ${cols.map(c => c.width || '1fr').join(' ')} 34px`, background: T.surfaceH, borderBottom: `1px solid ${T.border}` }}>
        <div style={hdrCell}>#</div>
        {cols.map((c, i) => <div key={i} style={hdrCell}>{c.h}</div>)}
        <div style={hdrCell}></div>
      </div>
      {rows.map((r, i) => (
        <div key={r._id ?? i} style={{ display: 'grid', gridTemplateColumns: `36px ${cols.map(c => c.width || '1fr').join(' ')} 34px`, borderBottom: `1px solid ${T.borderL}`, background: i % 2 ? T.surface : T.surfaceH }}>
          <div style={{ ...cell, color: T.textMut, fontFamily: T.mono, fontSize: 11 }}>{i + 1}</div>
          {renderRow ? renderRow(r, i) : cols.map((c, j) => (
            <div key={j} style={cell}>
              {c.edit ? c.edit(r, i) : <span style={{ fontSize: 12, color: T.text, fontFamily: c.mono ? T.mono : T.font }}>{r[c.k]}</span>}
            </div>
          ))}
          <div style={{ ...cell, textAlign: 'center' }}>
            {onDel && <button onClick={() => onDel(i)} style={xStyle}>×</button>}
          </div>
        </div>
      ))}
      {onAdd && (
        <button onClick={onAdd} style={{ width: '100%', background: T.surface, color: T.gold, border: 'none', borderTop: `1px dashed ${T.border}`, padding: '8px', fontSize: 12, cursor: 'pointer', fontFamily: T.mono }}>+ add row</button>
      )}
    </div>
  );
}

const hdrCell = { padding: '8px 10px', fontSize: 10, color: T.textMut, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 500, borderRight: `1px solid ${T.borderL}` };
const cell = { padding: '6px 10px', fontSize: 12, borderRight: `1px solid ${T.borderL}`, display: 'flex', alignItems: 'center' };
const xStyle = { background: 'transparent', color: T.red, border: 'none', cursor: 'pointer', fontSize: 14, padding: 0 };

export function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${T.borderL}`, borderRadius: 3, marginTop: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', textAlign: 'left', background: T.surfaceH, color: T.textSec, border: 'none', padding: '8px 12px', fontSize: 12, fontFamily: T.font, cursor: 'pointer', borderRadius: '3px 3px 0 0' }}>
        {open ? '▾' : '▸'} {title}
      </button>
      {open && <div style={{ padding: 12 }}>{children}</div>}
    </div>
  );
}

export function Note({ children, level = 'info' }) {
  const c = { info: T.teal, warn: T.amber, ok: T.green, bad: T.red }[level];
  return <div style={{ borderLeft: `3px solid ${c}`, background: T.surfaceH, padding: '8px 12px', fontSize: 12, color: T.textSec, margin: '8px 0' }}>{children}</div>;
}

// HTML deliverable building blocks (return strings)
export const html = {
  kpi: (label, value) => `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div></div>`,
  table: (headers, rows) => `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
  h1: (t) => `<h1>${t}</h1>`,
  h2: (t) => `<h2>${t}</h2>`,
  h3: (t) => `<h3>${t}</h3>`,
  p: (t) => `<p>${t}</p>`,
  meta: (kv) => `<div class="meta">${Object.entries(kv).map(([k,v]) => `<b>${k}:</b> ${v}`).join(' · ')}</div>`,
  badge: (cls, t) => `<span class="badge badge-${cls}">${t}</span>`,
};
