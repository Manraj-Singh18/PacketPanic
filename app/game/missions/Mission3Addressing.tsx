"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server,
  FileSearch,
  Pencil,
  Wifi,
  Activity,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
} from "lucide-react";

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

interface ServerItem {
  id: string;
  name: string;
  ip: string;
  service: string;
  status: "online" | "offline" | "decommissioned";
  note: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  source: string;
  destination: string;
  result: string;
  isWrongDestination: boolean;
}

const servers: ServerItem[] = [
  {
    id: "old_archive",
    name: "Old Archive Server",
    ip: "10.20.0.20",
    service: "File Archive (decommissioned)",
    status: "decommissioned",
    note: "Replaced last week. Still receives stray requests due to cached configs.",
  },
  {
    id: "event_server",
    name: "Event Server",
    ip: "10.20.0.10",
    service: "Event Registration & Live Stream",
    status: "online",
    note: "Online and reachable. Hosting tonight's event.",
  },
  {
    id: "backup_server",
    name: "Backup Server",
    ip: "10.20.0.30",
    service: "Backup & Recovery Service",
    status: "online",
    note: "Online, but hosts a DIFFERENT service (backups only). Not the event server.",
  },
];

const logs: LogEntry[] = [
  {
    id: 1,
    timestamp: "18:42:01",
    source: "192.168.1.25",
    destination: "10.20.0.20",
    result: "Connection refused — host decommissioned",
    isWrongDestination: true,
  },
  {
    id: 2,
    timestamp: "18:42:15",
    source: "192.168.1.25",
    destination: "10.20.0.20",
    result: "Connection refused — host decommissioned",
    isWrongDestination: true,
  },
  {
    id: 3,
    timestamp: "18:42:28",
    source: "192.168.1.25",
    destination: "10.20.0.30",
    result: "TCP connect succeeded, but service mismatch (backup service, not event)",
    isWrongDestination: true,
  },
  {
    id: 4,
    timestamp: "18:42:40",
    source: "192.168.1.25",
    destination: "10.20.0.10",
    result: "TCP connect succeeded — event service responding",
    isWrongDestination: false,
  },
];

type Stage = "investigate" | "fix-address" | "test-network" | "test-service" | "complete";

