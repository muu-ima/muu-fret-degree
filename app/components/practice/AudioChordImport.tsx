"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { LuFileAudio } from "react-icons/lu";
import { formatAudioTime } from "../../lib/audio-chord-chart";
import { analyzeAudioFile, getAudioChordSelection, type AudioChordAnalysis, type AudioChordSelection } from "../../lib/audio-chords";
import { AudioChordChart } from "./AudioChordChart";
import styles from "./AudioChordImport.module.css";

type Analysis =
  | { status: "idle" }
  | { status: "loading" | "error"; filename: string }
  | { status: "ready"; filename: string; result: AudioChordAnalysis };

export function AudioChordImport({ fallbackBpm, onSelect }: { fallbackBpm: number; onSelect: (chord: AudioChordSelection) => void }) {
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
      const result = await analyzeAudioFile(file, controller.signal);
      if (!controller.signal.aborted) {
        setAnalysis({ status: "ready", filename: file.name, result });
      }
    } catch {
      if (!controller.signal.aborted) {
        setAnalysis({ status: "error", filename: file.name });
      }
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }

  const hasChords = analysis.status === "ready" && analysis.result.segments.some((segment) => segment.quality !== "N");

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
      {analysis.status === "ready" && (hasChords || analysis.result.timing) && (
        <AudioChordChart analysis={analysis.result} fallbackBpm={fallbackBpm} onSelect={onSelect} />
      )}
      {analysis.status === "ready" && hasChords && (
        <details className={styles.timelineDetails}>
          <summary>コードの切り替わり時刻</summary>
          <ol className={styles.timeline} aria-label="時刻付きの推定コード進行">
            {analysis.result.segments.map((segment, index) => {
              const chord = getAudioChordSelection(segment);
              const content = (
                <>
                  <strong>{chord ? segment.label : "コードなし"}</strong>
                  <span className={styles.time}>{formatAudioTime(segment.time)}</span>
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
        </details>
      )}
    </section>
  );
}
