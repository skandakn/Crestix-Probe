import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout, ForgotPasswordForm } from "@/features/auth";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Recover Access Key — Crestix Probe Enclave",
  description: "Request an encrypted security recovery signal for your Crestix Probe telemetry account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Key Phrase Recovery"
      subtitle="Dispatch cryptographically signed recovery signal"
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-12 text-cyan-400 font-mono text-xs gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>CONNECTING RECOVERY TRANSPONDER...</span>
          </div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
