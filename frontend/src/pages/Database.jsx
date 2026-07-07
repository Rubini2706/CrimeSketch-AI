import { useState } from 'react'
import { Search, Plus, Eye, Pencil, Trash2, X, AlertTriangle, Files, FolderOpen, FolderCheck, CalendarClock } from 'lucide-react'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { formatDate } from '../utils/helpers.js'
import { useApp } from '../context/AppContext.jsx'
import styles from './Database.module.css'

const CRIME_TYPES = ['Robbery', 'Theft', 'Assault', 'Burglary', 'Fraud', 'Homicide', 'Other']

const MOCK_CASES = [
  {
    id: 'CS-1042',
    caseName: 'Riverside Corner Robbery',
    crimeType: 'Robbery',
    location: 'Riverside, TX',
    date: '2026-07-02',
    status: 'Open',
    officerName: 'Det. A. Munroe',
    description: 'Armed robbery reported at a convenience store on 5th and Corner Ave.'
  },
  {
    id: 'CS-1039',
    caseName: 'Downtown Vehicle Theft',
    crimeType: 'Theft',
    location: 'Austin, TX',
    date: '2026-06-21',
    status: 'Closed',
    officerName: 'Det. R. Halden',
    description: 'Vehicle reported stolen from a downtown parking garage, recovered two days later.'
  },
  {
    id: 'CS-1035',
    caseName: 'Northgate Assault',
    crimeType: 'Assault',
    location: 'Northgate, TX',
    date: '2026-06-15',
    status: 'Open',
    officerName: 'Det. L. Ferreira',
    description: 'Physical altercation outside a bar on Northgate Blvd, one victim hospitalized.'
  },
  {
    id: 'CS-1028',
    caseName: 'Cedar Park Burglary',
    crimeType: 'Burglary',
    location: 'Cedar Park, TX',
    date: '2026-05-30',
    status: 'Closed',
    officerName: 'Det. A. Munroe',
    description: 'Residential burglary, entry forced through rear window, suspect identified via sketch match.'
  },
  {
    id: 'CS-1021',
    caseName: 'Lakeview Fraud Case',
    crimeType: 'Fraud',
    location: 'Lakeview, TX',
    date: '2026-05-12',
    status: 'Open',
    officerName: 'Det. S. Okafor',
    description: 'Reported check fraud targeting elderly residents in the Lakeview community.'
  }
]

const emptyForm = {
  caseName: '',
  crimeType: CRIME_TYPES[0],
  location: '',
  date: new Date().toISOString().slice(0, 10),
  officerName: '',
  description: ''
}

function generateCaseId(existing) {
  const max = existing.reduce((acc, c) => {
    const num = parseInt(String(c.id).replace(/\D/g, ''), 10)
    return Number.isFinite(num) ? Math.max(acc, num) : acc
  }, 1000)
  return `CS-${max + 1}`
}

