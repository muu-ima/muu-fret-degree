"use client";

import { createContext, type ReactNode, useContext } from "react";
import theory from "../../data/theory.json";
import { useProgressionState } from "../hooks/useProgressionState";
import type { ChordType } from "../lib/music";

type ProgressionSession = ReturnType<typeof useProgressionState>;

const ProgressionSessionContext = createContext<ProgressionSession | null>(null);

export function ProgressionSessionProvider({ children }: { children: ReactNode }) {
  const session = useProgressionState({
    roots: theory.roots,
    chordTypes: theory.chordTypes as ChordType[],
  });

  return (
    <ProgressionSessionContext.Provider value={session}>
      {children}
    </ProgressionSessionContext.Provider>
  );
}

export function useProgressionSession() {
  const session = useContext(ProgressionSessionContext);
  if (!session) {
    throw new Error("useProgressionSession must be used within ProgressionSessionProvider");
  }

  return session;
}
