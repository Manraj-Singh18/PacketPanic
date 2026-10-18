"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import Timer from "@/components/Timer";
import Mission1Route from "./missions/Mission1Route";
import Mission2Protocol from "./missions/Mission2Protocol";
import Mission3Addressing from "./missions/Mission3Addressing";
import Mission4Outage from "./missions/Mission4Outage";
import { MISSIONS } from "@/lib/game/missions";

interface SessionData {
  session: {
    id: string;
    status: string;
    current_mission: number;
    start_time: string;
    duration_seconds: number;
    final_score: number;
    hints_used: number;
    missions_completed: number;
    teams: { team_name: string; team_code: string };
  };
  results: Array<{
    mission_id: number;
    status: string;
    score: number;
    attempts: number;
    hints_used: number;
  }>;
}

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session");
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState(1);
  const [missionKey, setMissionKey] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0); // forces re-render

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      router.push("/register");
      return;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      if (!res.ok) {
        setError("Session not found");
        setLoading(false);
        return;
      }
      const json = await res.json();
      console.log("=== LOADED SESSION ===");
      console.log("final_score:", json.session?.final_score);
      console.log("missions_completed:", json.session?.missions_completed);
      setData(json);
      setRefreshTick((t) => t + 1); // force re-render

      if (json.session.status === "completed" || json.session.status === "expired") {
        router.push(`/results?session=${sessionId}`);
      }
    } catch (e) {
      console.error("loadSession error:", e);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const onExpire = useCallback(async () => {
    try {
      await fetch("/api/sessions/expire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch (e) {
      console.error("Expire failed:", e);
    }
    router.push(`/results?session=${sessionId}`);
  }, [sessionId, router]);

  const handleMissionResult = useCallback(
    async (result: { success: boolean; message: string; sessionCompleted?: boolean }) => {
      console.log("=== MISSION RESULT ===", result);
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });

      if (result.success) {
        // Wait 500ms to let the DB write settle, then reload
        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadSession();

        if (result.sessionCompleted) {
          setTimeout(() => {
            router.push(`/results?session=${sessionId}`);
          }, 1500);
        } else {
          setShowNextButton(true);
        }
      } else {
        setTimeout(() => setFeedback(null), 3000);
      }
    },
    [sessionId, router, loadSession]
  );

  const goToNextMission = () => {
    console.log("Next mission clicked! Current:", activeMission, "Next:", activeMission + 1);
    const nextMission = activeMission + 1;
    if (nextMission <= 4) {
      setShowNextButton(false);
      setFeedback(null);
      setActiveMission(nextMission);
      setMissionKey((prev) => prev + 1);
      loadSession();
    } else {
      router.push(`/results?session=${sessionId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-pp-electric" size={24} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error ?? "Unknown error"}
      </div>
    );
  }

  const { session, results } = data;
  const startTime = new Date(session.start_time).getTime();
  const completedSet = new Set(
    results.filter((r) => r.status === "completed").map((r) => r.mission_id)
  );

    const MissionComponentMap: Record<number, React.ComponentType<{
    sessionId: string;
    onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
  }>> = {
    1: Mission1Route,
    2: Mission2Protocol,
    3: Mission3Addressing,
    4: Mission4Outage,
  };
  const MissionComponent = MissionComponentMap[activeMission] ?? Mission1Route;

  console.log("RENDER: final_score =", session.final_score, "refreshTick =", refreshTick);

  return (
    <div className="relative min-h-screen">
      <NetworkBackground density={8} />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 md:px-6 py-4 border-b border-pp-border bg-pp-bg/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Team info */}
            <div>
              <div className="text-xs font-mono text-pp-muted">
                {session.teams.team_name} · {session.teams.team_code}
              </div>
              <div className="font-bold text-pp-light">
                MISSION {activeMission} / 4
              </div>
            </div>

            {/* Timer */}
            <Timer
              startTime={startTime}
              durationSeconds={session.duration_seconds}
              onExpire={onExpire}
            />
          </div>

          {/* Progress bar */}
          <div className="max-w-6xl mx-auto mt-3 flex gap-2">
            {MISSIONS.map((m) => (
              <div
                key={m.id}
                className={`flex-1 h-1 rounded-full ${
                  completedSet.has(m.id)
                    ? "bg-pp-electric"
                    : activeMission === m.id
                    ? "bg-pp-blue"
                    : "bg-pp-border"
                }`}
              />
            ))}
          </div>
        </header>

        {/* Mission area */}
        <main className="flex-1 px-4 md:px-6 py-6 max-w-6xl mx-auto w-full">
          <MissionComponent
            key={missionKey}
            sessionId={sessionId ?? ""}
            onResult={handleMissionResult}
          />
        </main>

        {/* Next Mission button */}
        {showNextButton && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={goToNextMission}
              className="inline-flex items-center gap-2 px-8 py-4 bg-pp-electric hover:bg-pp-light text-pp-bg rounded-lg font-bold text-lg shadow-lg"
            >
              Next Mission
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Feedback toast */}
        {feedback && !showNextButton && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg border z-30 max-w-md ${
              feedback.type === "success"
                ? "bg-pp-card border-pp-electric text-pp-electric"
                : "bg-pp-card border-red-500/40 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="text-sm">{feedback.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GameClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pp-muted">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}
