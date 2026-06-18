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
  onRootChange: (root: string) => void;
  onChordTypeChange: (chordTypeId: string) => void;
  onTuningChange: (tuningId: string) => void;
  onChordOctaveChange: (chordOctaveId: string) => void;
  onChordInversionChange: (chordInversion: number) => void;
  onShowGuideTonesChange: (showGuideTones: boolean) => void;
  onPlayArpeggio: () => void;
  onPlayStack: () => void;
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
  onRootChange,
  onChordTypeChange,
  onTuningChange,
  onChordOctaveChange,
  onChordInversionChange,
  onShowGuideTonesChange,
  onPlayArpeggio,
  onPlayStack,
}: ControlsPanelProps) {
  const inversionTabs = ["Root", "1st Inv.", "2nd Inv.", "3rd Inv."];

  return (
    <section className={className} aria-label="コードとチューニング">
      <div className="controlsSection">
        <div className="controlsSectionHeader">
          <div>
            <p className="controlsSectionEyebrow">Harmony</p>
            <strong>コードと音域</strong>
          </div>
          <span>Root / Chord / Tuning / Inversion</span>
        </div>
        <div className="controlsColumn controlsColumnPrimary">
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
        </div>

        <div className="controlsColumn controlsColumnSecondary">
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
          <div className="voicingTabs" role="group" aria-label="Inversion">
            <span className="voicingTabsLabel">転回形 (Inversion)</span>
            <div className="voicingTabsRow">
              {inversionTabs.map((label, item) => {
                const isAvailable = chordInversions.includes(item);
                const isActive = isAvailable && item === chordInversion;
                return (
                  <button
                    key={item}
                    type="button"
                    className={isActive ? "voicingTab active" : "voicingTab"}
                    aria-pressed={isActive}
                    disabled={!isAvailable}
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
        </div>
      </div>

      <div className="controlsSection controlsSectionPlayback">
        <div className="controlsSectionHeader">
          <div>
            <p className="controlsSectionEyebrow">Playback</p>
            <strong>コード再生</strong>
          </div>
          <span>Arpeggio / Chord</span>
        </div>
        <div className="controlsColumn controlsColumnActions">
          <button type="button" className="actionButton actionButtonPrimary" onClick={onPlayArpeggio}>
            <span aria-hidden="true">▶</span>
            Arpeggio
          </button>
          <button
            type="button"
            className="actionButton"
            onClick={onPlayStack}
          >
            <span aria-hidden="true">▶</span>
            Chord
          </button>
        </div>

      </div>
    </section>
  );
}
