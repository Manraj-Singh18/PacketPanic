import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_EVENT_ID } from "@/lib/game/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("game_sessions")
    .select(
      "id, final_score, completion_time_seconds, missions_completed, status, end_time, teams(team_name)"
    )
    .eq("event_id", DEFAULT_EVENT_ID)
    .in("status", ["completed", "expired"])
    .order("final_score", { ascending: false })
    .order("completion_time_seconds", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  const entries = (data ?? []).map((row: any, i: number) => ({
    rank: i + 1,
    session_id: row.id,
    team_name: row.teams?.team_name ?? "—",
    final_score: row.final_score,
    completion_time_seconds: row.completion_time_seconds,
    missions_completed: row.missions_completed,
  }));

  return NextResponse.json({ entries });
}