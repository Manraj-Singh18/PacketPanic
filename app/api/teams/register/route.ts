import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_EVENT_ID } from "@/lib/game/session";
import { generateTeamCode, generateToken } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { teamName, members, pin } = await req.json();
    if (!teamName || typeof teamName !== "string" || teamName.trim().length === 0) {
      return NextResponse.json({ error: "Team name required" }, { status: 400 });
    }
    if (!Array.isArray(members) || members.length === 0 || members.length > 4) {
      return NextResponse.json({ error: "1–4 members required" }, { status: 400 });
    }
    if (teamName.length > 30) {
      return NextResponse.json({ error: "Team name too long" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Validate event state
    const { data: event, error: evErr } = await supabase
      .from("events")
      .select("status, event_pin")
      .eq("id", DEFAULT_EVENT_ID)
      .single();
    if (evErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (!["registration", "active"].includes(event.status)) {
      return NextResponse.json({ error: "Registration is closed" }, { status: 403 });
    }
    if (event.event_pin && pin !== event.event_pin) {
      return NextResponse.json({ error: "Invalid event PIN" }, { status: 403 });
    }

    // Generate codes
    const teamCode = generateTeamCode();
    const accessToken = generateToken();

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        event_id: DEFAULT_EVENT_ID,
        team_code: teamCode,
        team_name: teamName.trim(),
        members: members.map((m: string) => m.trim()).filter(Boolean),
        access_token: accessToken,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Team name already taken. Choose another." },
          { status: 409 }
        );
      }
      console.error("Team insert error:", error);
      return NextResponse.json({ error: "Failed to register team" }, { status: 500 });
    }

    return NextResponse.json({
      teamId: team.id,
      teamCode,
      teamName: team.team_name,
      accessToken,
    });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}