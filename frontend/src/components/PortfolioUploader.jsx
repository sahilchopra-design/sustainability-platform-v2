import React, { useState, useCallback, useMemo, useRef } from 'react';

const T = { surface:'#fafaf7', border:'#e2e0d8', navy:'#1b2a4a', gold:'#b8962e', text:'#1a1a2e', sub:'#64748b', card:'#ffffff', indigo:'#4f46e5', green:'#065f46', red:'#991b1b', amber:'#92400e' };

const AUTO_MAP = {
  name: ['company name', 'name', 'issuer', 'entity', 'holding'],
  ticker: ['ticker', 'symbol', 'nse code', 'bse code', 'stock'],
  isin: ['isin', 'isin code'],
  sector: ['sector', 'industry', 'gics sector', 'gics'],
  country: ['country', 'domicile', 'geography', 'region'],
  marketValue: ['market value', 'mv', 'value', 'nav', 'aum', 'amount'],
  weight: ['weight', 'weight %', 'allocation', 'pct'],
  scope1: ['scope 1', 'scope1', 's1', 'direct emissions'],
  scope2: ['scope 2', 'scope2', 's2', 'indirect emissions'],
  scope3: ['scope 3', 'scope3', 's3', 'value chain'],
  revenue: ['revenue', 'turnover', 'sales'],
  marketCap: ['market cap', 'mcap', 'mkt cap'],
  esgScore: ['esg score', 'esg', 'sustainability score'],
  temperature: ['temperature', 'itr', 'temp alignment', 'implied temp'],
  assetClass: ['asset class', 'type', 'instrument'],
};

const NUMERIC_FIELDS = new Set(['marketValue', 'weight', 'scope1', 'scope2', 'scope3', 'revenue', 'marketCap', 'esgScore', 'temperature']);

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(delim).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

function autoDetectMapping(csvHeaders, allFields) {
  const mapping = {};
  allFields.forEach(field => {
    const aliases = AUTO_MAP[field] || [field.toLowerCase()];
    const match = csvHeaders.find(h => aliases.includes(h.toLowerCase().trim()));
    if (match) mapping[field] = match;
  });
  return mapping;
}

