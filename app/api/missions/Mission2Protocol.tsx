"use client";

import { useState } from "react";
import { FileText, Phone, RefreshCw } from "lucide-react";

interface Props {
  sessionId: string;
  onResult: (r: { success: boolean; message: string; sessionCompleted?: boolean }) => void;
}

const SCENARIOS = [
  {
    id: 1,
    icon: FileText,
    title: "Document Download",
    desc: "A user is downloading an important 50-page PDF document from the server. Every byte must arrive correctly and in order.",
    correct: "TCP" as const,
    explanation: {
      TCP: "Correct! TCP ensures reliable, ordered delivery. The document must arrive complete and intact.",
      UDP: "UDP doesn't guarantee delivery or ordering. A corrupted document is unacceptable here.",
    },
  },
  {
    id: 2,
    icon: Phone,
    title: "Real-time Voice Call",
    desc: "Two students are having a live voice conversation. Low latency matters more than perfect delivery.",
    correct: "UDP" as const,
    explanation: {
      UDP: "Correct! UDP's low overhead is ideal for real-time audio where slight packet loss is preferable to delays.",
      TCP: "TCP's retransmission and ordering would introduce unacceptable latency for live audio.",
    },
  },
  {
    id: 3,
    icon: RefreshCw,
    title: "Database Query",
    desc: "An application sends a small request to a database and expects a response. Reliability is important, but the data is small.",
    correct: "TCP" as const,
    explanation: {
      TCP: "Correct! For request-response transactions, TCP's reliability ensures the query and response both arrive.",
      UDP: "UDP could drop the request or response. For database transactions, reliability is essential.",
    },
  },
];

export default function Mission2Protocol({ sessionId, onResult }: Props) {
  const [answers, setAnswers] = useState<Record<number, "TCP" | "UDP">>({});
  const [feedback, setFeedback] = useState<Record<number, string> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const submit = async () => {
    if (Object.keys(answers).length < 3) {
      onResult({ success: false, message: "Answer all three scenarios before submitting." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/missions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          missionId: 2,
          payload: {
            answers: Object.entries(answers).map(([sid, protocol]) => ({
              scenarioId: Number(sid),
              protocol,
            })),
          },
        }),
      });
      const data = await res.json();
      setAttempts((a) => a + 1);
      // Show explanations
      const newFeedback: Record<number, string> = {};
      SCENARIOS.forEach((s) => {
        const ans = answers[s.id];
        newFeedback[s.id] = s.explanation[ans];
      });
      setFeedback(newFeedback);
      onResult({
        success: data.success,
        message: data.message,
        sessionCompleted: data.sessionCompleted,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-pp-border rounded-full text-xs font-mono text-pp-muted mb-3">
          MISSION 2 · EASY-MEDIUM · 150 PTS (50 EACH)
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Choose the Right Protocol</h1>
        <p className="text-sm text-pp-muted max-w-2xl">
          The network is operational. For each scenario below, choose TCP or UDP.
          You can retry — your highest score is kept.
        </p>
      </div>

      <div className="space-y-4">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          const ans = answers[s.id];
          return (
            <div
              key={s.id}
              className="bg-pp-card border border-pp-border rounded-lg p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-pp-bg-2 border border-pp-border flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-pp-electric" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-pp-muted mb-4">{s.desc}</p>
                  <div className="flex gap-3">
                    {(["TCP", "UDP"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setAnswers((prev) => ({ ...prev, [s.id]: p }));
                          setFeedback(null);
                        }}
                        className={`flex-1 py-2.5 rounded-lg border font-mono font-bold text-sm transition-all ${
                          ans === p
                            ? "border-pp-electric bg-pp-electric/10 text-pp-electric"
                            : "border-pp-border text-pp-muted hover:border-pp-light"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {feedback?.[s.id] && (
                    <div
                      className={`mt-3 p-2.5 rounded text-xs ${
                        s.correct === ans
                          ? "bg-pp-electric/10 text-pp-electric border border-pp-electric/30"
                          : "bg-red-500/10 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {feedback[s.id]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-xs text-pp-muted">
          {Object.keys(answers).length}/3 answered
          {attempts > 0 && ` · Attempt ${attempts + 1}`}
        </div>
        <button
          onClick={submit}
          disabled={submitting || Object.keys(answers).length < 3}
          className="px-6 py-2.5 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Answers"}
        </button>
      </div>

      <div className="mt-4 p-4 bg-pp-bg-2/50 border border-pp-border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Concepts</h3>
        <p className="text-xs text-pp-muted">
          TCP provides reliable, ordered byte-stream delivery with retransmission.
          UDP provides lightweight datagrams without those guarantees, ideal for
          latency-sensitive applications.
        </p>
      </div>
    </div>
  );
}