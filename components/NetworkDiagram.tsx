"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Router, Server, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface NetNode {
  id: string;
  type: "client" | "router" | "server";
  label: string;
  ip?: string;
  x: number;
  y: number;
}

export interface NetLink {
  from: string;
  to: string;
  broken?: boolean;
  label?: string;
}

export interface NetworkDiagramProps {
  nodes: NetNode[];
  links: NetLink[];
  startNode: string;
  endNode: string;
  onPathSubmit: (path: string[]) => Promise<SubmitResult>;
  correctPath?: string[];
  showBrokenLabels?: boolean;
  interactive?: boolean;
  resetSignal?: number;
}

export interface SubmitResult {
  success: boolean;
  message: string;
  reachedEnd?: boolean;
  failedAt?: string;
}

const nodeRadius = 26;

export default function NetworkDiagram({
  nodes,
  links,
  startNode,
  endNode,
  onPathSubmit,
  correctPath,
  showBrokenLabels = false,
  interactive = true,
  resetSignal,
}: NetworkDiagramProps) {
  const [selectedPath, setSelectedPath] = useState<string[]>([startNode]);
  const [packetAnimating, setPacketAnimating] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [brokenReveal, setBrokenReveal] = useState<Set<string>>(new Set());

  const nodeMap = useMemo(() => {
    const m = new Map<string, NetNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const adjacency = useMemo(() => {
    const adj = new Map<string, { to: string; link: NetLink }[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    links.forEach((l) => {
      adj.get(l.from)?.push({ to: l.to, link: l });
      adj.get(l.to)?.push({ to: l.from, link: l });
    });
    return adj;
  }, [nodes, links]);

  const linkKey = (a: string, b: string) => [a, b].sort().join("--");

  const lastInPath = selectedPath[selectedPath.length - 1];

  const possibleNext = useMemo(() => {
    if (!interactive || packetAnimating || result?.success) return [];
    const neighbors = adjacency.get(lastInPath) ?? [];
    return neighbors
      .filter(({ to }) => !selectedPath.includes(to))
      .map(({ to, link }) => ({ to, link }));
  }, [adjacency, lastInPath, selectedPath, interactive, packetAnimating, result]);

  const handleNodeClick = useCallback(
    (id: string) => {
      if (!interactive || packetAnimating || result?.success) return;
      if (id === startNode) {
        setSelectedPath([startNode]);
        setResult(null);
        setBrokenReveal(new Set());
        return;
      }
      if (selectedPath.includes(id)) {
        const idx = selectedPath.indexOf(id);
        setSelectedPath(selectedPath.slice(0, idx + 1));
        return;
      }
      const isAdjacent = possibleNext.some((p) => p.to === id);
      if (isAdjacent) {
        setSelectedPath((prev) => [...prev, id]);
        setResult(null);
      }
    },
    [interactive, packetAnimating, result, startNode, selectedPath, possibleNext]
  );

  const handleSubmit = async () => {
    if (selectedPath.length < 2 || packetAnimating) return;
    setPacketAnimating(true);
    setResult(null);

    let stepIdx = 0;
    let failedAt: string | undefined;
    const newlyBroken = new Set<string>();

    for (let i = 0; i < selectedPath.length - 1; i++) {
      const a = selectedPath[i];
      const b = selectedPath[i + 1];
      const link = links.find(
        (l) =>
          (l.from === a && l.to === b) || (l.from === b && l.to === a)
      );
      if (link?.broken) {
        failedAt = b;
        newlyBroken.add(linkKey(a, b));
        break;
      }
      stepIdx = i + 1;
      await new Promise((r) => setTimeout(r, 600));
    }
    setBrokenReveal(newlyBroken);

    const reachedEnd = !failedAt && selectedPath[selectedPath.length - 1] === endNode;
    const res = await onPathSubmit(selectedPath);
    setResult({
      ...res,
      reachedEnd,
      failedAt,
    });
    setPacketAnimating(false);
  };

  const reset = () => {
    setSelectedPath([startNode]);
    setResult(null);
    setBrokenReveal(new Set());
    setPacketAnimating(false);
  };

  // Reset on signal change
  useMemo(() => {
    if (resetSignal !== undefined) reset();
  }, [resetSignal]);

  const width = Math.max(...nodes.map((n) => n.x)) + 60;
  const height = Math.max(...nodes.map((n) => n.y)) + 60;

  const pathLinkSet = new Set<string>();
  for (let i = 0; i < selectedPath.length - 1; i++) {
    pathLinkSet.add(linkKey(selectedPath[i], selectedPath[i + 1]));
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[60vh] min-w-[600px]"
        role="img"
        aria-label="Interactive network diagram"
      >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#38BDF8" />
          </marker>
          <linearGradient id="packetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>

        {/* Links */}
        {links.map((l) => {
          const a = nodeMap.get(l.from)!;
          const b = nodeMap.get(l.to)!;
          const k = linkKey(l.from, l.to);
          const inPath = pathLinkSet.has(k);
          const broken = l.broken || brokenReveal.has(k);
          return (
            <g key={k}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={broken ? "#EF4444" : inPath ? "#38BDF8" : "#1E3A5F"}
                strokeWidth={inPath ? 3 : 2}
                strokeDasharray={broken ? "6,4" : undefined}
                opacity={broken ? 0.85 : 1}
              />
              {showBrokenLabels && broken && (
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2 - 8}
                  textAnchor="middle"
                  fill="#FCA5A5"
                  fontSize="11"
                  className="font-mono"
                >
                  LINK DOWN
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const isSelected = selectedPath.includes(n.id);
          const isStart = n.id === startNode;
          const isEnd = n.id === endNode;
          const Icon = n.type === "client" ? Laptop : n.type === "router" ? Router : Server;
          return (
            <g
              key={n.id}
              onClick={() => handleNodeClick(n.id)}
              className={interactive ? "cursor-pointer" : ""}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNodeClick(n.id);
                }
              }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeRadius}
                fill={isSelected ? "#0E1B33" : "#0A1428"}
                stroke={
                  isStart ? "#93C5FD" : isEnd ? "#38BDF8" : isSelected ? "#2563EB" : "#1E3A5F"
                }
                strokeWidth={isSelected || isStart || isEnd ? 3 : 2}
                className={isSelected ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" : ""}
              />
              <foreignObject x={n.x - 12} y={n.y - 12} width={24} height={24}>
                <div className="flex items-center justify-center w-full h-full pointer-events-none">
                  <Icon
                    size={18}
                    color={
                      isStart ? "#93C5FD" : isEnd ? "#38BDF8" : isSelected ? "#93C5FD" : "#94A3B8"
                    }
                  />
                </div>
              </foreignObject>
              <text
                x={n.x}
                y={n.y + nodeRadius + 16}
                textAnchor="middle"
                fill="#F1F5F9"
                fontSize="11"
                fontWeight="600"
                className="font-mono"
              >
                {n.label}
              </text>
              {n.ip && (
                <text
                  x={n.x}
                  y={n.y + nodeRadius + 30}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="10"
                  className="font-mono"
                >
                  {n.ip}
                </text>
              )}
            </g>
          );
        })}

        {/* Packet animation */}
        {packetAnimating &&
          selectedPath.slice(0, -1).map((_, i) => {
            const a = nodeMap.get(selectedPath[i])!;
            const b = nodeMap.get(selectedPath[i + 1])!;
            const k = linkKey(selectedPath[i], selectedPath[i + 1]);
            const isBroken = links.find(
              (l) => linkKey(l.from, l.to) === k
            )?.broken;
            return (
              <motion.circle
                key={`pkt-${i}`}
                r={6}
                fill="url(#packetGrad)"
                initial={{ cx: a.x, cy: a.y, opacity: 0 }}
                animate={{
                  cx: isBroken ? (a.x + b.x) / 2 : b.x,
                  cy: isBroken ? (a.y + b.y) / 2 : b.y,
                  opacity: isBroken ? [1, 1, 0] : [0, 1, 1, 1],
                }}
                transition={{ duration: 0.6, delay: i * 0.6 }}
              />
            );
          })}
      </svg>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="text-sm font-mono text-pp-muted">
          <span className="text-pp-light">PATH:</span>{" "}
          {selectedPath.map((id) => nodeMap.get(id)?.label ?? id).join(" → ")}
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            disabled={!interactive || packetAnimating}
            className="px-3 py-1.5 text-sm border border-pp-border rounded-md text-pp-muted hover:bg-pp-bg-2 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !interactive ||
              packetAnimating ||
              selectedPath.length < 2 ||
              !!result?.success
            }
            className="px-4 py-1.5 text-sm bg-pp-blue text-white rounded-md hover:bg-pp-electric hover:text-pp-bg disabled:opacity-50 font-semibold"
          >
            Send Packet
          </button>
        </div>
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 p-3 rounded-md border flex items-start gap-3 ${
              result.success
                ? "bg-pp-bg-2 border-pp-electric/40 text-pp-electric"
                : "bg-pp-bg-2 border-red-500/40 text-red-300"
            }`}
          >
            {result.success ? (
              <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm">{result.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}