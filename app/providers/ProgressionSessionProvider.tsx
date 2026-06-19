"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import theory from "../../data/theory.json";
import { useAudioOutput } from "../hooks/useAudioOutput";
import { useProgressionPlayback } from "../hooks/useProgressionPlayback";
import { useProgressionState } from "../hooks/useProgressionState";
import type { ChordProgression } from "../lib/progression";
import type { ChordType } from "../lib/music";

type ProgressionSession = ReturnType<typeof useProgressionState>;
type ProgressionTransport = ReturnType<typeof useProgressionPlayback>;
type SessionAudioOutput = ReturnType<typeof useAudioOutput>;

const ProgressionSessionContext = createContext<ProgressionSession | null>(null);
const ProgressionTransportContext = createContext<ProgressionTransport | null>(null);
const SessionAudioOutputContext = createContext<SessionAudioOutput | null>(null);

function ProgressionRuntimeProvider({
  children,
  progression,
}: {
  children: ReactNode;
  progression: ChordProgression;
}) {
  const transport = useProgressionPlayback({ progression });
  const audioOutput = useAudioOutput();
  const stableAudioOutput = useMemo(
    () => audioOutput,
    [
      audioOutput.playBassNote,
      audioOutput.playMetronomeClick,
      audioOutput.playPianoNote,
      audioOutput.resumeAudio,
    ],
  );

  return (
    <SessionAudioOutputContext.Provider value={stableAudioOutput}>
      <ProgressionTransportContext.Provider value={transport}>
        {children}
      </ProgressionTransportContext.Provider>
    </SessionAudioOutputContext.Provider>
  );
}

export function ProgressionSessionProvider({ children }: { children: ReactNode }) {
  const session = useProgressionState({
    roots: theory.roots,
    chordTypes: theory.chordTypes as ChordType[],
  });

  return (
    <ProgressionSessionContext.Provider value={session}>
      <ProgressionRuntimeProvider progression={session.progression}>
        {children}
      </ProgressionRuntimeProvider>
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

export function useProgressionTransport() {
  const transport = useContext(ProgressionTransportContext);
  if (!transport) {
    throw new Error("useProgressionTransport must be used within ProgressionSessionProvider");
  }

  return transport;
}

export function useSessionAudioOutput() {
  const audioOutput = useContext(SessionAudioOutputContext);
  if (!audioOutput) {
    throw new Error("useSessionAudioOutput must be used within ProgressionSessionProvider");
  }

  return audioOutput;
}
