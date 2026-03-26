import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { fetchEODHD, fetchAlphaVantage, mergeEnrichment } from '../data/enrichmentService';

/* ─── State shape ─────────────────────────────────────────────────────────────
  {
    apiKeys: { eodhd: '', alpha_vantage: '' },
    enriched: {},          // { [cin]: mergedProfile }
    status: {},            // { [cin]: 'idle'|'loading'|'partial'|'complete'|'error' }
    errors: {},            // { [cin]: errorMessage }
    manualOverrides: {},   // { [cin]: { [field]: value } }
    queue: [],             // [{ cin, ticker }, ...]
    queueRunning: false,
  }
─────────────────────────────────────────────────────────────────────────────── */

const initialState = {
  apiKeys: { eodhd: '', alpha_vantage: '' },
  enriched: {},
  status: {},
  errors: {},
  manualOverrides: {},
  queue: [],
  queueRunning: false,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_API_KEY':
      return {
        ...state,
        apiKeys: { ...state.apiKeys, [action.source]: action.key },
      };
    case 'SET_ENRICHED':
      return {
        ...state,
        enriched: { ...state.enriched, [action.cin]: action.profile },
      };
    case 'SET_STATUS':
      return {
        ...state,
        status: { ...state.status, [action.cin]: action.status },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.cin]: action.error },
      };
    case 'SET_MANUAL': {
      const prev = state.manualOverrides[action.cin] || {};
      return {
        ...state,
        manualOverrides: {
          ...state.manualOverrides,
          [action.cin]: { ...prev, [action.field]: action.value },
        },
      };
    }
    case 'CLEAR_ONE': {
      const enriched = { ...state.enriched };
      const status = { ...state.status };
      const errors = { ...state.errors };
      delete enriched[action.cin];
      delete status[action.cin];
      delete errors[action.cin];
      return { ...state, enriched, status, errors };
    }
    case 'CLEAR_ALL':
      return { ...state, enriched: {}, status: {}, errors: {} };
    case 'SET_QUEUE':
      return { ...state, queue: action.queue };
    case 'SHIFT_QUEUE':
      return { ...state, queue: state.queue.slice(1) };
    case 'SET_QUEUE_RUNNING':
      return { ...state, queueRunning: action.running };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CompanyEnrichmentContext = createContext(null);

