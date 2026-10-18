"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Clock, Target, ArrowRight } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import { formatTime } from "@/lib/utils";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [missionsCompleted, setMissionsCompleted] = useState(0);
  const [teamName, setTeamName] = useState<string>("");
  const [teamCode, setTeamCode] = useState<string>("");
  const [sessionStatus, setSessionStatus] = useState<string>("");
  const [rank, setRank] = useState<number | null>(null);
  const [totalTeams, setTotalTeams] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    // Fetch session data directly from the debug endpoint (verified working)
    fetch(`/api/debug/session?id=${sessionId}&t=${Date.now()}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        console.log("=== RESULTS: session data ===", d);
        if (d.error) {
          setError(d.error);
        } else if (d.session) {
          setFinalScore(d.session.final_score ?? 0);
          setCompletionTime(d.session.completion_time_seconds ?? null);
          setMissionsCompleted(d.session.missions_completed ?? 0);
          setSessionStatus(d.session.status ?? "");
          if (d.session.teams) {
            setTeamName(d.session.teams.team_name ?? "");
            setTeamCode(d.session.teams.team_code ?? "");
          }
        }
      })
      .catch((e) => {
        console.error("Results fetch error:", e);
        setError("Failed to load results");
      })
      .finally(() => {
        // Fetch leaderboard rank
        fetch(`/api/leaderboard?t=${Date.now()}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((lb) => {
            const idx = (lb.entries ?? []).findIndex(
              (e: any) => e.session_id === sessionId
            );
            if (idx >= 0) {
              setRank(idx + 1);
            }
            setTotalTeams((lb.entries ?? []).length);
          })
          .catch((e) => console.error("Leaderboard fetch error:", e))
          .finally(() => setLoading(false));
      });
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-pp-muted">
        Loading results...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  const isSuccess = sessionStatus === "completed";
  const completionSeconds = completionTime ? Math.floor(completionTime) : 0;

  return (
    <div className="relative min-h-screen">
      <NetworkBackground density={12} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-pp-muted hover:text-pp-light"
          >
            <ArrowRight size={16} className="rotate-180" /> Home
          </Link>
        </header>

        <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="text-xs font-mono text-pp-muted mb-2">
              {teamName}
              {teamCode && ` · ${teamCode}`}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {isSuccess ? "NETWORK RESTORED" : "MISSION ENDED"}
            </h1>
            <p className="text-pp-muted">
              {isSuccess
                ? "You successfully restored connectivity to the event server."
                : "Time expired. Here's your recovery report."}
            </p>
          </motion.div>

          {/* Final score — prominent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-pp-card border border-pp-border rounded-xl p-8 mb-6 text-center"
          >
            <Trophy className="mx-auto text-pp-gold mb-3" size={48} />
            <div className="text-xs font-mono text-pp-muted uppercase tracking-wider mb-2">
              FINAL SCORE
            </div>
            <div className="text-6xl md:text-7xl font-mono font-bold text-pp-electric mb-4">
              {finalScore}
            </div>
            <div className="text-sm text-pp-muted">points</div>
          </motion.div>

          {/* Secondary stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            <div className="bg-pp-card border border-pp-border rounded-lg p-4 text-center">
              <Clock className="mx-auto text-pp-electric mb-2" size={20} />
              <div className="text-xs text-pp-muted">TIME</div>
              <div className="text-lg font-mono font-bold text-pp-light">
                {formatTime(completionSeconds)}
              </div>
            </div>
            <div className="bg-pp-card border border-pp-border rounded-lg p-4 text-center">
              <Target className="mx-auto text-pp-electric mb-2" size={20} />
              <div className="text-xs text-pp-muted">MISSIONS</div>
              <div className="text-lg font-mono font-bold text-pp-light">
                {missionsCompleted}/4
              </div>
            </div>
            <div className="bg-pp-card border border-pp-border rounded-lg p-4 text-center">
              <Trophy className="mx-auto text-pp-gold mb-2" size={20} />
              <div className="text-xs text-pp-muted">RANK</div>
              <div className="text-lg font-mono font-bold text-pp-light">
                {rank ? `#${rank}` : "—"}
              </div>
            </div>
          </motion.div>

          {rank && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs text-pp-muted mb-6"
            >
              Out of {totalTeams} team{totalTeams === 1 ? "" : "s"} on the leaderboard
            </motion.div>
          )}

          {/* Concepts learned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-pp-card border border-pp-border rounded-xl p-6 mb-6"
          >
            <h3 className="font-semibold mb-3">What You Learned</h3>
            <ul className="space-y-2 text-sm text-pp-muted">
              <li>• Routers forward packets between networks based on routing tables.</li>
              <li>• TCP provides reliable, ordered delivery; UDP is lightweight and low-latency.</li>
              <li>• IP addresses identify source and destination at the network layer.</li>
              <li>• Layered troubleshooting checks addressing, routing, link status, and protocol needs.</li>
            </ul>
          </motion.div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/leaderboard"
              className="px-6 py-3 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold text-center"
            >
              View Leaderboard
            </Link>
            <Link
              href="/ceremony"
              className="px-6 py-3 border border-pp-border hover:border-pp-electric text-pp-light rounded-lg font-semibold text-center"
            >
              Watch Ceremony
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-pp-border hover:border-pp-electric text-pp-light rounded-lg font-semibold text-center"
            >
              Return Home
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ResultsClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pp-muted">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
