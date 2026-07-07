import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { useApp } from '../context/AppContext.jsx';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: '◆' },
  { label: 'Case Files', path: '/cases', icon: '▣' },
  { label: 'Database', path: '/database', icon: '▤' },
   { label: 'Sketch Generation', path: '/sketch', icon: '✏' },
  { label: 'Reports', path: '/reports', icon: '▥' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useApp();

  const sidebarClass = [
    styles.sidebar,
    sidebarCollapsed ? styles.collapsed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={sidebarClass}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>CS</div>
        {!sidebarCollapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>CrimeSketch</span>
            <span className={styles.brandSubtitle}>Forensic Console</span>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              [styles.navLink, isActive ? styles.navLinkActive : '']
                .filter(Boolean)
                .join(' ')
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? '»' : '« Collapse'}
        </button>
      </div>
    </aside>
  );
}