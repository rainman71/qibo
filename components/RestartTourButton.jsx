// components/RestartTourButton.jsx
"use client";
export default function RestartTourButton() {
  return (
    <button onClick={() => window.restartTour?.()} className="ml-3 px-3 py-2 rounded border">
      Restart Tour
    </button>
  );
}
