import {
  SimulationRunRequest,
  SimulationFrame,
} from "@/features/simulation/types/contract";
import { MockSimulationApiAdapter } from "@/features/simulation/api/mock-adapter";

export interface StoredSimulation {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progressPercentage: number;
  currentStep: number;
  totalSteps: number;
  createdAt: string;
  completedAt?: string;
  config: SimulationRunRequest;
  frames: SimulationFrame[];
}

// Global in-memory storage for development / API route mock server
const globalSimulations = new Map<string, StoredSimulation>();
const mockEngine = new MockSimulationApiAdapter();

export function createSimulationJob(request: SimulationRunRequest): StoredSimulation {
  const id = `sim-srv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Use the mock engine to generate deterministic frames for this job
  const totalDurationSeconds = request.totalDurationMinutes * 60;
  const dt = Math.max(5, request.timeStepSeconds || 30);
  const totalSteps = Math.min(240, Math.max(10, Math.floor(totalDurationSeconds / dt)));

  // Synchronously generate frames for test simulation
  // In a real member-9 solver, this would enqueue in Redis / Celery / Worker
  // Here we fulfill the REST API contract accurately
  const runPromise = mockEngine.runSimulation(request);
  
  const record: StoredSimulation = {
    id,
    status: "completed",
    progressPercentage: 100,
    currentStep: totalSteps,
    totalSteps,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    config: request,
    frames: [],
  };

  globalSimulations.set(id, record);

  // Retrieve generated frames
  runPromise.then(async (res) => {
    const framesRes = await mockEngine.getSimulationFrames(res.simulationId);
    record.frames = framesRes.frames;
  });

  return record;
}

export function getSimulationJob(id: string): StoredSimulation | undefined {
  return globalSimulations.get(id);
}
