import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Welcome to iGebra</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/lessons" className="block">
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">Start Learning</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Begin your journey with our interactive lessons
              </p>
            </div>
          </Link>
          <Link href="/practice" className="block">
            <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold mb-2">Practice</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Test your knowledge with practice problems
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
