"use client";

import { useState } from "react";
import NetworkDiagram, { NetNode, NetLink } from "@/components/NetworkDiagram";

const nodes: NetNode[] = [
  { id: "laptop", type: "client", label: "Laptop", ip: "10.0.0.5", x: 60, y: 200 },
  { id: "R1", type: "router", label: "R1", ip: "10.0.0.1", x: 200, y: 200 },
  { id: "R2", type: "router", label: "R2", ip: "10.10.0.1", x: 340, y: 100 },
  { id: "R3", type: "router", label: "R3", ip: "10.10.0.2", x: 340, y: 320 },
  { id: "R4", type: "router", label: "R4", ip: "10.20.0.1", x: 500, y: 200 },
  { id: "server", type: "server", label: "Event Server", ip: "10.20.0.10", x: 660, y: 200 },
];

const links: NetLink[] = [
  { from: "laptop", to: "R1" },
  { from: "R1", to: "R2" },
  { from: "R1", to: "R3" },
  { from: "R2", to: "R3", broken: true, label: "down" },
  { from: "R2", to: "R4" },
  { from: "R3", to: "R4" },
  { from: "R4", to: "server" },
];

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

export default function Mission1Route({ sessionId, onResult }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (path: string[]): Promise<{ success: boolean; message: string }> => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 1,
          payload: { path },
        }),
      });
      const data = await res.json();
      // Check if path traverses broken link
      const hasBroken = checkBroken(path);
      if (hasBroken && !data.success) {
        return {
          success: false,
          message: "Packet hit a broken link (R2–R3) and was dropped. Try a different route.",
        };
      }
      return {
        success: data.success,
        message: data.message,
      };
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-pp-border rounded-full text-xs font-mono text-pp-muted mb-3">
          MISSION 1 · EASY · 100 PTS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Route the Packet</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          A student's laptop needs to send a packet to the college event server.
          Click the laptop to start, then click adjacent nodes to build a route.
          Avoid broken links. Click "Send Packet" when ready.
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
          <span className="text-pp-muted">
            Source: <span className="text-pp-light">10.0.0.5</span> (Laptop)
          </span>
          <span className="text-pp-muted">
            Destination: <span className="text-pp-light">10.20.0.10</span> (Event Server)
          </span>
        </div>
      </div>

      <div className="bg-pp-card border border-pp-border rounded-xl p-4 md:p-6">
        <NetworkDiagram
          nodes={nodes}
          links={links}
          startNode="laptop"
          endNode="server"
          onPathSubmit={handleSubmit}
          showBrokenLabels
        />
      </div>

      <div className="mt-4 p-4 bg-pp-bg-2/50 border border-pp-border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Concepts</h3>
        <p className="text-xs text-pp-muted">
          Routers forward packets between networks. A packet needs a viable path
          from source to destination. If a link is broken, packets must take an
          alternative route.
        </p>
      </div>
    </div>
  );
}

function checkBroken(path: string[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const pair = new Set([path[i], path[i + 1]]);
    if (pair.has("R2") && pair.has("R3")) return true;
  }
  return false;
}