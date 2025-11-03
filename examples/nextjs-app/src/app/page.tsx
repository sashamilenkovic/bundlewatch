export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📦 Bundle Watch
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Next.js App Router + Bundle Watch Example
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/about"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            About Page
          </a>
          <a
            href="/blog"
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Blog
          </a>
        </div>
      </div>
    </main>
  );
}

