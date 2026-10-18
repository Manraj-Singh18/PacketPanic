import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const supabase = createAdminClient();
    const { data: session } = await supabase
      .from("game_sessions")
      .select("id, status, start_time, duration_seconds")
      .eq("id", sessionId)
      .single();
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (session.status === "active") {
      const elapsed = (Date.now() - new Date(session.start_time).getTime()) / 1000;
      await supabase
        .from("game_sessions")
        .update({
          status: "expired",
          end_time: new Date().toISOString(),
          completion_time_seconds: elapsed,
        })
        .eq("id", sessionId);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}