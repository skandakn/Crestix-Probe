import {
  SimulationRunRequest,
  SimulationRunResponse,
  SimulationStatusResponse,
  SimulationFramesResponse,
} from "../types/contract";

export interface ISimulationApiAdapter {
  readonly adapterType: "mock" | "http";
  readonly displayName: string;
  readonly description: string;

  /**
   * Submit a new flood simulation run job
   */
  runSimulation(request: SimulationRunRequest): Promise<SimulationRunResponse>;

  /**
   * Poll or fetch the status of an ongoing or completed simulation job
   */
  getSimulationStatus(simulationId: string): Promise<SimulationStatusResponse>;

  /**
   * Retrieve all generated time-step frames for a completed simulation
   */
  getSimulationFrames(simulationId: string): Promise<SimulationFramesResponse>;

  /**
   * Check connection / availability of this adapter
   */
  checkHealth(): Promise<{ ok: boolean; message: string }>;
}
