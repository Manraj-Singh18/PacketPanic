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

export async function POST(req: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { action, minutes } = await req.json();
  const supabase = createAdminClient();

  let update: any = {};
  switch (action) {
    case "open_registration":
      update = { status: "registration" };
      break;
    case "start":
      update = { status: "active" };
      break;
    case "end":
      update = { status: "ended" };
      break;
    case "toggle_practice":
      const { data: ev } = await supabase
        .from("events")
        .select("practice_mode")
        .eq("id", DEFAULT_EVENT_ID)
        .single();
      update = { practice_mode: !ev?.practice_mode };
      break;
    case "set_duration":
      if (!minutes || minutes < 1 || minutes > 60) {
        return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
      }
      update = { duration_seconds: minutes * 60 };
      break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const { error } = await supabase
    .from("events")
    .update(update)
    .eq("id", DEFAULT_EVENT_ID);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}