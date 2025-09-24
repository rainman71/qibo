// components/ProductTour.jsx
"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });
const STORAGE_KEY = "qibo.tour.v1";

function useTourState() {
  const [seen, setSeen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSeen(!!parsed.seen);
        setStep(parsed.step ?? 0);
      }
    } catch {}
  }, []);

  const save = (u) => {
    const next = { seen, step, ...u };
    setSeen(next.seen);
    setStep(next.step);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return { seen, step, save };
}

export default function ProductTour() {
  const pathname = usePathname();
  const router = useRouter();
  const { seen, step, save } = useTourState();
  const [run, setRun] = useState(false);

  const stepsByRoute = {
    "/avatar": [
      { target: '[data-tour="avatar-male"]',   content: "Pick a starting avatar. You can change later.", placement: "bottom" },
      { target: '[data-tour="avatar-female"]', content: "Same here—choose whichever you prefer.", placement: "bottom" },
      { target: '[data-tour="continue-to-intake"]', content: "Next we’ll do a super-quick intake.", placement: "top" },
      { target: "ROUTE:/intake", content: "Heading to intake…" },
    ],
    "/intake": [
      { target: '[data-tour="intake-section1"]', content: "A few basics so the system can tailor the plan.", placement: "bottom" },
      { target: '[data-tour="intake-section2"]', content: "One more field and you’re set.", placement: "bottom" },
      { target: '[data-tour="submit-intake"]',   content: "Submit to start the visit.", placement: "top" },
      { target: "ROUTE:/chart", content: "Jumping into the visit…" },
    ],
    "/chart": [
      { target: '[data-tour="physician-join"]', content: "Your physician avatar joins here automatically.", placement: "right" },
      { target: '[data-tour="soap-notes"]',     content: "Clinician charts in SOAP. Patients see a summary later.", placement: "bottom" },
      { target: '[data-tour="order-herbs"]',    content: "Order herbs with interaction checks here.", placement: "left" },
    ],
  };

  const rawSteps = stepsByRoute[pathname] ?? [];
  const steps = rawSteps.map((s) =>
    s.target.startsWith("ROUTE:")
      ? s
      : { ...s, disableBeacon: true, placement: s.placement ?? "auto" }
  );

  useEffect(() => {
    if (seen || steps.length === 0) return;

    const current = rawSteps[step];
    const isRouteHop = current?.target?.startsWith?.("ROUTE:");

    if (isRouteHop) { setRun(true); return; }

    const ready = steps.every((s) => {
      const sel = s.target;
      if (!sel || sel.startsWith("ROUTE:")) return true;
      try { return !!document.querySelector(sel); } catch { return false; }
    });

    if (ready) setRun(true);
  }, [pathname, seen, step, steps.length]);

  const callback = (data) => {
    const { action, index, status, type } = data;

    if (status === "finished" || status === "skipped") {
      save({ seen: true, step: 0 });
      setRun(false);
      return;
    }

    if (type === "step:after") {
      const nextIndex = action === "prev" ? Math.max(0, index - 1) : index + 1;
      const nextRaw = rawSteps[nextIndex];

      if (nextRaw?.target?.startsWith?.("ROUTE:")) {
        const to = nextRaw.target.replace("ROUTE:", "");
        save({ step: nextIndex });
        setRun(false);
        router.push(to);
        return;
      }
      save({ step: nextIndex });
    }
  };

  useEffect(() => {
    window.restartTour = () => { save({ seen: false, step: 0 }); setRun(true); };
  }, []);

  if (seen || steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={step}
      continuous
      showSkipButton
      showProgress
      disableScrolling={false}
      spotlightPadding={6}
      styles={{ options: { zIndex: 10000 }, tooltipContent: { maxWidth: 360 } }}
      locale={{ back: "Back", close: "Close", last: "Done", next: "Next", skip: "Skip" }}
      callback={callback}
    />
  );
}