export default function PortfolioUploader({
  onUpload,
  requiredFields = ['name', 'sector', 'marketValue'],
  optionalFields = [],
  entityType = 'mixed',
  maxRows = 5000,
  storageKey = 'a2_uploaded_portfolio',
}) {
  const fileInputRef = useRef(null);
  const [rawData, setRawData] = useState(null);        // { headers, rows }
  const [mapping, setMapping] = useState({});           // field -> csvColumn
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  const allFields = useMemo(() => [...requiredFields, ...optionalFields], [requiredFields, optionalFields]);

  // Check localStorage for previously uploaded data
  const stored = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch { return null; }
  }, [storageKey, applied]);

  const handleFile = useCallback((file) => {
    setError('');
    setApplied(false);
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'tsv', 'txt', 'xlsx', 'xls'].includes(ext)) {
      setError('Unsupported file type. Please upload .csv or .xlsx');
      return;
    }
    if (ext === 'xlsx' || ext === 'xls') {
      setError('Excel (.xlsx) files require the SheetJS library. Please export as CSV from Excel and re-upload.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) { setError('Could not parse any columns from file.'); return; }
      if (rows.length === 0) { setError('File has headers but no data rows.'); return; }
      const trimmed = rows.slice(0, maxRows);
      setRawData({ headers, rows: trimmed, fileName: file.name, totalRows: rows.length });
      setMapping(autoDetectMapping(headers, allFields));
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
  }, [allFields, maxRows]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e) => {
    handleFile(e.target.files?.[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const updateMapping = useCallback((field, csvCol) => {
    setMapping(prev => ({ ...prev, [field]: csvCol || undefined }));
  }, []);

  // Validation
  const validation = useMemo(() => {
    if (!rawData) return null;
    const unmapped = requiredFields.filter(f => !mapping[f]);
    let missingCount = 0;
    let numericErrors = 0;
    const mapped = rawData.rows.map(row => {
      const obj = {};
      let rowMissing = false;
      allFields.forEach(field => {
        const col = mapping[field];
        if (!col) return;
        let val = row[col] ?? '';
        if (NUMERIC_FIELDS.has(field) && val !== '') {
          const n = parseFloat(String(val).replace(/[,$%]/g, ''));
          if (isNaN(n)) { numericErrors++; val = ''; }
          else val = n;
        }
        obj[field] = val;
      });
      requiredFields.forEach(f => {
        if (obj[f] === undefined || obj[f] === '') rowMissing = true;
      });
      if (rowMissing) missingCount++;
      return obj;
    });
    const validRows = mapped.filter(r => requiredFields.every(f => r[f] !== undefined && r[f] !== ''));
    return { unmapped, missingCount, numericErrors, validRows, allMapped: mapped };
  }, [rawData, mapping, requiredFields, allFields]);

  const previewRows = useMemo(() => {
    if (!validation) return [];
    return validation.allMapped.slice(0, 10);
  }, [validation]);

  const handleApply = useCallback(() => {
    if (!validation || validation.unmapped.length > 0) return;
    const holdings = validation.validRows;
    try { localStorage.setItem(storageKey, JSON.stringify(holdings)); } catch { /* quota */ }
    setApplied(true);
    if (onUpload) onUpload(holdings);
  }, [validation, storageKey, onUpload]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setRawData(null);
    setMapping({});
    setApplied(false);
    setError('');
    if (onUpload) onUpload([]);
  }, [storageKey, onUpload]);

  const displayFields = useMemo(() => {
    return allFields.map(f => ({
      key: f,
      label: f.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()),
      required: requiredFields.includes(f),
    }));
  }, [allFields, requiredFields]);

  // --- Render ---
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 17 }}>Upload Portfolio (CSV)</span>
      </div>

      {/* Previously uploaded summary */}
      {stored && !rawData && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: T.green, fontSize: 13, fontWeight: 500 }}>
            Previously uploaded: {stored.length} holding{stored.length !== 1 ? 's' : ''} in storage
          </span>
          <button onClick={handleClear} style={{ background: 'none', border: `1px solid ${T.red}`, color: T.red, borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            Clear
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? T.gold : T.navy}`,
          borderRadius: 8,
          padding: '28px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? '#faf6eb' : T.surface,
          transition: 'border-color 0.2s, background 0.2s',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 4 }}>{rawData ? 'Replace file' : 'Drag & drop file here'}</div>
        <div style={{ fontSize: 13, color: T.sub }}>or click to browse  |  Supports: .csv, .tsv</div>
        {rawData && (
          <div style={{ marginTop: 6, fontSize: 13, color: T.navy, fontWeight: 500 }}>
            {rawData.fileName} ({rawData.totalRows > maxRows ? `${maxRows} of ${rawData.totalRows} rows loaded` : `${rawData.rows.length} rows`})
          </div>
        )}
        <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" onChange={onFileChange} style={{ display: 'none' }} />
      </div>

      {error && (
        <div style={{ color: T.red, fontSize: 13, marginBottom: 10, fontWeight: 500 }}>{error}</div>
      )}

      {/* Column Mapping */}
      {rawData && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 8, borderBottom: `1px solid ${T.border}`, paddingBottom: 4 }}>
            Column Mapping
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8, marginBottom: 14 }}>
            {displayFields.map(({ key, label, required }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ minWidth: 110, color: T.text, fontWeight: required ? 600 : 400 }}>
                  {label}{required ? ' *' : ''}
                </span>
                <select
                  value={mapping[key] || ''}
                  onChange={(e) => updateMapping(key, e.target.value)}
                  style={{
                    flex: 1, padding: '4px 6px', fontSize: 12, borderRadius: 4,
                    border: `1px solid ${required && !mapping[key] ? T.red : T.border}`,
                    background: T.card, color: T.text,
                  }}
                >
                  <option value="">-- skip --</option>
                  {rawData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Validation summary */}
          {validation && (
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              {validation.unmapped.length > 0 && (
                <div style={{ color: T.red, marginBottom: 4, fontWeight: 500 }}>
                  Unmapped required fields: {validation.unmapped.join(', ')}
                </div>
              )}
              <div style={{ color: T.green, fontWeight: 500 }}>
                {validation.validRows.length} valid holding{validation.validRows.length !== 1 ? 's' : ''} parsed
              </div>
              {validation.missingCount > 0 && (
                <div style={{ color: T.amber, fontWeight: 500 }}>
                  {validation.missingCount} row{validation.missingCount !== 1 ? 's' : ''} missing required fields (will be skipped)
                </div>
              )}
              {validation.numericErrors > 0 && (
                <div style={{ color: T.amber }}>
                  {validation.numericErrors} non-numeric value{validation.numericErrors !== 1 ? 's' : ''} in numeric fields (treated as blank)
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6, borderBottom: `1px solid ${T.border}`, paddingBottom: 4 }}>
                Preview (first {Math.min(previewRows.length, 10)} rows)
              </div>
              <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {allFields.filter(f => mapping[f]).map(f => (
                        <th key={f} style={{ textAlign: 'left', padding: '5px 8px', borderBottom: `2px solid ${T.navy}`, color: T.navy, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {f.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? T.card : T.surface }}>
                        {allFields.filter(f => mapping[f]).map(f => (
                          <td key={f} style={{ padding: '4px 8px', borderBottom: `1px solid ${T.border}`, color: T.text, whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row[f] !== undefined && row[f] !== '' ? String(row[f]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleApply}
              disabled={!validation || validation.unmapped.length > 0 || validation.validRows.length === 0}
              style={{
                padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 5, cursor: 'pointer',
                border: 'none', color: '#fff',
                background: (!validation || validation.unmapped.length > 0 || validation.validRows.length === 0) ? T.sub : T.navy,
                opacity: (!validation || validation.unmapped.length > 0 || validation.validRows.length === 0) ? 0.5 : 1,
              }}
            >
              Apply Portfolio
            </button>
            <button
              onClick={handleClear}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 5, cursor: 'pointer', border: `1px solid ${T.border}`, background: T.card, color: T.text }}
            >
              Clear
            </button>
            {applied && (
              <span style={{ color: T.green, fontSize: 13, fontWeight: 600 }}>
                Applied {validation.validRows.length} holdings
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
