import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  MOCK_CASES,
  MOCK_MATCH_RESULTS,
  MOCK_SUBJECTS,
  MOCK_REPORTS,
} from '../utils/mockData.js';

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  const [cases, setCases] = useState(MOCK_CASES);
  const [matchResults, setMatchResults] = useState(MOCK_MATCH_RESULTS);
  const [subjects, setSubjects] = useState(MOCK_SUBJECTS);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const getCaseById = useCallback(
    (id) => cases.find((c) => c.id === id),
    [cases]
  );

  const getMatchResultsForCase = useCallback(
    (caseId) => matchResults.filter((m) => m.caseId === caseId),
    [matchResults]
  );

  const getSubjectById = useCallback(
    (id) => subjects.find((s) => s.id === id),
    [subjects]
  );

  const addCase = useCallback((newCase) => {
    setCases((prev) => [newCase, ...prev]);
  }, []);

  const updateCase = useCallback((id, updates) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteCase = useCallback((id) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const addAlert = useCallback((message, type = 'info') => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newAlert = {
      id,
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    setAlerts((prev) => [newAlert, ...prev]);
    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const value = useMemo(
    () => ({
      cases,
      setCases,
      matchResults,
      setMatchResults,
      subjects,
      setSubjects,
      reports,
      setReports,
      selectedCaseId,
      setSelectedCaseId,
      sidebarCollapsed,
      toggleSidebar,
      getCaseById,
      getMatchResultsForCase,
      getSubjectById,
      addCase,
      updateCase,
      deleteCase,
      alerts,
      addAlert,
      removeAlert,
      clearAlerts,
    }),
    [
      cases,
      matchResults,
      subjects,
      reports,
      selectedCaseId,
      sidebarCollapsed,
      toggleSidebar,
      getCaseById,
      getMatchResultsForCase,
      getSubjectById,
      addCase,
      updateCase,
      deleteCase,
      alerts,
      addAlert,
      removeAlert,
      clearAlerts,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (ctx === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}

export default AppContext;