export default function Mission3Addressing({ sessionId, onResult }: Props) {
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const [destinationIp, setDestinationIp] = useState<string>("10.20.0.20");
  const [stage, setStage] = useState<Stage>("investigate");
  const [networkTestResult, setNetworkTestResult] = useState<null | "pass" | "fail">(null);
  const [serviceTestResult, setServiceTestResult] = useState<null | "pass" | "fail" | "service-down">(null);
  const [finalAnswer, setFinalAnswer] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const correctIp = "10.20.0.10";

  const runNetworkTest = () => {
    if (destinationIp.trim() === correctIp) {
      setNetworkTestResult("pass");
      setStage("test-service");
      setFeedback("Network reachability test PASSED. The event server (10.20.0.10) responds to ping.");
    } else if (destinationIp.trim() === "10.20.0.20") {
      setNetworkTestResult("fail");
      setFeedback("Network test FAILED. 10.20.0.20 is decommissioned — no host responds. Fix the destination IP.");
    } else if (destinationIp.trim() === "10.20.0.30") {
      setNetworkTestResult("pass");
      setFeedback("Network test PASSED — 10.20.0.30 is reachable. But is it the EVENT server? Check the service inventory.");
    } else {
      setNetworkTestResult("fail");
      setFeedback("Network test FAILED. Unknown host. Use one of the IPs from the inventory.");
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const runServiceTest = () => {
    if (destinationIp.trim() === correctIp) {
      // The event server is reachable at the network layer, but the application service is temporarily down
      setServiceTestResult("service-down");
      setFeedback(
        "Application-service test: the event server is REACHABLE at the network layer, but the event application service reports TEMPORARILY UNAVAILABLE. The address was correct — there is a separate application-level issue."
      );
      setStage("complete");
    } else if (destinationIp.trim() === "10.20.0.30") {
      setServiceTestResult("fail");
      setFeedback("Application-service test: the backup service answered, but it is NOT the event service. Wrong server.");
    } else {
      setServiceTestResult("fail");
      setFeedback("Application-service test FAILED. No service responded.");
    }
    setTimeout(() => setFeedback(null), 6000);
  };

      const submit = async () => {
    if (destinationIp.trim() !== correctIp) {
      setFeedback("Destination IP is still wrong. Correct it to 10.20.0.10 before submitting.");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    if (networkTestResult !== "pass") {
      setFeedback("Run the network reachability test first.");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    if (serviceTestResult !== "service-down") {
      setFeedback("Run the application-service test first.");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    if (!finalAnswer) {
      setFeedback("Select an answer to the final diagnosis question.");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    const mcqCorrect = finalAnswer === "a";
    setSubmitted(true);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 3,
          payload: {
            destinationIp: destinationIp.trim(),
            networkTestPassed: networkTestResult === "pass",
            serviceTestResult,
            mcqCorrect,
          },
        }),
      });
      const data = await res.json();
      // ALWAYS advance — partial credit is awarded by the server
      onResult({
        success: true,
        message: mcqCorrect
          ? "Investigation complete. Both issues identified correctly."
          : "Investigation submitted. Partial credit awarded — review the feedback and move on.",
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
          MISSION 3 · THE ADDRESSING MYSTERY · 150 PTS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">The Addressing Mystery</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          A new event server replaced the old archive server, but some requests
          are still going to the wrong destination. Investigate the request log,
          identify the wrong address, correct it, then run TWO separate tests:
          one for network reachability, one for application service availability.
          These are different layers — do not confuse them.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Server inventory */}
        <div className="bg-pp-card border border-pp-border rounded-lg p-3">
          <h3 className="flex items-center gap-2 text-xs font-mono tracking-wider text-pp-muted mb-3">
            <Server size={14} className="text-pp-electric" /> SERVER INVENTORY
          </h3>
          <div className="space-y-2">
            {servers.map((s) => {
              const isSel = selectedServer === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedServer(s.id)}
                  className={`w-full text-left p-2.5 rounded border text-xs transition-all ${
                    isSel
                      ? "border-pp-electric bg-pp-electric/10"
                      : "border-pp-border/60 hover:border-pp-light bg-pp-bg-2/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-pp-text">{s.name}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        s.status === "online"
                          ? "bg-pp-electric/20 text-pp-electric"
                          : s.status === "decommissioned"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-pp-bg-2 text-pp-muted"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-pp-light">{s.ip}</div>
                  <div className="text-pp-muted">{s.service}</div>
                  {isSel && (
                    <div className="mt-1.5 pt-1.5 border-t border-pp-border/40 text-pp-muted text-[11px] leading-relaxed">
                      {s.note}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Request log */}
        <div className="bg-pp-card border border-pp-border rounded-lg p-3">
          <h3 className="flex items-center gap-2 text-xs font-mono tracking-wider text-pp-muted mb-3">
            <FileSearch size={14} className="text-pp-electric" /> REQUEST LOG
          </h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {logs.map((l) => {
              const isSel = selectedLog === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelectedLog(l.id)}
                  className={`w-full text-left p-2 rounded border text-xs font-mono transition-all ${
                    isSel
                      ? l.isWrongDestination
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-pp-electric bg-pp-electric/10"
                      : "border-pp-border/40 hover:border-pp-light bg-pp-bg-2/30"
                  }`}
                >
                  <div className="flex items-center justify-between text-pp-muted">
                    <span>{l.timestamp}</span>
                    <span>#{l.id}</span>
                  </div>
                  <div className="mt-1 text-pp-light">
                    {l.source} → <span className={l.isWrongDestination ? "text-red-300" : "text-pp-electric"}>{l.destination}</span>
                  </div>
                  <div className="text-pp-muted text-[10px] mt-0.5">{l.result}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-pp-muted">
            {selectedLog
              ? `Inspecting log #${selectedLog}. The destination field tells you where the request was actually sent.`
              : "Click a log entry to inspect its source and destination fields."}
          </div>
        </div>
      </div>

      {/* Request configuration */}
      <div className="bg-pp-card border border-pp-border rounded-lg p-4 mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
          <Pencil size={16} className="text-pp-electric" /> Request Configuration
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-pp-muted">Destination IP:</label>
          <input
            type="text"
            value={destinationIp}
            onChange={(e) => {
              setDestinationIp(e.target.value);
              setNetworkTestResult(null);
              setServiceTestResult(null);
            }}
            className="px-3 py-2 bg-pp-bg-2 border border-pp-border rounded-lg font-mono text-pp-text focus:border-pp-electric focus:outline-none"
            placeholder="e.g. 10.20.0.10"
          />
          <span className="text-xs text-pp-muted">Source: 192.168.1.25 (fixed)</span>
        </div>
      </div>

      {/* Diagnostic tests */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Network test */}
        <div className="bg-pp-card border border-pp-border rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Wifi size={16} className="text-pp-electric" /> Network Reachability Test
          </h3>
          <p className="text-xs text-pp-muted mb-3">
            Tests whether the destination IP responds at the network layer (Layer 3).
            This does NOT tell you whether an application service is running.
          </p>
          <button
            onClick={runNetworkTest}
            className="px-4 py-2 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded text-sm font-semibold"
          >
            Run Network Test
          </button>
          {networkTestResult && (
            <div
              className={`mt-3 flex items-center gap-2 text-sm ${
                networkTestResult === "pass" ? "text-pp-electric" : "text-red-400"
              }`}
            >
              {networkTestResult === "pass" ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {networkTestResult === "pass" ? "PASS — host reachable" : "FAIL — no response"}
            </div>
          )}
        </div>

        {/* Service test */}
        <div className="bg-pp-card border border-pp-border rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Activity size={16} className="text-pp-electric" /> Application Service Test
          </h3>
          <p className="text-xs text-pp-muted mb-3">
            Tests whether the intended application service is available (Layer 7).
            Requires the network test to pass first.
          </p>
          <button
            onClick={runServiceTest}
            disabled={networkTestResult !== "pass"}
            className="px-4 py-2 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded text-sm font-semibold disabled:opacity-50"
          >
            Run Service Test
          </button>
          {serviceTestResult && (
            <div
              className={`mt-3 flex items-center gap-2 text-sm ${
                serviceTestResult === "service-down"
                  ? "text-yellow-400"
                  : serviceTestResult === "pass"
                  ? "text-pp-electric"
                  : "text-red-400"
              }`}
            >
              <AlertTriangle size={16} />
              {serviceTestResult === "service-down"
                ? "Network OK — but application service TEMPORARILY UNAVAILABLE"
                : serviceTestResult === "pass"
                ? "Service responding"
                : "Service test failed"}
            </div>
          )}
        </div>
      </div>

                        {/* Final MCQ */}
      {stage === "complete" && (
        <div className="bg-pp-card border border-pp-border rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2">Final Diagnosis (MCQ)</h3>
          <p className="text-xs text-pp-muted mb-3">
            Based on your investigation, which statement best describes the TWO separate issues you found?
          </p>
          <div className="space-y-2">
            {[
              {
                id: "a",
                text: "The request was sent to the wrong IP (decommissioned archive server). After fixing the address, the server is reachable, but the event application service is temporarily unavailable.",
              },
              {
                id: "b",
                text: "The event server is offline and cannot be reached at the network layer. The application is also down.",
              },
              {
                id: "c",
                text: "The DNS server is broken, causing the wrong IP to be used. Fixing DNS solves everything.",
              },
              {
                id: "d",
                text: "The backup server (10.20.0.30) is the correct destination. The event service runs there.",
              },
            ].map((opt) => {
              const isSel = finalAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFinalAnswer(opt.id)}
                  className={`w-full text-left p-3 rounded border text-xs transition-all ${
                    isSel
                      ? "border-pp-electric bg-pp-electric/10 text-pp-light"
                      : "border-pp-border text-pp-muted hover:border-pp-light"
                  }`}
                >
                  <span className="font-mono font-bold mr-2 text-pp-electric">{opt.id.toUpperCase()}.</span>
                  {opt.text}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-pp-muted italic">
            Choose carefully — you can only submit once for scoring.
          </p>
        </div>
      )}
      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={submitted}
          className="px-6 py-2.5 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} /> Submit Investigation
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
          A correct destination IP is necessary to reach the intended host, but
          it does not guarantee that the application service is running. Network
          reachability (Layer 3) and application availability (Layer 7) are
          separate concerns — troubleshooting should isolate problems by layer.
        </p>
      </div>
    </div>
  );
}
