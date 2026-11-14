'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ForecastFrame } from '../types/forecast';

export function useForecastPlayback(frames: ForecastFrame[]) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const totalFrames = frames.length;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentFrameIndexRef = useRef(currentFrameIndex);
  currentFrameIndexRef.current = currentFrameIndex;

  // Reset frame when new forecast frames load
  useEffect(() => {
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }, [frames]);

  const play = useCallback(() => {
    if (totalFrames <= 1) return;
    if (currentFrameIndexRef.current >= totalFrames - 1) {
      setCurrentFrameIndex(0);
    }
    setIsPlaying(true);
  }, [totalFrames]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stepForward = useCallback(() => {
    pause();
    setCurrentFrameIndex((prev) => Math.min(totalFrames - 1, prev + 1));
  }, [totalFrames, pause]);

  const stepBackward = useCallback(() => {
    pause();
    setCurrentFrameIndex((prev) => Math.max(0, prev - 1));
  }, [pause]);

  const seek = useCallback(
    (index: number) => {
      pause();
      const clamped = Math.max(0, Math.min(totalFrames - 1, index));
      setCurrentFrameIndex(clamped);
    },
    [totalFrames, pause]
  );

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) return;

    const baseIntervalMs = 500; // 500ms per frame at 1x
    const intervalMs = Math.max(50, baseIntervalMs / playbackSpeed);

    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        if (prev >= totalFrames - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, totalFrames, playbackSpeed]);

  const currentFrame = frames[currentFrameIndex] || null;

  return {
    currentFrame,
    currentFrameIndex,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
    seek,
    setPlaybackSpeed
  };
}
