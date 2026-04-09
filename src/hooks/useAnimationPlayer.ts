"use client";

import { useEffect, useReducer, useRef } from "react";
import type { BFStep } from "@/types/graph";

interface State {
  steps: BFStep[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number; // multiplier: 0.5, 1, 2, 4
}

type Action =
  | { type: "SET_STEPS"; steps: BFStep[] }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STEP_FORWARD" }
  | { type: "STEP_BACK" }
  | { type: "RESET" }
  | { type: "SET_SPEED"; speed: number }
  | { type: "TICK" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_STEPS":
      return { ...state, steps: action.steps, currentIndex: 0, isPlaying: false };
    case "PLAY":
      return { ...state, isPlaying: true };
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "STEP_FORWARD":
      return {
        ...state,
        isPlaying: false,
        currentIndex: Math.min(state.currentIndex + 1, state.steps.length - 1),
      };
    case "STEP_BACK":
      return {
        ...state,
        isPlaying: false,
        currentIndex: Math.max(state.currentIndex - 1, 0),
      };
    case "RESET":
      return { ...state, isPlaying: false, currentIndex: 0 };
    case "SET_SPEED":
      return { ...state, speed: action.speed };
    case "TICK": {
      const next = state.currentIndex + 1;
      if (next >= state.steps.length) {
        return { ...state, isPlaying: false, currentIndex: state.steps.length - 1 };
      }
      return { ...state, currentIndex: next };
    }
    default:
      return state;
  }
}

export function useAnimationPlayer(steps: BFStep[] = []) {
  const [state, dispatch] = useReducer(reducer, {
    steps,
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
  });

  // Sync steps from outside (e.g. after data loads)
  const prevStepsRef = useRef(steps);
  useEffect(() => {
    if (prevStepsRef.current !== steps) {
      prevStepsRef.current = steps;
      dispatch({ type: "SET_STEPS", steps });
    }
  }, [steps]);

  // Auto-tick when playing
  useEffect(() => {
    if (!state.isPlaying) return;
    const intervalMs = 500 / state.speed;
    const id = setInterval(() => dispatch({ type: "TICK" }), intervalMs);
    return () => clearInterval(id);
  }, [state.isPlaying, state.speed]);

  const currentStep = state.steps[state.currentIndex] ?? null;
  const isAtStart = state.currentIndex === 0;
  const isAtEnd = state.currentIndex >= state.steps.length - 1;

  return {
    currentIndex: state.currentIndex,
    currentStep,
    totalSteps: state.steps.length,
    isPlaying: state.isPlaying,
    speed: state.speed,
    isAtStart,
    isAtEnd,
    play: () => dispatch({ type: "PLAY" }),
    pause: () => dispatch({ type: "PAUSE" }),
    stepForward: () => dispatch({ type: "STEP_FORWARD" }),
    stepBack: () => dispatch({ type: "STEP_BACK" }),
    reset: () => dispatch({ type: "RESET" }),
    setSpeed: (speed: number) => dispatch({ type: "SET_SPEED", speed }),
  };
}
