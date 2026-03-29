/**
 * DATA SOURCE REGISTRY — UI Summary Layer
 * Sprint AM — Data Source Manager Integration
 *
 * Lightweight registry derived from dataSourceConnectors.js for use by the
 * Data Source Manager UI. Includes sync history, mapping coverage, and
 * health metrics.
 *
 * CRITICAL: Deterministic seeded RNG — no Math.random().
 */

import { DATA_SOURCES, DB_TABLES, ENGINE_FIELD_MAP, TABLE_SOURCE_MAP } from './dataSourceConnectors';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
let _seed = 800;
const rand = () => { _seed++; return sr(_seed); };
const randInt = (lo, hi) => Math.floor(lo + rand() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// ═══════════════════════════════════════════════════════════════════════════════
//  SOURCE REGISTRY — compact summaries for the Data Source Manager grid
// ═══════════════════════════════════════════════════════════════════════════════

export const SOURCE_REGISTRY = DATA_SOURCES.map(s => ({
  id: s.id,
  name: s.name,
  status: s.status,
  type: s.type,
  plan: s.plan,
  fieldCount: s.endpoints.reduce((a, e) => a + e.fields.length, 0),
  endpointCount: s.endpoints.length,
  lastSync: s.lastSync,
  refreshCadence: s.refreshCadence,
  rateLimit: s.rateLimit,
  documentation: s.documentation,
  tablesWritten: [...new Set(s.endpoints.flatMap(e => e.fields.map(f => f.targetTable)))],
  enginesServed: [...new Set(s.endpoints.flatMap(e => e.engines || []))],
}));


// ═══════════════════════════════════════════════════════════════════════════════
//  SYNC HISTORY — 30 days of mock sync events per source
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_OPTIONS = ['success', 'success', 'success', 'success', 'partial', 'error'];

function generateSyncHistory() {
  const history = [];
  const baseDate = new Date('2026-03-29T04:00:00Z');

  DATA_SOURCES.forEach(ds => {
    if (ds.status === 'not_connected') return;

    for (let day = 0; day < 30; day++) {
      const syncDate = new Date(baseDate);
      syncDate.setDate(syncDate.getDate() - day);
      const hour = randInt(0, 5);
      syncDate.setHours(hour, randInt(0, 59), randInt(0, 59));

      const status = pick(STATUS_OPTIONS);
      const totalFields = ds.endpoints.reduce((a, e) => a + e.fields.length, 0);
      const recordsProcessed = status === 'error' ? 0 : randInt(500, 50000);
      const fieldsMapped = status === 'error' ? 0 : (status === 'partial' ? randInt(Math.floor(totalFields * 0.6), totalFields - 1) : totalFields);
      const durationMs = status === 'error' ? randInt(100, 2000) : randInt(3000, 45000);

      history.push({
        id: `SYNC-${ds.id}-D${String(day).padStart(2, '0')}`,
        sourceId: ds.id,
        sourceName: ds.name,
        timestamp: syncDate.toISOString(),
        status,
        recordsProcessed,
        fieldsMapped,
        totalFields,
        durationMs,
        endpointResults: ds.endpoints.map(ep => ({
          endpointId: ep.id,
          endpointName: ep.name,
          status: status === 'error' && rand() > 0.5 ? 'error' : 'success',
          records: status === 'error' ? 0 : randInt(50, 5000),
          durationMs: randInt(200, 8000),
        })),
        errorMessage: status === 'error' ? pick([
          'Rate limit exceeded — retry after 60s',
          'Connection timeout after 30000ms',
          'API returned 503 Service Unavailable',
          'Authentication token expired',
          'Malformed JSON response from upstream',
        ]) : null,
      });
    }
  });

  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export const SYNC_HISTORY = generateSyncHistory();


// ═══════════════════════════════════════════════════════════════════════════════
//  MAPPING COVERAGE — Per DB table: % of columns with at least one source mapped
// ═══════════════════════════════════════════════════════════════════════════════

export const MAPPING_COVERAGE = {};
DB_TABLES.forEach(table => {
  const mappedColumns = TABLE_SOURCE_MAP[table.name]
    ? [...new Set(TABLE_SOURCE_MAP[table.name].map(m => m.column))]
    : [];
  const totalColumns = table.columns.length;
  const coveredCount = mappedColumns.filter(c => table.columns.includes(c)).length;

  MAPPING_COVERAGE[table.name] = {
    totalColumns,
    coveredColumns: coveredCount,
    coveragePct: totalColumns > 0 ? Math.round((coveredCount / totalColumns) * 100) : 0,
    unmappedColumns: table.columns.filter(c => !mappedColumns.includes(c)),
    sources: TABLE_SOURCE_MAP[table.name]
      ? [...new Set(TABLE_SOURCE_MAP[table.name].map(m => m.source))]
      : [],
    alembicMigration: table.alembicMigration,
  };
});


// ═══════════════════════════════════════════════════════════════════════════════
//  HEALTH METRICS — aggregated connector health for dashboard
// ═══════════════════════════════════════════════════════════════════════════════

export const CONNECTOR_HEALTH = {
  totalSources: DATA_SOURCES.length,
  connected: DATA_SOURCES.filter(s => s.status === 'connected').length,
  pending: DATA_SOURCES.filter(s => s.status === 'pending').length,
  notConnected: DATA_SOURCES.filter(s => s.status === 'not_connected').length,
  totalEndpoints: DATA_SOURCES.reduce((a, s) => a + s.endpoints.length, 0),
  totalFieldMappings: DATA_SOURCES.reduce((a, s) => a + s.endpoints.reduce((b, e) => b + e.fields.length, 0), 0),
  totalDbTables: DB_TABLES.length,
  totalEngines: Object.keys(ENGINE_FIELD_MAP).length,
  avgCoverage: Math.round(
    Object.values(MAPPING_COVERAGE).reduce((a, c) => a + c.coveragePct, 0) /
    Math.max(Object.keys(MAPPING_COVERAGE).length, 1)
  ),
  last24hSyncs: SYNC_HISTORY.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date('2026-03-29T04:00:00Z');
    return (now - d) < 86400000;
  }).length,
  last24hErrors: SYNC_HISTORY.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date('2026-03-29T04:00:00Z');
    return (now - d) < 86400000 && s.status === 'error';
  }).length,
  rateLimitUtilization: DATA_SOURCES
    .filter(s => s.status === 'connected' && s.rateLimit)
    .map(s => ({
      sourceId: s.id,
      sourceName: s.name,
      used: s.rateLimit.used,
      limit: s.rateLimit.requests,
      pct: Math.round((s.rateLimit.used / s.rateLimit.requests) * 100),
    })),
};


