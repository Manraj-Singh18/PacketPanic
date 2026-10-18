import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_EVENT_ID } from "@/lib/game/session";

export async function POST(req: Request) {
  try {
    const { teamCode } = await req.json();
    if (!teamCode) return NextResponse.json({ error: "Team code required" }, { status: 400 });

    const supabase = createAdminClient();

    // Validate event
    const { data: event } = await supabase
      .from("events")
      .select("status, duration_seconds")
      .eq("id", DEFAULT_EVENT_ID)
      .single();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (!["registration", "active"].includes(event.status)) {
      return NextResponse.json({ error: "Event not active" }, { status: 403 });
    }

    // Find team
    const { data: team } = await supabase
      .from("teams")
      .select("id, team_name")
      .eq("team_code", teamCode.toUpperCase())
      .single();
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // Check for existing session this event
    const { data: existing } = await supabase
      .from("game_sessions")
      .select("id, status, start_time, current_mission")
      .eq("team_id", team.id)
      .eq("event_id", DEFAULT_EVENT_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing && existing.status === "active") {
      return NextResponse.json({ sessionId: existing.id, resumed: true });
    }
    if (existing && (existing.status === "completed" || existing.status === "expired")) {
      return NextResponse.json(
        { error: "Team already completed this event", sessionId: existing.id },
        { status: 403 }
      );
    }

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        team_id: team.id,
        event_id: DEFAULT_EVENT_ID,
        status: "active",
        current_mission: 1,
        start_time: new Date().toISOString(),
        duration_seconds: event.duration_seconds,
      })
      .select()
      .single();

    if (error) {
      console.error("Session insert:", error);
      return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
    }

    // Create mission_results stubs
    await supabase.from("mission_results").insert(
      [1, 2, 3, 4].map((mid) => ({
        session_id: session.id,
        mission_id: mid,
        status: "in_progress",
      }))
    );

    return NextResponse.json({ sessionId: session.id, resumed: false });
  } catch (e) {
    console.error("Start session error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}