import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import Sidebar from './Sidebar.jsx';

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <main className={styles.content}>
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}