/**
 * Crestix Probe - Authentication Adapter Factory
 * Allows switching between MockAuthAdapter and ApiAuthAdapter transparently.
 */

import { AuthAdapter } from "../types";
import { MockAuthAdapter } from "./mock-auth-adapter";
import { ApiAuthAdapter } from "./api-auth-adapter";

let activeAdapterInstance: AuthAdapter | null = null;

export function getAuthAdapter(): AuthAdapter {
  if (activeAdapterInstance) {
    return activeAdapterInstance;
  }

  // Detect environment configuration
  const adapterType = process.env.NEXT_PUBLIC_AUTH_ADAPTER?.toLowerCase();

  if (adapterType === "api" || adapterType === "backend") {
    activeAdapterInstance = new ApiAuthAdapter();
  } else {
    // Default to MockAuthAdapter for isolated local development & demonstration
    activeAdapterInstance = new MockAuthAdapter();
  }

  return activeAdapterInstance;
}

/**
 * Programmatically set active adapter (useful in testing or dev-mode toggle)
 */
export function setActiveAdapter(adapter: AuthAdapter | null): void {
  activeAdapterInstance = adapter;
}

export { MockAuthAdapter, ApiAuthAdapter };
