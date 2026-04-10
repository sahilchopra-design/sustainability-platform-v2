import React, { useState, useCallback, useRef } from 'react';

const T = {
  navy: '#1b2a4a', gold: '#b8962e', cream: '#faf9f6', border: '#e2e0d8',
  sub: '#64748b', muted: '#94a3b8', white: '#ffffff',
};

const styles = {
  wrapper: { position: 'relative', display: 'inline-block' },
  btn: {
    background: T.navy, color: T.gold, border: `1px solid ${T.gold}`,
    borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: 6, letterSpacing: 0.3,
  },
  dropdown: {
    position: 'absolute', top: '100%', right: 0, marginTop: 4,
    background: T.white, border: `1px solid ${T.border}`, borderRadius: 6,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 999, minWidth: 180,
    overflow: 'hidden',
  },
  item: {
    padding: '8px 14px', fontSize: 12, fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', color: T.navy, borderBottom: `1px solid ${T.border}`,
    display: 'flex', alignItems: 'center', gap: 8,
  },
};

function flattenSectionsToCSV(sections) {
  const rows = [];
  (sections || []).forEach((sec) => {
    if (sec.type === 'kpis' && Array.isArray(sec.data)) {
      rows.push(['--- ' + (sec.title || 'KPIs') + ' ---']);
      rows.push(['Metric', 'Value']);
      sec.data.forEach((k) => rows.push([k.label || '', String(k.value ?? '')]));
      rows.push([]);
    }
    if (sec.type === 'table' && sec.data) {
      rows.push(['--- ' + (sec.title || 'Table') + ' ---']);
      const headers = sec.data.headers || [];
      const tableRows = sec.data.rows || [];
      if (headers.length) rows.push(headers);
      tableRows.forEach((r) => rows.push(Array.isArray(r) ? r : Object.values(r)));
      rows.push([]);
    }
    if (sec.type === 'text' && sec.data) {
      rows.push(['--- ' + (sec.title || 'Notes') + ' ---']);
      rows.push([String(sec.data)]);
      rows.push([]);
    }
  });
  return rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
}

function buildSummaryText(title, subtitle, framework, sections, metadata) {
  const lines = [title || 'Report'];
  if (subtitle) lines.push(subtitle);
  if (framework) lines.push('Framework: ' + framework);
  lines.push('Date: ' + (metadata?.date || new Date().toLocaleDateString()));
  lines.push('');
  (sections || []).forEach((sec) => {
    lines.push('## ' + (sec.title || 'Section'));
    if (sec.type === 'kpis' && Array.isArray(sec.data)) {
      sec.data.forEach((k) => lines.push('  ' + (k.label || '') + ': ' + (k.value ?? '')));
    }
    if (sec.type === 'text' && sec.data) lines.push('  ' + sec.data);
    if (sec.type === 'table' && sec.data?.headers) {
      lines.push('  ' + sec.data.headers.join(' | '));
    }
    lines.push('');
  });
  if (metadata?.disclaimer) lines.push('Disclaimer: ' + metadata.disclaimer);
  return lines.join('\n');
}

