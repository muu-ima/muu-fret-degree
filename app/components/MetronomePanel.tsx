"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LuMinus, LuPlay, LuPlus, LuSquare, LuTimerReset } from "react-icons/lu";
import { type MetronomeTone } from "../lib/audio";

type MetronomePanelProps = {
  isPanelOpen: boolean;
  bpm: number;
  bpmInput: string;
  currentBeat: number;
  currentPulse: number;
  countInBeatsRemaining: number;
  beatsPerMeasure: number;
  pulsesPerBeat: number;
  countInMeasures: number;
  swingRatio: number;
  tone: MetronomeTone;
  accentFirstBeat: boolean;
  volume: number;
  isRunning: boolean;
  isCountingIn: boolean;
  onBpmInputChange: (value: string) => void;
  onBpmCommit: (value: string) => void;
  onBeatsPerMeasureChange: (beats: number) => void;
  onPulsesPerBeatChange: (pulses: number) => void;
  onCountInMeasuresChange: (measures: number) => void;
  onSwingRatioChange: (ratio: number) => void;
  onToneChange: (tone: MetronomeTone) => void;
  onAccentFirstBeatChange: (accented: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onToggle: () => void;
};

const meterOptions = [2, 3, 4, 6];
const countInOptions = [
  { value: 0, label: "Off" },
  { value: 1, label: "1 bar" },
  { value: 2, label: "2 bars" },
];
const swingOptions = [
  { value: 0, label: "Straight" },
  { value: 0.56, label: "Light" },
  { value: 0.62, label: "Medium" },
  { value: 0.67, label: "Heavy" },
];
const pulseOptions = [
  { value: 1, label: "1/4" },
  { value: 2, label: "1/8" },
  { value: 3, label: "Triplet" },
  { value: 4, label: "1/16" },
];
const toneOptions: Array<{ value: MetronomeTone; label: string }> = [
  { value: "soft", label: "Soft" },
  { value: "wood", label: "Wood" },
  { value: "classic", label: "Classic" },
];
const tempoPresets = [
  { bpm: 60, label: "Largo" },
  { bpm: 80, label: "Andante" },
  { bpm: 100, label: "Moderato" },
  { bpm: 120, label: "Allegro" },
  { bpm: 140, label: "Vivace" },
  { bpm: 160, label: "Presto" },
];

export function MetronomePanel({
  isPanelOpen,
  bpm,
  bpmInput,
  currentBeat,
  currentPulse,
  countInBeatsRemaining,
  beatsPerMeasure,
  pulsesPerBeat,
  countInMeasures,
  swingRatio,
  tone,
  accentFirstBeat,
  volume,
  isRunning,
  isCountingIn,
  onBpmInputChange,
  onBpmCommit,
  onBeatsPerMeasureChange,
  onPulsesPerBeatChange,
  onCountInMeasuresChange,
  onSwingRatioChange,
  onToneChange,
  onAccentFirstBeatChange,
  onVolumeChange,
  onToggle,
}: MetronomePanelProps) {
  const tapTimesRef = useRef<number[]>([]);
  const [tapCount, setTapCount] = useState(0);

  const adjustBpm = useCallback(
    (amount: number) => {
      onBpmCommit(String(bpm + amount));
    },
    [bpm, onBpmCommit],
  );

  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const previousTap = tapTimesRef.current.at(-1);

    if (previousTap === undefined || now - previousTap > 2000) {
      tapTimesRef.current = [now];
      setTapCount(1);
      return;
    }

    const taps = [...tapTimesRef.current, now].slice(-5);
    tapTimesRef.current = taps;
    setTapCount(taps.length);

    if (taps.length < 2) {
      return;
    }

    const intervals = taps.slice(1).map((tap, index) => tap - taps[index]);
    const averageInterval = intervals.reduce((total, interval) => total + interval, 0) / intervals.length;
    onBpmCommit(String(Math.round(60000 / averageInterval)));
  }, [onBpmCommit]);

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isFormControl =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "SELECT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "BUTTON";

      if (isFormControl || event.repeat) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        onToggle();
        return;
      }

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        handleTapTempo();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const direction = event.key === "ArrowUp" ? 1 : -1;
        adjustBpm(direction * (event.shiftKey ? 5 : 1));
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [adjustBpm, handleTapTempo, isPanelOpen, onToggle]);

  return (
    <section className="metronomePanel" aria-label="メトロノーム設定">
      <div className={isCountingIn ? "metronomeReadout countingIn" : "metronomeReadout"}>
        <div>
          <p className="panelEyebrow">{isCountingIn ? "Count-in" : "Tempo"}</p>
          <strong>{isCountingIn ? countInBeatsRemaining : bpm}</strong>
          <span>{isCountingIn ? "BEATS" : "BPM"}</span>
        </div>
        <div
          className={isCountingIn ? "beatIndicator countingIn" : "beatIndicator"}
          aria-label={`${currentBeat}拍目 / ${beatsPerMeasure}拍`}
        >
          {Array.from({ length: beatsPerMeasure }, (_, index) => (
            <span
              className={isRunning && index + 1 === currentBeat ? "active" : undefined}
              key={`beat-${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div
        className={isCountingIn ? "pulsePosition countingIn" : "pulsePosition"}
        aria-label={`拍内パルス ${currentPulse} / ${pulsesPerBeat}`}
      >
        {Array.from({ length: pulsesPerBeat }, (_, index) => (
          <span className={isRunning && index + 1 === currentPulse ? "active" : undefined} key={`pulse-${index + 1}`} />
        ))}
      </div>

      <div className="metronomeTempoControls">
        <button
          type="button"
          className="tempoStepButton"
          onClick={() => adjustBpm(-1)}
          aria-label="BPMを1下げる"
          aria-keyshortcuts="ArrowDown"
        >
          <LuMinus />
        </button>
        <label className="metronomeBpmInput">
          BPM
          <input
            min="40"
            max="240"
            step="1"
            type="number"
            value={bpmInput}
            onBlur={(event) => onBpmCommit(event.target.value)}
            onChange={(event) => onBpmInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onBpmCommit(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <button
          type="button"
          className="tempoStepButton"
          onClick={() => adjustBpm(1)}
          aria-label="BPMを1上げる"
          aria-keyshortcuts="ArrowUp"
        >
          <LuPlus />
        </button>
      </div>

      <div className="tempoPresetGroup">
        <span className="controlLabel">Tempo Presets</span>
        <div className="tempoPresetGrid">
          {tempoPresets.map((preset) => (
            <button
              type="button"
              className={preset.bpm === bpm ? "tempoPreset active" : "tempoPreset"}
              aria-pressed={preset.bpm === bpm}
              key={preset.bpm}
              onClick={() => onBpmCommit(String(preset.bpm))}
            >
              <strong>{preset.bpm}</strong>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="metronomePrimaryActions">
        <button
          type="button"
          className="actionButton tapTempoButton"
          onClick={handleTapTempo}
          aria-keyshortcuts="T"
        >
          <LuTimerReset aria-hidden="true" />
          Tap Tempo
          <span>{tapCount > 1 ? `${tapCount} taps` : "Tap repeatedly"}</span>
        </button>
        <button
          type="button"
          className={isRunning ? "actionButton metronomeButton active" : "actionButton metronomeButton"}
          onClick={onToggle}
          aria-keyshortcuts="Space"
        >
          {isRunning ? <LuSquare aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
          {isCountingIn
            ? `Count-in · ${countInBeatsRemaining}`
            : isRunning
              ? `Stop · Beat ${currentBeat}`
              : "Start"}
        </button>
      </div>

      <div className="metronomeSettings">
        <div className="metronomeSettingGroup">
          <span className="controlLabel">Count-in</span>
          <div className="countInTabs" role="group" aria-label="カウントイン">
            {countInOptions.map((option) => (
              <button
                type="button"
                className={option.value === countInMeasures ? "countInTab active" : "countInTab"}
                aria-pressed={option.value === countInMeasures}
                disabled={isRunning}
                key={option.value}
                onClick={() => onCountInMeasuresChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="metronomeSettingGroup">
          <span className="controlLabel">Tone</span>
          <div className="toneTabs" role="group" aria-label="メトロノーム音色">
            {toneOptions.map((option) => (
              <button
                type="button"
                className={option.value === tone ? "toneTab active" : "toneTab"}
                aria-pressed={option.value === tone}
                key={option.value}
                onClick={() => onToneChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="metronomeSettingGroup">
          <span className="controlLabel">Pulse</span>
          <div className="pulseTabs" role="group" aria-label="パルス">
            {pulseOptions.map((option) => (
              <button
                type="button"
                className={option.value === pulsesPerBeat ? "pulseTab active" : "pulseTab"}
                aria-pressed={option.value === pulsesPerBeat}
                key={option.value}
                onClick={() => onPulsesPerBeatChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="metronomeSettingGroup">
          <span className="controlLabel">
            Swing
            <small>8th pulse only</small>
          </span>
          <div className="swingTabs" role="group" aria-label="スウィング">
            {swingOptions.map((option) => (
              <button
                type="button"
                className={option.value === swingRatio ? "swingTab active" : "swingTab"}
                aria-pressed={option.value === swingRatio}
                disabled={pulsesPerBeat !== 2}
                key={option.value}
                onClick={() => onSwingRatioChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="metronomeSettingGroup">
          <span className="controlLabel">Meter</span>
          <div className="meterTabs" role="group" aria-label="拍子">
            {meterOptions.map((beats) => (
              <button
                type="button"
                className={beats === beatsPerMeasure ? "meterTab active" : "meterTab"}
                aria-pressed={beats === beatsPerMeasure}
                key={beats}
                onClick={() => onBeatsPerMeasureChange(beats)}
              >
                {beats}/4
              </button>
            ))}
          </div>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={accentFirstBeat}
            onChange={(event) => onAccentFirstBeatChange(event.target.checked)}
          />
          1拍目をアクセント
        </label>

        <label className="metronomeVolume">
          <span>
            Volume
            <output>{Math.round(volume * 100)}%</output>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
}
