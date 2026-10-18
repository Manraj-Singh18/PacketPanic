"use client";

import { useEffect, useState, useRef } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  startTime: number; // server timestamp ms
  durationSeconds: number;
  onExpire?: () => void;
}

export default function Timer({ startTime, durationSeconds, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const currentNow = Date.now();
      setNow(currentNow);
      const elapsed = Math.floor((currentNow - startTime) / 1000);
      const rem = Math.max(0, durationSeconds - elapsed);
      setRemaining(rem);
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [startTime, durationSeconds, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isCritical = remaining <= 30 && remaining > 0;
  const isExpired = remaining <= 0;
  const pct = (remaining / durationSeconds) * 100;

  return (
    <div className={`flex flex-col items-center ${isCritical ? "timer-critical" : ""}`}>
      <div className="flex items-center gap-2 text-pp-muted text-xs uppercase tracking-wider">
        <Clock size={14} />
        Time Remaining
      </div>
      <div
        className={`mt-1 font-mono text-3xl font-bold tabular-nums ${
          isExpired ? "text-red-500" : isCritical ? "text-red-400" : "text-pp-light"
        }`}
      >
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
      <div className="w-full h-1 bg-pp-border rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isExpired || isCritical ? "bg-red-500" : "bg-pp-electric"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}