function renderSectionsHTML(sections) {
  return (sections || []).map((sec) => {
    let html = '<h2 style="margin-top:24px;font-size:14px;color:#1b2a4a;">' + (sec.title || '') + '</h2>';
    if (sec.type === 'kpis' && Array.isArray(sec.data)) {
      html += '<div style="margin:8px 0;">';
      sec.data.forEach((k) => {
        html += '<div class="kpi"><div class="kpi-value">' + (k.value ?? '') + '</div>'
          + '<div class="kpi-label">' + (k.label || '') + '</div></div>';
      });
      html += '</div>';
    }
    if (sec.type === 'table' && sec.data) {
      const headers = sec.data.headers || [];
      const rows = sec.data.rows || [];
      html += '<table><thead><tr>';
      headers.forEach((h) => { html += '<th>' + h + '</th>'; });
      html += '</tr></thead><tbody>';
      rows.forEach((r) => {
        const cells = Array.isArray(r) ? r : Object.values(r);
        html += '<tr>';
        cells.forEach((c) => { html += '<td>' + (c ?? '') + '</td>'; });
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
    if (sec.type === 'text' && sec.data) {
      html += '<p style="font-size:11px;color:#334155;line-height:1.6;">' + sec.data + '</p>';
    }
    if (sec.type === 'chart') {
      html += '<p style="font-size:10px;color:#94a3b8;font-style:italic;">[Chart: view in application]</p>';
    }
    return html;
  }).join('');
}

function openPrintView(title, subtitle, framework, sections, metadata) {
  const dateStr = metadata?.date || new Date().toLocaleDateString();
  const disclaimer = metadata?.disclaimer || '';
  const preparedBy = metadata?.preparedBy || 'A\u00B2 Intelligence';
  const version = metadata?.version || '';
  const sectionsHTML = renderSectionsHTML(sections);

  const html = `<!DOCTYPE html><html><head><title>${title || 'Report'}</title>
<style>
  body { font-family: 'DM Sans', Arial, sans-serif; color: #1b2a4a; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { color: #1b2a4a; border-bottom: 3px solid #b8962e; padding-bottom: 8px; font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 14px; }
  .badge { background: #b8962e; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #1b2a4a; color: white; padding: 8px; text-align: left; font-size: 11px; }
  td { border: 1px solid #e2e0d8; padding: 6px 8px; font-size: 11px; }
  tr:nth-child(even) { background: #faf9f6; }
  .kpi { display: inline-block; border: 1px solid #e2e0d8; border-radius: 8px; padding: 12px 16px; margin: 4px; min-width: 100px; text-align: center; }
  .kpi-value { font-size: 20px; font-weight: 700; color: #1b2a4a; }
  .kpi-label { font-size: 10px; color: #64748b; margin-top: 2px; }
  .footer { margin-top: 40px; border-top: 1px solid #e2e0d8; padding-top: 12px; font-size: 9px; color: #94a3b8; }
  .meta { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head><body>
  <div style="display:flex;justify-content:space-between;align-items:center;">
    <div><h1>${title || 'Report'}</h1><div class="meta">${subtitle || ''}</div></div>
    <div>${framework ? '<span class="badge">' + framework + '</span>' : ''}</div>
  </div>
  ${version ? '<div class="meta">Version: ' + version + ' | Prepared by: ' + preparedBy + ' | ' + dateStr + '</div>' : '<div class="meta">Prepared by: ' + preparedBy + ' | ' + dateStr + '</div>'}
  ${sectionsHTML}
  <div class="footer">
    Prepared by A\u00B2 Intelligence (AA Impact Inc.) | ${dateStr}${disclaimer ? ' | ' + disclaimer : ''}
  </div>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
  }
}

export default function ReportExporter({ title, subtitle, framework, sections, metadata, onExport }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef(null);

  const handleExportCSV = useCallback(() => {
    const csv = flattenSectionsToCSV(sections);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title || 'report').replace(/\s+/g, '_').toLowerCase() + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
    if (onExport) onExport('csv');
  }, [sections, title, onExport]);

  const handlePrint = useCallback(() => {
    openPrintView(title, subtitle, framework, sections, metadata);
    setOpen(false);
    if (onExport) onExport('print');
  }, [title, subtitle, framework, sections, metadata, onExport]);

  const handleCopy = useCallback(() => {
    const text = buildSummaryText(title, subtitle, framework, sections, metadata);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setOpen(false);
    if (onExport) onExport('copy');
  }, [title, subtitle, framework, sections, metadata, onExport]);

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <button style={styles.btn} onClick={() => setOpen((o) => !o)} title="Export report">
        <span style={{ fontSize: 14 }}>&#x2913;</span> Export
      </button>
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.item} onClick={handleExportCSV}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#faf9f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = T.white; }}>
            <span>&#x1F4C4;</span> Export CSV
          </div>
          <div style={styles.item} onClick={handlePrint}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#faf9f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = T.white; }}>
            <span>&#x1F5A8;</span> Print Report (PDF)
          </div>
          <div style={{ ...styles.item, borderBottom: 'none' }} onClick={handleCopy}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#faf9f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = T.white; }}>
            <span>&#x1F4CB;</span> {copied ? 'Copied!' : 'Copy Summary'}
          </div>
        </div>
      )}
    </div>
  );
}