// ═══════════════════════════════════════════════════════════════════════════════
//  ENGINE DEPENDENCY MATRIX — which engines depend on which sources
// ═══════════════════════════════════════════════════════════════════════════════

export const ENGINE_DEPENDENCY_MATRIX = Object.entries(ENGINE_FIELD_MAP).map(([id, eng]) => ({
  engineId: id,
  engineName: eng.name,
  requiredFieldCount: eng.requiredFields.length,
  optionalFieldCount: (eng.optionalFields || []).length,
  sourceCount: eng.sources.length,
  sources: eng.sources.map(sId => {
    const src = DATA_SOURCES.find(s => s.id === sId);
    return {
      id: sId,
      name: src ? src.name : sId,
      status: src ? src.status : 'unknown',
    };
  }),
  modules: eng.modules,
  dataReadiness: eng.sources.every(sId => {
    const src = DATA_SOURCES.find(s => s.id === sId);
    return src && src.status === 'connected';
  }) ? 'ready' : eng.sources.some(sId => {
    const src = DATA_SOURCES.find(s => s.id === sId);
    return src && src.status === 'connected';
  }) ? 'partial' : 'blocked',
}));


// ═══════════════════════════════════════════════════════════════════════════════
//  DATA FRESHNESS — per-source freshness indicators
// ═══════════════════════════════════════════════════════════════════════════════

const now = new Date('2026-03-29T06:00:00Z');

export const DATA_FRESHNESS = SOURCE_REGISTRY.map(s => {
  if (!s.lastSync) {
    return { sourceId: s.id, sourceName: s.name, status: 'never_synced', hoursAgo: null, isStale: true };
  }
  const syncTime = new Date(s.lastSync);
  const hoursAgo = Math.round((now - syncTime) / 3600000);
  const staleThresholds = { daily: 48, weekly: 240, monthly: 1440, quarterly: 4320, annual: 17520, 'real-time': 1 };
  const threshold = staleThresholds[s.refreshCadence] || 48;
  return {
    sourceId: s.id,
    sourceName: s.name,
    lastSync: s.lastSync,
    refreshCadence: s.refreshCadence,
    hoursAgo,
    isStale: hoursAgo > threshold,
    status: hoursAgo <= threshold / 2 ? 'fresh' : hoursAgo <= threshold ? 'aging' : 'stale',
  };
});
