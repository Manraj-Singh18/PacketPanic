import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();

  // Load session
  const { data: session, error } = await supabase
    .from("game_sessions")
    .select(
      "id, status, current_mission, start_time, end_time, duration_seconds, final_score, hints_used, missions_completed, completion_time_seconds, team_id, teams(team_name, team_code)"
    )
    .eq("id", params.id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Load mission results
  const { data: results } = await supabase
    .from("mission_results")
    .select("mission_id, status, score, attempts, hints_used, completed_at")
    .eq("session_id", params.id)
    .order("mission_id", { ascending: true });

  // COMPUTE THE SCORE FROM MISSION_RESULTS — don't trust final_score
  const computedScore = (results ?? []).reduce((sum, r) => sum + (r.score ?? 0), 0);
  const computedCompleted = (results ?? []).filter((r) => r.status === "completed").length;

  console.log("=== SESSION API ===");
  console.log("stored final_score:", session.final_score);
  console.log("computed score from results:", computedScore);
  console.log("computed completed:", computedCompleted);

  // Use the computed values (they're always fresh from mission_results)
  const response = NextResponse.json({
    session: {
      ...session,
      final_score: computedScore, // override with computed value
      missions_completed: computedCompleted,
    },
    results: results ?? [],
  });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}