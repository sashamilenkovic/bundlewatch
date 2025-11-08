'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

export default function Home() {
  const [time, setTime] = useState(new Date());
  const [data, setData] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    axios.get('https://api.github.com/repos/anthropics/claude-code')
      .then(res => setData(res.data.description))
      .catch(() => setData('Bundle Watch + Next.js Example'));

    return () => clearInterval(timer);
  }, []);

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>📦 Bundle Watch + Next.js</h1>
      <p style={styles.subtitle}>{format(time, 'PPpp')}</p>
      <p style={styles.description}>{data}</p>
      <div style={styles.card}>
        <p>This Next.js app uses Bundle Watch via the Webpack plugin!</p>
        <p>Check <code>bundle-report/index.html</code> after building.</p>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 1rem',
  },
  subtitle: {
    fontSize: '1.5rem',
    margin: '0 0 2rem',
    color: '#94a3b8',
  },
  description: {
    fontSize: '1.1rem',
    color: '#cbd5e1',
    marginBottom: '2rem',
  },
  card: {
    background: '#1e293b',
    padding: '2rem',
    borderRadius: '0.5rem',
    border: '1px solid #334155',
    maxWidth: '600px',
    textAlign: 'center' as const,
  },
};
