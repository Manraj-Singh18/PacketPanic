import { Suspense } from "react";
import GameClient from "./GameClient";

export const dynamic = "force-dynamic";

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pp-muted">Loading mission...</div>}>
      <GameClient />
    </Suspense>
  );
}