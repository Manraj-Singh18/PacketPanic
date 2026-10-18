"use client";

import { useState } from "react";
import { Lightbulb, Send } from "lucide-react";

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

const devices = [
  { id: "client", label: "Client", ip: "10.0.0.5", x: 60, y: 200, type: "client" },
  { id: "router", label: "Router", ip: "10.0.0.1", x: 280, y: 200, type: "router" },
  { id: "decoy", label: "Old Server", ip: "10.20.0.20", x: 500, y: 100, type: "server", note: "Decommissioned last week" },
  { id: "event_server", label: "Event Server", ip: "10.20.0.10", x: 500, y: 320, type: "server", note: "Hosting tonight's event" },
];

export default function Mission3Addressing({ sessionId, onResult }: Props) {
  const [ip, setIp] = useState("");
  const [hintShown, setHintShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 3,
          payload: { destinationIp: ip },
          hintUsed: hintShown,
        }),
      });
      const data = await res.json();
      onResult({
        success: data.success,
        message: data.message,
        sessionCompleted: data.sessionCompleted,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-pp-border rounded-full text-xs font-mono text-pp-muted mb-3">
          MISSION 3 · MEDIUM · 150 PTS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">The Addressing Crisis</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          The server is running, but the client is sending packets to the wrong
          IP. Inspect the devices below, identify the event server, and enter
          the correct destination IP address.
        </p>
      </div>

      {/* Topology */}
      <div className="bg-pp-card border border-pp-border rounded-xl p-6 mb-6">
        <svg viewBox="0 0 600 400" className="w-full h-auto">
          {/* Links */}
          <line x1="100" y1="200" x2="280" y2="200" stroke="#1E3A5F" strokeWidth="2" />
          <line x1="280" y1="200" x2="500" y2="100" stroke="#1E3A5F" strokeWidth="2" />
          <line x1="280" y1="200" x2="500" y2="320" stroke="#1E3A5F" strokeWidth="2" />

          {/* Devices */}
          {devices.map((d) => (
            <g key={d.id}>
              <circle
                cx={d.x}
                cy={d.y}
                r={32}
                fill="#0A1428"
                stroke="#1E3A5F"
                strokeWidth={2}
              />
              <text
                x={d.x}
                y={d.y + 5}
                textAnchor="middle"
                fill="#93C5FD"
                fontSize="10"
                className="font-mono"
              >
                {d.type === "client" ? "CLIENT" : d.type === "router" ? "ROUTER" : "SERVER"}
              </text>
              <text
                x={d.x}
                y={d.y + 56}
                textAnchor="middle"
                fill="#F1F5F9"
                fontSize="12"
                fontWeight="600"
                className="font-mono"
              >
                {d.label}
              </text>
              <text
                x={d.x}
                y={d.y + 72}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="11"
                className="font-mono"
              >
                {d.ip}
              </text>
              {d.note && (
                <text
                  x={d.x}
                  y={d.y + 88}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="9"
                  className="font-mono"
                >
                  ({d.note})
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* IP entry */}
      <div className="bg-pp-card border border-pp-border rounded-lg p-5">
        <label className="block text-sm font-medium mb-2">
          Enter the correct destination IP address
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="e.g. 10.20.0.X"
            className="flex-1 px-3 py-2.5 bg-pp-bg-2 border border-pp-border rounded-lg font-mono text-pp-text placeholder:text-pp-muted/60 focus:border-pp-electric focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && ip && submit()}
          />
          <button
            onClick={submit}
            disabled={!ip || submitting}
            className="px-5 py-2.5 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} /> Send
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setHintShown(true)}
            disabled={hintShown}
            className="text-xs text-pp-muted hover:text-pp-light flex items-center gap-1 disabled:opacity-50"
          >
            <Lightbulb size={14} /> {hintShown ? "Hint shown (-30 pts)" : "Show hint (-30 pts)"}
          </button>
          {hintShown && (
            <p className="text-xs text-pp-muted italic">
              Hint: The event server hosts tonight's event. Look for the device
              marked as hosting the event, not the decommissioned one.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-pp-bg-2/50 border border-pp-border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Concepts</h3>
        <p className="text-xs text-pp-muted">
          IP addresses identify the source and destination at the network layer.
          Sending packets to the wrong destination IP means they'll be delivered
          to the wrong machine — even if the network is healthy.
        </p>
      </div>
    </div>
  );
}