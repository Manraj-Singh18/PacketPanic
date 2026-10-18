import { Suspense } from "react";
import BriefingClient from "./BriefingClient";

export const dynamic = "force-dynamic";

export default function BriefingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pp-muted">Loading...</div>}>
      <BriefingClient />
    </Suspense>
  );
}