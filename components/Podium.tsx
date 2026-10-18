"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export interface PodiumTeam {
  rank: number;
  team_name: string;
  final_score: number;
  completion_time_seconds: number | null;
}

const podiumConfig = [
  { rank: 1, height: "h-40", color: "pp-gold", label: "GOLD" },
  { rank: 2, height: "h-28", color: "pp-silver", label: "SILVER" },
  { rank: 3, height: "h-20", color: "pp-bronze", label: "BRONZE" },
];

export default function Podium({
  teams,
  revealedCount,
}: {
  teams: PodiumTeam[];
  revealedCount: number;
}) {
  // Order: 2nd, 1st, 3rd (visual arrangement)
  const arrangement = [1, 0, 2];
  const orderedTeams = arrangement
    .map((idx) => teams[idx])
    .filter(Boolean);

  return (
    <div className="flex items-end justify-center gap-4 md:gap-8 w-full max-w-4xl mx-auto">
      {orderedTeams.map((team, i) => {
        const realRank = team.rank;
        const config = podiumConfig[realRank - 1];
        const isRevealed = revealedCount >= realRank;
        if (!isRevealed || !team) {
          return (
            <div
              key={`placeholder-${i}`}
              className={`${config.height} w-24 md:w-40 bg-pp-card/50 border border-pp-border rounded-t-lg`}
            />
          );
        }
        return (
          <motion.div
            key={team.team_name}
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ rotate: -15, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mb-3"
            >
              <Trophy
                size={48}
                className={`text-${config.color}`}
                strokeWidth={1.5}
              />
            </motion.div>
            <div className="text-center mb-3 px-2">
              <div className="font-bold text-pp-text text-base md:text-xl">
                {team.team_name}
              </div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-pp-light">
                {team.final_score.toLocaleString()}
              </div>
              <div className="text-xs text-pp-muted mt-1">
                {team.completion_time_seconds
                  ? `${Math.floor(team.completion_time_seconds / 60)}m ${Math.floor(
                      team.completion_time_seconds % 60
                    )}s`
                  : "—"}
              </div>
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              className={`${config.height} w-24 md:w-40 bg-gradient-to-t from-${config.color}/30 to-${config.color}/10 border-2 border-${config.color} rounded-t-lg flex items-center justify-center`}
            >
              <span className={`text-${config.color} font-mono text-lg font-bold`}>
                {realRank}
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}