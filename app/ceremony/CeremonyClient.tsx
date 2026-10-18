"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Crown, Medal, Play, RotateCcw, Maximize2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import NetworkBackground from "@/components/NetworkBackground";
import Podium, { PodiumTeam } from "@/components/Podium";

type Phase = "intro" | "countdown" | "bronze" | "silver" | "gold" | "final" | "leaderboard";

export default function CeremonyClient() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [teams, setTeams] = useState<PodiumTeam[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    const top3 = (data.entries ?? []).slice(0, 3).map((e: any, i: number) => ({
      rank: i + 1,
      team_name: e.team_name,
      final_score: e.final_score,
      completion_time_seconds: e.completion_time_seconds,
    }));
    setTeams(top3);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const startCeremony = async () => {
    await fetchTeams();
    setPhase("intro");
    setTimeout(() => setPhase("countdown"), 2500);
  };

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("bronze");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === "bronze") {
      const t = setTimeout(() => setPhase("silver"), 3500);
      return () => clearTimeout(t);
    }
    if (phase === "silver") {
      const t = setTimeout(() => setPhase("gold"), 3500);
      return () => clearTimeout(t);
    }
    if (phase === "gold") {
      const t = setTimeout(() => setPhase("final"), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const fullscreen = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  const revealedCount =
    phase === "bronze" ? 1 :
    phase === "silver" ? 2 :
    phase === "gold" || phase === "final" || phase === "leaderboard" ? 3 : 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <NetworkBackground density={24} />
      <div className="absolute inset-0 bg-gradient-to-b from-pp-bg/50 via-transparent to-pp-bg/80" />

      {/* Top bar (organizer controls) */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={fullscreen}
          className="p-2 bg-pp-card/60 border border-pp-border rounded text-pp-muted hover:text-pp-light"
          title="Fullscreen"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={startCeremony}
          className="p-2 bg-pp-card/60 border border-pp-border rounded text-pp-muted hover:text-pp-light"
          title="Replay"
        >
          <RotateCcw size={16} />
        </button>
        <Link
          href="/admin"
          className="p-2 bg-pp-card/60 border border-pp-border rounded text-pp-muted hover:text-pp-light"
          title="Admin"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {/* INTRO */}
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="inline-block mb-8"
              >
                <Sparkles size={64} className="text-pp-electric" />
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-5xl font-bold mb-3"
              >
                ALL PACKETS DELIVERED.
              </motion.h1>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-2xl md:text-4xl text-pp-electric"
              >
                THE NETWORK IS STABLE.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-8 text-pp-muted"
              >
                THE RESULTS ARE IN...
              </motion.p>
            </motion.div>
          )}

          {/* COUNTDOWN */}
          {phase === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="text-pp-muted text-sm uppercase tracking-widest mb-4">
                Preparing the podium
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-9xl font-mono font-bold text-pp-electric"
                >
                  {countdown > 0 ? countdown : "GO!"}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* BRONZE / SILVER / GOLD / FINAL */}
          {(phase === "bronze" || phase === "silver" || phase === "gold" || phase === "final") && (
            <motion.div
              key="podium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              {/* Confetti particles */}
              {phase === "gold" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: Math.random() * window.innerWidth,
                        y: -20,
                        opacity: 1,
                        rotate: 0,
                      }}
                      animate={{
                        y: window.innerHeight + 20,
                        opacity: [1, 1, 0],
                        rotate: 360,
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        delay: Math.random() * 2,
                        repeat: Infinity,
                      }}
                      className="absolute w-2 h-3"
                      style={{
                        backgroundColor: ["#FBBF24", "#38BDF8", "#93C5FD"][i % 3],
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="text-center mb-12">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">
                  {phase === "bronze" && "🥉 THIRD PLACE"}
                  {phase === "silver" && "🥈 SECOND PLACE"}
                  {phase === "gold" && "🥇 FIRST PLACE"}
                  {phase === "final" && "PACKET PANIC CHAMPIONS"}
                </h1>
              </div>

              <Podium teams={teams} revealedCount={revealedCount} />

              {phase === "final" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-12 text-center"
                >
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-pp-border hover:border-pp-electric text-pp-light rounded-lg font-semibold"
                  >
                    View Full Leaderboard
                  </Link>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial start button */}
        {phase === "intro" && loading === false && teams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-12"
          >
            <p className="text-pp-muted text-sm mb-4">
              No teams have completed the game yet.
            </p>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-6 py-3 border border-pp-border text-pp-light rounded-lg"
            >
              View Leaderboard
            </Link>
          </motion.div>
        )}

        {phase === "intro" && teams.length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={startCeremony}
            className="mt-12 inline-flex items-center gap-2 px-8 py-4 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-bold text-lg"
          >
            <Play size={20} /> Start Ceremony
          </motion.button>
        )}
      </div>
    </div>
  );
}