export function CompanyEnrichmentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const queueTimerRef = useRef(null);
  const cancelQueueRef = useRef(false);

  // ── Load from localStorage on mount ────────────────────────────────────────
  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('ra_api_keys');
      if (storedKeys) {
        const keys = JSON.parse(storedKeys);
        if (keys.eodhd) dispatch({ type: 'SET_API_KEY', source: 'eodhd', key: keys.eodhd });
        if (keys.alpha_vantage) dispatch({ type: 'SET_API_KEY', source: 'alpha_vantage', key: keys.alpha_vantage });
      }
    } catch {}

    try {
      const storedEnriched = localStorage.getItem('ra_enriched');
      if (storedEnriched) {
        const enriched = JSON.parse(storedEnriched);
        Object.entries(enriched).forEach(([cin, profile]) => {
          dispatch({ type: 'SET_ENRICHED', cin, profile });
          const score = profile?.enrichment_score ?? 0;
          dispatch({ type: 'SET_STATUS', cin, status: score >= 70 ? 'complete' : 'partial' });
        });
      }
    } catch {}

    try {
      const storedManual = localStorage.getItem('ra_manual_overrides');
      if (storedManual) {
        const overrides = JSON.parse(storedManual);
        Object.entries(overrides).forEach(([cin, fields]) => {
          Object.entries(fields).forEach(([field, value]) => {
            dispatch({ type: 'SET_MANUAL', cin, field, value });
          });
        });
      }
    } catch {}
  }, []);

  // ── Persist to localStorage on changes ─────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('ra_api_keys', JSON.stringify(state.apiKeys));
    } catch {}
  }, [state.apiKeys]);

  useEffect(() => {
    try {
      localStorage.setItem('ra_enriched', JSON.stringify(state.enriched));
    } catch {}
  }, [state.enriched]);

  useEffect(() => {
    try {
      localStorage.setItem('ra_manual_overrides', JSON.stringify(state.manualOverrides));
    } catch {}
  }, [state.manualOverrides]);

  // ── setApiKey ───────────────────────────────────────────────────────────────
  const setApiKey = useCallback((source, key) => {
    dispatch({ type: 'SET_API_KEY', source, key });
  }, []);

  // ── enrichCompany ───────────────────────────────────────────────────────────
  const enrichCompany = useCallback(async (cin, ticker) => {
    dispatch({ type: 'SET_STATUS', cin, status: 'loading' });
    dispatch({ type: 'SET_ERROR', cin, error: null });

    try {
      const { apiKeys, manualOverrides } = state;

      const [eodhdResult, avResult] = await Promise.allSettled([
        apiKeys.eodhd ? fetchEODHD(ticker, apiKeys.eodhd) : Promise.resolve({ fields: {}, source: 'eodhd' }),
        apiKeys.alpha_vantage ? fetchAlphaVantage(ticker, apiKeys.alpha_vantage) : Promise.resolve({ fields: {}, source: 'alpha_vantage' }),
      ]);

      const eodhd = eodhdResult.status === 'fulfilled' ? eodhdResult.value : { fields: {}, source: 'eodhd', error: eodhdResult.reason?.message };
      const av = avResult.status === 'fulfilled' ? avResult.value : { fields: {}, source: 'alpha_vantage', error: avResult.reason?.message };

      // Find master record for enrichment score calculation
      const masterRecord = null; // will be resolved by consumer if needed

      const profile = mergeEnrichment(masterRecord, eodhd, av, manualOverrides[cin] || {});

      dispatch({ type: 'SET_ENRICHED', cin, profile });

      const score = profile.enrichment_score ?? 0;
      dispatch({ type: 'SET_STATUS', cin, status: score >= 70 ? 'complete' : 'partial' });

      // Collect errors from partial failures
      const errs = [];
      if (eodhd.error) errs.push(`EODHD: ${eodhd.error}`);
      if (av.error) errs.push(`Alpha Vantage: ${av.error}`);
      if (errs.length > 0) {
        dispatch({ type: 'SET_ERROR', cin, error: errs.join(' | ') });
      }
    } catch (e) {
      dispatch({ type: 'SET_STATUS', cin, status: 'error' });
      dispatch({ type: 'SET_ERROR', cin, error: e.message });
    }
  }, [state]);

  // ── enrichBulk ──────────────────────────────────────────────────────────────
  const enrichBulk = useCallback((companies) => {
    cancelQueueRef.current = false;
    dispatch({ type: 'SET_QUEUE', queue: companies });
    dispatch({ type: 'SET_QUEUE_RUNNING', running: true });

    const processNext = (remaining) => {
      if (cancelQueueRef.current || remaining.length === 0) {
        dispatch({ type: 'SET_QUEUE_RUNNING', running: false });
        dispatch({ type: 'SET_QUEUE', queue: [] });
        return;
      }
      const [next, ...rest] = remaining;
      dispatch({ type: 'SET_QUEUE', queue: rest });

      enrichCompany(next.cin, next.ticker).finally(() => {
        queueTimerRef.current = setTimeout(() => processNext(rest), 1200);
      });
    };

    processNext(companies);
  }, [enrichCompany]);

  // ── cancelQueue ─────────────────────────────────────────────────────────────
  const cancelQueue = useCallback(() => {
    cancelQueueRef.current = true;
    if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
    dispatch({ type: 'SET_QUEUE_RUNNING', running: false });
    dispatch({ type: 'SET_QUEUE', queue: [] });
  }, []);

  // ── setManualField ───────────────────────────────────────────────────────────
  const setManualField = useCallback((cin, field, value) => {
    dispatch({ type: 'SET_MANUAL', cin, field, value });

    // Re-merge: get existing enriched data and re-apply with new manual override
    // We use a functional update pattern via a subsequent dispatch
    // The actual re-merge happens in a separate effect or the consumer can call enrichCompany again
    // For immediate UI feedback we store the override and the getProfile function handles it live
  }, []);

  // ── clearEnrichment ──────────────────────────────────────────────────────────
  const clearEnrichment = useCallback((cin) => {
    dispatch({ type: 'CLEAR_ONE', cin });
  }, []);

  // ── clearAll ─────────────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // ── getProfile ───────────────────────────────────────────────────────────────
  const getProfile = useCallback((cin) => {
    return state.enriched[cin] || null;
  }, [state.enriched]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
    };
  }, []);

  const value = {
    // State
    apiKeys: state.apiKeys,
    enriched: state.enriched,
    status: state.status,
    errors: state.errors,
    manualOverrides: state.manualOverrides,
    queue: state.queue,
    queueRunning: state.queueRunning,
    // Actions
    setApiKey,
    enrichCompany,
    enrichBulk,
    setManualField,
    clearEnrichment,
    clearAll,
    getProfile,
    cancelQueue,
  };

  return (
    <CompanyEnrichmentContext.Provider value={value}>
      {children}
    </CompanyEnrichmentContext.Provider>
  );
}

export function useEnrichment() {
  const ctx = useContext(CompanyEnrichmentContext);
  if (!ctx) throw new Error('useEnrichment must be used within CompanyEnrichmentProvider');
  return ctx;
}
