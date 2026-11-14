import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiAuthAdapter } from "../adapters/api-auth-adapter";
import { getAuthAdapter, setActiveAdapter, MockAuthAdapter } from "../adapters";

describe("ApiAuthAdapter & Factory Suite", () => {
  beforeEach(() => {
    setActiveAdapter(null);
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    setActiveAdapter(null);
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should default to MockAuthAdapter in development when env var is unset", () => {
    delete process.env.NEXT_PUBLIC_AUTH_ADAPTER;
    const adapter = getAuthAdapter();
    expect(adapter).toBeInstanceOf(MockAuthAdapter);
    expect(adapter.isMock).toBe(true);
  });

  it("should instantiate ApiAuthAdapter when NEXT_PUBLIC_AUTH_ADAPTER=backend", () => {
    setActiveAdapter(null);
    process.env.NEXT_PUBLIC_AUTH_ADAPTER = "backend";
    const adapter = getAuthAdapter();
    expect(adapter).toBeInstanceOf(ApiAuthAdapter);
    expect(adapter.isMock).toBe(false);
    expect(adapter.name).toBe("ApiAuthAdapter");
  });

  it("should allow programmatic adapter override without UI rewrite", () => {
    const customMock = new MockAuthAdapter({ latencyMs: 0 });
    setActiveAdapter(customMock);
    expect(getAuthAdapter()).toBe(customMock);
  });

  it("should send POST to /login and persist session token on success", async () => {
    const fakeSession = {
      user: {
        id: "usr_1",
        email: "op@crestix.space",
        name: "Test Op",
        callsign: "TEST-1",
        role: "operator" as const,
        clearanceLevel: "LEVEL_3" as const,
        createdAt: "2026-01-01",
      },
      token: "jwt_token_12345",
      issuedAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        session: fakeSession,
        user: fakeSession.user,
      }),
    });

    const apiAdapter = new ApiAuthAdapter({ baseUrl: "https://api.crestix.space/auth" });
    const response = await apiAdapter.login({
      email: "op@crestix.space",
      password: "SecretPassword123!",
    });

    expect(response.success).toBe(true);
    expect(response.session?.token).toBe("jwt_token_12345");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.crestix.space/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "op@crestix.space",
          password: "SecretPassword123!",
        }),
      })
    );

    // Verify session stored in localStorage
    const stored = await apiAdapter.getCurrentSession();
    expect(stored?.token).toBe("jwt_token_12345");
  });

  it("should handle backend 401 error response cleanly", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Invalid operator credentials or revoked security clearance.",
      }),
    });

    const apiAdapter = new ApiAuthAdapter({ baseUrl: "https://api.crestix.space/auth" });
    const response = await apiAdapter.login({
      email: "op@crestix.space",
      password: "WrongPassword!",
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain("Invalid operator credentials");
  });
});
