import React from 'react';
import styles from './Card.module.css';

export default function Card({
  children,
  title,
  subtitle,
  footer,
  hoverable = false,
  className = '',
  onClick,
  ...rest
}) {
  const cardClass = [styles.card, hoverable ? styles.hoverable : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass} onClick={onClick} {...rest}>
      {(title || subtitle) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
        </div>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}