import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
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

  const { data: results } = await supabase
    .from("mission_results")
    .select("mission_id, status, score, attempts, hints_used")
    .eq("session_id", params.id)
    .order("mission_id", { ascending: true });

  const response = NextResponse.json({ session, results: results ?? [] });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}