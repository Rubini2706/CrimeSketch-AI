import styles from './StatCard.module.css'

export default function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  delta
}) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.icon} style={{ color }}>
          {Icon && <Icon size={20} />}
        </div>

        {delta !== undefined && (
          <span
            className={styles.delta}
            style={{
              color: delta >= 0 ? '#22c55e' : '#ef4444'
            }}
          >
            {delta >= 0 ? `+${delta}%` : `${delta}%`}
          </span>
        )}
      </div>

      <div className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>

      <div className={styles.label}>{label}</div>
    </div>
  )
}