'use client';

import { useState } from 'react';
import _ from 'lodash';
import { format, formatDistance, subDays } from 'date-fns';
import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';

// Zustand store for demo
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// Fake API call for react-query demo
async function fetchStats() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    bundleSize: '799 KB',
    gzipSize: '240 KB',
    chunks: 28,
  };
}

export default function Home() {
  const [items] = useState(['React', 'Next.js', 'TypeScript', 'Tailwind']);
  const { count, increment, decrement } = useStore();

  // React Query for data fetching
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  // Lodash usage
  const shuffledItems = _.shuffle(items);
  const chunkedItems = _.chunk(shuffledItems, 2);

  // Date-fns usage
  const now = new Date();
  const formattedDate = format(now, 'PPP');
  const relativeDate = formatDistance(subDays(now, 3), now, { addSuffix: true });

  return (
    <main>
      <div className="container">
        <h1>Bundle Watch</h1>
        <p>Next.js App Router + Bundle Watch Example</p>

        <section style={{ marginTop: '2rem' }}>
          <h2>Zustand Counter</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={decrement} className="button">-</button>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{count}</span>
            <button onClick={increment} className="button">+</button>
          </div>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>Date-fns Demo</h2>
          <p>Today: {formattedDate}</p>
          <p>3 days ago was {relativeDate}</p>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>Lodash Demo</h2>
          <p>Shuffled & chunked items:</p>
          {chunkedItems.map((chunk, i) => (
            <div key={i}>{chunk.join(' | ')}</div>
          ))}
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2>React Query Demo</h2>
          {isLoading ? (
            <p>Loading stats...</p>
          ) : (
            <div>
              <p>Bundle: {stats?.bundleSize}</p>
              <p>Gzip: {stats?.gzipSize}</p>
              <p>Chunks: {stats?.chunks}</p>
            </div>
          )}
        </section>

        <div className="button-group" style={{ marginTop: '2rem' }}>
          <a href="/about" className="button button-blue">
            About Page
          </a>
          <a href="/blog" className="button button-green">
            Blog
          </a>
        </div>
      </div>
    </main>
  );
}
