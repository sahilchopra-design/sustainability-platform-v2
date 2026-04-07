import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'ra_guided_mode';

const initialState = {
  isGuidedMode: false,
  showCalculationBrief: true,
  showDataPoints: true,
  showUserInteraction: true,
  showReferences: true,
  showAcronyms: true,
  showValueSummary: true,
  showDataLineage: true,
  panelPosition: 'right',       // 'right' | 'bottom' | 'floating'
  panelWidth: 380,
  dismissedTips: [],
  expandedSections: ['overview', 'calculation', 'dataPoints'],
};

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_GUIDED_MODE':
      return { ...state, isGuidedMode: !state.isGuidedMode };
    case 'SET_GUIDED_MODE':
      return { ...state, isGuidedMode: action.payload };
    case 'TOGGLE_SECTION':
      return {
        ...state,
        expandedSections: state.expandedSections.includes(action.payload)
          ? state.expandedSections.filter(s => s !== action.payload)
          : [...state.expandedSections, action.payload],
      };
    case 'TOGGLE_CALC_BRIEF':
      return { ...state, showCalculationBrief: !state.showCalculationBrief };
    case 'TOGGLE_DATA_POINTS':
      return { ...state, showDataPoints: !state.showDataPoints };
    case 'TOGGLE_USER_INTERACTION':
      return { ...state, showUserInteraction: !state.showUserInteraction };
    case 'TOGGLE_REFERENCES':
      return { ...state, showReferences: !state.showReferences };
    case 'TOGGLE_ACRONYMS':
      return { ...state, showAcronyms: !state.showAcronyms };
    case 'TOGGLE_VALUE_SUMMARY':
      return { ...state, showValueSummary: !state.showValueSummary };
    case 'TOGGLE_DATA_LINEAGE':
      return { ...state, showDataLineage: !state.showDataLineage };
    case 'SET_PANEL_POSITION':
      return { ...state, panelPosition: action.payload };
    case 'SET_PANEL_WIDTH':
      return { ...state, panelWidth: action.payload };
    case 'DISMISS_TIP':
      return { ...state, dismissedTips: [...state.dismissedTips, action.payload] };
    case 'RESET_TIPS':
      return { ...state, dismissedTips: [] };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const GuidedModeContext = createContext(null);

export function GuidedModeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch (e) { /* silent */ }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isGuidedMode: state.isGuidedMode,
        showCalculationBrief: state.showCalculationBrief,
        showDataPoints: state.showDataPoints,
        showUserInteraction: state.showUserInteraction,
        showReferences: state.showReferences,
        showAcronyms: state.showAcronyms,
        showValueSummary: state.showValueSummary,
        showDataLineage: state.showDataLineage,
        panelPosition: state.panelPosition,
        panelWidth: state.panelWidth,
        dismissedTips: state.dismissedTips,
        expandedSections: state.expandedSections,
      }));
    } catch (e) { /* silent */ }
  }, [state]);

  const toggleGuidedMode = useCallback(() => dispatch({ type: 'TOGGLE_GUIDED_MODE' }), []);
  const setGuidedMode = useCallback((v) => dispatch({ type: 'SET_GUIDED_MODE', payload: v }), []);
  const toggleSection = useCallback((s) => dispatch({ type: 'TOGGLE_SECTION', payload: s }), []);
  const dismissTip = useCallback((id) => dispatch({ type: 'DISMISS_TIP', payload: id }), []);
  const resetTips = useCallback(() => dispatch({ type: 'RESET_TIPS' }), []);
  const setPanelPosition = useCallback((p) => dispatch({ type: 'SET_PANEL_POSITION', payload: p }), []);

  const value = useMemo(() => ({
    ...state,
    toggleGuidedMode,
    setGuidedMode,
    toggleSection,
    dismissTip,
    resetTips,
    setPanelPosition,
    dispatch,
  }), [state, toggleGuidedMode, setGuidedMode, toggleSection, dismissTip, resetTips, setPanelPosition]);

  return (
    <GuidedModeContext.Provider value={value}>
      {children}
    </GuidedModeContext.Provider>
  );
}

export function useGuidedMode() {
  const ctx = useContext(GuidedModeContext);
  if (!ctx) throw new Error('useGuidedMode must be used within GuidedModeProvider');
  return ctx;
}

export default GuidedModeContext;
