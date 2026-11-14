"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Probe telemetry uncaught exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <ErrorState
          title="Telemetry Exception Caught"
          message={error.message || "An unexpected error disrupted the mission console interface."}
          onRetry={reset}
          retryLabel="Reset Console Session"
        />
      </div>
    </div>
  );
}
