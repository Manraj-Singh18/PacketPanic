"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import PacketInspector, { PacketField } from "@/components/PacketInspector";
import RoutingTable, { RoutingEntry } from "@/components/RoutingTable";

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

interface TopoNode {
  id: string;
  label: string;
  ip?: string;
  x: number;
  y: number;
  type: "client" | "router" | "server";
}

const nodes: TopoNode[] = [
  { id: "client", label: "Student Laptop", ip: "192.168.1.25", x: 60, y: 220, type: "client" },
  { id: "RA", label: "RA", ip: "192.168.1.1", x: 220, y: 220, type: "router" },
  { id: "RB", label: "RB", ip: "10.10.0.2", x: 380, y: 110, type: "router" },
  { id: "RC", label: "RC", ip: "10.10.0.3", x: 380, y: 330, type: "router" },
  { id: "RD", label: "RD", ip: "10.20.0.1", x: 540, y: 220, type: "router" },
  { id: "event", label: "Event Server", ip: "10.20.0.10", x: 700, y: 140, type: "server" },
  { id: "archive", label: "Archive Net", ip: "10.30.0.10", x: 700, y: 320, type: "server" },
];

const links: { from: string; to: string; broken?: boolean }[] = [
  { from: "client", to: "RA" },
  { from: "RA", to: "RB" },
  { from: "RA", to: "RC" },
  { from: "RB", to: "RD" },
  { from: "RC", to: "RD" },
  { from: "RD", to: "event" },
  { from: "RB", to: "archive" },
];

const routingTables: Record<string, RoutingEntry[]> = {
  RA: [
    {
      destination: "10.20.0.0",
      mask: "255.255.255.0",
      nextHop: "10.10.0.2 (RB)",
      interface: "eth0",
      note: "Matches destination 10.20.0.10 — forward to RB.",
      correct: true,
    },
    {
      destination: "10.30.0.0",
      mask: "255.255.255.0",
      nextHop: "10.10.0.2 (RB)",
      interface: "eth0",
      note: "Matches 10.30.x.x — also via RB, but wrong network for our packet.",
    },
    {
      destination: "0.0.0.0",
      mask: "0.0.0.0",
      nextHop: "10.10.0.3 (RC)",
      interface: "eth1",
      note: "Default route — only used when no other entry matches. 10.20.0.0/24 matches above, so this is NOT used.",
    },
  ],
  RB: [
    {
      destination: "10.20.0.0",
      mask: "255.255.255.0",
      nextHop: "10.20.0.1 (RD)",
      interface: "eth0",
      note: "Matches destination 10.20.0.10 — forward to RD.",
      correct: true,
    },
    {
      destination: "10.30.0.0",
      mask: "255.255.255.0",
      nextHop: "Direct (archive)",
      interface: "eth1",
      note: "This is the archive network. Our packet is NOT destined here.",
    },
  ],
  RC: [
    {
      destination: "10.20.0.0",
      mask: "255.255.255.0",
      nextHop: "10.20.0.1 (RD)",
      interface: "eth0",
      note: "Alternative path to the event network via RD.",
    },
  ],
  RD: [
    {
      destination: "10.20.0.0",
      mask: "255.255.255.0",
      nextHop: "Direct (event)",
      interface: "eth0",
      note: "Directly connected — deliver to the event server.",
      correct: true,
    },
  ],
};

const correctDecisions: Record<string, string> = {
  RA: "RB",
  RB: "RD",
  RC: "RD",
  RD: "event",
};

const packetFields: PacketField[] = [
  { label: "Source IP", value: "192.168.1.25", note: "The student laptop sending the request." },
  {
    label: "Destination IP",
    value: "10.20.0.10",
    highlight: true,
    note: "This is what the routing table must match against.",
  },
  { label: "Protocol", value: "TCP", note: "Transport protocol." },
  { label: "Payload", value: "EVENT_FILE_REQUEST", note: "Application data." },
];

