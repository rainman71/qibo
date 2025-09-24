// app/chart/page.js
export default function ChartPage() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Visit</h1>

      <div className="rounded border p-4">
        <div data-tour="physician-join" className="font-medium">
          Physician: Dr. Lin (joined)
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded border p-4" data-tour="soap-notes">
          <h2 className="font-semibold mb-2">SOAP Notes</h2>
          <textarea className="w-full h-32 rounded border p-2" placeholder="Subjective, Objective, Assessment, Plan..." />
        </section>

        <section className="rounded border p-4" data-tour="order-herbs">
          <h2 className="font-semibold mb-2">Order Herbs</h2>
          <button className="px-3 py-2 rounded border">New Prescription</button>
        </section>
      </div>

      <a href="/" className="inline-block px-3 py-2 rounded border">Back to Menu</a>
      import RestartTourButton from "../../components/RestartTourButton";
      // ...
      <RestartTourButton />
    </main>
  );
}
