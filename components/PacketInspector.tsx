"use client";

import { useState } from "react";

export interface PacketField {
  label: string;
  value: string;
  highlight?: boolean;
  note?: string;
}

interface PacketInspectorProps {
  fields: PacketField[];
  title?: string;
  onFieldClick?: (field: PacketField, index: number) => void;
  selectedField?: number | null;
}

export default function PacketInspector({
  fields,
  title = "PACKET INSPECTOR",
  onFieldClick,
  selectedField,
}: PacketInspectorProps) {
  const [internalSelected, setInternalSelected] = useState<number | null>(null);
  const selected = selectedField ?? internalSelected;

  const handleClick = (field: PacketField, index: number) => {
    setInternalSelected(index);
    onFieldClick?.(field, index);
  };

  return (
    <div className="bg-pp-card border border-pp-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-pp-bg-2 border-b border-pp-border flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-pp-electric animate-pulse" />
        <span className="text-xs font-mono tracking-wider text-pp-muted">{title}</span>
      </div>
      <div className="p-3 space-y-1.5">
        {fields.map((field, i) => {
          const isSel = selected === i;
          return (
            <button
              key={i}
              onClick={() => handleClick(field, i)}
              className={`w-full text-left p-2 rounded border text-xs transition-all ${
                isSel
                  ? "border-pp-electric bg-pp-electric/10"
                  : "border-pp-border/60 hover:border-pp-light bg-pp-bg-2/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-pp-muted uppercase tracking-wider">
                  {field.label}
                </span>
                <span
                  className={`font-mono font-semibold ${
                    field.highlight ? "text-pp-electric" : "text-pp-text"
                  }`}
                >
                  {field.value}
                </span>
              </div>
              {isSel && field.note && (
                <div className="mt-1.5 pt-1.5 border-t border-pp-border/40 text-pp-muted text-[11px] leading-relaxed">
                  {field.note}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
