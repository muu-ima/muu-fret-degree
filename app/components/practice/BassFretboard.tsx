"use client";

import {
  degreeTone,
  type FretNote,
  type FretRange,
  markerFrets,
  type Tuning,
} from "../../lib/music";

const nutWidth = 14;
const leftPad = 74;
const topPad = 46;
const boardWidth = 940;
const boardHeight = 290;
const stringGap = boardHeight / 3;

type BassFretboardProps = {
  notes: FretNote[];
  tuning: Tuning;
  fretRange: FretRange;
  onPlayNote: (note: FretNote) => void;
};

export function BassFretboard({ notes, tuning, fretRange, onPlayNote }: BassFretboardProps) {
  const height = topPad * 2 + boardHeight;
  const width = leftPad + boardWidth + 32;
  const visibleFretCount = fretRange.end - fretRange.start + 1;
  const currentFretGap = boardWidth / visibleFretCount;
  const isOpenRange = fretRange.start === 0;
  const rangeNotes = notes.filter((note) => note.fret >= fretRange.start && note.fret <= fretRange.end);
  const visibleMarkers = [...markerFrets].filter(
    (fret) => fret >= Math.max(1, fretRange.start) && fret <= fretRange.end,
  );

  return (
    <div className="fretboardShell desktopFretboard" aria-label={`ベース指板 ${fretRange.label}`}>
      <svg
        className="fretboard"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`fretboard-title-${fretRange.id} fretboard-desc-${fretRange.id}`}
      >
        <title id={`fretboard-title-${fretRange.id}`}>コード構成音の度数を表示するベース指板</title>
        <desc id={`fretboard-desc-${fretRange.id}`}>
          4弦ベースの{fretRange.label}に、選択コードの構成音を度数で表示します。
        </desc>

        <rect
          className="fingerboard"
          x={leftPad}
          y={topPad - 18}
          width={boardWidth}
          height={boardHeight + 36}
          rx="6"
        />
        {Array.from({ length: visibleFretCount }, (_, fretIndex) => {
          if (fretIndex % 2 !== 1) {
            return null;
          }

          return (
            <rect
              className="fretLaneShade"
              key={`fret-shade-${fretRange.id}-${fretIndex}`}
              x={leftPad + fretIndex * currentFretGap}
              y={topPad - 18}
              width={currentFretGap}
              height={boardHeight + 36}
            />
          );
        })}
        {isOpenRange ? (
          <rect
            className="nut"
            x={leftPad - nutWidth}
            y={topPad - 20}
            width={nutWidth}
            height={boardHeight + 40}
            rx="3"
          />
        ) : null}

        {Array.from({ length: visibleFretCount + 1 }, (_, fretIndex) => {
          const x = leftPad + fretIndex * currentFretGap;
          return (
            <line
              className={isOpenRange && fretIndex === 0 ? "fret fretZero" : "fret"}
              key={`fret-line-${fretRange.id}-${fretIndex}`}
              x1={x}
              y1={topPad - 18}
              x2={x}
              y2={topPad + boardHeight + 18}
            />
          );
        })}

        {Array.from({ length: visibleFretCount }, (_, fretIndex) => {
          const fretLabel = isOpenRange ? fretIndex + 1 : fretRange.start + fretIndex;
          const x = leftPad + (fretIndex + 0.5) * currentFretGap;
          return (
            <g className="fretNumberGroup" key={`fret-label-${fretRange.id}-${fretLabel}`}>
              <rect className="fretNumberBadge" x={x - 17} y={10} width="34" height="24" rx="12" />
              <text className="fretNumber" x={x} y={27}>
                {fretLabel}
              </text>
            </g>
          );
        })}

        {visibleMarkers.map((fret) => (
          <circle
            key={`marker-${fretRange.id}-${fret}`}
            className="positionMarker"
            cx={leftPad + (isOpenRange ? fret - 0.5 : fret - fretRange.start + 0.5) * currentFretGap}
            cy={topPad + boardHeight / 2}
            r="8"
          />
        ))}
        {fretRange.start <= 12 && fretRange.end >= 12 ? (
          <g className="doubleMarker twelfthMarker">
            <circle
              cx={leftPad + (isOpenRange ? 11.5 : 12 - fretRange.start + 0.5) * currentFretGap}
              cy={topPad + stringGap}
              r="7"
            />
            <circle
              cx={leftPad + (isOpenRange ? 11.5 : 12 - fretRange.start + 0.5) * currentFretGap}
              cy={topPad + stringGap * 2}
              r="7"
            />
          </g>
        ) : null}

        {tuning.strings.map((string, stringIndex) => {
          const y = topPad + stringIndex * stringGap;
          return (
            <g key={`${string.name}-${stringIndex}`}>
              <text className="stringName" x={28} y={y + 6}>
                {string.name}
              </text>
              <line
                className={`bassString string-${stringIndex}`}
                x1={isOpenRange ? leftPad - nutWidth : leftPad}
                y1={y}
                x2={leftPad + boardWidth}
                y2={y}
              />
            </g>
          );
        })}

        {rangeNotes.map((note) => {
          if (!note.inChord) {
            return null;
          }

          const x =
            isOpenRange && note.fret === 0
              ? leftPad - 34
              : leftPad + (isOpenRange ? note.fret - 0.5 : note.fret - fretRange.start + 0.5) * currentFretGap;
          const y = topPad + note.stringIndex * stringGap;
          const color = note.degree ? degreeTone[note.degree] ?? "#333" : "#333";
          const isRoot = note.degree === "1";

          return (
            <g
              className={isRoot ? "noteHit rootNote" : "noteHit"}
              key={`${fretRange.id}-${note.id}`}
              tabIndex={0}
              role="button"
              aria-label={`${note.note} ${note.degree}度 ${note.fret}フレットを鳴らす`}
              onClick={() => onPlayNote(note)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPlayNote(note);
                }
              }}
            >
              <circle className="noteHalo" cx={x} cy={y} r="29" fill={color} />
              {isRoot ? (
                <>
                  <circle className="rootRing rootRingOuter" cx={x} cy={y} r="31" />
                  <circle className="rootRing rootRingInner" cx={x} cy={y} r="26" />
                </>
              ) : null}
              <circle cx={x} cy={y} r="22" fill={color} />
              <text className="degreeLabel" x={x} y={y + 6}>
                {note.degree}
              </text>
              <text className="noteName" x={x} y={y + 37}>
                {note.note}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function MobileBassFretboard({ notes, tuning, fretRange, onPlayNote }: BassFretboardProps) {
  const mobileLeft = 46;
  const mobileTop = 76;
  const mobileWidth = 340;
  const mobileHeight = 740;
  const openStringLane = 44;
  const noteRadius = 18;
  const stringCount = tuning.strings.length;
  const visibleFretCount = fretRange.end - fretRange.start + 1;
  const mobileStringGap = mobileWidth / Math.max(stringCount - 1, 1);
  const mobileFretGap = mobileHeight / visibleFretCount;
  const width = mobileLeft * 2 + mobileWidth;
  const height = mobileTop + mobileHeight + 56;
  const isOpenRange = fretRange.start === 0;
  const rangeNotes = notes.filter((note) => note.fret >= fretRange.start && note.fret <= fretRange.end);
  const visibleMarkers = [...markerFrets].filter(
    (fret) => fret >= Math.max(1, fretRange.start) && fret <= fretRange.end,
  );

  return (
    <div className="fretboardShell mobileFretboard" aria-label={`モバイル用ベース指板 ${fretRange.label}`}>
      <svg
        className="fretboard verticalFretboard"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`mobile-fretboard-title-${fretRange.id} mobile-fretboard-desc-${fretRange.id}`}
      >
        <title id={`mobile-fretboard-title-${fretRange.id}`}>縦向きのコード構成音ベース指板</title>
        <desc id={`mobile-fretboard-desc-${fretRange.id}`}>
          スマートフォン向けに、{fretRange.label}を縦向き指板で表示します。
        </desc>

        <rect
          className="fingerboard"
          x={mobileLeft - noteRadius}
          y={mobileTop}
          width={mobileWidth + noteRadius * 2}
          height={mobileHeight}
          rx="6"
        />
        {Array.from({ length: visibleFretCount }, (_, fretIndex) => {
          if (fretIndex % 2 !== 1) {
            return null;
          }

          return (
            <rect
              className="fretLaneShade"
              key={`mobile-fret-shade-${fretRange.id}-${fretIndex}`}
              x={mobileLeft - noteRadius}
              y={mobileTop + fretIndex * mobileFretGap}
              width={mobileWidth + noteRadius * 2}
              height={mobileFretGap}
            />
          );
        })}
        {isOpenRange ? (
          <rect
            className="nut"
            x={mobileLeft - noteRadius}
            y={mobileTop - nutWidth}
            width={mobileWidth + noteRadius * 2}
            height={nutWidth}
            rx="3"
          />
        ) : null}

        {Array.from({ length: visibleFretCount + 1 }, (_, fretIndex) => {
          const y = mobileTop + fretIndex * mobileFretGap;
          return (
            <line
              className={isOpenRange && fretIndex === 0 ? "fret fretZero" : "fret"}
              key={`mobile-fret-line-${fretRange.id}-${fretIndex}`}
              x1={mobileLeft - noteRadius}
              y1={y}
              x2={mobileLeft + mobileWidth + noteRadius}
              y2={y}
            />
          );
        })}

        {Array.from({ length: visibleFretCount }, (_, fretIndex) => {
          const fretLabel = isOpenRange ? fretIndex + 1 : fretRange.start + fretIndex;
          const y = mobileTop + (fretIndex + 0.5) * mobileFretGap;
          return (
            <g className="fretNumberGroup" key={`mobile-fret-label-${fretRange.id}-${fretLabel}`}>
              <rect className="fretNumberBadge" x={2} y={y - 12} width="28" height="24" rx="12" />
              <text className="fretNumber mobileFretNumber" x={16} y={y + 5}>
                {fretLabel}
              </text>
            </g>
          );
        })}

        {visibleMarkers.map((fret) => (
          <circle
            key={`mobile-marker-${fretRange.id}-${fret}`}
            className="positionMarker"
            cx={mobileLeft + mobileWidth / 2}
            cy={mobileTop + (isOpenRange ? fret - 0.5 : fret - fretRange.start + 0.5) * mobileFretGap}
            r="8"
          />
        ))}
        {fretRange.start <= 12 && fretRange.end >= 12 ? (
          <g className="doubleMarker twelfthMarker">
            <circle
              cx={mobileLeft + mobileStringGap}
              cy={mobileTop + (isOpenRange ? 11.5 : 12 - fretRange.start + 0.5) * mobileFretGap}
              r="7"
            />
            <circle
              cx={mobileLeft + mobileStringGap * 2}
              cy={mobileTop + (isOpenRange ? 11.5 : 12 - fretRange.start + 0.5) * mobileFretGap}
              r="7"
            />
          </g>
        ) : null}

        {tuning.strings.map((string, stringIndex) => {
          const displayStringIndex = stringCount - 1 - stringIndex;
          const x = mobileLeft + displayStringIndex * mobileStringGap;
          return (
            <g key={`mobile-${string.name}-${stringIndex}`}>
              <text className="stringName mobileStringName" x={x} y={36}>
                {string.name}
              </text>
              <line
                className={`bassString string-${stringIndex}`}
                x1={x}
                y1={isOpenRange ? mobileTop - nutWidth : mobileTop}
                x2={x}
                y2={mobileTop + mobileHeight}
              />
            </g>
          );
        })}

        {rangeNotes.map((note) => {
          if (!note.inChord) {
            return null;
          }

          const displayStringIndex = stringCount - 1 - note.stringIndex;
          const x = mobileLeft + displayStringIndex * mobileStringGap;
          const y =
            isOpenRange && note.fret === 0
              ? mobileTop - openStringLane / 2
              : mobileTop + (isOpenRange ? note.fret - 0.5 : note.fret - fretRange.start + 0.5) * mobileFretGap;
          const color = note.degree ? degreeTone[note.degree] ?? "#333" : "#333";
          const isRoot = note.degree === "1";

          return (
            <g
              className={isRoot ? "noteHit rootNote" : "noteHit"}
              key={`mobile-${fretRange.id}-${note.id}`}
              tabIndex={0}
              role="button"
              aria-label={`${note.note} ${note.degree}度 ${note.fret}フレットを鳴らす`}
              onClick={() => onPlayNote(note)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onPlayNote(note);
                }
              }}
            >
              <circle className="noteHalo" cx={x} cy={y} r={noteRadius + 6} fill={color} />
              {isRoot ? (
                <>
                  <circle className="rootRing rootRingOuter" cx={x} cy={y} r={noteRadius + 10} />
                  <circle className="rootRing rootRingInner" cx={x} cy={y} r={noteRadius + 6} />
                </>
              ) : null}
              <circle cx={x} cy={y} r={noteRadius} fill={color} />
              <text className="degreeLabel" x={x} y={y + 6}>
                {note.degree}
              </text>
              <text className="noteName" x={x} y={y + noteRadius + 12}>
                {note.note}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
