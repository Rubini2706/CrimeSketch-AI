// General-purpose helper utilities for CrimeSketch

export function formatDate(dateInput, options = {}) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';

  const intervals = [
    { label: 'year', secs: 31536000 },
    { label: 'month', secs: 2592000 },
    { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 },
    { label: 'minute', secs: 60 },
  ];

  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

export function formatPercent(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(decimals)}%`;
}

export function getConfidenceLevel(score) {
  const normalized = score <= 1 ? score * 100 : score;
  if (normalized >= 85) return 'high';
  if (normalized >= 60) return 'medium';
  return 'low';
}

export function getConfidenceColor(score) {
  const level = getConfidenceLevel(score);
  switch (level) {
    case 'high':
      return '#22c55e';
    case 'medium':
      return '#eab308';
    case 'low':
    default:
      return '#ef4444';
  }
}

export function getStatusColor(status) {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'open':
    case 'active':
      return '#3b82f6';
    case 'closed':
    case 'resolved':
      return '#22c55e';
    case 'pending':
    case 'in-progress':
    case 'in progress':
      return '#eab308';
    case 'cold':
    case 'archived':
      return '#6b7280';
    case 'urgent':
    case 'critical':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function classNames(...args) {
  return args
    .flat()
    .filter(Boolean)
    .join(' ');
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sortByDate(items, key = 'date', direction = 'desc') {
  const sorted = [...items].sort((a, b) => {
    const dateA = new Date(a[key]).getTime();
    const dateB = new Date(b[key]).getTime();
    return direction === 'desc' ? dateB - dateA : dateA - dateB;
  });
  return sorted;
}

export function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const group = typeof key === 'function' ? key(item) : item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function searchFilter(items, query, fields = []) {
  if (!query) return items;
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(lowerQuery);
    })
  );
}