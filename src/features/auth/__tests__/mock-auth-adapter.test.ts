import { describe, it, expect, beforeEach } from "vitest";
import { MockAuthAdapter } from "../adapters/mock-auth-adapter";

describe("MockAuthAdapter Implementation", () => {
  let adapter: MockAuthAdapter;

  beforeEach(() => {
    // Zero latency for rapid unit testing
    adapter = new MockAuthAdapter({ latencyMs: 0 });
    adapter.resetMockDatabase();
  });

  it("should authenticate pre-seeded operator with valid credentials", async () => {
    const res = await adapter.login({
      email: "probe.lead@crestix.space",
      password: "Crestix#2026",
    });

    expect(res.success).toBe(true);
    expect(res.session).toBeDefined();
    expect(res.user?.name).toBe("Dr. Elena Vance");
    expect(res.user?.clearanceLevel).toBe("LEVEL_4");
    expect(res.session?.token).toBeTruthy();
  });

  it("should reject authentication with invalid password", async () => {
    const res = await adapter.login({
      email: "probe.lead@crestix.space",
      password: "WrongPassword!",
    });

    expect(res.success).toBe(false);
    expect(res.session).toBeUndefined();
    expect(res.error).toContain("verification failed");
  });

  it("should reject non-existent telemetry address", async () => {
    const res = await adapter.login({
      email: "ghost.operator@crestix.space",
      password: "Crestix#2026",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("not found");
  });

  it("should provision a new operator profile via register()", async () => {
    const regRes = await adapter.register({
      name: "Commander Alex Mercer",
      callsign: "APEX-1",
      email: "alex.mercer@crestix.space",
      clearanceLevel: "LEVEL_3",
      organization: "Asteroid Mining Vanguard",
      password: "SecurePassword#2026",
      confirmPassword: "SecurePassword#2026",
      acceptTerms: true,
    });

    expect(regRes.success).toBe(true);
    expect(regRes.user?.name).toBe("Commander Alex Mercer");
    expect(regRes.user?.callsign).toBe("APEX-1");
    expect(regRes.session?.token).toBeTruthy();

    // Verify immediate login with newly registered credentials
    const loginRes = await adapter.login({
      email: "alex.mercer@crestix.space",
      password: "SecurePassword#2026",
    });
    expect(loginRes.success).toBe(true);
    expect(loginRes.user?.name).toBe("Commander Alex Mercer");
  });

  it("should prevent duplicate registration with same email", async () => {
    const data = {
      name: "Commander Alex Mercer",
      callsign: "APEX-1",
      email: "duplicate@crestix.space",
      password: "SecurePassword#2026",
      confirmPassword: "SecurePassword#2026",
      acceptTerms: true,
    };

    const first = await adapter.register(data);
    expect(first.success).toBe(true);

    const duplicate = await adapter.register(data);
    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toContain("already registered");
  });

  it("should manage session persistence and logout", async () => {
    await adapter.login({
      email: "probe.lead@crestix.space",
      password: "Crestix#2026",
    });

    const activeSession = await adapter.getCurrentSession();
    expect(activeSession).not.toBeNull();
    expect(activeSession?.user.email).toBe("probe.lead@crestix.space");

    await adapter.logout();
    const afterLogout = await adapter.getCurrentSession();
    expect(afterLogout).toBeNull();
  });

  it("should update operator profile data", async () => {
    await adapter.login({
      email: "probe.lead@crestix.space",
      password: "Crestix#2026",
    });

    const updated = await adapter.updateProfile({
      callsign: "VANCE-OMEGA",
      organization: "Deep Space Fleet Directorate",
    });

    expect(updated.callsign).toBe("VANCE-OMEGA");
    expect(updated.organization).toBe("Deep Space Fleet Directorate");

    const session = await adapter.getCurrentSession();
    expect(session?.user.callsign).toBe("VANCE-OMEGA");
  });

  it("should process forgotPassword requests gracefully", async () => {
    const res = await adapter.forgotPassword({
      email: "probe.lead@crestix.space",
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain("Recovery signal");
  });
});
