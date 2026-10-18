import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/game/session";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return token === process.env.ADMIN_SECRET;
}

export async function POST(req: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { teamId } = await req.json();
  if (!teamId) return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
  const supabase = createAdminClient();
  // Delete all sessions and mission_results for this team
  const { data: sessions } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("team_id", teamId);
  if (sessions && sessions.length > 0) {
    await supabase
      .from("mission_results")
      .delete()
      .in("session_id", sessions.map((s) => s.id));
    await supabase
      .from("game_sessions")
      .delete()
      .eq("team_id", teamId);
  }
  return NextResponse.json({ ok: true });
}