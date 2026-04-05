import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'ra_data_depth';

const initialState = {
  isActive: false,              // whether drill-down mode is enabled
  selectedPoint: null,          // { moduleRoute, metricKey, value, position: {x,y} }
  drillPath: [],                // breadcrumb path: ['totalVaR', 'transVaR', 'carbonPriceParam']
  showLineage: true,
  showSensitivity: true,
  showDataSources: true,
  overlayMode: 'popover',       // 'popover' | 'modal' | 'panel'
};

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_ACTIVE':
      return { ...state, isActive: !state.isActive, selectedPoint: null, drillPath: [] };
    case 'SET_ACTIVE':
      return { ...state, isActive: action.payload };
    case 'SELECT_POINT':
      return { ...state, selectedPoint: action.payload, drillPath: [action.payload.metricKey] };
    case 'DRILL_INTO':
      return { ...state, drillPath: [...state.drillPath, action.payload] };
    case 'DRILL_UP':
      return { ...state, drillPath: state.drillPath.slice(0, -1) };
    case 'DRILL_TO_LEVEL':
      return { ...state, drillPath: state.drillPath.slice(0, action.payload + 1) };
    case 'CLEAR_SELECTION':
      return { ...state, selectedPoint: null, drillPath: [] };
    case 'TOGGLE_LINEAGE':
      return { ...state, showLineage: !state.showLineage };
    case 'TOGGLE_SENSITIVITY':
      return { ...state, showSensitivity: !state.showSensitivity };
    case 'SET_OVERLAY_MODE':
      return { ...state, overlayMode: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload, selectedPoint: null, drillPath: [] };
    default:
      return state;
  }
}

const DataDepthContext = createContext(null);

export function DataDepthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) dispatch({ type: 'LOAD_STATE', payload: JSON.parse(stored) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isActive: state.isActive, showLineage: state.showLineage,
        showSensitivity: state.showSensitivity, showDataSources: state.showDataSources,
        overlayMode: state.overlayMode,
      }));
    } catch {}
  }, [state.isActive, state.showLineage, state.showSensitivity, state.showDataSources, state.overlayMode]);

  const toggleActive = useCallback(() => dispatch({ type: 'TOGGLE_ACTIVE' }), []);
  const selectPoint = useCallback((point) => dispatch({ type: 'SELECT_POINT', payload: point }), []);
  const drillInto = useCallback((key) => dispatch({ type: 'DRILL_INTO', payload: key }), []);
  const drillUp = useCallback(() => dispatch({ type: 'DRILL_UP' }), []);
  const drillToLevel = useCallback((level) => dispatch({ type: 'DRILL_TO_LEVEL', payload: level }), []);
  const clearSelection = useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), []);

  const value = useMemo(() => ({
    ...state, toggleActive, selectPoint, drillInto, drillUp, drillToLevel, clearSelection, dispatch,
  }), [state, toggleActive, selectPoint, drillInto, drillUp, drillToLevel, clearSelection]);

  return <DataDepthContext.Provider value={value}>{children}</DataDepthContext.Provider>;
}

export function useDataDepth() {
  const ctx = useContext(DataDepthContext);
  if (!ctx) throw new Error('useDataDepth must be used within DataDepthProvider');
  return ctx;
}

export default DataDepthContext;