export default function Database() {
  const { addAlert } = useApp()
  const [cases, setCases] = useState(MOCK_CASES)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modal, setModal] = useState(null) // { mode: 'add' | 'edit', data } | null
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = cases.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.caseName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'ALL' || c.status.toUpperCase() === statusFilter
    return matchSearch && matchStatus
  })

  const todayISO = new Date().toISOString().slice(0, 10)
  const stats = {
    total: cases.length,
    open: cases.filter(c => c.status === 'Open').length,
    closed: cases.filter(c => c.status === 'Closed').length,
    today: cases.filter(c => c.date === todayISO).length
  }

  const openAddModal = () => setModal({ mode: 'add', data: emptyForm })
  const openEditModal = (c) => setModal({ mode: 'edit', data: { ...c } })
  const closeModal = () => setModal(null)

  const handleViewCase = (c) => {
    addAlert(`Viewing case: ${c.caseName} (${c.id})`, 'info')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = modal.data

    if (!form.caseName.trim() || !form.location.trim() || !form.officerName.trim() || !form.date) {
      addAlert('Please fill in all required fields.', 'error')
      return
    }

    if (modal.mode === 'edit') {
      setCases(prev => prev.map(c => (c.id === form.id ? { ...form } : c)))
      addAlert(`Case updated: ${form.caseName}`, 'success')
    } else {
      const newCase = { ...form, id: generateCaseId(cases), status: 'Open' }
      setCases(prev => [newCase, ...prev])
      addAlert(`Case created: ${newCase.caseName}`, 'success')
    }
    closeModal()
  }

  const updateField = (field, value) => {
    setModal(prev => ({ ...prev, data: { ...prev.data, [field]: value } }))
  }

  const confirmDelete = () => {
    setCases(prev => prev.filter(c => c.id !== deleteTarget.id))
    addAlert(`Case deleted: ${deleteTarget.caseName}`, 'info')
    setDeleteTarget(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.heading}>Case Database</h2>
          <p className={styles.subheading}>{cases.length.toLocaleString()} cases on file — manage, search, and review forensic cases</p>
        </div>
        <Button variant="primary" icon={<Plus size={15} />} onClick={openAddModal}>
          Add Case
        </Button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <Files size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Cases</div>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <FolderOpen size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.open}</div>
            <div className={styles.statLabel}>Open Cases</div>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <FolderCheck size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.closed}</div>
            <div className={styles.statLabel}>Closed Cases</div>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
            <CalendarClock size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className={styles.statValue}>{stats.today}</div>
            <div className={styles.statLabel}>Today's Cases</div>
          </div>
        </Card>
      </div>

      {/* Filter row */}
      <Card className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder="Search by Case ID or Case Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            {['ALL', 'OPEN', 'CLOSED'].map(s => (
              <button
                key={s}
                className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'ALL' ? 'ALL STATUS' : s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Case table */}
      <Card className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <AlertTriangle size={28} strokeWidth={1.5} />
            </div>
            <p className={styles.emptyTitle}>No cases available.</p>
            <p className={styles.emptySub}>Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Case Name</th>
                  <th>Crime Type</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td data-label="Case ID" className={styles.mono}>{c.id}</td>
                    <td data-label="Case Name">{c.caseName}</td>
                    <td data-label="Crime Type">{c.crimeType}</td>
                    <td data-label="Location">{c.location}</td>
                    <td data-label="Date">{formatDate(c.date)}</td>
                    <td data-label="Status">
                      <Badge status={c.status} color={c.status === 'Open' ? 'orange' : 'green'} showDot />
                    </td>
                    <td data-label="Actions">
                      <div className={styles.rowActions}>
                        <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => handleViewCase(c)}>
                          View
                        </Button>
                        <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => openEditModal(c)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} style={{ color: 'var(--red-400)' }} />}
                          onClick={() => setDeleteTarget(c)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Case Modal */}
      {modal && (
        <div className={styles.overlay} onMouseDown={closeModal}>
          <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modal.mode === 'edit' ? 'Edit Case' : 'Add New Case'}</h3>
              <button className={styles.closeBtn} onClick={closeModal} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <form className={styles.modalBody} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Case Name</span>
                  <input
                    value={modal.data.caseName}
                    onChange={e => updateField('caseName', e.target.value)}
                    placeholder="e.g. Riverside Corner Robbery"
                  />
                </label>
                <label className={styles.field}>
                  <span>Crime Type</span>
                  <select value={modal.data.crimeType} onChange={e => updateField('crimeType', e.target.value)}>
                    {CRIME_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Location</span>
                  <input
                    value={modal.data.location}
                    onChange={e => updateField('location', e.target.value)}
                    placeholder="City, State"
                  />
                </label>
                <label className={styles.field}>
                  <span>Date</span>
                  <input
                    type="date"
                    value={modal.data.date}
                    onChange={e => updateField('date', e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Officer Name</span>
                  <input
                    value={modal.data.officerName}
                    onChange={e => updateField('officerName', e.target.value)}
                    placeholder="e.g. Det. A. Munroe"
                  />
                </label>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span>Description</span>
                  <textarea
                    rows={4}
                    value={modal.data.description}
                    onChange={e => updateField('description', e.target.value)}
                    placeholder="Brief summary of the case..."
                  />
                </label>
              </div>
              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary">Save Case</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className={styles.overlay} onMouseDown={() => setDeleteTarget(null)}>
          <div className={styles.confirmBox} onMouseDown={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <AlertTriangle size={20} strokeWidth={1.75} />
            </div>
            <h3>Delete this case?</h3>
            <p>This will permanently remove <strong>{deleteTarget.caseName}</strong> from the database.</p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={confirmDelete}>Delete Case</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}