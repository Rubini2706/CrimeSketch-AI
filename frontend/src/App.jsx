// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import CaseFiles from './pages/CaseFiles.jsx'
import NewCase from "./pages/NewCase";
import CaseDetail from './pages/CaseDetail.jsx'
import Database from './pages/Database.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import SketchGeneration from "./pages/SketchGeneration";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/cases" replace />} />
        <Route path="cases" element={<CaseFiles />} />
        <Route path="/cases/new" element={<NewCase />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        <Route path="database" element={<Database />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/cases" replace />} />
        <Route path="sketch" element={<SketchGeneration />} />
      </Route>
    </Routes>
  )
}
