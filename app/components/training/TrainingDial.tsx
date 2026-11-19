"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import styles from "./TrainingDial.module.css";

type Props = {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function TrainingDial({ label, unit, value, min, max, disabled = false, onChange }: Props) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const drag = useRef<{ pointer: number; y: number; value: number } | null>(null);
  const angle = -135 + (value - min) / (max - min) * 270;

  useEffect(() => setDraft(String(value)), [value]);
  useEffect(() => { if (disabled) drag.current = null; }, [disabled]);

  function change(next: number) {
    if (disabled) return;
    const clamped = Math.min(max, Math.max(min, Math.round(next)));
    setDraft(String(clamped));
    onChange(clamped);
  }

  function commit() {
    const number = Number(draft);
    if (draft.trim() && Number.isFinite(number)) change(number);
    else setDraft(String(value));
  }

  return (
    <div className={styles.control} data-disabled={disabled}>
      <span id={`${id}-label`} className={styles.label}>{label}</span>
      <div className={styles.row}>
        <div className={styles.dial} role="slider" tabIndex={disabled ? -1 : 0}
          aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`}
          aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`} aria-orientation="vertical" aria-disabled={disabled}
          style={{ "--dial-angle": `${angle}deg`, "--dial-fill": `${angle + 135}deg` } as CSSProperties}
          onPointerDown={(event) => {
            if (disabled || !event.isPrimary || event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { pointer: event.pointerId, y: event.clientY, value };
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (!start || start.pointer !== event.pointerId) return;
            change(start.value + Math.round((start.y - event.clientY) / 3));
          }}
          onPointerUp={(event) => {
            if (drag.current?.pointer !== event.pointerId) return;
            drag.current = null;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { drag.current = null; }}
          onLostPointerCapture={() => { drag.current = null; }}
          onKeyDown={(event) => {
            if (disabled) return;
            const changes: Record<string, number> = {
              ArrowUp: value + 1, ArrowRight: value + 1,
              ArrowDown: value - 1, ArrowLeft: value - 1,
              PageUp: value + 10, PageDown: value - 10, Home: min, End: max,
            };
            if (!(event.key in changes)) return;
            event.preventDefault();
            change(changes[event.key]);
          }}>
          <span className={styles.knob} aria-hidden="true"><i /></span>
        </div>
        <div className={styles.numberControls}>
          <label className={styles.number}>
            <span className="srOnly">{label}を数値で入力</span>
            <input type="number" min={min} max={max} step="1" value={draft} disabled={disabled}
              onChange={(event) => setDraft(event.target.value)} onBlur={commit}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
            <span>{unit}</span>
          </label>
          <div className={styles.steps}>
            <button type="button" disabled={disabled || value <= min} aria-label={`${label}を1下げる`} onClick={() => change(value - 1)}>−</button>
            <button type="button" disabled={disabled || value >= max} aria-label={`${label}を1上げる`} onClick={() => change(value + 1)}>＋</button>
          </div>
        </div>
      </div>
      <small id={`${id}-help`} className={styles.help}>{min}–{max} · 上下ドラッグ / 矢印キーで1刻み</small>
    </div>
  );
}
