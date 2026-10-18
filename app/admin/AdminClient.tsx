"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, Play, Square, RotateCcw, Trash2, Users, Trophy, Settings, AlertTriangle } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import { motion } from "framer-motion";
interface Props {
  initialState: {
    authorized: boolean;
    event?: any;
    teams?: any[];
    sessions?: any[];
  };
}

export default function AdminClient({ initialState }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [event, setEvent] = useState(initialState.event);
  const [teams, setTeams] = useState(initialState.teams ?? []);
  const [sessions, setSessions] = useState(initialState.sessions ?? []);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setAuthError("Invalid password");
    }
  };

  const callAdmin = async (endpoint: string, body: any = {}) => {
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  if (!initialState.authorized) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <NetworkBackground density={10} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-pp-border bg-pp-card mb-3">
              <Lock size={24} className="text-pp-electric" />
            </div>
            <h1 className="text-xl font-bold">Organizer Access</h1>
            <p className="text-xs text-pp-muted mt-1">
              Enter the admin secret to manage the event.
            </p>
          </div>
          <form
            onSubmit={login}
            className="bg-pp-card border border-pp-border rounded-lg p-5 space-y-3"
          >
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setAuthError(null);
              }}
              placeholder="Admin secret"
              className="w-full px-3 py-2.5 bg-pp-bg-2 border border-pp-border rounded-lg text-pp-text font-mono focus:border-pp-electric focus:outline-none"
              required
            />
            {authError && (
              <div className="text-xs text-red-400">{authError}</div>
            )}
            <button
              type="submit"
              className="w-full py-2.5 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold"
            >
              Authenticate
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-pp-muted hover:text-pp-light">
              ← Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NetworkBackground density={6} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5 flex items-center justify-between border-b border-pp-border">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-pp-electric" />
            <h1 className="font-bold">Organizer Console</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/ceremony"
              className="text-sm px-3 py-1.5 border border-pp-border rounded hover:border-pp-electric text-pp-light"
            >
              Open Ceremony
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm px-3 py-1.5 border border-pp-border rounded hover:border-pp-electric text-pp-light"
            >
              Leaderboard
            </Link>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Event state */}
          <section className="bg-pp-card border border-pp-border rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <Settings size={18} className="text-pp-electric" /> Event Status
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-pp-muted">Status</div>
                <div className="text-lg font-mono font-bold text-pp-electric">
                  {event?.status?.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-xs text-pp-muted">Duration</div>
                <div className="text-lg font-mono font-bold">
                  {Math.floor((event?.duration_seconds ?? 600) / 60)} min
                </div>
              </div>
              <div>
                <div className="text-xs text-pp-muted">Practice Mode</div>
                <div className="text-lg font-mono font-bold">
                  {event?.practice_mode ? "ON" : "OFF"}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => callAdmin("/api/admin/event", { action: "open_registration" })}
                disabled={busy}
                className="px-3 py-1.5 text-sm bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded"
              >
                Open Registration
              </button>
              <button
                onClick={() => callAdmin("/api/admin/event", { action: "start" })}
                disabled={busy}
                className="px-3 py-1.5 text-sm bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded flex items-center gap-1"
              >
                <Play size={14} /> Start Event
              </button>
              <button
                onClick={() => callAdmin("/api/admin/event", { action: "end" })}
                disabled={busy}
                className="px-3 py-1.5 text-sm border border-red-500/40 text-red-300 hover:bg-red-500/10 rounded flex items-center gap-1"
              >
                <Square size={14} /> End Event
              </button>
              <button
                onClick={() => callAdmin("/api/admin/event", { action: "toggle_practice" })}
                disabled={busy}
                className="px-3 py-1.5 text-sm border border-pp-border text-pp-muted hover:text-pp-light rounded"
              >
                Toggle Practice
              </button>
              <button
                onClick={() => {
                  const mins = prompt("Duration in minutes", "10");
                  if (mins) callAdmin("/api/admin/event", { action: "set_duration", minutes: Number(mins) });
                }}
                disabled={busy}
                className="px-3 py-1.5 text-sm border border-pp-border text-pp-muted hover:text-pp-light rounded"
              >
                Set Duration
              </button>
            </div>
          </section>

          {/* Teams */}
          <section className="bg-pp-card border border-pp-border rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <Users size={18} className="text-pp-electric" /> Registered Teams ({teams.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-pp-muted border-b border-pp-border">
                    <th className="text-left py-2 px-2">Team</th>
                    <th className="text-left py-2 px-2">Code</th>
                    <th className="text-left py-2 px-2">Members</th>
                    <th className="text-left py-2 px-2">Registered</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pp-border/50">
                  {teams.map((t: any) => (
                    <tr key={t.id}>
                      <td className="py-2 px-2 font-medium">{t.team_name}</td>
                      <td className="py-2 px-2 font-mono text-pp-electric">{t.team_code}</td>
                      <td className="py-2 px-2 text-pp-muted text-xs">{(t.members ?? []).join(", ")}</td>
                      <td className="py-2 px-2 text-pp-muted text-xs">
                        {new Date(t.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Reset session for ${t.team_name}?`)) {
                              callAdmin("/api/admin/reset_team", { teamId: t.id });
                            }
                          }}
                          className="text-xs px-2 py-1 border border-pp-border text-pp-muted hover:text-pp-light rounded flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw size={12} /> Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-pp-muted">
                        No teams registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sessions */}
          <section className="bg-pp-card border border-pp-border rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <Trophy size={18} className="text-pp-electric" /> Game Sessions ({sessions.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-pp-muted border-b border-pp-border">
                    <th className="text-left py-2 px-2">Team</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Mission</th>
                    <th className="text-right py-2 px-2">Score</th>
                    <th className="text-right py-2 px-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pp-border/50">
                  {sessions.map((s: any) => (
                    <tr key={s.id}>
                      <td className="py-2 px-2 font-medium">{s.teams?.team_name}</td>
                      <td className="py-2 px-2">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                          s.status === "completed" ? "bg-pp-electric/20 text-pp-electric" :
                          s.status === "active" ? "bg-pp-blue/20 text-pp-light" :
                          s.status === "expired" ? "bg-red-500/20 text-red-300" :
                          "bg-pp-bg-2 text-pp-muted"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono text-xs">{s.current_mission}/4</td>
                      <td className="py-2 px-2 text-right font-mono text-pp-light">{s.final_score}</td>
                      <td className="py-2 px-2 text-right font-mono text-xs text-pp-muted">
                        {s.completion_time_seconds ? `${Math.floor(s.completion_time_seconds)}s` : "—"}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-pp-muted">
                        No active sessions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Danger zone */}
          <section className="bg-red-500/5 border border-red-500/30 rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-semibold mb-4 text-red-300">
              <AlertTriangle size={18} /> Danger Zone
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (confirmClear) {
                    callAdmin("/api/admin/clear_event", {});
                    setConfirmClear(false);
                  } else {
                    setConfirmClear(true);
                    setTimeout(() => setConfirmClear(false), 5000);
                  }
                }}
                className="px-3 py-2 text-sm border border-red-500/40 text-red-300 hover:bg-red-500/10 rounded flex items-center gap-2"
              >
                <Trash2 size={14} />
                {confirmClear ? "Click again to confirm — clears ALL teams & sessions" : "Clear All Event Data"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

