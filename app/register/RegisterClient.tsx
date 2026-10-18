"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users, KeyRound, Loader2 } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";

interface Props {
  event: {
    status: string;
    duration_seconds: number;
    event_pin: string | null;
    practice_mode: boolean;
  } | null;
  registrationOpen: boolean;
}

export default function RegisterClient({ event, registrationOpen }: Props) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<string[]>(["", "", "", ""]);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMember = (i: number, val: string) => {
    const next = [...members];
    next[i] = val;
    setMembers(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim()) {
      setError("Team name is required");
      return;
    }
    if (event?.event_pin && pin !== event.event_pin) {
      setError("Invalid event PIN");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/teams/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamName.trim(),
          members: members.filter((m) => m.trim()).map((m) => m.trim()),
          pin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      router.push(`/briefing?team=${data.teamCode}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (!registrationOpen) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <NetworkBackground density={12} />
        <div className="relative z-10 max-w-md text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Registration Closed</h1>
          <p className="text-pp-muted mb-6">
            The event is currently {event?.status ?? "not running"}. Please
            check with the organizer or check back shortly.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-pp-electric hover:underline"
          >
            <ArrowLeft size={16} /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <NetworkBackground density={10} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-pp-muted hover:text-pp-light"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-pp-border rounded-full text-xs font-mono text-pp-muted">
                <span className="w-2 h-2 rounded-full bg-pp-electric animate-pulse" />
                STEP 1 OF 3
              </div>
              <h1 className="text-3xl font-bold">Register Your Team</h1>
              <p className="text-sm text-pp-muted mt-2">
                You'll have {Math.floor((event?.duration_seconds ?? 600) / 60)} minutes
                to complete four missions.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-pp-card border border-pp-border rounded-xl p-6 space-y-5"
            >
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Users size={16} className="text-pp-electric" />
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={30}
                  required
                  placeholder="e.g. The Subnet Surfers"
                  className="w-full px-3 py-2.5 bg-pp-bg-2 border border-pp-border rounded-lg text-pp-text placeholder:text-pp-muted/60 focus:border-pp-electric focus:outline-none focus:ring-1 focus:ring-pp-electric"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Team Members{" "}
                  <span className="text-pp-muted text-xs">
                    (up to 4, at least 1 required)
                  </span>
                </label>
                <div className="space-y-2">
                  {members.map((m, i) => (
                    <input
                      key={i}
                      type="text"
                      value={m}
                      onChange={(e) => updateMember(i, e.target.value)}
                      maxLength={40}
                      placeholder={`Member ${i + 1}${i === 0 ? " (required)" : ""}`}
                      required={i === 0}
                      className="w-full px-3 py-2 bg-pp-bg-2 border border-pp-border rounded-lg text-sm text-pp-text placeholder:text-pp-muted/60 focus:border-pp-electric focus:outline-none"
                    />
                  ))}
                </div>
              </div>

              {event?.event_pin && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <KeyRound size={16} className="text-pp-electric" />
                    Event PIN
                  </label>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    placeholder="Enter the PIN provided by the organizer"
                    className="w-full px-3 py-2.5 bg-pp-bg-2 border border-pp-border rounded-lg text-pp-text placeholder:text-pp-muted/60 focus:border-pp-electric focus:outline-none font-mono"
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Registering...
                  </>
                ) : (
                  "Register Team"
                )}
              </button>
            </form>

            <p className="text-xs text-pp-muted text-center mt-4">
              By registering, you'll receive a unique team code. Keep it to
              rejoin your session from another device.
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}