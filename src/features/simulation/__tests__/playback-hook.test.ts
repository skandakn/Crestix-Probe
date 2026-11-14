import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSimulationPlayback } from "../hooks/useSimulationPlayback";
import { SimulationFrame } from "../types/contract";

describe("useSimulationPlayback hook", () => {
  const dummyFrames: SimulationFrame[] = Array.from({ length: 5 }, (_, i) => ({
    step: i,
    timeSeconds: i * 30,
    waterDepthGrid: [[i * 0.1]],
    maxDepthMeters: i * 0.1,
    avgDepthMeters: i * 0.05,
    floodedCellCount: 1,
    totalWaterVolumeM3: i * 10,
  }));

  it("should initialize with frame index 0 and stopped", () => {
    const { result } = renderHook(() =>
      useSimulationPlayback({ frames: dummyFrames })
    );

    expect(result.current.currentFrameIndex).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.totalFrames).toBe(5);
  });

  it("should step forward and backward correctly", () => {
    const { result } = renderHook(() =>
      useSimulationPlayback({ frames: dummyFrames })
    );

    act(() => {
      result.current.stepForward();
    });
    expect(result.current.currentFrameIndex).toBe(1);

    act(() => {
      result.current.stepForward();
    });
    expect(result.current.currentFrameIndex).toBe(2);

    act(() => {
      result.current.stepBackward();
    });
    expect(result.current.currentFrameIndex).toBe(1);
  });

  it("should seek directly to a specified frame index", () => {
    const { result } = renderHook(() =>
      useSimulationPlayback({ frames: dummyFrames })
    );

    act(() => {
      result.current.seekToFrame(3);
    });
    expect(result.current.currentFrameIndex).toBe(3);
    expect(result.current.currentFrame?.step).toBe(3);
  });

  it("should reset back to frame 0 and pause", () => {
    const { result } = renderHook(() =>
      useSimulationPlayback({ frames: dummyFrames })
    );

    act(() => {
      result.current.seekToFrame(4);
      result.current.reset();
    });

    expect(result.current.currentFrameIndex).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });

  it("should update playback speed", () => {
    const { result } = renderHook(() =>
      useSimulationPlayback({ frames: dummyFrames })
    );

    act(() => {
      result.current.setPlaybackSpeed(2);
    });
    expect(result.current.playbackSpeed).toBe(2);
  });
});
