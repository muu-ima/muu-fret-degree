"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import type { ChordSegment } from "@audio/mir-chordino";
import { LuFileAudio } from "react-icons/lu";
import { analyzeAudioFile, getAudioChordSelection, type AudioChordSelection } from "../../lib/audio-chords";
import styles from "./AudioChordImport.module.css";

type Analysis =
  | { status: "idle" }
  | { status: "loading" | "error"; filename: string }
  | { status: "ready"; filename: string; segments: ChordSegment[] };

function formatStartTime(seconds: number) {
  const tenths = Math.floor(seconds * 10);
  const minutes = Math.floor(tenths / 600);
  return `${minutes}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}

export function AudioChordImport({ onSelect }: { onSelect: (chord: AudioChordSelection) => void }) {
  const pending = useRef<AbortController | null>(null);
  const [analysis, setAnalysis] = useState<Analysis>({ status: "idle" });

  useEffect(() => () => pending.current?.abort(), []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setAnalysis({ status: "loading", filename: file.name });

    try {
      const segments = await analyzeAudioFile(file, controller.signal);
      if (!controller.signal.aborted) {
        setAnalysis({ status: "ready", filename: file.name, segments });
      }
    } catch {
      if (!controller.signal.aborted) {
        setAnalysis({ status: "error", filename: file.name });
      }
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }

  const hasChords = analysis.status === "ready" && analysis.segments.some((segment) => segment.quality !== "N");

  return (
    <section className={styles.importer} aria-labelledby="audio-chord-import-title">
      <div className={styles.header}>
        <div>
          <h2 id="audio-chord-import-title">音源からコードを推定</h2>
          <p>MP3やWAVを選び、推定されたコードをクリックすると指板に表示できます。</p>
        </div>
        <label className={styles.filePicker}>
          <input className="srOnly" type="file" accept="audio/*,.mp3,.wav" onChange={handleFileChange} />
          <LuFileAudio aria-hidden="true" />
          音源を選択
        </label>
      </div>
      <div className={styles.status} role="status">
        {analysis.status !== "idle" && <strong>{analysis.filename}</strong>}
        {analysis.status === "loading" && <span>コードを解析中…</span>}
        {analysis.status === "error" && <span>音源を解析できませんでした。別のMP3やWAVをお試しください。</span>}
        {analysis.status === "ready" && !hasChords && <span>コードが検出されませんでした。</span>}
      </div>
      {analysis.status === "ready" && hasChords && (
        <ol className={styles.timeline} aria-label="時刻付きの推定コード進行">
          {analysis.segments.map((segment, index) => {
            const chord = getAudioChordSelection(segment);
            const content = (
              <>
                <strong>{chord ? segment.label : "コードなし"}</strong>
                <span className={styles.time}>{formatStartTime(segment.time)}</span>
              </>
            );
            return (
              <li key={index}>
                {chord ? (
                  <button type="button" className={styles.segment} onClick={() => onSelect(chord)}>
                    {content}
                  </button>
                ) : (
                  <div className={styles.segment}>{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
