// app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">QiBo Demo</h1>
      <p className="text-gray-600">Choose an experience:</p>
      <div className="flex flex-col gap-4 w-64">
        <Link
          href="/qibocalculator"
          className="px-6 py-3 rounded bg-blue-600 text-white text-center"
        >
          ROI Calculator
        </Link>
        <Link
          href="/avatar"
          className="px-6 py-3 rounded bg-green-600 text-white text-center"
        >
          Product Tour
        </Link>
      </div>
    </main>
  );
}
