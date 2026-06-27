"use client";

import type { CSSProperties } from "react";

type WorkspaceSkeletonProps = {
  mode: "practice" | "progression";
};

function SkeletonBlock({ className, style }: { className: string; style?: CSSProperties }) {
  return <div className={`workspaceSkeletonBlock ${className}`} style={style} aria-hidden="true" />;
}

function SkeletonPanel({
  titleWidth = "wide",
  lineCount,
}: {
  titleWidth?: "wide" | "narrow";
  lineCount: number;
}) {
  return (
    <div className="workspaceSkeletonPanel" aria-hidden="true">
      <div className="workspaceSkeletonPanelHeader">
        <SkeletonBlock className={titleWidth === "wide" ? "line titleLine wide" : "line titleLine"} />
        <SkeletonBlock className="line chip" />
      </div>
      <div className="workspaceSkeletonPanelBody">
        {Array.from({ length: lineCount }, (_, index) => (
          <SkeletonBlock
            key={`panel-line-${lineCount}-${index}`}
            className={index % 2 === 0 ? "line bodyLine wide" : "line bodyLine"}
          />
        ))}
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
            <div className="workspaceSkeletonStack panelTall">
              <SkeletonPanel titleWidth="wide" lineCount={4} />
            </div>
            <div className="workspaceSkeletonStack panelMedium">
              <SkeletonPanel titleWidth="narrow" lineCount={3} />
            </div>
            <div className="workspaceSkeletonStack panelMedium">
              <SkeletonPanel titleWidth="narrow" lineCount={3} />
            </div>
            <div className="workspaceSkeletonBoard">
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
            <div className="workspaceSkeletonFooter">
              <SkeletonBlock className="footer" />
            </div>
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
            <div className="workspaceSkeletonEditorGrid">
              <div className="workspaceSkeletonEditorMain">
                <SkeletonBlock className="chart" />
              </div>
              <div className="workspaceSkeletonEditorSide">
                <SkeletonPanel titleWidth="wide" lineCount={4} />
                <SkeletonPanel titleWidth="wide" lineCount={4} />
                <SkeletonPanel titleWidth="wide" lineCount={3} />
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
