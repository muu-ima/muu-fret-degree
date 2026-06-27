export default function Loading() {
  return (
    <main className="routeLoading progressionRouteLoading" role="status" aria-live="polite" aria-busy="true">
      <div className="routeLoadingCard progressionRouteLoadingCard">
        <div className="progressionRouteLoadingHeader">
          <div className="progressionRouteLoadingText">
            <p className="eyebrow">Full Editor</p>
            <h1>Progression Edit</h1>
            <p>コード進行の編集画面を準備しています。</p>
          </div>
          <div className="progressionRouteLoadingActions">
            <span />
            <span />
          </div>
        </div>

        <div className="progressionRouteLoadingLayout" aria-hidden="true">
          <div className="progressionRouteLoadingCanvas" />
          <div className="progressionRouteLoadingSide">
            <div className="progressionRouteLoadingCardBlock" />
            <div className="progressionRouteLoadingCardBlock" />
            <div className="progressionRouteLoadingCardBlock" />
          </div>
        </div>

        <div className="routeLoadingBar" aria-hidden="true">
          <span />
        </div>
      </div>
    </main>
  );
}
