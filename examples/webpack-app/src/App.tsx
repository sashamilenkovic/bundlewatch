import React, { useState, useEffect } from 'react';
import { format, formatDistance } from 'date-fns';
import { chunk, sortBy, uniq } from 'lodash';
import axios from 'axios';
import classNames from 'classnames';

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Simulate fetching data
    const fetchData = async () => {
      try {
        const response = await axios.get('https://api.github.com/repos/anthropics/claude-code');
        setData(uniq([response.data.name, response.data.description]));
      } catch (error) {
        console.log('Demo mode - API not called');
        setData(['Bundle', 'Watch', 'Example']);
      }
    };

    fetchData();
    return () => clearInterval(timer);
  }, []);

  // Use lodash to chunk data
  const chunkedData = chunk(data, 2);
  const sortedData = sortBy(data, (d: string) => d.length);

  const containerClass = classNames(
    'container',
    { 'has-data': data.length > 0 }
  );

  return (
    <div style={styles.container} className={containerClass}>
      <h1 style={styles.title}>📦 Bundle Watch</h1>
      <p style={styles.subtitle}>Webpack + Bundle Watch Example</p>
      <p style={styles.description}>
        This app is built with Webpack and analyzed by Bundle Watch!
      </p>

      <div style={styles.info}>
        <p>Current time: {format(currentTime, 'PPpp')}</p>
        <p>Time ago: {formatDistance(new Date(2024, 0, 1), currentTime, { addSuffix: true })}</p>
        {data.length > 0 && (
          <>
            <p>Data chunks: {chunkedData.length}</p>
            <p>Sorted items: {sortedData.join(', ')}</p>
          </>
        )}
      </div>
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
  info: {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
};

