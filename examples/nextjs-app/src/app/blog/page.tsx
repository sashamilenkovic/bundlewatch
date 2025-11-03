export default function Blog() {
  const posts = [
    { id: 1, title: 'Getting Started with Bundle Watch', date: '2025-11-01' },
    { id: 2, title: 'Optimizing Your Bundle Size', date: '2025-11-02' },
    { id: 3, title: 'Advanced Bundle Analysis', date: '2025-11-03' },
  ];

  return (
    <main style={{ background: '#f0fdf4', padding: '3rem 0' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>Blog</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {post.title}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{post.date}</p>
            </article>
          ))}
        </div>
        <a
          href="/"
          className="button button-green"
          style={{ marginTop: '2rem' }}
        >
          ← Back Home
        </a>
      </div>
    </main>
  );
}

