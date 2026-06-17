"use client";

import { type ChordOctave, type ChordType, type Tuning } from "../lib/music";

type ControlsPanelProps = {
  className: string;
  roots: string[];
  chordTypes: ChordType[];
  tunings: Tuning[];
  chordOctaves: readonly ChordOctave[];
  chordInversions: number[];
  root: string;
  chordTypeId: string;
  tuningId: string;
  chordOctaveId: string;
  chordInversion: number;
  showGuideTones: boolean;
  bpmInput: string;
  isMetronomeRunning: boolean;
  currentBeat: number;
  onRootChange: (root: string) => void;
  onChordTypeChange: (chordTypeId: string) => void;
  onTuningChange: (tuningId: string) => void;
  onChordOctaveChange: (chordOctaveId: string) => void;
  onChordInversionChange: (chordInversion: number) => void;
  onShowGuideTonesChange: (showGuideTones: boolean) => void;
  onPlayArpeggio: () => void;
  onPlayStack: () => void;
  onBpmInputChange: (value: string) => void;
  onBpmCommit: (value: string) => void;
  onToggleMetronome: () => void;
};

export function ControlsPanel({
  className,
  roots,
  chordTypes,
  tunings,
  chordOctaves,
  chordInversions,
  root,
  chordTypeId,
  tuningId,
  chordOctaveId,
  chordInversion,
  showGuideTones,
  bpmInput,
  isMetronomeRunning,
  currentBeat,
  onRootChange,
  onChordTypeChange,
  onTuningChange,
  onChordOctaveChange,
  onChordInversionChange,
  onShowGuideTonesChange,
  onPlayArpeggio,
  onPlayStack,
  onBpmInputChange,
  onBpmCommit,
  onToggleMetronome,
}: ControlsPanelProps) {
  const voicingTabs = ["Root", "1st", "2nd", "3rd"];

  return (
    <section className={className} aria-label="コードとチューニング">
      <label>
        Root
        <select value={root} onChange={(event) => onRootChange(event.target.value)}>
          {roots.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label>
        Chord
        <select value={chordTypeId} onChange={(event) => onChordTypeChange(event.target.value)}>
          {chordTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tuning
        <select value={tuningId} onChange={(event) => onTuningChange(event.target.value)}>
          {tunings.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Octave
        <select value={chordOctaveId} onChange={(event) => onChordOctaveChange(event.target.value)}>
          {chordOctaves.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <div className="voicingTabs" role="group" aria-label="Voicing">
        <span className="voicingTabsLabel">Voicing</span>
        <div className="voicingTabsRow">
          {chordInversions.map((item) => {
            const label = voicingTabs[item] ?? `${item}`;
            const isActive = item === chordInversion;
            return (
              <button
                key={item}
                type="button"
                className={isActive ? "voicingTab active" : "voicingTab"}
                aria-pressed={isActive}
                onClick={() => onChordInversionChange(item)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={showGuideTones}
          onChange={(event) => onShowGuideTonesChange(event.target.checked)}
        />
        3rd / 7th を強調
      </label>
      <button type="button" className="actionButton actionButtonPrimary" onClick={onPlayArpeggio}>
        <span aria-hidden="true">▶</span>
        Arpeggio
      </button>
      <button type="button" className="actionButton" onClick={onPlayStack}>
        <span aria-hidden="true">▶</span>
        Chord
      </button>
      <label>
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
        className={isMetronomeRunning ? "actionButton metronomeButton active" : "actionButton metronomeButton"}
        onClick={onToggleMetronome}
      >
        <span aria-hidden="true">♫</span>
        {isMetronomeRunning ? "Beat " + currentBeat : "Metronome"}
      </button>
    </section>
  );
}
