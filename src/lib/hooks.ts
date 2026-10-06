"use client";
import { useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, subscribe } from "./store";

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
