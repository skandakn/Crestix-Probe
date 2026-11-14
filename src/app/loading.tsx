import { LoadingState } from "@/components/ui/loading-state";

export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <LoadingState
        message="Loading Probe Mission Console..."
        subMessage="Acquiring downlink packets and telemetry state"
      />
    </div>
  );
}
