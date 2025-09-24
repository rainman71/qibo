// components/ProductTour.jsx
"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

export default function ProductTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [run, setRun] = useState(false);
  const [step, setStep] = useState(0);

  const rawSteps = useMemo(() => {
    const map = {
      "/":        [{ target: "body", content: "Tour is mounted. Pick a demo.", placement: "center" }],
      "/avatar":  [
        { target: '[data-tour="avatar-male"]',   content: "Pick a starting avatar.", placement: "bottom" },
        { target: '[data-tour="avatar-female"]', content: "Or choose this one.",     placement: "bottom" },
        { target: '[data-tour="continue-to-intake"]', content: "Continue to intake.", placement: "top" },
        { target: "ROUTE:/intake", content: "Heading to intake…" },
      ],
      "/intake":  [
        { target: '[data-tour="intake-section1"]', content: "Basic info.", placement: "bottom" },
        { target: '[data-tour="intake-section2"]', content: "One more field.", placement: "bottom" },
        { target: '[data-tour="submit-intake"]',   content: "Submit to start visit.", placement: "top" },
        { target: "ROUTE:/chart", content: "Jumping into the visit…" },
      ],
      "/chart":   [
        { target: '[data-tour="physician-join"]', content: "Physician joins here.", placement: "right" },
        { target: '[data-tour="soap-notes"]',     content: "Chart SOAP here.",      placement: "bottom" },
        { target: '[data-tour="order-herbs"]',    content: "Order herbs here.",     placement: "left" },
      ],
    };
    return map[pathname] ?? [];
  }, [pathname]);

  const steps = rawSteps.map((s) =>
    s.target.startsWith?.("ROUTE:")
      ? s
      : { ...s, disableBeacon: true, placement: s.placement ?? "auto" }
  );

  useEffect(() => {
    if (steps.length === 0) return;
    const current = rawSteps[step];
    const isRouteHop = current?.target?.startsWith?.("ROUTE:");
    const isCenter   = current?.placement === "center" || current?.target === "body";

    if (isRouteHop || isCenter) { setRun(true); return; }

    const ready = steps.every((s) => {
      const sel = s.target;
      if (!sel || sel.startsWith("ROUTE:") || s.placement === "center") return true;
      try { return !!document.querySelector(sel); } catch { return false; }
    });
    if (ready) setRun(true);
  }, [rawSteps, step, steps]);

  const callback = (data) => {
    const { action, index, status, type } = data;

    if (status === "finished" || status === "skipped") {
      // Don’t save anything → it will show again next visit
      setRun(false);
      setStep(0);
      return;
    }

    if (type === "step:after") {
      const nextIndex = action === "prev" ? Math.max(0, index - 1) : index + 1;
      const nextRaw = rawSteps[nextIndex];

      if (nextRaw?.target?.startsWith?.("ROUTE:")) {
        const to = nextRaw.target.replace("ROUTE:", "");
        setRun(false);
        setStep(nextIndex);
        router.push(to);
        return;
      }
      setStep(nextIndex);
    }
  };

  return steps.length ? (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={step}
      continuous
      showSkipButton
      showProgress
      spotlightPadding={6}
      disableScrolling={false}
      styles={{ options: { zIndex: 999999 }, tooltipContent: { maxWidth: 360 } }}
      locale={{ back: "Back", close: "Close", last: "Done", next: "Next", skip: "Skip" }}
      callback={callback}
    />
  ) : null;
}
