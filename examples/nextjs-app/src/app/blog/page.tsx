export default function Blog() {
  const posts = [
    { id: 1, title: 'Getting Started with Bundle Watch', date: '2025-11-01' },
    { id: 2, title: 'Optimizing Your Bundle Size', date: '2025-11-02' },
    { id: 3, title: 'Advanced Bundle Analysis', date: '2025-11-03' },
  ];

  return (
    <main className="min-h-screen bg-green-50 py-12">
      <div className="max-w-4xl mx-auto px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Blog</h1>
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {post.title}
              </h2>
              <p className="text-gray-600 text-sm">{post.date}</p>
            </article>
          ))}
        </div>
        <a
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          ← Back Home
        </a>
      </div>
    </main>
  );
}

