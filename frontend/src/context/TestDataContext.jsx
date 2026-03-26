import React, { createContext, useContext, useState } from 'react';

const TestDataContext = createContext(null);

const INITIAL_STATE = {
  // NGFS
  selectedNgfsScenarioId: 'NGFS_P3_NET_ZERO_2050',
  selectedNgfsScenario: null,
  // Portfolio
  portfolioHoldings: [],
  dataLoadedAt: null,
  uploadedFileNames: {},
  // Stranded
  discountRate: 0.08,
  targetYears: [2030, 2035, 2040, 2050],
  reserveIds: [],
  // CSRD
  csrdCompanyId: 'L17110MH1973PLC019786',
  csrdFramework: 'ESRS',
  csrdReportingYear: 2024,
  // Pipeline
  lastPipelineTriggers: {},
};

export function TestDataProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);

  const set = (updates) => setState(prev => ({ ...prev, ...updates }));

  const ctx = {
    ...state,
    setSelectedNgfsScenario: (id, full) => set({ selectedNgfsScenarioId: id, selectedNgfsScenario: full }),
    setPortfolioHoldings: (holdings, fileName) => set({
      portfolioHoldings: holdings,
      dataLoadedAt: new Date().toISOString(),
      uploadedFileNames: { ...state.uploadedFileNames, portfolio: fileName || 'manual' },
    }),
    setDiscountRate: (v) => set({ discountRate: v }),
    setReserveIds: (ids) => set({ reserveIds: ids }),
    setCsrdCompanyId: (id) => set({ csrdCompanyId: id }),
    setCsrdFramework: (fw) => set({ csrdFramework: fw }),
    setCsrdReportingYear: (y) => set({ csrdReportingYear: y }),
    setPipelineTrigger: (id) => set({
      lastPipelineTriggers: { ...state.lastPipelineTriggers, [id]: new Date().toISOString() },
    }),
    reset: () => setState(INITIAL_STATE),
  };

  return <TestDataContext.Provider value={ctx}>{children}</TestDataContext.Provider>;
}

export function useTestData() {
  const ctx = useContext(TestDataContext);
  if (!ctx) throw new Error('useTestData must be used inside TestDataProvider');
  return ctx;
}

export default TestDataContext;
