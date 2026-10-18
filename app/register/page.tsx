import RegisterClient from "./RegisterClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_EVENT_ID } from "@/lib/game/session";

export const dynamic = "force-dynamic";

async function getEvent() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("status, duration_seconds, event_pin, practice_mode")
      .eq("id", DEFAULT_EVENT_ID)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function RegisterPage() {
  const event = await getEvent();
  const registrationOpen = event?.status === "registration" || event?.status === "active";

  return (
    <RegisterClient
      event={event}
      registrationOpen={registrationOpen}
    />
  );
}