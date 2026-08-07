"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number counting up from 0 to `value` on mount / whenever
 * `value` changes. Purely cosmetic — falls back instantly if the browser
 * has no rAF (SSR-safe: renders the final value on first paint via CSS
 * animation only, no layout shift).
 */
export default function CountUp({
  value,
  duration = 700,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    startRef.current = undefined;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function tick(ts: number) {
      if (startRef.current === undefined) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-back-ish curve for a lively finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
