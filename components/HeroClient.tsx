"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Trophy, Network } from "lucide-react";

export default function HeroClient({ event }: { event: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-pp-border rounded-full text-xs font-mono text-pp-muted">
        <span className="w-2 h-2 rounded-full bg-pp-electric animate-pulse" />
        LIVE NETWORK OPERATIONS
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
        <span className="block text-pp-text">PACKET</span>
        <span className="block bg-gradient-to-r from-pp-electric to-pp-blue bg-clip-text text-transparent">
          PANIC
        </span>
      </h1>
      <p className="mt-6 text-lg md:text-xl text-pp-muted">
        The network is down. Can your team bring it back?
      </p>
      <p className="mt-3 text-sm text-pp-muted max-w-xl mx-auto">
        A real-time, multiplayer networking escape room. Investigate faults,
        route packets, choose the right protocols, and restore connectivity
        before the countdown reaches zero.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-pp-blue hover:bg-pp-electric hover:text-pp-bg text-white rounded-lg font-semibold transition-all glow-blue hover:glow-strong"
        >
          Enter the Network
          <ArrowRight size={18} />
        </Link>
        <a
          href="#how-to-play"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-pp-border hover:border-pp-electric text-pp-light rounded-lg font-semibold transition-all"
        >
          <Play size={16} />
          How to Play
        </a>
      </div>

      {event && (
        <div className="mt-6 text-xs font-mono text-pp-muted">
          Event Status:{" "}
          <span className="text-pp-electric">{event.status.toUpperCase()}</span>
          {event.practice_mode && (
            <span className="ml-2 px-2 py-0.5 border border-pp-border rounded">
              PRACTICE MODE
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}