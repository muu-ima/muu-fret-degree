type ProgressionResetDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function ProgressionResetDialog({
  onCancel,
  onConfirm,
}: ProgressionResetDialogProps) {
  return (
    <div className="progressionResetDialogBackdrop" onClick={onCancel}>
      <section
        className="progressionResetDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progression-reset-title"
        aria-describedby="progression-reset-description"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">Confirm Reset</p>
        <h2 id="progression-reset-title">Reset Progression Edit?</h2>
        <p id="progression-reset-description">
          現在の Progression Edit を初期状態へ戻します。あとから Undo で元に戻せます。
        </p>
        <div className="progressionResetDialogActions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            Reset
          </button>
        </div>
      </section>
    </div>
  );
}
