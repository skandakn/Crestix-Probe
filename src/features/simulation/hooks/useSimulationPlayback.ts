"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SimulationFrame } from "../types/contract";

export interface UseSimulationPlaybackOptions {
  frames: SimulationFrame[];
  defaultSpeed?: number;
  loop?: boolean;
}

export function useSimulationPlayback({
  frames,
  defaultSpeed = 1,
  loop = false,
}: UseSimulationPlaybackOptions) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(defaultSpeed);
  const [isLooping, setIsLooping] = useState<boolean>(loop);

  const totalFrames = frames.length;
  const currentFrame = frames[currentFrameIndex] || null;

  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  // Reset frame when frames array changes
  useEffect(() => {
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }, [frames]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (totalFrames <= 0) return;
    setIsPlaying(true);
  }, [totalFrames]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (currentFrameIndex >= totalFrames - 1) {
        setCurrentFrameIndex(0);
      }
      play();
    }
  }, [isPlaying, currentFrameIndex, totalFrames, pause, play]);

  const reset = useCallback(() => {
    pause();
    setCurrentFrameIndex(0);
  }, [pause]);

  const stepForward = useCallback(() => {
    pause();
    setCurrentFrameIndex((prev) => Math.min(prev + 1, totalFrames - 1));
  }, [pause, totalFrames]);

  const stepBackward = useCallback(() => {
    pause();
    setCurrentFrameIndex((prev) => Math.max(prev - 1, 0));
  }, [pause]);

  const seekToFrame = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(index, totalFrames - 1));
      setCurrentFrameIndex(target);
    },
    [totalFrames]
  );

  // Playback animation loop
  useEffect(() => {
    if (!isPlaying || totalFrames === 0) {
      return;
    }

    lastTickTimeRef.current = performance.now();
    // Base frame interval in ms (e.g. 150ms per simulation step at 1x speed)
    const baseIntervalMs = 120;
    const intervalMs = baseIntervalMs / playbackSpeed;

    const tick = (now: number) => {
      const elapsed = now - lastTickTimeRef.current;
      if (elapsed >= intervalMs) {
        lastTickTimeRef.current = now;
        setCurrentFrameIndex((prev) => {
          if (prev >= totalFrames - 1) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return prev + 1;
        });
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalFrames, playbackSpeed, isLooping]);

  return {
    currentFrameIndex,
    currentFrame,
    totalFrames,
    isPlaying,
    playbackSpeed,
    isLooping,
    play,
    pause,
    togglePlay,
    reset,
    stepForward,
    stepBackward,
    seekToFrame,
    setPlaybackSpeed,
    setIsLooping,
  };
}
