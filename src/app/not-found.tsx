import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07090e] text-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-[#0b0f17] border border-cyan-500/30 text-cyan-400 mb-6 shadow-xl shadow-cyan-950/30">
        <Compass className="w-10 h-10 animate-spin" />
      </div>
      <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-2">
        ERROR 404 • UNCHARTED COORDINATES
      </span>
      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
        Telemetry Sector Not Found
      </h2>
      <p className="text-xs md:text-sm text-slate-400 max-w-md mb-8">
        The requested probe console route or sector does not exist within the current orbital telemetry grid.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Mission Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="md">
            Mission Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}
