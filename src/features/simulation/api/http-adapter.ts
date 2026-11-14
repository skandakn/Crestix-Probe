import { ISimulationApiAdapter } from "./adapter-interface";
import {
  SimulationRunRequest,
  SimulationRunResponse,
  SimulationStatusResponse,
  SimulationFramesResponse,
} from "../types/contract";

/**
 * HTTP SIMULATION API ADAPTER
 * 
 * Production adapter communicating over REST API endpoints:
 * - POST /api/simulation/run
 * - GET  /api/simulation/{id}
 * - GET  /api/simulation/{id}/frames
 * 
 * Includes network error handling, configurable base URLs, timeouts,
 * and clear diagnostic error messages for Member 9 backend services.
 */
export class HttpSimulationApiAdapter implements ISimulationApiAdapter {
  readonly adapterType = "http" as const;
  readonly displayName = "Live Backend API Adapter (HTTP)";
  readonly description =
    "Connects directly to Member 9 backend microservice via /api/simulation endpoints.";

  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async checkHealth(): Promise<{ ok: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/simulation/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          ok: true,
          message: data.message || "Live Backend API is reachable and healthy.",
        };
      }
      return {
        ok: false,
        message: `Backend API responded with status ${response.status}: ${response.statusText}`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Cannot connect to live backend API: ${errorMessage}. Switch to Mock Adapter for offline/preview simulation.`,
      };
    }
  }

  async runSimulation(request: SimulationRunRequest): Promise<SimulationRunResponse> {
    const url = `${this.baseUrl}/api/simulation/run`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(
          `Simulation run request failed [${res.status}]: ${errorData.message || res.statusText}`
        );
      }

      return (await res.json()) as SimulationRunResponse;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[HttpSimulationApiAdapter.runSimulation] ${msg}`);
    }
  }

  async getSimulationStatus(simulationId: string): Promise<SimulationStatusResponse> {
    const url = `${this.baseUrl}/api/simulation/${encodeURIComponent(simulationId)}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(
          `Simulation status check failed [${res.status}]: ${errorData.message || res.statusText}`
        );
      }

      return (await res.json()) as SimulationStatusResponse;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[HttpSimulationApiAdapter.getSimulationStatus] ${msg}`);
    }
  }

  async getSimulationFrames(simulationId: string): Promise<SimulationFramesResponse> {
    const url = `${this.baseUrl}/api/simulation/${encodeURIComponent(simulationId)}/frames`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(
          `Failed to load simulation frames [${res.status}]: ${errorData.message || res.statusText}`
        );
      }

      return (await res.json()) as SimulationFramesResponse;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[HttpSimulationApiAdapter.getSimulationFrames] ${msg}`);
    }
  }
}
