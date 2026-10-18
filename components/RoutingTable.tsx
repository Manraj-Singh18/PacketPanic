"use client";

import { useState } from "react";
import { Table, Eye } from "lucide-react";

export interface RoutingEntry {
  destination: string;
  mask: string;
  nextHop: string;
  interface: string;
  note?: string;
  correct?: boolean; // marks the correct entry for the current packet
}

interface RoutingTableProps {
  routerName: string;
  entries: RoutingEntry[];
  onSelect?: (entry: RoutingEntry, index: number) => void;
  selectedEntry?: number | null;
  compact?: boolean;
}

export default function RoutingTable({
  routerName,
  entries,
  onSelect,
  selectedEntry,
  compact = false,
}: RoutingTableProps) {
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const selected = selectedEntry ?? internalSelected;

  const handleSelect = (entry: RoutingEntry, index: number) => {
    setInternalSelected(index);
    onSelect?.(entry, index);
  };

  return (
    <div className="bg-pp-card border border-pp-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-pp-bg-2 border-b border-pp-border flex items-center gap-2">
        <Table size={14} className="text-pp-electric" />
        <span className="text-xs font-mono tracking-wider text-pp-muted">
          {routerName} — ROUTING TABLE
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-pp-muted border-b border-pp-border/60">
              <th className="text-left px-3 py-1.5 font-mono uppercase tracking-wider">Destination</th>
              <th className="text-left px-3 py-1.5 font-mono uppercase tracking-wider">Mask</th>
              <th className="text-left px-3 py-1.5 font-mono uppercase tracking-wider">Next Hop</th>
              {!compact && (
                <th className="text-left px-3 py-1.5 font-mono uppercase tracking-wider">Iface</th>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isSel = selected === i;
              return (
                <tr
                  key={i}
                  onClick={() => handleSelect(entry, i)}
                  className={`border-b border-pp-border/30 cursor-pointer transition-colors ${
                    isSel
                      ? "bg-pp-electric/10"
                      : "hover:bg-pp-bg-2/60"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-pp-text">{entry.destination}</td>
                  <td className="px-3 py-2 font-mono text-pp-muted">{entry.mask}</td>
                  <td className="px-3 py-2 font-mono text-pp-light">{entry.nextHop}</td>
                  {!compact && (
                    <td className="px-3 py-2 font-mono text-pp-muted">{entry.interface}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected !== null && entries[selected]?.note && (
        <div className="px-3 py-2 bg-pp-bg-2/40 border-t border-pp-border/40 text-[11px] text-pp-muted leading-relaxed">
          <Eye size={11} className="inline mr-1" />
          {entries[selected].note}
        </div>
      )}
    </div>
  );
}
