"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Shield,
  Wrench,
  Wifi,
  Send,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

interface Evidence {
  id: string;
  title: string;
  detail: string;
  correctVerdict: "relevant" | "irrelevant";
}

const EVIDENCE: Evidence[] = [
  {
    id: "pkt_header",
    title: "Packet Header",
    detail: "Source: 10.0.0.5 | Destination: 10.20.0.10 | Transport: TCP | Payload: EVENT_FILE_UPLOAD",
    correctVerdict: "relevant",
  },
  {
    id: "rb_link",
    title: "Router RB Status",
    detail: "RB reports: outgoing link to RD is DOWN. Interface eth1 is in error state.",
    correctVerdict: "relevant",
  },
  {
    id: "rc_link",
    title: "Router RC Status",
    detail: "RC reports: outgoing link to RD is OPERATIONAL. Packets forwarded via RC reach RD successfully.",
    correctVerdict: "relevant",
  },
  {
    id: "app_req",
    title: "Application Requirements",
    detail: "Event file upload requires reliable, ordered delivery. The organizer's laptop sends an EVENT_FILE_UPLOAD.",
    correctVerdict: "relevant",
  },
  {
    id: "dns_cache",
    title: "DNS Cache Entry",
    detail: "DNS cache on the laptop still has an entry: event.college.edu → 10.20.0.20 (the OLD server IP).",
    correctVerdict: "irrelevant",
  },
  {
    id: "ra_status",
    title: "Router RA Status",
    detail: "RA is fully operational. All interfaces up.",
    correctVerdict: "irrelevant",
  },
];

const DIAGNOSES = [
  { id: "wrong_dest_ip", label: "Incorrect destination IP" },
  { id: "failed_link", label: "Failed link on the current route (RB → RD)" },
  { id: "dns_failure", label: "DNS resolution failure" },
  { id: "wrong_protocol", label: "Wrong transport protocol" },
];

interface TopoNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "client" | "router" | "server";
}

const nodes: TopoNode[] = [
  { id: "client", label: "Organizer Laptop", x: 60, y: 220, type: "client" },
  { id: "RA", label: "RA", x: 200, y: 220, type: "router" },
  { id: "RB", label: "RB", x: 360, y: 110, type: "router" },
  { id: "RC", label: "RC", x: 360, y: 330, type: "router" },
  { id: "RD", label: "RD", x: 520, y: 220, type: "router" },
  { id: "event_server", label: "Event Server", x: 680, y: 220, type: "server" },
];

const links = [
  { from: "client", to: "RA" },
  { from: "RA", to: "RB" },
  { from: "RA", to: "RC" },
  { from: "RB", to: "RD", broken: true },
  { from: "RC", to: "RD" },
  { from: "RD", to: "event_server" },
];

const correctNextHop = "RC";

type Stage = "evidence" | "diagnosis" | "route" | "verify";

const DNS_OPTIONS = [
  {
    id: "a",
    text: "The packet already contains the destination IP 10.20.0.10 directly. DNS is only used to translate hostnames to IPs — since no hostname lookup occurs, the DNS cache is never consulted.",
  },
  {
    id: "b",
    text: "DNS only works on weekends, and the event is on a weekday.",
  },
  {
    id: "c",
    text: "The DNS cache entry points to 10.20.0.20, which is the correct IP, so it doesn't matter.",
  },
  {
    id: "d",
    text: "DNS is part of the transport layer, so it doesn't affect IP routing.",
  },
];

