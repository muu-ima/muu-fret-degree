export default function Loading() {
  return (
    <main className="routeLoading" role="status" aria-live="polite" aria-busy="true">
      <div className="routeLoadingCard">
        <p className="eyebrow">Loading</p>
        <h1>読み込み中</h1>
        <p>画面を整えています。少しだけお待ちください。</p>
        <div className="routeLoadingBar" aria-hidden="true">
          <span />
        </div>
      </div>
    </main>
  );
}
