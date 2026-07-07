import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, ChevronRight, FolderOpen } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { MOCK_CASES } from '../utils/mockData.js'
import { getStatusColor, getConfidenceColor, formatDate } from '../utils/helpers.js'
import { useApp } from '../context/AppContext.jsx'
import styles from './CaseFiles.module.css'

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'PENDING', 'CLOSED']
const PRIORITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export default function CaseFiles() {
  const navigate = useNavigate()
  const { addAlert } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const filtered = MOCK_CASES.filter(c => {
    const matchSearch = !search || c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.officer.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter
    const matchPriority = priorityFilter === 'ALL' || c.priority === priorityFilter
    return matchSearch && matchStatus && matchPriority
  })

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.heading}>Case Files</h2>
          <p className={styles.subheading}>{MOCK_CASES.length} cases on record — {MOCK_CASES.filter(c => c.status === 'ACTIVE').length} active</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/cases/new")}>
          New Case
        </Button>
      </div>

      {/* Filters */}
      <Card className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Search by ID, title, officer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <Filter size={12} style={{ color: 'var(--gray-500)' }} />
            <span className={styles.filterLabel}>STATUS</span>
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${statusFilter === f ? styles.filterActive : ''}`}
                onClick={() => setStatusFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>PRIORITY</span>
            {PRIORITY_FILTERS.map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${priorityFilter === f ? styles.filterActive : ''}`}
                onClick={() => setPriorityFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Case list */}
      <Card>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CASE ID</th>
              <th>TITLE</th>
              <th>STATUS</th>
              <th>PRIORITY</th>
              <th>SUSPECT</th>
              <th>OFFICER</th>
              <th>OPENED</th>
              <th>UPDATED</th>
              <th>MATCHES</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.empty}>
                  <FolderOpen size={24} strokeWidth={1} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                  No cases match your filters
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr
                key={c.id}
                className={styles.row}
                onClick={() => navigate(`/cases/${c.id}`)}
              >
                <td className={styles.caseId}>{c.id}</td>
                <td className={styles.title}>{c.title}</td>
               <td><Badge label={c.status} color={getStatusColor(c.status)} dot /></td>
               <td><Badge label={c.priority} color={getStatusColor(c.priority)} /></td>
                <td className={styles.suspect}>{c.suspect}</td>
                <td className={styles.officer}>{c.officer}</td>
                <td className={styles.date}>{formatDate(c.created)}</td>
                <td className={styles.date}>{formatDate(c.updated)}</td>
                <td>
                  <span className={styles.matches} style={{ color: c.matches > 0 ? 'var(--green-400)' : 'var(--gray-600)' }}>
                    {c.matches > 0 ? `${c.matches} HIT${c.matches > 1 ? 'S' : ''}` : '—'}
                  </span>
                </td>
                <td><ChevronRight size={14} className={styles.arrow} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.tableFooter}>
          Showing {filtered.length} of {MOCK_CASES.length} cases
        </div>
      </Card>
    </div>
  )
}