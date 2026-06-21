type ProgressionEditorHeaderProps = {
  barCount: number;
  barCountOptions: readonly number[];
  onBarCountChange: (barCount: number) => void;
};

export function ProgressionEditorHeader({
  barCount,
  barCountOptions,
  onBarCountChange,
}: ProgressionEditorHeaderProps) {
  return (
    <div className="progressionEditorHeader">
      <div>
        <p className="progressionLabel">Progression Edit</p>
        <strong>{barCount}-bar loop</strong>
      </div>
      <div className="barCountTabs" role="tablist" aria-label="Bars">
        {barCountOptions.map((count) => {
          const isActive = count === barCount;
          return (
            <button
              key={count}
              type="button"
              className={isActive ? "barCountTab active" : "barCountTab"}
              aria-label={`${count} bars`}
              aria-pressed={isActive}
              onClick={() => onBarCountChange(count)}
            >
              <span className="barCountTabNumber">{count}</span>
              <span className="barCountTabUnit">bars</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
