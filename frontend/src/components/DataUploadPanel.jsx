import React, { useState, useRef } from 'react';

const T = {
  navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', bg: '#f6f4f0',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// Minimal CSV parser — handles \r\n and basic quoted fields
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}

export default function DataUploadPanel({
  isOpen,
  onToggle,
  title = 'Data Input',
  manualFields = [],
  csvTemplate = '',
  onDataParsed,
  contextBanner = null,   // optional JSX shown at top when context data available
}) {
  const [tab, setTab]             = useState('upload');
  const [dragOver, setDragOver]   = useState(false);
  const [status, setStatus]       = useState(null);  // { type: 'success'|'error', msg }
  const [formVals, setFormVals]   = useState(() =>
    Object.fromEntries(manualFields.map(f => [f.key, f.defaultValue ?? '']))
  );
  const fileRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCSV(e.target.result);
        if (!rows.length) { setStatus({ type: 'error', msg: 'No data rows found in CSV.' }); return; }
        setStatus({ type: 'success', msg: `Parsed ${rows.length} row${rows.length > 1 ? 's' : ''} from ${file.name}` });
        onDataParsed(rows, file.name);
      } catch (err) {
        setStatus({ type: 'error', msg: `Parse error: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleManualSubmit = () => {
    const converted = Object.fromEntries(
      manualFields.map(f => [f.key, f.type === 'number' ? Number(formVals[f.key]) : formVals[f.key]])
    );
    onDataParsed([converted], 'manual');
    setStatus({ type: 'success', msg: 'Manual entry applied.' });
  };

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
      marginBottom: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(27,58,92,0.05)' }}>
      {/* Header */}
      <div onClick={onToggle} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 18px', cursor: 'pointer',
        background: isOpen ? T.navy : '#f0ede7',
        borderBottom: isOpen ? `1px solid #244a6e` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: isOpen ? T.gold : T.navy }}>
            {isOpen ? '▾' : '▸'} {title}
          </span>
          {status && (
            <span style={{ fontSize: 11, color: status.type === 'success' ? T.green : T.red,
              background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
              padding: '2px 8px', borderRadius: 4, border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {status.type === 'success' ? '✓' : '✗'} {status.msg}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: isOpen ? 'rgba(255,255,255,0.4)' : T.sub }}>
          CSV upload · Manual entry · Session sync
        </span>
      </div>

      {isOpen && (
        <div style={{ padding: '16px 18px' }}>
          {/* Context banner */}
          {contextBanner && (
            <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8,
              background: '#fffbeb', border: `1px solid #fde68a`, fontSize: 12, color: '#92400e' }}>
              {contextBanner}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {['upload', 'manual'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: tab === t ? T.navy : T.card,
                color: tab === t ? '#fff' : T.sub,
                border: `1px solid ${tab === t ? T.navy : T.border}`,
              }}>{t === 'upload' ? '📂 Upload CSV' : '✏️ Manual Entry'}</button>
            ))}
          </div>

          {/* Upload Tab */}
          {tab === 'upload' && (
            <div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? T.navy : T.border}`,
                  borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? '#f0f4ff' : T.bg,
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📥</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>
                  Drag & drop CSV here, or click to browse
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
                  Max 5MB · UTF-8 encoding · First row must be headers
                </div>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                  onChange={e => processFile(e.target.files[0])} />
              </div>
              {csvTemplate && (
                <div style={{ marginTop: 10, fontSize: 11, color: T.sub }}>
                  Expected columns: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 3,
                    fontSize: 10, color: T.navy }}>{csvTemplate}</code>
                  <button onClick={() => {
                    const blob = new Blob([csvTemplate + '\n'], { type: 'text/csv' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = 'template.csv'; a.click();
                  }} style={{ marginLeft: 8, fontSize: 10, color: T.navy, background: 'none',
                    border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
                    ↓ Download template
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Tab */}
          {tab === 'manual' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                {manualFields.map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 4 }}>
                      {f.label}
                    </label>
                    {f.type === 'select' ? (
                      <select value={formVals[f.key]} onChange={e => setFormVals(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
                          fontSize: 12, color: T.navy, background: T.card, fontFamily: T.font }}>
                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'range' ? (
                      <div>
                        <input type="range" min={f.min} max={f.max} step={f.step}
                          value={formVals[f.key]}
                          onChange={e => setFormVals(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ width: '100%' }} />
                        <div style={{ fontSize: 11, color: T.navy, fontWeight: 700, textAlign: 'center' }}>
                          {formVals[f.key]}{f.unit || ''}
                        </div>
                      </div>
                    ) : (
                      <input type={f.type || 'text'}
                        value={formVals[f.key]}
                        onChange={e => setFormVals(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder || f.label}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
                          fontSize: 12, color: T.navy, background: T.card, fontFamily: T.font, boxSizing: 'border-box' }} />
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handleManualSubmit} style={{
                padding: '8px 20px', background: T.navy, color: '#fff', border: 'none',
                borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Apply Entry →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
