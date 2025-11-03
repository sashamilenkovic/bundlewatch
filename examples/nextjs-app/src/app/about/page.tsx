export default function About() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="max-w-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About Bundle Watch
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          Bundle Watch tracks your build metrics over time, helping you:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Monitor bundle sizes</li>
          <li>Track performance trends</li>
          <li>Detect regressions early</li>
          <li>Optimize your builds</li>
        </ul>
        <a
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          ← Back Home
        </a>
      </div>
    </main>
  );
}

