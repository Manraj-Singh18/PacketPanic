import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_EVENT_ID } from "@/lib/game/session";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getLeaderboard() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("game_sessions")
      .select(
        "id, final_score, completion_time_seconds, missions_completed, status, end_time, teams(team_name)"
      )
      .eq("event_id", DEFAULT_EVENT_ID)
      .in("status", ["completed", "expired"])
      .order("final_score", { ascending: false })
      .order("completion_time_seconds", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <div className="relative min-h-screen">
      <NetworkBackground density={10} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-pp-muted hover:text-pp-light"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <Link
            href="/ceremony"
            className="text-sm text-pp-electric hover:underline"
          >
            View Ceremony →
          </Link>
        </header>

        <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
          <div className="text-center mb-10">
            <Trophy className="mx-auto text-pp-gold mb-3" size={36} />
            <h1 className="text-3xl font-bold">Global Leaderboard</h1>
            <p className="text-sm text-pp-muted mt-1">
              {entries.length === 0
                ? "No teams have completed the game yet. Be the first!"
                : `${entries.length} team${entries.length === 1 ? "" : "s"} have completed the mission.`}
            </p>
          </div>

          {entries.length > 0 ? (
            <div className="bg-pp-card border border-pp-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-pp-border text-xs font-mono text-pp-muted uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Team</div>
                <div className="col-span-2 text-right">Score</div>
                <div className="col-span-2 text-right">Time</div>
                <div className="col-span-2 text-right">Missions</div>
              </div>
              <div className="divide-y divide-pp-border/50">
                {entries.map((row: any, i) => (
                  <div
                    key={row.id}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm ${
                      i < 3 ? "bg-pp-bg-2/60" : ""
                    }`}
                  >
                    <div className="col-span-1 font-mono">
                      {i === 0 && <span className="text-pp-gold font-bold">1</span>}
                      {i === 1 && <span className="text-pp-silver font-bold">2</span>}
                      {i === 2 && <span className="text-pp-bronze font-bold">3</span>}
                      {i >= 3 && <span className="text-pp-muted">{i + 1}</span>}
                    </div>
                    <div className="col-span-5 font-medium truncate">
                      {row.teams?.team_name ?? "—"}
                    </div>
                    <div className="col-span-2 text-right font-mono text-pp-light">
                      {row.final_score}
                    </div>
                    <div className="col-span-2 text-right font-mono text-pp-muted text-xs">
                      {row.completion_time_seconds
                        ? formatTime(Math.floor(row.completion_time_seconds))
                        : "—"}
                    </div>
                    <div className="col-span-2 text-right font-mono text-pp-muted text-xs">
                      {row.missions_completed}/4
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-pp-card border border-pp-border rounded-xl p-12 text-center text-pp-muted">
              No completions yet.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}