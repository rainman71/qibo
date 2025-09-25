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
  const shownThisVisit = useRef(new Set());    // show once per route per visit
  const startedRef = useRef(false);
  const advanceCleanup = useRef<null | (() => void)>(null);

  // --- STEP DEFINITIONS ------------------------------------------------------
  // Add `advanceOn` to require a real user action, and optional `spotlightClicks`.
  const rawSteps = useMemo(() => {
    const map = {
      "/avatar": [
        {
          target: '[data-tour="avatar-male"]',
          content: "Pick a starting avatar.",
          placement: "bottom",
          spotlightClicks: true,
        },
        {
          target: '[data-tour="avatar-female"]',
          content: "Or choose this one.",
          placement: "bottom",
          spotlightClicks: true,
        },
        {
          target: '[data-tour="continue-to-intake"]',
          content: "Click Continue to move on to a short intake.",
          placement: "top",
          spotlightClicks: true,
          advanceOn: { event: "click", selector: '[data-tour="continue-to-intake"]' },
        },
        { target: "ROUTE:/intake", content: "Heading to intake…" },
      ],
      "/intake": [
        {
          target: '[data-tour="intake-section1"]',
          content: "Enter a value here to proceed.",
          placement: "bottom",
          spotlightClicks: true,
          advanceOn: { event: "input", selector: '[data-tour="intake-section1"]' },
        },
        {
          target: '[data-tour="intake-section2"]',
          content: "And add one here too.",
          placement: "bottom",
          spotlightClicks: true,
          advanceOn: { event: "input", selector: '[data-tour="intake-section2"]' },
        },
        {
          target: '[data-tour="submit-intake"]',
          content: "Click Submit to start the visit.",
          placement: "top",
          spotlightClicks: true,
          advanceOn: { event: "click", selector: '[data-tour="submit-intake"]' },
        },
        { target: "ROUTE:/chart", content: "Jumping into the visit…" },
      ],
      "/chart": [
        {
          target: '[data-tour="physician-join"]',
          content: "Your physician avatar joins here.",
          placement: "right",
        },
        {
          target: '[data-tour="soap-notes"]',
          content: "This is where the clinician charts SOAP.",
          placement: "bottom",
        },
        {
          target: '[data-tour="order-herbs"]',
          content: "Order herbs here with interaction checks.",
          placement: "left",
          spotlightClicks: true,
        },
      ],
    };
    return map[pathname] ?? [];
  }, [pathname]);

  // Normalize for Joyride (keep ROUTE sentinels)
  const steps = useMemo(
    () =>
      rawSteps.map((s) =>
        s.target?.startsWith?.("ROUTE:")
          ? s
          : {
              ...s,
              disableBeacon: true,
              placement: s.placement ?? "auto",
            }
      ),
    [rawSteps]
  );

  // Reset when route’s step list changes
  useEffect(() => {
    startedRef.current = false;
    setRun(false);
    if (step >= rawSteps.length) setStep(0);
    // cleanup a previous advanceOn listener, if any
    if (advanceCleanup.current) {
      advanceCleanup.current();
      advanceCleanup.current = null;
    }
  }, [rawSteps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start once per route per visit (unless Restart is pressed)
  useEffect(() => {
    if (steps.length === 0 || startedRef.current) return;
    if (shownThisVisit.current.has(pathname)) return;

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

  // Attach advanceOn handler for the CURRENT step (if provided)
  useEffect(() => {
    if (!run) return;

    const current = rawSteps[step];
    const cfg = current?.advanceOn;
    if (!cfg) return;

    const el = document.querySelector(cfg.selector);
    if (!el) return;

    const handler = () => {
      // emulate "next"
      setStep((i) => Math.min(i + 1, rawSteps.length - 1));
    };
    el.addEventListener(cfg.event, handler, { once: true });

    // store cleanup
    advanceCleanup.current = () => el.removeEventListener(cfg.event, handler);
    return () => {
      el.removeEventListener(cfg.event, handler);
      advanceCleanup.current = null;
    };
  }, [run, step, rawSteps]);

  const callback = (data) => {
    const { action, index, status, type } = data;

    // If they try to skip/close, send them to root (or remove the button entirely; see Joyride props below)
    if (status === "skipped") {
      setRun(false);
      setStep(0);
      startedRef.current = false;
      router.push("/");
      return;
    }
    if (status === "finished") {
      setRun(false);
      setStep(0);
      startedRef.current = false;
      return;
    }

    if (type === "step:after") {
      const nextIndex = action === "prev" ? Math.max(0, index - 1) : index + 1;
      const nextRaw = rawSteps[nextIndex];

      // Clean up any prior advanceOn listener before moving forward/back
      if (advanceCleanup.current) {
        advanceCleanup.current();
        advanceCleanup.current = null;
      }

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

  // Restart hook
  useEffect(() => {
    window.restartTour = () => {
      shownThisVisit.current.delete(pathname);
      startedRef.current = false;
      setStep(0);
      setRun(true);
    };
  }, [pathname]);

  if (!steps.length) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={step}
      continuous
      showProgress
      // --- BEHAVIOR: no Skip, no closing via overlay/Esc
      showSkipButton={false}
      disableOverlayClose
      disableCloseOnEsc
      // Allow clicking highlighted elements when a step sets `spotlightClicks: true`
      // (Joyride doesn't support per-step here; set true globally; gate with advanceOn when needed)
      spotlightClicks
      // --- DARK THEME (tweak primaryColor to match your brand)
      styles={{
        options: {
          zIndex: 999999,
          backgroundColor: "#0b0f1a", // tooltip background
          textColor: "#e5e7eb",
          arrowColor: "#0b0f1a",
          overlayColor: "rgba(0,0,0,0.6)",
          primaryColor: "#ad1123",    // <-- accent color (change to match ROI calculator)
        },
        tooltipContainer: { color: "#e5e7eb" },
        tooltipContent: { maxWidth: 380 },
        buttonNext: { backgroundColor: "#ad1123", color: "#fff" },
        buttonBack: { color: "#9ca3af" },
      }}
      locale={{
        back: "Back",
        close: "Close",   // won't show since skip is hidden; kept for completeness
        last: "Done",
        next: "Next",
        skip: "Skip",
      }}
      callback={callback}
    />
  );
}
