import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_EVENT_ID } from "@/lib/game/session";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/game/session";

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return token === process.env.ADMIN_SECRET;
}

export async function POST() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  // Deleting teams cascades to sessions and mission_results
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("event_id", DEFAULT_EVENT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Reset event state
  await supabase
    .from("events")
    .update({ status: "registration", practice_mode: false, duration_seconds: 600 })
    .eq("id", DEFAULT_EVENT_ID);
  return NextResponse.json({ ok: true });
}