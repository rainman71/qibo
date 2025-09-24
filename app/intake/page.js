// app/intake/page.js
"use client";

import { useRouter } from "next/navigation";

export default function IntakePage() {
  const router = useRouter();
  const onSubmit = (e) => { e.preventDefault(); router.push("/chart"); };

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Quick Intake</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <label className="block">
          <span className="text-sm text-gray-600">Section 1</span>
          <input data-tour="intake-section1" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Section 2</span>
          <input data-tour="intake-section2" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button data-tour="submit-intake" type="submit" className="px-4 py-2 rounded bg-black text-white">
          Submit
        </button>
      </form>
    </main>
  );
}
