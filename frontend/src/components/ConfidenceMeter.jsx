import React from 'react';
import styles from './ConfidenceMeter.module.css';
 import { getConfidenceColor, formatPercent } from '../utils/helpers';

export default function ConfidenceMeter({
  score = 0,
  label = 'Confidence',
  showLabel = true,
  showValue = true,
  className = '',
}) {
  const normalized = score <= 1 ? score * 100 : score;
  const clamped = Math.max(0, Math.min(100, normalized));
  const color = getConfidenceColor(score);

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {(showLabel || showValue) && (
        <div className={styles.labelRow}>
          {showLabel && <span className={styles.label}>{label}</span>}
          {showValue && (
            <span className={styles.value} style={{ color }}>
              {formatPercent(score)}
            </span>
          )}
        </div>
      )}
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}