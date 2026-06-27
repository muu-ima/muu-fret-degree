"use client";

type WorkspaceSkeletonProps = {
  mode: "practice" | "progression";
};

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`workspaceSkeletonBlock ${className}`} aria-hidden="true" />;
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
            <SkeletonBlock className="panel tall" />
            <SkeletonBlock className="panel medium" />
            <SkeletonBlock className="panel medium" />
            <SkeletonBlock className="board" />
            <SkeletonBlock className="footer" />
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
            <SkeletonBlock className="editorHeader" />
            <SkeletonBlock className="chart" />
            <SkeletonBlock className="selection" />
            <SkeletonBlock className="selection" />
            <SkeletonBlock className="selection" />
          </section>
        </>
      )}
    </main>
  );
}
