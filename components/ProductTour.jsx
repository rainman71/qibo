// components/ProductTour.jsx
"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

export default function ProductTour() {
  const pathname = usePathname();
  const router = useRouter();
  const [run, setRun] = useState(false);
  const [step, setStep] = useState(0);

  // Track which routes have already shown the tour in THIS visit
  const shownThisVisit = useRef(new Set()); // e.g., "/avatar", "/intake", "/chart"
  const startedRef = useRef(false);

  const rawSteps = useMemo(() => {
    const map = {
      "/avatar": [
        { target: '[data-tour="avatar-male"]',   content: "Pick a starting avatar.", placement: "bottom" },
        { target: '[data-tour="avatar-female"]', content: "Or choose this one.",     placement: "bottom" },
        { target: '[data-tour="continue-to-intake"]', content: "Continue to intake.", placement: "top" },
        { target: "ROUTE:/intake", content: "Heading to intake…" },
      ],
      "/intake": [
        { target: '[data-tour="intake-section1"]', content: "Basic info.", placement: "bottom" },
        { target: '[data-tour="intake-section2"]', content: "One more field.", placement: "bottom" },
        { target: '[data-tour="submit-intake"]',   content: "Submit to start visit.", placement: "top" },
        { target: "ROUTE:/chart", content: "Jumping into the visit…" },
      ],
      "/chart": [
        { target: '[data-tour="physician-join"]', content: "Physician joins here.", placement: "right" },
        { target: '[data-tour="soap-notes"]',     content: "Chart SOAP here.",      placement: "bottom" },
        { target: '[data-tour="order-herbs"]',    content: "Order herbs here.",     placement: "left" },
      ],
    };
    return map[pathname] ?? [];
  }, [pathname]);

  const steps = useMemo(
    () =>
      rawSteps.map((s) =>
        s.target?.startsWith?.("ROUTE:")
          ? s
          : { ...s, disableBeacon: true, placement: s.placement ?? "auto" }
      ),
    [rawSteps]
  );

  // Reset on route change
  useEffect(() => {
    startedRef.current = false;
    setRun(false);
    if (step >= rawSteps.length) setStep(0);
  }, [rawSteps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start once per route per navigation (unless user hits Restart)
  useEffect(() => {
    if (steps.length === 0 || startedRef.current) return;
    if (shownThisVisit.current.has(pathname)) return; // already shown on this route

    const current = rawSteps[step];
    const isRouteHop = current?.target?.startsWith?.("ROUTE:");

    if (isRouteHop) {
      setRun(true);
      startedRef.current = true;
      shownThisVisit.current.add(pathname);
      return;
    }

    const ready = steps.every((s) => {
      const sel = s.target;
      if (!sel || sel.startsWith?.("ROUTE:")) return true;
      try { return !!document.querySelector(sel); } catch { return false; }
    });

    if (ready) {
      setRun(true);
      startedRef.current = true;
      shownThisVisit.current.add(pathname);
    }
  }, [pathname, rawSteps, step, steps]);

  const callback = (data) => {
    const { action, index, status, type } = data;

    if (status === "finished" || status === "skipped") {
      setRun(false);
      setStep(0);
      startedRef.current = false;
      return;
    }

    if (type === "step:after") {
      const nextIndex = action === "prev" ? Math.max(0, index - 1) : index + 1;
      const nextRaw = rawSteps[nextIndex];

      if (nextRaw?.target?.startsWith?.("ROUTE:")) {
        const to = nextRaw.target.replace("ROUTE:", "");
        setRun(false);
        setStep(nextIndex);
        startedRef.current = false;
        router.push(to);
        return;
      }
      setStep(nextIndex);
    }
  };

  // Manual restart hook (also clears the per-route gate)
  useEffect(() => {
    window.restartTour = () => {
      shownThisVisit.current.delete(pathname);
      startedRef.current = false;
      setStep(0);
      setRun(false);

      const ready = steps.every((s) => {
        const sel = s.target;
        if (!sel || sel.startsWith?.("ROUTE:")) return true;
        try { return !!document.querySelector(sel); } catch { return false; }
      });
      if (ready) {
        setRun(true);
        startedRef.current = true;
        shownThisVisit.current.add(pathname);
      }
    };
  }, [pathname, steps]);

  if (!steps.length) return null;

  return (
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
  );
}