export default function Mission1Route({ sessionId, onResult }: Props) {
  const [currentRouter, setCurrentRouter] = useState<string>("RA");
  const [visitedHops, setVisitedHops] = useState<string[]>(["client", "RA"]);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wrongDestination, setWrongDestination] = useState<string | null>(null);
  const [packetPos, setPacketPos] = useState<{ x: number; y: number }>({ x: 220, y: 220 });
  const [animating, setAnimating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const reset = () => {
    setCurrentRouter("RA");
    setVisitedHops(["client", "RA"]);
    setSelectedField(null);
    setSelectedEntry(null);
    setFeedback(null);
    setWrongDestination(null);
    setPacketPos({ x: 220, y: 220 });
    setAnimating(false);
    setCompleted(false);
    setSubmitted(false);
  };

  const submitResultWithPath = async (success: boolean, message: string, path: string[]) => {
    if (submitted) return;
    setSubmitted(true);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 1,
          payload: { path, completed: success },
        }),
      });
      const data = await res.json();
      console.log("Mission 1 submit response:", data);
      onResult({
        success: success,
        message: message,
        sessionCompleted: data.sessionCompleted,
      });
    } catch (e) {
      console.error("Mission 1 submit error:", e);
      onResult({ success: false, message: "Network error." });
    }
  };

  const chooseNextHop = (nextNodeId: string) => {
    if (animating || completed) return;
    const correct = correctDecisions[currentRouter];
    if (nextNodeId !== correct) {
      const wrongNode = nodeMap.get(nextNodeId);
      if (nextNodeId === "archive" || (wrongNode && wrongNode.type === "server" && nextNodeId !== "event")) {
        setFeedback("Packet delivered to the WRONG network. Review the routing table.");
        setWrongDestination(nextNodeId);
      } else if (nextNodeId === "RC" && currentRouter === "RA") {
        setFeedback("Forwarding to RC uses the default route. 10.20.0.0/24 explicitly matches via RB.");
      } else {
        setFeedback("That next hop doesn't match the routing table entry. Try again.");
      }
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    setAnimating(true);
    setFeedback(null);
    setWrongDestination(null);
    const fromNode = nodeMap.get(currentRouter)!;
    const toNode = nodeMap.get(nextNodeId)!;
    const steps = 20;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const t = step / steps;
      setPacketPos({
        x: fromNode.x + (toNode.x - fromNode.x) * t,
        y: fromNode.y + (toNode.y - fromNode.y) * t,
      });

      if (step >= steps) {
        clearInterval(interval);
        const updatedHops = [...visitedHops, nextNodeId];
        setVisitedHops(updatedHops);
        setAnimating(false);

        if (nextNodeId === "event") {
          setCompleted(true);
          setFeedback("Packet delivered to the Event Server (10.20.0.10). Mission complete!");
          submitResultWithPath(
            true,
            "Packet delivered successfully via the correct routing decisions.",
            updatedHops
          );
        } else {
          setCurrentRouter(nextNodeId);
          setSelectedEntry(null);
          setFeedback("Arrived at " + nextNodeId + ". Inspect its routing table to choose the next hop.");
          setTimeout(() => setFeedback(null), 4000);
        }
      }
    }, 30);
  };

  const hops = visitedHops.length - 1;
  const visitedLinkSet = new Set<string>();
  for (let i = 0; i < visitedHops.length - 1; i++) {
    visitedLinkSet.add([visitedHops[i], visitedHops[i + 1]].sort().join("--"));
  }
  const adjacentNodes = links
    .filter((l) => l.from === currentRouter || l.to === currentRouter)
    .map((l) => (l.from === currentRouter ? l.to : l.from))
    .filter((id) => !visitedHops.includes(id));

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-pp-border rounded-full text-xs font-mono text-pp-muted mb-3">
          MISSION 1 · THE PACKET DETECTIVE · 100 PTS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">The Packet Detective</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          The event server is receiving no traffic. Inspect the packet, read each router&apos;s routing table, then click the correct next-hop node.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <PacketInspector
          fields={packetFields}
          title="PACKET INSPECTOR"
          selectedField={selectedField}
          onFieldClick={(_f, i) => setSelectedField(i)}
        />
        <div className="bg-pp-card border border-pp-border rounded-lg p-3">
          <div className="text-xs font-mono tracking-wider text-pp-muted mb-2">FORWARDING STATE</div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-pp-muted">Current Router</div>
              <div className="text-lg font-mono font-bold text-pp-electric">{currentRouter}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-pp-muted">Hops</div>
              <div className="text-lg font-mono font-bold text-pp-light">{hops}</div>
            </div>
          </div>
          <div className="text-xs text-pp-muted font-mono break-all">
            Path: <span className="text-pp-light">{visitedHops.join(" → ")}</span>
          </div>
        </div>
      </div>

      {!completed && (
        <RoutingTable
          routerName={currentRouter}
          entries={routingTables[currentRouter] ?? []}
          selectedEntry={selectedEntry}
          onSelect={(_e, i) => setSelectedEntry(i)}
        />
      )}

      <div className="bg-pp-card border border-pp-border rounded-xl p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Network Topology</h3>
          <button
            onClick={reset}
            className="text-xs px-2 py-1 border border-pp-border rounded text-pp-muted hover:text-pp-light flex items-center gap-1"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
        <svg viewBox="0 0 760 440" className="w-full h-auto" style={{ maxHeight: "60vh" }}>
          {links.map((l) => {
            const a = nodeMap.get(l.from)!;
            const b = nodeMap.get(l.to)!;
            const key = [l.from, l.to].sort().join("--");
            const inPath = visitedLinkSet.has(key);
            return (
              <line
                key={key}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={inPath ? "#38BDF8" : "#1E3A5F"}
                strokeWidth={inPath ? 3 : 2}
              />
            );
          })}
          {nodes.map((n) => {
            const isCurrent = n.id === currentRouter && !completed;
            const isVisited = visitedHops.includes(n.id);
            const isWrongDest = wrongDestination === n.id;
            const isAdjacent = adjacentNodes.includes(n.id);
            const isClickable = isAdjacent && !animating && !completed;
            return (
              <g
                key={n.id}
                onClick={() => isClickable && chooseNextHop(n.id)}
                style={{ cursor: isClickable ? "pointer" : "default" }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.type === "router" ? 28 : 30}
                  fill={isWrongDest ? "#7f1d1d" : "#0A1428"}
                  stroke={
                    isWrongDest
                      ? "#ef4444"
                      : isCurrent
                      ? "#38BDF8"
                      : isVisited
                      ? "#2563EB"
                      : isClickable
                      ? "#93C5FD"
                      : "#1E3A5F"
                  }
                  strokeWidth={isCurrent || isClickable ? 3 : 2}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fill={
                    isWrongDest
                      ? "#fca5a5"
                      : isCurrent
                      ? "#38BDF8"
                      : isVisited
                      ? "#93C5FD"
                      : isClickable
                      ? "#93C5FD"
                      : "#94A3B8"
                  }
                  fontSize="11"
                  fontWeight="600"
                  style={{ pointerEvents: "none" }}
                >
                  {n.label}
                </text>
                <text
                  x={n.x}
                  y={n.y + (n.type === "router" ? 44 : 46)}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  style={{ pointerEvents: "none" }}
                >
                  {n.ip}
                </text>
                {isClickable && (
                  <text
                    x={n.x}
                    y={n.y - 40}
                    textAnchor="middle"
                    fill="#38BDF8"
                    fontSize="9"
                    style={{ pointerEvents: "none" }}
                  >
                    ↓ click
                  </text>
                )}
              </g>
            );
          })}
          <circle
            r={8}
            fill="#38BDF8"
            stroke="#fff"
            strokeWidth={1.5}
            cx={packetPos.x}
            cy={packetPos.y}
            style={{ pointerEvents: "none" }}
          />
        </svg>
        {!completed && !animating && adjacentNodes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-pp-muted self-center mr-2">
              Choose next hop from <span className="text-pp-electric font-mono">{currentRouter}</span>:
            </span>
            {adjacentNodes.map((nextId) => {
              const nextNode = nodeMap.get(nextId);
              return (
                <button
                  key={nextId}
                  onClick={() => chooseNextHop(nextId)}
                  disabled={animating}
                  className="px-3 py-1.5 text-xs border border-pp-border rounded hover:border-pp-electric hover:text-pp-electric font-mono disabled:opacity-50"
                >
                  <MapPin size={11} className="inline mr-1" />
                  {nextNode?.label} ({nextNode?.ip})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 p-3 rounded-md border flex items-start gap-2 text-sm ${
              completed
                ? "bg-pp-bg-2 border-pp-electric/40 text-pp-electric"
                : wrongDestination
                ? "bg-pp-bg-2 border-red-500/40 text-red-300"
                : "bg-pp-bg-2 border-pp-border text-pp-muted"
            }`}
          >
            {completed ? (
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
            ) : wrongDestination ? (
              <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            ) : null}
            <p>{feedback}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 p-4 bg-pp-bg-2/50 border border-pp-border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Hint</h3>
        <p className="text-xs text-pp-muted">
          At RA: choose <span className="text-pp-electric font-mono">RB</span>. At RB: choose{" "}
          <span className="text-pp-electric font-mono">RD</span>. At RD: deliver to the event server.
        </p>
      </div>
    </div>
  );
}