export default function Mission4Outage({ sessionId, onResult }: Props) {
  const [stage, setStage] = useState<Stage>("evidence");
  const [verdicts, setVerdicts] = useState<Record<string, "relevant" | "irrelevant" | null>>({});
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [routeChoice, setRouteChoice] = useState<string | null>(null);
  const [routeFeedback, setRouteFeedback] = useState<string | null>(null);
  const [reachabilityTest, setReachabilityTest] = useState<null | "pass" | "fail">(null);
  const [protocolConfirm, setProtocolConfirm] = useState<"TCP" | "UDP" | null>(null);
  const [dnsAnswer, setDnsAnswer] = useState<string>("");
  const [hintUsed, setHintUsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allEvidenceJudged = EVIDENCE.every((e) => verdicts[e.id] !== undefined && verdicts[e.id] !== null);
  const evidenceCorrect = EVIDENCE.every((e) => verdicts[e.id] === e.correctVerdict);

  const setVerdict = (id: string, v: "relevant" | "irrelevant") => {
    setVerdicts((prev) => ({ ...prev, [id]: v }));
  };

  const proceedToDiagnosis = () => {
    if (!allEvidenceJudged) {
      setFeedback("Judge every piece of evidence (relevant or irrelevant) before proceeding.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setStage("diagnosis");
    setFeedback(null);
  };

  const proceedToRoute = () => {
    if (!diagnosis) {
      setFeedback("Select a primary diagnosis first.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (diagnosis !== "failed_link") {
      setFeedback("Incorrect diagnosis. Re-examine the router status evidence.");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    setStage("route");
    setFeedback(null);
  };

  const chooseRoute = (nextId: string) => {
    setRouteChoice(nextId);
    if (nextId === correctNextHop) {
      setRouteFeedback("Forwarding via RC — packet reaches RD successfully. Route repaired.");
    } else if (nextId === "RB") {
      setRouteFeedback("Forwarding via RB — packet hits the broken RB→RD link and is dropped. Try again.");
    } else {
      setRouteFeedback("That is not a valid next hop from RA.");
    }
  };

  const proceedToVerify = () => {
    if (routeChoice !== correctNextHop) {
      setFeedback("Repair the route first — forward via RC.");
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setStage("verify");
    setFeedback(null);
  };

  const runReachabilityTest = () => {
    setReachabilityTest("pass");
    setFeedback("Reachability test PASSED — packet reaches the event server via RA → RC → RD.");
    setTimeout(() => setFeedback(null), 4000);
  };

  const submit = async () => {
    setSubmitted(true);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 4,
          payload: {
            diagnosis,
            route: routeChoice === "RC" ? ["client", "RA", "RC", "RD", "event_server"] : [],
            protocol: protocolConfirm,
            evidenceCorrect,
            dnsMcqCorrect: dnsAnswer === "a",
          },
          hintUsed,
        }),
      });
      const data = await res.json();
      onResult({
        success: data.success,
        message: data.message || "Incident report submitted.",
        sessionCompleted: data.sessionCompleted,
      });
    } catch {
      onResult({ success: false, message: "Network error." });
    }
  };

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const stageLabels: Record<Stage, string> = {
    evidence: "A. Inspect Evidence",
    diagnosis: "B. Identify Root Cause",
    route: "C. Restore the Route",
    verify: "D. Verify & Report",
  };

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-pp-border rounded-full text-xs font-mono text-pp-muted mb-3">
          MISSION 4 · OPERATION BLACKOUT · 300 PTS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Operation Blackout</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          The event server cannot receive file uploads. Investigate four stages:
          (A) inspect and classify evidence, (B) identify the root cause, (C)
          repair the route, (D) verify and submit your incident report.
        </p>
      </div>

      {/* Stage indicator */}
      <div className="flex gap-2 mb-6 text-xs font-mono flex-wrap">
        {(["evidence", "diagnosis", "route", "verify"] as Stage[]).map((s) => (
          <div
            key={s}
            className={`px-3 py-1.5 rounded border ${
              stage === s
                ? "border-pp-electric text-pp-electric bg-pp-electric/10"
                : "border-pp-border text-pp-muted"
            }`}
          >
            {stageLabels[s]}
          </div>
        ))}
      </div>

      {/* STAGE A: EVIDENCE */}
      {stage === "evidence" && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <Eye size={18} className="text-pp-electric" /> Stage A: Inspect the Evidence
          </h2>
          <p className="text-sm text-pp-muted mb-4">
            Click each evidence card to expand it. Then classify it as{" "}
            <span className="text-pp-electric">Relevant</span> or{" "}
            <span className="text-pp-muted">Irrelevant</span> to the current failure.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {EVIDENCE.map((e) => {
              const v = verdicts[e.id];
              const isExpanded = expandedEvidence === e.id;
              return (
                <div
                  key={e.id}
                  className={`bg-pp-card border rounded-lg p-3 transition-all ${
                    v === "relevant"
                      ? "border-pp-electric/60"
                      : v === "irrelevant"
                      ? "border-pp-border/40 opacity-70"
                      : "border-pp-border"
                  }`}
                >
                  <button
                    onClick={() => setExpandedEvidence(isExpanded ? null : e.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{e.title}</span>
                      <Eye size={14} className="text-pp-muted" />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-2 border-t border-pp-border/40 text-xs font-mono text-pp-muted">
                          {e.detail}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setVerdict(e.id, "relevant")}
                            className={`px-3 py-1 text-xs rounded border ${
                              v === "relevant"
                                ? "border-pp-electric bg-pp-electric/10 text-pp-electric"
                                : "border-pp-border text-pp-muted"
                            }`}
                          >
                            Relevant
                          </button>
                          <button
                            onClick={() => setVerdict(e.id, "irrelevant")}
                            className={`px-3 py-1 text-xs rounded border ${
                              v === "irrelevant"
                                ? "border-pp-muted bg-pp-bg-2 text-pp-light"
                                : "border-pp-border text-pp-muted"
                            }`}
                          >
                            Irrelevant
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-pp-muted">
              Judged: {Object.values(verdicts).filter(Boolean).length}/{EVIDENCE.length}
            </div>
            <button
              onClick={proceedToDiagnosis}
              disabled={!allEvidenceJudged}
              className="px-5 py-2 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded text-sm font-semibold disabled:opacity-50"
            >
              Proceed to Diagnosis →
            </button>
          </div>
        </div>
      )}

      {/* STAGE B: DIAGNOSIS */}
      {stage === "diagnosis" && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <Shield size={18} className="text-pp-electric" /> Stage B: Identify the Root Cause
          </h2>

          <div className="bg-pp-card border border-pp-border rounded-lg p-4 mb-4">
            <div className="text-xs font-mono tracking-wider text-pp-muted mb-2">
              INCIDENT TIMELINE
            </div>
            <p className="text-sm text-pp-text leading-relaxed mb-3">
              The organizer&apos;s laptop has been uploading event files to the
              event server every evening for the past week without issue. The
              network path it normally uses runs through{" "}
              <span className="text-pp-electric font-mono">RA → RB → RD</span>,
              which has been the standard route since the system was configured.
            </p>
            <p className="text-sm text-pp-text leading-relaxed mb-3">
              Tonight, fifteen minutes before the event is scheduled to begin,
              the uploads suddenly started failing. The organizer confirms the
              laptop is on the same network as always, the destination IP{" "}
              <span className="text-pp-electric font-mono">10.20.0.10</span> is
              correct (they verified it against the event server inventory), and
              the file-transfer application is configured to use TCP for
              reliable delivery — exactly as it has been all week.
            </p>
            <p className="text-sm text-pp-muted leading-relaxed">
              Nothing on the laptop or the server has changed. The packet leaves
              the laptop correctly addressed, reaches{" "}
              <span className="text-pp-electric font-mono">RA</span> as it
              always does, but never arrives at the event server. Your task is
              to determine what changed in the network between{" "}
              <span className="text-pp-electric font-mono">RA</span> and the
              event server, and select the diagnosis that best explains the
              failure based on the evidence you reviewed in Stage A.
            </p>
          </div>

          <p className="text-sm text-pp-muted mb-4">
            Based on the timeline and your evidence review, select the primary
            cause of the failure.
          </p>

          <div className="space-y-2">
            {DIAGNOSES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDiagnosis(d.id)}
                className={`w-full text-left p-3 rounded border text-sm transition-all ${
                  diagnosis === d.id
                    ? "border-pp-electric bg-pp-electric/10 text-pp-light"
                    : "border-pp-border text-pp-muted hover:border-pp-light"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={proceedToRoute}
              className="px-5 py-2 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded text-sm font-semibold"
            >
              Proceed to Route Repair →
            </button>
          </div>
        </div>
      )}

      {/* STAGE C: ROUTE */}
      {stage === "route" && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <Wrench size={18} className="text-pp-electric" /> Stage C: Restore the Route
          </h2>
          <p className="text-sm text-pp-muted mb-4">
            At router RA, choose the correct next hop. The default route via RB
            is broken (RB→RD link is down). Forward via RC instead.
          </p>
          <div className="bg-pp-card border border-pp-border rounded-xl p-4">
            <svg viewBox="0 0 740 440" className="w-full h-auto">
              {links.map((l) => {
                const a = nodeMap.get(l.from)!;
                const b = nodeMap.get(l.to)!;
                return (
                  <line
                    key={`${l.from}-${l.to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={l.broken ? "#ef4444" : "#1E3A5F"}
                    strokeWidth={2}
                    strokeDasharray={l.broken ? "6,4" : undefined}
                  />
                );
              })}
              {nodes.map((n) => {
                const isChoice = n.id === "RB" || n.id === "RC";
                const isSel = routeChoice === n.id;
                return (
                  <g
                    key={n.id}
                    onClick={() => isChoice && chooseRoute(n.id)}
                    style={{ cursor: isChoice ? "pointer" : "default" }}
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={26}
                      fill="#0A1428"
                      stroke={isSel ? "#38BDF8" : isChoice ? "#2563EB" : "#1E3A5F"}
                      strokeWidth={isSel ? 3 : 2}
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      fill={isSel ? "#38BDF8" : "#93C5FD"}
                      fontSize="11"
                      fontWeight="600"
                      style={{ pointerEvents: "none" }}
                    >
                      {n.label}
                    </text>
                    {isChoice && (
                      <text
                        x={n.x}
                        y={n.y - 36}
                        textAnchor="middle"
                        fill="#94A3B8"
                        fontSize="9"
                        style={{ pointerEvents: "none" }}
                      >
                        ↓ choose
                      </text>
                    )}
                  </g>
                );
              })}
              <text
                x={(nodeMap.get("RB")!.x + nodeMap.get("RD")!.x) / 2}
                y={(nodeMap.get("RB")!.y + nodeMap.get("RD")!.y) / 2 - 8}
                textAnchor="middle"
                fill="#fca5a5"
                fontSize="10"
                style={{ pointerEvents: "none" }}
              >
                LINK DOWN
              </text>
            </svg>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => chooseRoute("RB")}
              className={`px-4 py-2 text-xs border rounded font-mono ${
                routeChoice === "RB"
                  ? "border-red-500/60 bg-red-500/10 text-red-300"
                  : "border-pp-border text-pp-muted"
              }`}
            >
              Forward via RB
            </button>
            <button
              onClick={() => chooseRoute("RC")}
              className={`px-4 py-2 text-xs border rounded font-mono ${
                routeChoice === "RC"
                  ? "border-pp-electric bg-pp-electric/10 text-pp-electric"
                  : "border-pp-border text-pp-muted"
              }`}
            >
              Forward via RC
            </button>
          </div>
          {routeFeedback && (
            <div className={`mt-3 p-3 rounded text-sm border ${
              routeChoice === correctNextHop
                ? "border-pp-electric/40 text-pp-electric bg-pp-bg-2"
                : "border-red-500/40 text-red-300 bg-pp-bg-2"
            }`}>
              {routeFeedback}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button
              onClick={proceedToVerify}
              disabled={routeChoice !== correctNextHop}
              className="px-5 py-2 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded text-sm font-semibold disabled:opacity-50"
            >
              Proceed to Verification →
            </button>
          </div>
        </div>
      )}

      {/* STAGE D: VERIFY */}
      {stage === "verify" && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <CheckCircle2 size={18} className="text-pp-electric" /> Stage D: Verify & Report
          </h2>

          <div className="bg-pp-card border border-pp-border rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Wifi size={14} className="text-pp-electric" /> Reachability Test
                </div>
                <p className="text-xs text-pp-muted mt-1">
                  Verify the packet now reaches the event server via RA → RC → RD.
                </p>
              </div>
              <button
                onClick={runReachabilityTest}
                disabled={reachabilityTest !== null}
                className="px-4 py-2 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                {reachabilityTest === "pass" ? "PASSED" : "Run Test"}
              </button>
            </div>
          </div>

          <div className="bg-pp-card border border-pp-border rounded-lg p-4 mb-3">
            <div className="font-semibold text-sm mb-2">Confirm Transport Protocol</div>
            <p className="text-xs text-pp-muted mb-2">
              The application requires reliable, ordered file delivery. Confirm the correct protocol.
            </p>
            <div className="flex gap-2">
              {(["TCP", "UDP"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProtocolConfirm(p)}
                  className={`px-4 py-2 rounded border font-mono font-bold text-sm ${
                    protocolConfirm === p
                      ? "border-pp-electric bg-pp-electric/10 text-pp-electric"
                      : "border-pp-border text-pp-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* DNS MCQ */}
          <div className="bg-pp-card border border-pp-border rounded-lg p-4 mb-3">
            <div className="font-semibold text-sm mb-2">Why is the DNS clue irrelevant?</div>
            <p className="text-xs text-pp-muted mb-3">
              The DNS cache shows <span className="font-mono text-pp-light">event.college.edu → 10.20.0.20</span> (the OLD server IP). Why is this entry irrelevant to THIS specific packet?
            </p>
            <div className="space-y-2">
              {DNS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDnsAnswer(opt.id)}
                  className={`w-full text-left p-3 rounded border text-xs transition-all ${
                    dnsAnswer === opt.id
                      ? "border-pp-electric bg-pp-electric/10 text-pp-light"
                      : "border-pp-border text-pp-muted hover:border-pp-light"
                  }`}
                >
                  <span className="font-mono font-bold mr-2 text-pp-electric">{opt.id.toUpperCase()}.</span>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setHintUsed(true)}
              disabled={hintUsed}
              className="text-xs text-pp-muted hover:text-pp-light flex items-center gap-1 disabled:opacity-50"
            >
              <Lightbulb size={14} /> {hintUsed ? "Hint used (-25 pts)" : "Show hint (-25 pts)"}
            </button>
            <button
              onClick={submit}
              disabled={submitted}
              className="px-6 py-2.5 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={16} /> Submit Incident Report
            </button>
          </div>
          {hintUsed && (
            <div className="mt-3 p-3 bg-pp-bg-2/60 border border-pp-border rounded text-xs text-pp-muted italic">
              Hint: The packet&apos;s destination field already contains an IP address — DNS is only used to translate hostnames to IPs.
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
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
          Real troubleshooting requires isolating the actual cause, distinguishing
          relevant from irrelevant evidence, selecting a valid alternative route,
          and verifying the repair. A single symptom (server unreachable) can
          have many causes — only the evidence tells you which one applies here.
        </p>
      </div>
    </div>
  );
}