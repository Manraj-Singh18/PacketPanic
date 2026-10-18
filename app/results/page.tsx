import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-pp-muted">Loading...</div>}>
      <ResultsClient />
    </Suspense>
  );
}