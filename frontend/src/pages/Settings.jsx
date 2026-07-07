import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import Badge from '../components/Badge.jsx'
import { useApp } from '../context/AppContext.jsx'
import styles from './Setting.module.css'

export default function Settings() {
  const { addAlert } = useApp()

  const handleSave = () => {
    addAlert('Settings saved successfully.', 'success')
  }

  const handleReset = () => {
    addAlert('Settings reset.', 'info')
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Settings</h1>
          <p className={styles.subheading}>
            Manage system preferences and configuration for CrimeSketch
          </p>
        </div>
        <Badge status="ONLINE" color="#22c55e" />
      </div>

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>System Preferences</h2>
        <p>Auto-save cases, case numbering, and default units are managed here.</p>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <p>Theme, accent color, and layout density settings.</p>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <p>Match alerts, case updates, and system notifications.</p>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>AI Matching Settings</h2>
        <p>Configure confidence thresholds and matching behavior.</p>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>Database Settings</h2>
        <p>Backup frequency, retention period, and encryption status.</p>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>Security</h2>
        <p>Two-factor authentication, session timeout, and audit logging.</p>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>About CrimeSketch</h2>
        <p>Version 3.4.1 &mdash; Law Enforcement Edition</p>
      </Card>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  )
}