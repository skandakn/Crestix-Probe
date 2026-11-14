import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthLayout, RegisterForm } from "@/features/auth";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Provision Credentials — Crestix Probe Enclave",
  description: "Request clearance and register operator credentials for Crestix Probe mission telemetry.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Provision Enclave Profile"
      subtitle="Establish operator credentials and mission authorization"
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-12 text-cyan-400 font-mono text-xs gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>INITIALIZING ENCLAVE PROVISIONING MODULE...</span>
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
