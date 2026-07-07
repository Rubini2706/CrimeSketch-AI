import React from 'react';
import styles from './Badge.module.css';

const STATUS_COLOR_MAP = {
  open: 'blue',
  active: 'blue',
  pending: 'yellow',
  'in-progress': 'yellow',
  'in progress': 'yellow',
  closed: 'green',
  resolved: 'green',
  cold: 'gray',
  archived: 'gray',
  urgent: 'red',
  critical: 'red',
  high: 'red',
  medium: 'yellow',
  low: 'green',
};

export default function Badge({
  children,
  color,
  status,
  showDot = false,
  className = '',
  ...rest
}) {
  const resolvedColor =
    color || STATUS_COLOR_MAP[(status || '').toLowerCase()] || 'default';

  const badgeClass = [
    styles.badge,
    styles[resolvedColor] || styles.default,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClass} {...rest}>
      {showDot && <span className={styles.dot} />}
      {children ?? status}
    </span>
  );
}