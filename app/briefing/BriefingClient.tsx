"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, ArrowLeft, Clock, Target, Award, ListChecks } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import { MISSIONS } from "@/lib/game/missions";

function BriefingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamCode = searchParams.get("team");
  const [teamName, setTeamName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamCode) {
      router.push("/register");
      return;
    }
    fetch("/api/teams/info?code=" + teamCode)
      .then((r) => r.json())
      .then((d) => {
        if (d.teamName) {
          setTeamName(d.teamName);
        } else {
          router.push("/register");
        }
      })
      .finally(() => setLoading(false));
  }, [teamCode, router]);

  const startSession = async () => {
    const res = await fetch("/api/sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamCode }),
    });
    const data = await res.json();
    if (res.ok && data.sessionId) {
      router.push(`/game?session=${data.sessionId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pp-muted">Loading briefing...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NetworkBackground density={14} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-pp-muted hover:text-pp-light"
          >
            <ArrowLeft size={16} /> Exit
          </Link>
        </header>

        <main className="flex-1 px-6 py-4 max-w-4xl mx-auto w-full">
          {/* Critical alert */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-red-500/40 bg-red-500/5 rounded-lg p-4 mb-8 flex items-start gap-3"
          >
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-red-300">CRITICAL ALERT</div>
              <p className="text-sm text-red-200/80 mt-1">
                The college event server has lost connectivity just before a
                major event. Your team has been recruited as emergency network
                engineers. Investigate the network, diagnose failures, and
                restore communication before the countdown reaches zero.
              </p>
            </div>
          </motion.div>

          {/* Team confirmation */}
          <div className="text-center mb-10">
            <div className="text-xs font-mono text-pp-muted mb-2">
              TEAM REGISTERED
            </div>
            <h1 className="text-2xl font-bold text-pp-light">{teamName}</h1>
            <div className="text-sm text-pp-muted mt-1">
              Team Code:{" "}
              <span className="font-mono text-pp-electric">{teamCode}</span>
            </div>
          </div>

          {/* Rules */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            <div className="bg-pp-card border border-pp-border rounded-lg p-4">
              <Clock className="text-pp-electric mb-2" size={20} />
              <h3 className="font-semibold text-sm mb-1">Time Limit</h3>
              <p className="text-xs text-pp-muted">
                You have 10 minutes for all four missions. The clock starts when
                you begin.
              </p>
            </div>
            <div className="bg-pp-card border border-pp-border rounded-lg p-4">
              <Award className="text-pp-electric mb-2" size={20} />
              <h3 className="font-semibold text-sm mb-1">Scoring</h3>
              <p className="text-xs text-pp-muted">
                Up to ~1,000 points across all missions. Speed bonuses for fast
                correct answers.
              </p>
            </div>
            <div className="bg-pp-card border border-pp-border rounded-lg p-4">
              <Target className="text-pp-electric mb-2" size={20} />
              <h3 className="font-semibold text-sm mb-1">Objective</h3>
              <p className="text-xs text-pp-muted">
                Restore connectivity to the event server. Every decision counts.
              </p>
            </div>
          </div>

          {/* Mission overview */}
          <div className="bg-pp-card border border-pp-border rounded-lg p-6 mb-10">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <ListChecks size={18} className="text-pp-electric" />
              Mission Briefing
            </h2>
            <div className="space-y-3">
              {MISSIONS.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-3 bg-pp-bg-2/50 rounded-lg border border-pp-border/50"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-pp-bg rounded-full border border-pp-border font-mono font-bold text-pp-electric">
                    {m.id}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-pp-muted">{m.concept}</div>
                  </div>
                  <div className="text-xs font-mono text-pp-muted">
                    {m.maxPoints} pts
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules list */}
          <div className="text-sm text-pp-muted space-y-1 mb-10">
            <p>• Correct answers earn points. Incorrect attempts may incur a small penalty.</p>
            <p>• Some missions allow experimentation before submitting your final answer.</p>
            <p>• Teams ranked by score, with completion time as tie-breaker.</p>
            <p>• Game ends when the timer expires or you complete all missions.</p>
            <p>• Refreshing the page will not reset your timer.</p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={startSession}
              className="inline-flex items-center gap-2 px-8 py-4 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-bold text-lg transition-all glow-blue hover:glow-strong"
            >
              Start Mission
              <ArrowRight size={20} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function BriefingClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pp-muted">Loading...</div>}>
      <BriefingContent />
    </Suspense>
  );
};