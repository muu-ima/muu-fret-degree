"use client";

import type { CSSProperties } from "react";

type WorkspaceSkeletonProps = {
  mode: "practice" | "progression";
};

function SkeletonBlock({ className, style }: { className: string; style?: CSSProperties }) {
  return <div className={`workspaceSkeletonBlock ${className}`} style={style} aria-hidden="true" />;
}

function PracticeControlsSkeleton() {
  return (
    <div className="workspaceSkeletonCard workspaceSkeletonControls" aria-hidden="true">
      <div className="workspaceSkeletonCardHeader">
        <div className="workspaceSkeletonCardHeading">
          <SkeletonBlock className="eyebrow micro" />
          <SkeletonBlock className="titleLine" />
        </div>
        <SkeletonBlock className="chip" />
      </div>

      <div className="workspaceSkeletonSplitGrid">
        <div className="workspaceSkeletonFieldColumn">
          <SkeletonBlock className="fieldLabel" />
          <SkeletonBlock className="fieldSelect" />
          <SkeletonBlock className="fieldLabel" />
          <SkeletonBlock className="fieldSelect" />
          <SkeletonBlock className="fieldLabel" />
          <SkeletonBlock className="fieldSelect" />
        </div>

        <div className="workspaceSkeletonFieldColumn">
          <SkeletonBlock className="fieldLabel" />
          <SkeletonBlock className="fieldSelect" />
          <div className="workspaceSkeletonTabGrid">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock key={`voicing-${index}`} className={index === 0 ? "tab active" : "tab"} />
            ))}
          </div>
          <SkeletonBlock className="toggleRow" />
        </div>
      </div>

      <div className="workspaceSkeletonPlaybackBlock">
        <div className="workspaceSkeletonCardHeader">
          <div className="workspaceSkeletonCardHeading">
            <SkeletonBlock className="eyebrow micro" />
            <SkeletonBlock className="titleLine narrow" />
          </div>
          <SkeletonBlock className="chip chipWide" />
        </div>
        <SkeletonBlock className="fieldLabel" />
        <SkeletonBlock className="fieldSelect" />
        <div className="workspaceSkeletonButtonRow">
          <SkeletonBlock className="actionButton primary" />
          <SkeletonBlock className="actionButton" />
        </div>
      </div>
    </div>
  );
}

function PracticeMetronomeSkeleton() {
  return (
    <div className="workspaceSkeletonCard workspaceSkeletonMetronome" aria-hidden="true">
      <div className="workspaceSkeletonCardHeader">
        <div className="workspaceSkeletonCardHeading">
          <SkeletonBlock className="eyebrow micro" />
          <SkeletonBlock className="titleLine narrow" />
        </div>
        <SkeletonBlock className="chip chipWide" />
      </div>

      <div className="workspaceSkeletonMetronomeReadout">
        <SkeletonBlock className="meterValue" />
        <SkeletonBlock className="meterHint" />
      </div>
      <div className="workspaceSkeletonBeatRow">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={`beat-${index}`} className="beatDot" />
        ))}
      </div>
      <div className="workspaceSkeletonStepperRow">
        <SkeletonBlock className="tempoStepButton" />
        <SkeletonBlock className="tempoInput" />
        <SkeletonBlock className="tempoStepButton" />
      </div>
      <div className="workspaceSkeletonPresetGrid">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonBlock key={`preset-${index}`} className="presetTile" />
        ))}
      </div>
      <div className="workspaceSkeletonButtonRow">
        <SkeletonBlock className="actionButton primary" />
        <SkeletonBlock className="actionButton" />
      </div>
    </div>
  );
}

function PracticeProgressionSkeleton() {
  return (
    <div className="workspaceSkeletonCard workspaceSkeletonProgression" aria-hidden="true">
      <div className="workspaceSkeletonCardHeader">
        <div className="workspaceSkeletonCardHeading">
          <SkeletonBlock className="eyebrow micro" />
          <SkeletonBlock className="titleLine narrow" />
        </div>
        <SkeletonBlock className="chip chipWide" />
      </div>
      <SkeletonBlock className="progressReadout" />
      <div className="workspaceSkeletonButtonRow">
        <SkeletonBlock className="actionButton primary" />
        <SkeletonBlock className="actionButton" />
        <SkeletonBlock className="actionButton" />
      </div>
      <SkeletonBlock className="fieldLabel" />
      <div className="workspaceSkeletonTabGrid wide">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonBlock key={`rhythm-${index}`} className={index === 0 ? "tab active wide" : "tab wide"} />
        ))}
      </div>
      <SkeletonBlock className="fieldLabel" />
      <div className="workspaceSkeletonTabGrid narrow">
        {Array.from({ length: 2 }, (_, index) => (
          <SkeletonBlock key={`groove-${index}`} className={index === 0 ? "tab active narrow" : "tab narrow"} />
        ))}
      </div>
    </div>
  );
}

