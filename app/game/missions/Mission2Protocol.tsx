"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Phone,
  Database,
  FlaskConical,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Plug,
} from "lucide-react";

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

interface Service {
  id: number;
  name: string;
  icon: typeof FileText;
  requirement: string;
  currentBehavior: string;
  diagnostic: string;
  correctProtocol: "TCP" | "UDP";
  correctReason: string;
  correctPort: number;
  portOptions: number[];
  portLabel: string;
  serviceNote: string;
}

const SERVICES: Service[] = [
  {
    id: 1,
    name: "Event Document Download",
    icon: FileText,
    requirement: "Download a 50-page event program. Every byte must arrive correctly and in order.",
    currentBehavior: "Download pauses at page 23, then resumes at page 26. Pages 24–25 are missing.",
    diagnostic:
      "Capture shows segment 24 and 25 were never retransmitted. The transport layer is not requesting retransmission of lost segments.",
    correctProtocol: "TCP",
    correctReason:
      "TCP provides reliable, ordered delivery with automatic retransmission of lost segments. The missing pages require retransmission — only TCP does this natively.",
    correctPort: 443,
    portOptions: [443, 53, 161],
    portLabel: "HTTPS (secure document transfer)",
    serviceNote: "HTTPS runs on TCP port 443. The download is an HTTPS request.",
  },
  {
    id: 2,
    name: "Live Voice Call",
    icon: Phone,
    requirement: "Two students speaking live. Audio must arrive with minimal delay.",
    currentBehavior: "Audio is being retransmitted constantly. Listeners hear echoes and 2-second delays.",
    diagnostic:
      "Capture shows the transport layer re-sending old voice samples. By the time they arrive, they are useless.",
    correctProtocol: "UDP",
    correctReason:
      "UDP sends datagrams without retransmission. For live audio, an old sample is useless — it's better to drop it and play the next one. TCP's retransmission causes the echo and delay.",
    correctPort: 5060,
    portOptions: [5060, 80, 22],
    portLabel: "SIP / RTP voice (real-time media)",
    serviceNote: "Voice-over-IP media typically uses UDP. SIP signaling often uses UDP port 5060.",
  },
  {
    id: 3,
    name: "Database Request",
    icon: Database,
    requirement:
      "Application sends a small query to the event database and expects a response. The provided database service uses TCP and requires reliable delivery.",
    currentBehavior: "Queries sometimes vanish. The application hangs waiting for a response that never comes.",
    diagnostic:
      "Capture shows queries sent as datagrams with no delivery confirmation. When a query is lost, nothing retries it.",
    correctProtocol: "TCP",
    correctReason:
      "The database service requires reliable delivery. TCP ensures both the request and response arrive. Without reliability, a lost query causes the application to hang.",
    correctPort: 5432,
    portOptions: [5432, 123, 69],
    portLabel: "PostgreSQL database (reliable query/response)",
    serviceNote: "PostgreSQL listens on TCP port 5432 by default. Database services commonly use TCP.",
  },
];

type TestStatus = "idle" | "running" | "pass" | "fail";

