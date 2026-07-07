import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, ScanFace, Database, TrendingUp,
  Activity, Clock, ChevronRight, AlertTriangle
} from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import Card from '../components/Card.jsx'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import { MOCK_STATS, MOCK_CASES } from '../utils/mockData.js'
import { getStatusColor, formatDate } from '../utils/helpers.js'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { totalCases, activeCases, matchesFound, accuracy, dbSize, avgMatchTime, recentActivity, matchTrend } = MOCK_STATS
  const urgentCases = MOCK_CASES.filter(c => c.priority === 'CRITICAL' || c.priority === 'HIGH').slice(0, 4)

  const maxMatches = Math.max(...matchTrend.map(d => d.matches))

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.heading}>System Overview</h2>
          <p className={styles.subheading}>All units operational — Real-time forensic monitoring active</p>
        </div>
        <Button variant="primary" icon={<ScanFace size={16} />} onClick={() => navigate('/cases')}>
          New Face Match
        </Button>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Cases" value={totalCases.toLocaleString()} icon={FolderOpen} color="var(--ice-400)" delta={12} />
        <StatCard label="Active Cases" value={activeCases} icon={Activity} color="var(--amber-500)" delta={-3} />
        <StatCard label="Matches Found" value={matchesFound.toLocaleString()} icon={ScanFace} color="var(--green-500)" delta={8} />
        <StatCard label="Match Accuracy" value={accuracy} unit="%" icon={TrendingUp} color="var(--ice-400)" />
        <StatCard label="DB Subjects" value={(dbSize / 1000).toFixed(1) + 'K'} icon={Database} color="var(--gray-400)" />
        <StatCard label="Avg Match Time" value={avgMatchTime} unit="sec" icon={Clock} color="var(--green-500)" />
      </div>

      {/* Middle row */}
      <div className={styles.midRow}>
        {/* Match trend mini-chart */}
        <Card className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>MATCH ACTIVITY — 7 DAYS</span>
            <span className={styles.cardMeta}>WEEKLY TREND</span>
          </div>
          <div className={styles.barChart}>
            {matchTrend.map((d) => (
              <div key={d.label} className={styles.barCol}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${(d.matches / maxMatches) * 100}%` }}
                    title={`${d.matches} matches`}
                  />
                  <div
                    className={styles.barFillCases}
                    style={{ height: `${(d.cases / maxMatches) * 100}%` }}
                    title={`${d.cases} cases`}
                  />
                </div>
                <span className={styles.barLabel}>{d.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.chartLegend}>
            <span className={styles.legendDot} style={{ background: 'var(--ice-400)' }} />
            <span>Matches</span>
            <span className={styles.legendDot} style={{ background: 'var(--amber-500)' }} />
            <span>Cases</span>
          </div>
        </Card>

        {/* Recent activity feed */}
        <Card className={styles.activityCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>RECENT ACTIVITY</span>
            <span className={styles.cardMeta}>LIVE FEED</span>
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((item) => (
              <div key={item.id} className={styles.activityItem}>
<div
  className={styles.activityDot}
  style={{ background: getStatusColor(item.status) }}
/>
                <div className={styles.activityBody}>
                  <span className={styles.activityEvent}>{item.event}</span>
                  <span className={styles.activityCase}>{item.caseId}</span>
                </div>
                <div className={styles.activityRight}>
                  {item.confidence && (
                    <span className={styles.activityConf} style={{ color: item.confidence > 80 ? 'var(--green-400)' : 'var(--amber-500)' }}>
                      {item.confidence}%
                    </span>
                  )}
                  <span className={styles.activityTime}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Urgent cases */}
      <Card>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>
            <AlertTriangle size={13} style={{ color: 'var(--red-400)', display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            HIGH PRIORITY CASES
          </span>
          <button className={styles.viewAll} onClick={() => navigate('/cases')}>
            View all <ChevronRight size={12} />
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>CASE ID</th>
              <th>TITLE</th>
              <th>STATUS</th>
              <th>PRIORITY</th>
              <th>OFFICER</th>
              <th>UPDATED</th>
              <th>MATCHES</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {urgentCases.map(c => (
              <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)} className={styles.tableRow}>
                <td className={styles.caseId}>{c.id}</td>
                <td className={styles.caseTitle}>{c.title}</td>
                <td><Badge status={c.status} color={getStatusColor(c.status)} showDot /></td>
          <td><Badge status={c.priority} color={getStatusColor(c.priority)} /></td>
                <td className={styles.officer}>{c.officer}</td>
                <td className={styles.date}>{formatDate(c.updated)}</td>
                <td className={styles.matches} style={{ color: c.matches > 0 ? 'var(--green-400)' : 'var(--gray-600)' }}>
                  {c.matches > 0 ? `${c.matches} HIT${c.matches > 1 ? 'S' : ''}` : '—'}
                </td>
                <td><ChevronRight size={14} className={styles.rowArrow} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}  