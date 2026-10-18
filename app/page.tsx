import Link from "next/link";
import { Network } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import HeroClient from "@/components/HeroClient";
import LeaderboardPreview from "@/components/LeaderboardPreview";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_EVENT_ID } from "@/lib/game/session";
// Force dynamic rendering — never cache
export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getLeaderboardPreview() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("game_sessions")
      .select("team_id, final_score, completion_time_seconds, missions_completed, status, teams(team_name)")
      .eq("event_id", DEFAULT_EVENT_ID)
      .in("status", ["completed", "expired"])
      .order("final_score", { ascending: false })
      .order("completion_time_seconds", { ascending: true })
      .limit(5);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getEventStatus() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("events")
      .select("status, practice_mode")
      .eq("id", DEFAULT_EVENT_ID)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const [preview, event] = await Promise.all([getLeaderboardPreview(), getEventStatus()]);

  return (
    <div className="relative min-h-screen">
      <NetworkBackground density={20} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={22} className="text-pp-electric" />
            <span className="font-mono text-sm tracking-widest text-pp-light">
              PACKET PANIC
            </span>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/leaderboard" className="text-pp-muted hover:text-pp-light">Leaderboard</Link>
            <Link href="/ceremony" className="text-pp-muted hover:text-pp-light">Ceremony</Link>
            <Link href="/admin" className="text-pp-muted hover:text-pp-light">Organizer</Link>
          </nav>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <HeroClient event={event} />
          <LeaderboardPreview preview={preview} />
        </main>

        <section id="how-to-play" className="px-6 py-20 bg-pp-bg-2/40 border-t border-pp-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How to Play</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "Register Your Team", desc: "Create a team with up to 4 members. Receive a unique team code to access the mission." },
                { step: "02", title: "Complete Four Missions", desc: "Route packets, choose protocols, fix addressing, and troubleshoot the final outage. Each mission is harder than the last." },
                { step: "03", title: "Beat the Clock", desc: "You have 10 minutes. Correct answers earn points. The fastest correct team wins. Climb the global leaderboard." },
              ].map((item) => (
                <div key={item.step} className="p-6 bg-pp-card border border-pp-border rounded-lg">
                  <div className="text-3xl font-mono text-pp-electric mb-3">{item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-pp-muted">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 border border-pp-border rounded-lg bg-pp-card/50">
              <h3 className="font-semibold mb-3">What You'll Learn</h3>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-pp-muted">
                <li>• How routers forward packets between networks</li>
                <li>• The difference between TCP and UDP</li>
                <li>• How IP addresses identify source and destination</li>
                <li>• Layered troubleshooting across the TCP/IP stack</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="px-6 py-6 text-center text-xs text-pp-muted border-t border-pp-border">
          Packet Panic · An interactive networking escape room · Built for college technical events
        </footer>
      </div>
    </div>
  );
}