export default function Mission2Protocol({ sessionId, onResult }: Props) {
  const [assignments, setAssignments] = useState<Record<number, "TCP" | "UDP" | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [portAssignments, setPortAssignments] = useState<Record<number, number | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [openDiagnostic, setOpenDiagnostic] = useState<number | null>(null);
  const [testStatus, setTestStatus] = useState<Record<number, TestStatus>>({
    1: "idle",
    2: "idle",
    3: "idle",
  });
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const assignProtocol = (serviceId: number, proto: "TCP" | "UDP") => {
    setAssignments((prev) => ({ ...prev, [serviceId]: proto }));
    setTestStatus((prev) => ({ ...prev, [serviceId]: "idle" }));
  };

  const assignPort = (serviceId: number, port: number) => {
    setPortAssignments((prev) => ({ ...prev, [serviceId]: port }));
  };

  const runTest = (serviceId: number) => {
    const service = SERVICES.find((s) => s.id === serviceId)!;
    const proto = assignments[serviceId];
    const port = portAssignments[serviceId];
    if (!proto || !port) {
      setFeedback("Assign both a protocol and a port before running the test.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setTestStatus((prev) => ({ ...prev, [serviceId]: "running" }));
    setTimeout(() => {
      const protoCorrect = proto === service.correctProtocol;
      const portCorrect = port === service.correctPort;
      const passed = protoCorrect && portCorrect;
      setTestStatus((prev) => ({
        ...prev,
        [serviceId]: passed ? "pass" : "fail",
      }));
    }, 1200);
  };

  const allTestsPass = SERVICES.every(
    (s) => testStatus[s.id] === "pass"
  );
  const allConfigured = SERVICES.every(
    (s) => assignments[s.id] && portAssignments[s.id]
  );

  const submit = async () => {
    if (!allConfigured) {
      setFeedback("Configure all three services (protocol + port) before submitting.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (!allTestsPass) {
      setFeedback("Run tests on all three services and ensure they pass before submitting.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setSubmitted(true);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 2,
          payload: {
            answers: SERVICES.map((s) => ({
              scenarioId: s.id,
              protocol: assignments[s.id],
              port: portAssignments[s.id],
            })),
          },
        }),
      });
      const data = await res.json();
      onResult({
        success: data.success,
        message: data.message || "All services correctly configured.",
        sessionCompleted: data.sessionCompleted,
      });
    } catch {
      onResult({ success: false, message: "Network error." });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-pp-border rounded-full text-xs font-mono text-pp-muted mb-3">
          MISSION 2 · PROTOCOL TRIAGE ROOM · 150 PTS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">The Protocol Triage Room</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          Three applications are misbehaving. Inspect their diagnostic evidence,
          assign the correct transport protocol (TCP or UDP), match the correct
          port from the service directory, then run a simulated test before
          submitting your final configuration.
        </p>
      </div>

      {/* Service directory (port hints) */}
      <div className="bg-pp-card border border-pp-border rounded-lg p-3 mb-4">
        <h3 className="flex items-center gap-2 text-xs font-mono tracking-wider text-pp-muted mb-2">
          <Plug size={14} className="text-pp-electric" /> SERVICE DIRECTORY (PORT REFERENCE)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-pp-bg-2/40 rounded border border-pp-border/40 font-mono">
            <span className="text-pp-electric">443/tcp</span> — HTTPS
          </div>
          <div className="p-2 bg-pp-bg-2/40 rounded border border-pp-border/40 font-mono">
            <span className="text-pp-electric">5432/tcp</span> — PostgreSQL
          </div>
          <div className="p-2 bg-pp-bg-2/40 rounded border border-pp-border/40 font-mono">
            <span className="text-pp-electric">5060/udp</span> — SIP (VoIP)
          </div>
          <div className="p-2 bg-pp-bg-2/40 rounded border border-pp-border/40 font-mono">
            <span className="text-pp-muted">53, 80, 22, 69, 123, 161</span> — other
          </div>
        </div>
      </div>

      {/* Service cards */}
      <div className="space-y-4">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          const proto = assignments[s.id];
          const port = portAssignments[s.id];
          const status = testStatus[s.id];
          const isOpen = openDiagnostic === s.id;
          return (
            <div
              key={s.id}
              className="bg-pp-card border border-pp-border rounded-lg p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-pp-bg-2 border border-pp-border flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-pp-electric" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-pp-muted mt-1">{s.requirement}</p>
                </div>
                {status === "pass" && (
                  <div className="flex items-center gap-1 text-pp-electric text-xs">
                    <CheckCircle2 size={16} /> PASS
                  </div>
                )}
                {status === "fail" && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <XCircle size={16} /> FAIL
                  </div>
                )}
              </div>

              <div className="text-xs text-pp-muted mb-3 italic">
                Current behavior: {s.currentBehavior}
              </div>

              {/* Diagnostic toggle */}
              <button
                onClick={() => setOpenDiagnostic(isOpen ? null : s.id)}
                className="text-xs text-pp-electric hover:underline flex items-center gap-1 mb-3"
              >
                <FlaskConical size={12} />
                {isOpen ? "Hide diagnostic report" : "Show diagnostic report"}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-2.5 bg-pp-bg-2/60 border border-pp-border/40 rounded text-xs text-pp-muted mb-3 font-mono">
                      {s.diagnostic}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Protocol assignment */}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-pp-muted mb-1.5">Transport Protocol</div>
                  <div className="flex gap-2">
                    {(["TCP", "UDP"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => assignProtocol(s.id, p)}
                        className={`flex-1 py-2 rounded border font-mono font-bold text-sm transition-all ${
                          proto === p
                            ? "border-pp-electric bg-pp-electric/10 text-pp-electric"
                            : "border-pp-border text-pp-muted hover:border-pp-light"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {proto && proto === s.correctProtocol && status === "pass" && (
                    <div className="mt-2 text-[11px] text-pp-electric leading-relaxed">
                      {s.correctReason}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-pp-muted mb-1.5">Service Port</div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.portOptions.map((p) => (
                      <button
                        key={p}
                        onClick={() => assignPort(s.id, p)}
                        className={`px-2.5 py-1.5 rounded border font-mono text-xs transition-all ${
                          port === p
                            ? "border-pp-electric bg-pp-electric/10 text-pp-electric"
                            : "border-pp-border text-pp-muted hover:border-pp-light"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Test button */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => runTest(s.id)}
                  disabled={!proto || !port || status === "running"}
                  className="px-3 py-1.5 text-xs bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded font-semibold disabled:opacity-50 flex items-center gap-1"
                >
                  <FlaskConical size={12} />
                  {status === "running" ? "Testing..." : "Run Simulated Test"}
                </button>
                {status === "fail" && (
                  <span className="text-xs text-red-400">
                    Test failed — check your protocol/port assignment against the diagnostic.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs text-pp-muted">
          Tests passed: {SERVICES.filter((s) => testStatus[s.id] === "pass").length}/3
        </div>
        <button
          onClick={submit}
          disabled={submitted || !allTestsPass}
          className="px-6 py-2.5 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
          {submitted ? "Submitted" : "Submit Final Configuration"}
        </button>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 rounded-md border border-pp-border text-sm text-pp-muted bg-pp-bg-2"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 p-4 bg-pp-bg-2/50 border border-pp-border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Concepts</h3>
        <p className="text-xs text-pp-muted">
          TCP provides reliable, ordered byte-stream delivery with retransmission.
          UDP provides lightweight datagrams without those guarantees. The right
          choice depends on the application's needs: reliability vs latency.
          Ports identify application endpoints at the transport layer — they are
          distinct from IP addresses.
        </p>
      </div>
    </div>
  );
}
