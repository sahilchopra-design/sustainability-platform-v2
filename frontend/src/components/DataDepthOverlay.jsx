import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDataDepth } from '../context/DataDepthContext';
import { MODULE_METADATA, findMetricByText } from '../data/moduleMetadata';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  teal: '#0891b2', purple: '#7c3aed',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

const DQ_COLORS = { 1: T.green, 2: '#22c55e', 3: T.amber, 4: '#ea580c', 5: T.red };
const DQ_LABELS = { 1: 'Audited', 2: 'Reported', 3: 'Activity Proxy', 4: 'Revenue Est.', 5: 'Asset Proxy' };

function LineageNode({ node, depth = 0, expanded, onToggle, onDrill }) {
  const hasChildren = node.children && node.children.length > 0;
  const isOpen = expanded.has(node.key);
  return (
    <div>
      <div
        onClick={() => { if (hasChildren) onToggle(node.key); if (node.drillable) onDrill(node.key); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
          paddingLeft: 10 + depth * 20, cursor: hasChildren || node.drillable ? 'pointer' : 'default',
          background: depth === 0 ? T.teal + '08' : 'transparent',
          borderBottom: `1px solid ${T.border}`, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (hasChildren) e.currentTarget.style.background = T.gold + '11'; }}
        onMouseLeave={e => { e.currentTarget.style.background = depth === 0 ? T.teal + '08' : 'transparent'; }}
      >
        {hasChildren ? (
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.teal, width: 12, textAlign: 'center' }}>
            {isOpen ? '▾' : '▸'}
          </span>
        ) : (
          <span style={{ width: 12, textAlign: 'center', fontSize: 8, color: T.textMut }}>●</span>
        )}
        <span style={{ flex: 1, fontSize: 11, color: T.navy, fontWeight: depth === 0 ? 700 : 400 }}>{node.label}</span>
        {node.value !== undefined && (
          <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.navy }}>{node.value}</span>
        )}
        {node.weight !== undefined && (
          <span style={{ fontFamily: T.mono, fontSize: 9, color: T.textMut, background: T.border, padding: '1px 4px', borderRadius: 3 }}>
            w={typeof node.weight === 'number' ? (node.weight * 100).toFixed(0) + '%' : node.weight}
          </span>
        )}
        {node.quality !== undefined && (
          <span style={{
            fontFamily: T.mono, fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
            background: (DQ_COLORS[node.quality] || T.textMut) + '22', color: DQ_COLORS[node.quality] || T.textMut,
          }}>DQ{node.quality}</span>
        )}
        {node.source && (
          <span style={{ fontSize: 9, color: T.teal, fontFamily: T.mono }}>{node.source}</span>
        )}
      </div>
      {isOpen && hasChildren && node.children.map(child => (
        <LineageNode key={child.key} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onDrill={onDrill} />
      ))}
    </div>
  );
}

