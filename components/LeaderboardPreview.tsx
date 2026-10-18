"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy } from "lucide-react";

export default function LeaderboardPreview({ preview }: { preview: any[] }) {
  if (!preview || preview.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mt-16 w-full max-w-md"
    >
      <div className="flex items-center gap-2 mb-3 justify-center">
        <Trophy size={18} className="text-pp-gold" />
        <h2 className="text-sm font-mono tracking-wider text-pp-muted">
          TOP TEAMS
        </h2>
      </div>
      <div className="bg-pp-card/60 backdrop-blur border border-pp-border rounded-lg divide-y divide-pp-border/50">
        {preview.map((row: any, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-pp-muted font-mono w-4">{i + 1}</span>
              <span className="text-pp-text">{row.teams?.team_name ?? "—"}</span>
            </div>
            <span className="font-mono text-pp-light">{row.final_score}</span>
          </div>
        ))}
      </div>
      <Link href="/leaderboard" className="block text-center text-xs text-pp-muted hover:text-pp-light mt-3">
        View full leaderboard →
      </Link>
    </motion.div>
  );
}