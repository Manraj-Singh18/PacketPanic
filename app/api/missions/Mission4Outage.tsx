"use client";

import { useState } from "react";
import NetworkDiagram, { NetNode, NetLink } from "@/components/NetworkDiagram";
import { Lightbulb, Terminal, Wrench } from "lucide-react";

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

const nodes: NetNode[] = [
  { id: "client", type: "client", label: "Client", ip: "10.0.0.5", x: 60, y: 200 },
  { id: "RA", type: "router", label: "RA", ip: "10.0.0.1", x: 200, y: 200 },
  { id: "RB", type: "router", label: "RB", ip: "10.30.0.1", x: 360, y: 80 },
  { id: "RC", type: "router", label: "RC", ip: "10.30.0.2", x: 360, y: 320 },
  { id: "RD", type: "router", label: "RD", ip: "10.40.0.1", x: 520, y: 200 },
  { id: "event_server", type: "server", label: "Event Server", ip: "10.20.0.10", x: 680, y: 200 },
];

const links: NetLink[] = [
  { from: "client", to: "RA" },
  { from: "RA", to: "RB" },
  { from: "RA", to: "RC" },
  { from: "RB", to: "RD", broken: true },
  { from: "RC", to: "RD" },
  { from: "RD", to: "event_server" },
];

const DIAGNOSES = [
  { id: "wrong_dest_ip", label: "Destination IP is incorrect", correct: false },
  { id: "link_failure_alt_route", label: "Link failure on path via RB; use alternative route via RC", correct: true },
  { id: "dns_failure", label: "DNS resolution failed", correct: false },
  { id: "wrong_protocol", label: "Wrong transport protocol selected", correct: false },
];

export default function Mission4Outage({ sessionId, onResult }: Props) {
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [route, setRoute] = useState<string[]>([]);
  const [protocol, setProtocol] = useState<"TCP" | "UDP" | null>(null);
  const [hintShown, setHintShown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePathSubmit = async (path: string[]): Promise<{ success: boolean; message: string }> => {
    setRoute(path);
    return { success: true, message: "Route captured. Continue with diagnosis and protocol." };
  };

  const submit = async () => {
    if (!diagnosis || route.length < 2 || !protocol) {
      onResult({ success: false, message: "Complete all three sections before submitting." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 4,
          payload: { diagnosis, route, protocol },
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
          MISSION 4 · MEDIUM-HARD · 300 PTS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">The Final Outage</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          The event server is still unreachable. Investigate the topology, review
          the diagnostic console, choose a diagnosis, select a working route, and
          pick the correct transport protocol.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Network diagram */}
        <div className="lg:col-span-2 bg-pp-card border border-pp-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Network Topology</h3>
          <NetworkDiagram
            nodes={nodes}
            links={links}
            startNode="client"
            endNode="event_server"
            onPathSubmit={handlePathSubmit}
            showBrokenLabels
          />
          <div className="mt-3 text-xs text-pp-muted font-mono">
            Selected route:{" "}
            {route.length > 0
              ? route.map((r) => nodes.find((n) => n.id === r)?.label).join(" → ")
              : "none"}
          </div>
        </div>

        {/* Diagnostic console */}
        <div className="bg-pp-card border border-pp-border rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Terminal size={16} className="text-pp-electric" />
            Diagnostic Console
          </h3>
          <div className="space-y-2 text-xs font-mono text-pp-muted">
            <div className="p-2 bg-pp-bg-2/60 rounded border border-pp-border/50">
              ✓ Destination IP matches event server (10.20.0.10)
            </div>
            <div className="p-2 bg-pp-bg-2/60 rounded border border-pp-border/50">
              ✗ Router RB reports outgoing link to RD is down
            </div>
            <div className="p-2 bg-pp-bg-2/60 rounded border border-pp-border/50">
              ✓ Alternative path via RC is operational
            </div>
            <div className="p-2 bg-pp-bg-2/60 rounded border border-pp-border/50">
              ✓ Application: file transfer requires reliable, ordered delivery
            </div>
            <div className="p-2 bg-pp-bg-2/60 rounded border border-pp-border/50 text-pp-muted/70">
              ? DNS cache shows recent lookups (irrelevant to current issue)
            </div>
          </div>
        </div>
      </div>

      {/* Selections */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {/* Diagnosis */}
        <div className="bg-pp-card border border-pp-border rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Wrench size={16} className="text-pp-electric" />
            1. Diagnosis
          </h3>
          <div className="space-y-2">
            {DIAGNOSES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDiagnosis(d.id)}
                className={`w-full text-left p-2.5 rounded border text-xs transition-all ${
                  diagnosis === d.id
                    ? "border-pp-electric bg-pp-electric/10 text-pp-light"
                    : "border-pp-border text-pp-muted hover:border-pp-light"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Route (mirror of network) */}
        <div className="bg-pp-card border border-pp-border rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Wrench size={16} className="text-pp-electric" />
            2. Route Selection
          </h3>
          <p className="text-xs text-pp-muted mb-3">
            Select a route in the network diagram above. Avoid the broken link
            (RB → RD).
          </p>
          <div className="text-xs font-mono p-2.5 bg-pp-bg-2/60 rounded border border-pp-border/50 min-h-[60px]">
            {route.length > 0
              ? route.map((r) => nodes.find((n) => n.id === r)?.label).join(" → ")
              : "No route selected"}
          </div>
        </div>

        {/* Protocol */}
        <div className="bg-pp-card border border-pp-border rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Wrench size={16} className="text-pp-electric" />
            3. Transport Protocol
          </h3>
          <p className="text-xs text-pp-muted mb-3">
            The application requires reliable, ordered delivery of files.
          </p>
          <div className="flex gap-2">
            {(["TCP", "UDP"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={`flex-1 py-2 rounded border font-mono font-bold text-sm transition-all ${
                  protocol === p
                    ? "border-pp-electric bg-pp-electric/10 text-pp-electric"
                    : "border-pp-border text-pp-muted hover:border-pp-light"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit and hint */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setHintShown(true)}
          disabled={hintShown}
          className="text-xs text-pp-muted hover:text-pp-light flex items-center gap-1 disabled:opacity-50"
        >
          <Lightbulb size={14} /> {hintShown ? "Hint shown (-25 pts)" : "Show hint (-25 pts)"}
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-6 py-2.5 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Final Diagnosis"}
        </button>
      </div>

      {hintShown && (
        <div className="mt-3 p-3 bg-pp-bg-2/60 border border-pp-border rounded text-xs text-pp-muted italic">
          Hint: The destination IP is already correct. Focus on the link failure
          and the application's need for reliable delivery.
        </div>
      )}

      <div className="mt-4 p-4 bg-pp-bg-2/50 border border-pp-border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Concepts</h3>
        <p className="text-xs text-pp-muted">
          Real troubleshooting requires checking multiple layers: addressing
          (is the destination right?), the network path (are links working?),
          and the transport protocol (does the application need TCP or UDP?).
          Don't be misled by irrelevant clues.
        </p>
      </div>
    </div>
  );
}