export default function About() {
  return (
    <main style={{ background: '#eff6ff' }}>
      <div className="container" style={{ maxWidth: '42rem' }}>
        <h1>About Bundle Watch</h1>
        <p style={{ marginBottom: '1rem' }}>
          Bundle Watch tracks your build metrics over time, helping you:
        </p>
        <ul style={{ listStyle: 'disc', paddingLeft: '2rem', marginBottom: '2rem', color: '#374151' }}>
          <li>Monitor bundle sizes</li>
          <li>Track performance trends</li>
          <li>Detect regressions early</li>
          <li>Optimize your builds</li>
        </ul>
        <a href="/" className="button button-blue">
          ← Back Home
        </a>
      </div>
    </main>
  );
}

