import React from 'react';

export default function App() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📦 Bundle Watch</h1>
      <p style={styles.subtitle}>Webpack + Bundle Watch Example</p>
      <p style={styles.description}>
        This app is built with Webpack and analyzed by Bundle Watch!
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 1rem',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.5rem',
    margin: '0 0 2rem',
    color: '#666',
  },
  description: {
    fontSize: '1.1rem',
    color: '#888',
  },
};

