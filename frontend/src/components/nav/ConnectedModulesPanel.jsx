import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import axios from 'axios';

/* ─────────────────────────────────────────────────────────────────────
   CONNECTED MODULES PANEL — shell-level chrome (mounted once in App.js,
   NOT inside any individual module page). Shows the modules that share a
   backend engine or database table with whatever module route is
   currently active, using the Module Atlas interconnection data exposed
   by GET /api/v1/module-nav/connections/{module_id}.

   Placement: fixed to the bottom-right corner of the viewport (never
   flows with page content, so it cannot overlap a module page's own
   layout at any scroll position). Collapsed to a small edge tab by
   default; expansion state is remembered in localStorage so a user who
   dismisses it doesn't have it reappear on every navigation.

   Convention (matches backend + Module Atlas): module_id is the route
   pathname with its leading slash stripped, e.g. "/carbon-removal" ->
   "carbon-removal". Reversing module_id -> path is simply "/" + module_id.
   A small number of routes (nested routes like "/invite/:token", or any
   module_id the atlas hasn't indexed) won't reverse to a real, indexed
   module page — that's fine here: the panel treats a 404 or an empty
   connections array as "nothing to show" and renders nothing. Detecting
   whether a computed link 404s client-side is out of scope for this
   component; this comment documents the assumption instead.
   ───────────────────────────────────────────────────────────────────── */

const T = {
  surface: '#ffffff', bg: '#f4f6f9', border: '#e3e8ef',
  navy: '#1b3a5c', navyD: '#12273d',
  gold: '#c5a96a', goldD: '#8a6f2e',
  text: '#1a2433', textSec: '#566373', textMut: '#8a94a3',
  font: "'DM Sans', 'SF Pro Display', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
};

const LS_KEY = 'a2-connected-panel-open';
const MAX_CONNECTIONS = 6;

function readStoredOpen() {
  try {
    return window.localStorage.getItem(LS_KEY) === 'true';
  } catch {
    return false; // localStorage unavailable (private mode / SSR) — default collapsed
  }
}

function writeStoredOpen(value) {
  try {
    window.localStorage.setItem(LS_KEY, value ? 'true' : 'false');
  } catch {
    /* best-effort only */
  }
}

export default function ConnectedModulesPanel() {
  const location = useLocation();
  // Backend convention: module_id === route pathname with the leading slash stripped.
  const moduleId = useMemo(() => location.pathname.replace(/^\/+/, ''), [location.pathname]);

  const [connections, setConnections] = useState([]);
  const [open, setOpen] = useState(readStoredOpen);

  // Ref-based "latest request wins" guard: even though we also abort the
  // in-flight request via AbortController on route change, we additionally
  // stamp every request with a monotonically increasing id and ignore any
  // response/error that resolves after a newer request has started. This
  // covers environments where an aborted axios request still settles its
  // promise (rather than rejecting) before the next request's guard is in
  // place, so a fast series of route changes can never paint a stale
  // module's connections over the current route.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    // Clear immediately on route change — never show the previous module's
    // connections while the new module's request is in flight.
    setConnections([]);

    if (!moduleId) {
      // Root / dashboard route (or any other empty module id) — nothing to look up.
      return undefined;
    }

    const controller = new AbortController();

    axios
      .get(`/api/v1/module-nav/connections/${moduleId}`, { signal: controller.signal })
      .then((res) => {
        if (requestIdRef.current !== requestId) return; // superseded by a later navigation
        const data = res && res.data;
        const conns = Array.isArray(data && data.connections) ? data.connections : [];
        setConnections(conns);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return; // superseded — ignore stale error too
        if (axios.isCancel && axios.isCancel(err)) return; // our own abort — not a real error
        if (err && (err.code === 'ERR_CANCELED' || err.name === 'CanceledError')) return;
        // 404 (module not yet indexed), network error, or any other failure —
        // all treated as "no connections", not a user-facing error state.
        if (process.env.NODE_ENV !== 'production' && err && err.response && err.response.status && err.response.status !== 404) {
          // eslint-disable-next-line no-console
          console.debug('[ConnectedModulesPanel] non-404 error fetching connections for', moduleId, err.response.status);
        }
        setConnections([]);
      });

    return () => controller.abort();
  }, [moduleId]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      writeStoredOpen(next);
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    writeStoredOpen(false);
  }, []);

  // Zero connections (module not indexed yet, or genuinely isolated) —
  // render absolutely nothing, not even the collapsed tab. No empty-state clutter.
  if (!connections || connections.length === 0) return null;

  const visible = connections.slice(0, MAX_CONNECTIONS);

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        bottom: 32, // clears the 24px StatusBar strip + a small margin
        zIndex: 9998,
        display: 'flex',
        alignItems: 'flex-end',
        fontFamily: T.font,
        pointerEvents: 'none', // only the tab/drawer itself should capture clicks
      }}
    >
      {open ? (
        <div
          role="complementary"
          aria-label="Connected modules"
          style={{
            pointerEvents: 'auto',
            width: 320,
            maxHeight: 380,
            display: 'flex',
            flexDirection: 'column',
            background: T.surface,
            borderRadius: '10px 0 0 10px',
            border: `1px solid ${T.border}`,
            borderRight: 'none',
            boxShadow: '-6px 0 24px rgba(16,24,40,0.14), 0 0 0 1px rgba(16,24,40,0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              background: T.navy,
            }}
          >
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.5, color: T.gold, fontWeight: 700 }}>
                CONNECTED MODULES
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                {connections.length} module{connections.length === 1 ? '' : 's'} linked
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Collapse connected modules panel"
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)',
                cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 4px',
              }}
            >
              &times;
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }} className="a2-scroll">
            {visible.map((conn, i) => {
              const targetPath = '/' + String(conn.module_id || '').replace(/^\/+/, '');
              return (
                <NavLink
                  key={conn.module_id || i}
                  to={targetPath}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    padding: '8px 12px',
                    textDecoration: 'none',
                    color: T.text,
                    borderBottom: i === visible.length - 1 ? 'none' : `1px solid ${T.border}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.bg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>
                    {conn.label || conn.module_id}
                  </span>
                  {conn.via_summary && (
                    <span
                      title={conn.via_summary}
                      style={{
                        alignSelf: 'flex-start',
                        fontFamily: T.mono,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        color: T.goldD,
                        background: 'rgba(197,169,106,0.16)',
                        borderRadius: 3,
                        padding: '1px 6px',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conn.via_summary}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={handleToggle}
          aria-label={`Show ${connections.length} connected modules`}
          style={{
            pointerEvents: 'auto',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 6px',
            background: T.navy,
            color: '#fff',
            border: `1px solid ${T.navyD}`,
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            cursor: 'pointer',
            fontFamily: T.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            boxShadow: '-4px 0 14px rgba(16,24,40,0.12)',
          }}
        >
          <span
            style={{
              writingMode: 'horizontal-tb',
              transform: 'rotate(180deg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 14,
              height: 14,
              borderRadius: 7,
              background: T.gold,
              color: T.navyD,
              fontSize: 9,
            }}
          >
            {connections.length}
          </span>
          CONNECTED
        </button>
      )}
    </div>
  );
}
