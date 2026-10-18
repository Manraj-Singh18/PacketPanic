import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { teamCode } = await req.json();
    if (!teamCode || typeof teamCode !== "string") {
      return NextResponse.json({ error: "Team code required" }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data: team, error } = await supabase
      .from("teams")
      .select("id, team_name, access_token, event_id")
      .eq("team_code", teamCode.toUpperCase())
      .single();
    if (error || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    return NextResponse.json({
      teamId: team.id,
      teamName: team.team_name,
      accessToken: team.access_token,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}