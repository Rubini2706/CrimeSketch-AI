import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ScanFace, Paperclip, FileText, Clock, User, AlertTriangle } from 'lucide-react'
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import ConfidenceMeter from "../components/ConfidenceMeter.jsx";
import { MOCK_CASES, MOCK_MATCH_RESULTS } from '../utils/mockData.js'
import { getStatusColor, formatDate } from '../utils/helpers.js'
import { useApp } from '../context/AppContext.jsx'
import styles from './CaseDetail.module.css'

export default function CaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addAlert } = useApp()
  const caseData = MOCK_CASES.find(c => c.id === id) || MOCK_CASES[0]

  const timeline = [
    { time: '14:32', date: formatDate(caseData.updated), event: 'Face match completed — 2 candidates identified', type: 'match' },
    { time: '11:15', date: formatDate(caseData.updated), event: 'Evidence package uploaded (3 files)', type: 'upload' },
    { time: '09:00', date: formatDate(caseData.created), event: 'Case created and assigned to ' + caseData.officer, type: 'create' },
  ]

  return (
    <div className={styles.page}>
      {/* Back + header */}
      <div className={styles.top}>
  <button className={styles.back} onClick={() => navigate('/cases')}>
    <ArrowLeft size={14} /> Cases
  </button>

  <div className={styles.caseIdRow}>
    <span className={styles.caseId}>{caseData.id}</span>
    <Badge label={caseData.priority} color={getStatusColor(caseData.priority)} />
  </div>
</div>   {/* <-- Indha closing div missing */}

<h2 className={styles.title}>{caseData.title}</h2>

      {/* Summary row */}
      <div className={styles.summaryRow}>
        <div className={styles.metaItem}>
          <User size={12} />
          <span>Assigned to</span>
          <strong>{caseData.officer}</strong>
        </div>
        <div className={styles.metaItem}>
          <Clock size={12} />
          <span>Opened</span>
          <strong>{formatDate(caseData.created)}</strong>
        </div>
        <div className={styles.metaItem}>
          <Clock size={12} />
          <span>Last updated</span>
          <strong>{formatDate(caseData.updated)}</strong>
        </div>
        <div className={styles.metaItem}>
          <ScanFace size={12} />
          <span>Face matches</span>
          <strong style={{ color: caseData.matches > 0 ? 'var(--green-400)' : 'var(--gray-500)' }}>
            {caseData.matches} found
          </strong>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left: suspect info + matches */}
        <div className={styles.leftCol}>
          {/* Suspect */}
          <Card>
            <div className={styles.sectionTitle}>SUSPECT PROFILE</div>
            <div className={styles.suspectBox}>
              <div className={styles.suspectAvatar}><User size={28} strokeWidth={1} /></div>
              <div>
                <div className={styles.suspectName}>{caseData.suspect}</div>
                <div className={styles.suspectNote}>Profile based on CCTV and witness description</div>
              </div>
            </div>
          </Card>

          {/* Match results */}
          {MOCK_MATCH_RESULTS.length > 0 && (
            <Card>
              <div className={styles.sectionTitle}>FACE MATCH RESULTS</div>
              <div className={styles.matchList}>
                {MOCK_MATCH_RESULTS.map((r, i) => (
                  <div key={r.id} className={styles.matchItem}>
                    <div className={styles.matchRank}>#{i + 1}</div>
                    <div className={styles.matchAvatar}><User size={16} strokeWidth={1.5} /></div>
                    <div className={styles.matchBody}>
                      <div className={styles.matchName}>{r.name}</div>
                      <div className={styles.matchMeta}>
                        <span className={styles.matchId}>{r.subjectId}</span>
                       <Badge label={r.status} color={getStatusColor(r.status)} dot />
                       <Badge label={r.risk} color={getStatusColor(r.risk)} />
                      </div>
                      <ConfidenceMeter score={r.confidence} />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<ScanFace size={13} />}
                className={styles.rerunBtn}
                onClick={() => navigate('/match')}
              >
                Run New Match
              </Button>
            </Card>
          )}
        </div>

        {/* Right: timeline + evidence */}
        <div className={styles.rightCol}>
          {/* Evidence */}
          <Card>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionTitle}>EVIDENCE FILES</span>
              <Button
                variant="secondary"
                size="sm"
                icon={<Paperclip size={12} />}
                onClick={() => addAlert('Evidence upload panel coming soon.', 'info')}
              >
                Attach
              </Button>
            </div>
            <div className={styles.evidenceList}>
              {['CCTV_footage_north_cam.mp4', 'suspect_sketch_v2.png', 'witness_statement.pdf'].map(f => (
                <div key={f} className={styles.evidenceItem}>
                  <FileText size={13} className={styles.evidenceIcon} />
                  <span className={styles.evidenceName}>{f}</span>
                  <span className={styles.evidenceSize}>{(Math.random() * 4 + 0.5).toFixed(1)} MB</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <div className={styles.sectionTitle}>CASE TIMELINE</div>
            <div className={styles.timeline}>
              {timeline.map((item, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  {i < timeline.length - 1 && <div className={styles.timelineLine} />}
                  <div className={styles.timelineBody}>
                    <span className={styles.timelineTime}>{item.date} — {item.time}</span>
                    <span className={styles.timelineEvent}>{item.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="secondary" icon={<FileText size={14} />} onClick={() => addAlert('Report generated.', 'success')}>
              Generate Report
            </Button>
            <Button variant="danger" icon={<AlertTriangle size={14} />} onClick={() => addAlert('Case flagged for review.', 'warning')}>
              Flag Case
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
   