function PracticeBoardSkeleton() {
  return (
    <div className="workspaceSkeletonBoard" aria-hidden="true">
      <div className="workspaceSkeletonBoardHeader">
        <SkeletonBlock className="line boardLabel" />
        <SkeletonBlock className="line boardTabs" />
      </div>
      <div className="workspaceSkeletonFretboard">
        {Array.from({ length: 4 }, (_, stringIndex) => (
          <SkeletonBlock
            key={`string-${stringIndex}`}
            className="fretString"
            style={{ top: `${18 + stringIndex * 22}%` }}
          />
        ))}
        {Array.from({ length: 7 }, (_, fretIndex) => (
          <SkeletonBlock
            key={`fret-${fretIndex}`}
            className="fretMarker"
            style={{ left: `${12 + fretIndex * 13}%`, top: `${22 + (fretIndex % 2) * 26}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function PracticeDegreeStripSkeleton() {
  return (
    <div className="workspaceSkeletonDegreeStrip" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <SkeletonBlock key={`degree-${index}`} className="degreeChip" />
      ))}
    </div>
  );
}

function ProgressionEditorSkeleton() {
  return (
    <div className="workspaceSkeletonEditorShell" aria-hidden="true">
      <div className="workspaceSkeletonEditorMain">
        <div className="workspaceSkeletonEditorToolbar">
          <SkeletonBlock className="editorToolbarLabel" />
          <SkeletonBlock className="editorToolbarActions" />
        </div>
        <SkeletonBlock className="chart" />
      </div>
      <div className="workspaceSkeletonEditorSide">
        <div className="workspaceSkeletonCard workspaceSkeletonEditorCard">
          <div className="workspaceSkeletonCardHeader">
            <div className="workspaceSkeletonCardHeading">
              <SkeletonBlock className="eyebrow micro" />
              <SkeletonBlock className="titleLine" />
            </div>
            <SkeletonBlock className="chip" />
          </div>
          <SkeletonBlock className="editorSelectionLine" />
          <SkeletonBlock className="editorSelectionLine" />
          <div className="workspaceSkeletonTabGrid wide">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock key={`editor-tab-${index}`} className={index === 0 ? "tab active wide" : "tab wide"} />
            ))}
          </div>
        </div>
        <div className="workspaceSkeletonCard workspaceSkeletonEditorCard">
          <SkeletonBlock className="editorSelectionLine" />
          <SkeletonBlock className="editorSelectionLine" />
          <SkeletonBlock className="editorSelectionLine short" />
        </div>
        <div className="workspaceSkeletonCard workspaceSkeletonEditorCard">
          <SkeletonBlock className="editorSelectionLine" />
          <div className="workspaceSkeletonTabGrid narrow">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBlock key={`advanced-${index}`} className={index === 0 ? "tab active narrow" : "tab narrow"} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSkeleton({ mode }: WorkspaceSkeletonProps) {
  return (
    <main className="workspaceSkeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="srOnly">読み込み中です。</span>

      {mode === "practice" ? (
        <>
          <section className="workspaceSkeletonHero">
            <div className="workspaceSkeletonText">
              <SkeletonBlock className="eyebrow" />
              <SkeletonBlock className="title" />
              <SkeletonBlock className="summary" />
            </div>
            <SkeletonBlock className="badge" />
          </section>

          <section className="workspaceSkeletonGrid">
            <PracticeControlsSkeleton />
            <PracticeMetronomeSkeleton />
            <PracticeProgressionSkeleton />
            <PracticeBoardSkeleton />
            <PracticeDegreeStripSkeleton />
          </section>
        </>
      ) : (
        <>
          <section className="workspaceSkeletonHeader">
            <div className="workspaceSkeletonText">
              <SkeletonBlock className="eyebrow" />
              <SkeletonBlock className="title wide" />
              <SkeletonBlock className="summary wide" />
            </div>
            <div className="workspaceSkeletonActions">
              <SkeletonBlock className="action" />
              <SkeletonBlock className="action" />
            </div>
          </section>

          <section className="workspaceSkeletonEditor">
            <div className="workspaceSkeletonEditorHero">
              <SkeletonBlock className="editorHeader" />
            </div>
            <ProgressionEditorSkeleton />
          </section>
        </>
      )}
    </main>
  );
}