export default function DataDepthOverlay() {
  const { isActive, selectedPoint, drillPath, selectPoint, clearSelection, drillInto } = useDataDepth();
  const location = useLocation();
  const overlayRef = useRef(null);
  const [expanded, setExpanded] = useState(new Set());
  const [position, setPosition] = useState({ top: 100, left: 400 });

  const currentPath = location.pathname;
  const metadata = MODULE_METADATA[currentPath];
  const highlightTimerRef = useRef(null);

  // ── Highlight drillable data points when depth mode is active ──
  useEffect(() => {
    if (!isActive || !metadata) {
      // Remove all highlights when depth mode is off
      document.querySelectorAll('[data-depth-highlight]').forEach(el => {
        el.removeAttribute('data-depth-highlight');
        el.style.removeProperty('outline');
        el.style.removeProperty('outline-offset');
        el.style.removeProperty('cursor');
        el.style.removeProperty('position');
        const badge = el.querySelector('.depth-badge');
        if (badge) badge.remove();
      });
      return;
    }

    function highlightDrillableElements() {
      // Remove old highlights first
      document.querySelectorAll('[data-depth-highlight]').forEach(el => {
        el.removeAttribute('data-depth-highlight');
        el.style.removeProperty('outline');
        el.style.removeProperty('outline-offset');
        el.style.removeProperty('cursor');
        el.style.removeProperty('box-shadow');
        el.style.removeProperty('border-radius');
        const badge = el.querySelector('.depth-badge');
        if (badge) badge.remove();
      });

      // Scan for bold/large numeric text elements that match metadata
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const candidates = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent.trim();
        if (!text || text.length > 50 || text.length < 1) continue;
        const el = node.parentElement;
        if (!el) continue;
        // Skip elements inside the overlay itself
        if (el.closest('[style*="zIndex: 10000"]') || el.closest('[style*="z-index: 10000"]')) continue;

        const cs = window.getComputedStyle(el);
        const isBold = parseInt(cs.fontWeight) >= 600;
        const isLargeText = parseInt(cs.fontSize) >= 16;
        const hasNumber = /\d/.test(text);

        if (isBold && isLargeText && hasNumber && el.children.length === 0) {
          // Try to find context (label) from the same card container
          let contextText = text;
          let container = el.parentElement;
          for (let up = 0; up < 4 && container; up++) {
            const children = container.querySelectorAll('div, span, p');
            for (const child of children) {
              const ct = child.textContent.trim();
              const childCs = window.getComputedStyle(child);
              const isLabel = parseInt(childCs.fontSize) <= 14 && ct !== text && ct.length > 2 && ct.length < 40 && !/^\d/.test(ct);
              if (isLabel && child.children.length === 0) {
                contextText = ct + ' ' + text;
                break;
              }
            }
            if (contextText !== text) break;
            container = container.parentElement;
          }

          // Check if this matches any metric in metadata
          const match = findMetricByText(contextText, metadata) || findMetricByText(text, metadata);
          if (match) {
            candidates.push({ el, match, text });
          }
        }
      }

      // Apply highlights
      candidates.forEach(({ el, match }) => {
        if (el.getAttribute('data-depth-highlight')) return; // already highlighted
        el.setAttribute('data-depth-highlight', match.key);
        el.style.outline = '2px dashed rgba(8,145,178,0.5)';
        el.style.outlineOffset = '3px';
        el.style.cursor = 'pointer';
        el.style.borderRadius = '4px';
        el.style.boxShadow = '0 0 8px rgba(8,145,178,0.15)';
        // Position relative for badge
        if (!el.style.position || el.style.position === 'static') {
          el.style.position = 'relative';
        }
        // Add small depth icon badge
        if (!el.querySelector('.depth-badge')) {
          const badge = document.createElement('span');
          badge.className = 'depth-badge';
          badge.textContent = '🔍';
          badge.style.cssText = 'position:absolute;top:-8px;right:-8px;font-size:10px;background:#0891b2;color:white;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,0.3);z-index:5;';
          el.appendChild(badge);
        }
      });
    }

    // Run highlighting after a small delay (let React finish rendering)
    highlightTimerRef.current = setTimeout(highlightDrillableElements, 500);

    // Re-run on DOM changes (tab switches, data updates)
    const observer = new MutationObserver(() => {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(highlightDrillableElements, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(highlightTimerRef.current);
      observer.disconnect();
      document.querySelectorAll('[data-depth-highlight]').forEach(el => {
        el.removeAttribute('data-depth-highlight');
        el.style.removeProperty('outline');
        el.style.removeProperty('outline-offset');
        el.style.removeProperty('cursor');
        el.style.removeProperty('box-shadow');
        el.style.removeProperty('border-radius');
        const badge = el.querySelector('.depth-badge');
        if (badge) badge.remove();
      });
    };
  }, [isActive, metadata, currentPath]);

  // Click interceptor — captures clicks on metric elements
  const handleDocumentClick = useCallback((e) => {
    if (!isActive) return;
    if (overlayRef.current && overlayRef.current.contains(e.target)) return;

    // Find the nearest metric-like element using computed styles (works with React inline styles)
    let target = e.target;
    // Walk up max 5 levels to find a metric element
    for (let i = 0; i < 6 && target && target !== document.body; i++) {
      const cs = window.getComputedStyle(target);
      const isBold = parseInt(cs.fontWeight) >= 600;
      const isMono = cs.fontFamily.includes('Mono') || cs.fontFamily.includes('monospace');
      const isLargeText = parseInt(cs.fontSize) >= 16;
      // Match numeric content including units like tCO2e, MWh, %, $, ₹, °C, Cr, L, B, M, K
      const hasNumericContent = /[\d]/.test(target.textContent.trim()) && /^[\d$€£₹%°.,BMKLCryr/\s\-+×·tCO2eINRUSDMWhGWkgppm°]+$/.test(target.textContent.trim());
      // Also match if the text contains a number and is inside a KPI-like container
      const hasNumber = /\d/.test(target.textContent.trim());
      const isSmallElement = target.textContent.trim().length < 40;
      if ((isBold && (isMono || isLargeText || hasNumericContent)) || (isMono && isBold) || (isBold && hasNumber && isSmallElement && isLargeText)) break;
      target = target.parentElement;
    }
    if (!target || target === document.body) { clearSelection(); return; }

    const text = target.textContent.trim();
    if (!text || text.length > 50 || text.length < 1) { clearSelection(); return; }


    // Try to match against module metadata using value text + nearby label text
    if (metadata) {
      // Grab label text from within the same KPI card container
      // Walk UP to find the card container (usually 2-3 levels up), then search its children for a label
      let contextText = text;
      let container = target.parentElement;
      for (let up = 0; up < 4 && container; up++) {
        // Look for a small text element that's a label (fontSize < 14px, not the value itself)
        const children = container.querySelectorAll('div, span, p');
        for (const child of children) {
          const ct = child.textContent.trim();
          const cs = window.getComputedStyle(child);
          const isLabel = parseInt(cs.fontSize) <= 14 && ct !== text && ct.length > 2 && ct.length < 40 && !/^\d/.test(ct);
          if (isLabel && child.children.length === 0) {
            contextText = ct + ' ' + text;
            break;
          }
        }
        if (contextText !== text) break;
        container = container.parentElement;
      }

      const match = findMetricByText(contextText, metadata) || findMetricByText(text, metadata);

      if (match) {
        const rect = target.getBoundingClientRect();
        setPosition({
          top: Math.min(rect.bottom + 8, window.innerHeight - 450),
          left: Math.min(rect.left, window.innerWidth - 420),
        });
        selectPoint({
          moduleRoute: currentPath,
          metricKey: match.key,
          value: text,
          metric: match,
        });
        // Auto-expand first level
        setExpanded(new Set(match.children ? match.children.map(c => c.key) : []));
        e.stopPropagation();
        return;
      }
    }
    clearSelection();
  }, [isActive, metadata, currentPath, selectPoint, clearSelection]);

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [handleDocumentClick]);

  // Clear on route change
  useEffect(() => { clearSelection(); }, [currentPath, clearSelection]);

  // Toggle expansion
  const toggleExpand = useCallback((key) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  if (!isActive || !selectedPoint || !selectedPoint.metric) return null;

  const metric = selectedPoint.metric;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', top: position.top, left: position.left,
        width: 400, maxHeight: 440, background: T.surface,
        borderRadius: 10, border: `2px solid ${T.teal}`,
        boxShadow: '0 12px 40px rgba(27,58,92,0.18), 0 0 0 1px rgba(8,145,178,0.2)',
        zIndex: 10000, fontFamily: T.font, overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 14px', background: T.navy, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 9, color: T.teal, letterSpacing: 2 }}>DATA DEPTH · DRILL-DOWN</div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, marginTop: 2 }}>{metric.label || selectedPoint.value}</div>
        </div>
        <button onClick={clearSelection} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, padding: '0 4px',
        }}>×</button>
      </div>

      {/* Breadcrumb */}
      {drillPath.length > 0 && (
        <div style={{ padding: '6px 14px', background: T.teal + '08', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>PATH:</span>
          {drillPath.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: T.textMut, fontSize: 10 }}>→</span>}
              <span style={{ fontSize: 10, fontFamily: T.mono, color: i === drillPath.length - 1 ? T.teal : T.textSec, fontWeight: i === drillPath.length - 1 ? 700 : 400 }}>{p}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      <div style={{ overflowY: 'auto', maxHeight: 320 }}>
        {/* Current Value */}
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>Displayed Value</div>
            <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.navy }}>{selectedPoint.value}</div>
          </div>
          {metric.formula && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1 }}>Formula</div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.teal, maxWidth: 200, lineHeight: 1.4 }}>{metric.formula}</div>
            </div>
          )}
        </div>

        {/* Methodology */}
        {metric.methodology && (
          <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: T.navy, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Methodology: </span>
            {metric.methodology}
          </div>
        )}

        {/* Component Tree (Lineage) */}
        {metric.children && metric.children.length > 0 && (
          <div>
            <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 700, color: T.teal, textTransform: 'uppercase', letterSpacing: 1, borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              Value Decomposition ({metric.children.length} components)
            </div>
            {metric.children.map(child => (
              <LineageNode key={child.key} node={child} expanded={expanded} onToggle={toggleExpand} onDrill={(k) => drillInto(k)} />
            ))}
          </div>
        )}

        {/* Data Sources */}
        {metric.sources && metric.sources.length > 0 && (
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Data Sources</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {metric.sources.map((s, i) => (
                <span key={i} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: T.teal + '15', color: T.teal, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Sensitivity */}
        {metric.sensitivity && (
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.purple, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Sensitivity (±10%)</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {metric.sensitivity.map((s, i) => (
                <div key={i} style={{ flex: 1, background: T.bg, borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: T.textMut }}>{s.param}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: s.impact > 0 ? T.red : T.green }}>
                    {s.impact > 0 ? '+' : ''}{s.impact}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '6px 14px', background: T.bg, borderTop: `1px solid ${T.border}`, fontSize: 9, color: T.textMut, textAlign: 'center' }}>
        Click components to drill deeper · ESC to close · Data depth mode active
      </div>
    </div>
  );
}
