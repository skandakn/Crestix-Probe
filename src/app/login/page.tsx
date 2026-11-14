import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout, LoginForm } from "@/features/auth";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Authenticate Operator — Crestix Probe Enclave",
  description: "Secure gateway for Crestix Probe operators and scientific investigators.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Operator Authentication"
      subtitle="Initialize secure encrypted telemetry session"
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-12 text-cyan-400 font-mono text-xs gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>INITIALIZING ENCLAVE SECURITY LINK...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
